/**
 * Web port of keplix-frontend/services/onboardingAPI.js#submitOnboarding.
 *
 * Same three phases in the same order — profile, then documents and photos,
 * then services — because the service creates need the user id the profile
 * response returns. Kept deliberately close to the mobile version so the two
 * cannot drift into accepting different applications.
 *
 * The differences are only where the platform forces them: browser File objects
 * replace `{ uri }` descriptors, and there is no image compression step (that
 * exists on mobile to survive React Native's uploader).
 */

import { vendorAPI, documentsAPI } from '@/api/vendor';
import { servicesAPI } from '@/api/services';

/** DD/MM/YYYY → YYYY-MM-DD; anything already correct passes through. */
const formatDateForBackend = (dateString) => {
  if (!dateString) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

  const parts = dateString.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateString;
};

/**
 * Minutes from the duration vocabulary vendors pick from ("30 min", "1.5 Hours").
 * Mirrors the mobile parser, including its 1-minute floor — the backend requires
 * a positive integer.
 */
export const parseDurationToMinutes = (value) => {
  if (typeof value === 'number') return value > 0 ? Math.round(value) : 1;

  const text = String(value ?? '').toLowerCase().trim();
  const hours = text.match(/^([\d.]+)\s*h/);
  const minutes = text.match(/^([\d.]+)\s*m/);

  let result = 1;
  if (hours) result = Math.round(parseFloat(hours[1]) * 60);
  else if (minutes) result = Math.round(parseFloat(minutes[1]));
  else {
    const first = text.match(/([\d.]+)/);
    result = first ? Math.round(parseFloat(first[1])) : 1;
  }

  return result > 0 ? result : 1;
};

const uploadDocument = async (docType, file) => {
  if (!file) return null;

  const formData = new FormData();
  // Field name is `file_url`: the route is uploadSingle('file_url').
  formData.append('file_url', file, file.name);
  formData.append('document_type', docType);

  const response = await documentsAPI.uploadDocument(formData);
  if (!response?.success) throw new Error(response?.error || `Failed to upload ${docType}`);
  return response;
};

export const submitOnboarding = async ({ draft, files, shopPhotos = [] }) => {
  try {
    const { workshopInfo, address, location, ownerDetails, gstInfo, bankDetails, timings } = draft;

    const profileData = {
      business_name: workshopInfo.workshopName,
      description: workshopInfo.description || null,
      phone: ownerDetails.phone || workshopInfo.phone,
      email: workshopInfo.email || null,
      alternate_phone: workshopInfo.alternatePhone || null,

      // Payout details come only from the documents step. They used to be
      // collected on owner details as well, which gave the backend two sources
      // of truth for where a vendor gets paid.
      bank_account_number: bankDetails.accountNumber || null,
      ifsc_code: bankDetails.ifsc || null,
      bank_account_holder_name: bankDetails.accountHolderName || null,
      upi_id: bankDetails.upi || null,

      street: address.street || '',
      area: address.area || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      landmark: address.landmark || '',
      latitude: location.latitude ? parseFloat(location.latitude) : null,
      longitude: location.longitude ? parseFloat(location.longitude) : null,
      address:
        [address.street, address.area, address.city, address.state, address.pincode]
          .filter(Boolean)
          .join(', ') || '',

      owner_name: ownerDetails.fullName || '',
      date_of_birth: formatDateForBackend(ownerDetails.dateOfBirth),

      has_gst: Boolean(gstInfo.gstNumber),
      gst_number: gstInfo.gstNumber || null,
      tax_type: gstInfo.taxType ? String(gstInfo.taxType).toLowerCase() : null,

      operating_hours:
        timings.openTime && timings.closeTime ? `${timings.openTime} - ${timings.closeTime}` : null,
      // Sent as JSON strings: multer turns every non-file field into a string,
      // so the backend reads these the same way whether they arrive as part of
      // a multipart body or a plain JSON one.
      // Each break is stored as the string "1:00 PM - 1:30 PM", which is what
      // the mobile app writes and reads. The draft holds {start, end} objects,
      // and sending those as-is made a web-registered vendor's breaks render as
      // "[object Object]" in the app.
      breaks:
        draft.breaks.length > 0
          ? JSON.stringify(draft.breaks.map((b) => `${b.start} - ${b.end}`))
          : null,
      holidays: draft.holidays.length > 0 ? JSON.stringify(draft.holidays) : null,

      onboarding_completed: true,
    };

    const ownerSelfie = files.ownerSelfie ?? null;
    const coverPhoto = shopPhotos[0] ?? null;

    let profileResponse;
    if (ownerSelfie || coverPhoto) {
      const formData = new FormData();

      Object.entries(profileData).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        formData.append(key, typeof value === 'boolean' ? String(value) : String(value));
      });

      if (ownerSelfie) formData.append('image', ownerSelfie, ownerSelfie.name);
      if (coverPhoto) formData.append('cover_image', coverPhoto, coverPhoto.name);

      profileResponse = await vendorAPI.updateProfileWithImage(formData);
    } else {
      profileResponse = await vendorAPI.updateProfile(profileData);
    }

    if (!profileResponse?.success) {
      throw new Error(profileResponse?.error || 'Failed to update vendor profile');
    }

    // The backend expects the USER id for service creation, not the
    // VendorProfile id — the profile serializer returns it as `user`.
    const vendorId = profileResponse.data?.user;

    // Documents never block onboarding: each failure is collected and reported
    // so the vendor knows exactly what to re-upload.
    const documentUploads = [
      ['pan_card', files.panCard],
      ['trade_license', files.tradeLicense],
      ['gst_certificate', files.gstCertificate],
      ['shop_license', files.bankProof],
      ['aadhar_card', files.ownerAadhar],
    ].filter(([, file]) => Boolean(file));

    const documentResults = await Promise.allSettled(
      documentUploads.map(([type, file]) => uploadDocument(type, file))
    );
    const failedDocuments = documentResults
      .map((result, index) => (result.status === 'rejected' ? documentUploads[index][0] : null))
      .filter(Boolean);

    // shopPhotos[0] already went up as cover_image, so it is skipped here.
    let failedPhotos = [];
    if (shopPhotos.length > 1) {
      const extras = shopPhotos.slice(1);
      // allSettled, not all: every request is already in flight when one
      // rejects, so Promise.all would abandon uploads that still land on the
      // server. Partial success is real and has to be reported.
      const photoResults = await Promise.allSettled(
        extras.map((photo, index) => uploadDocument(`shop_photo_${index + 2}`, photo))
      );
      failedPhotos = photoResults
        .map((result, index) => (result.status === 'rejected' ? `shop_photo_${index + 2}` : null))
        .filter(Boolean);
    }

    let failedServices = [];
    if (vendorId && draft.serviceDetails.length > 0) {
      const serviceNames = draft.serviceDetails.map((s, i) => s?.name || `Service ${i + 1}`);

      const serviceResults = await Promise.allSettled(
        draft.serviceDetails.map((service) => {
          const serviceData = {
            name: service.name,
            description: service.description || '',
            price: parseFloat(service.price) || 0,
            duration: parseDurationToMinutes(service.duration),
            category: service.category || 'General',
            is_active: true,
            vehicle_note: service.vehicle_note || null,
            segment_prices: Array.isArray(service.segment_prices) ? service.segment_prices : [],
          };

          return service.image
            ? servicesAPI.createServiceWithImage(vendorId, serviceData, service.image)
            : servicesAPI.createService(vendorId, serviceData);
        })
      );

      // Same reasoning as the photos above: a Promise.all rejection would leave
      // the services that succeeded in the database while telling the vendor
      // the whole thing failed.
      failedServices = serviceResults
        .map((result, index) =>
          result.status === 'rejected' || result.value?.success === false
            ? serviceNames[index]
            : null
        )
        .filter(Boolean);
    }

    const partialFailure =
      failedServices.length > 0 || failedPhotos.length > 0 || failedDocuments.length > 0;

    return {
      success: true,
      partialFailure,
      failedServices,
      failedPhotos,
      failedDocuments,
      data: profileResponse.data,
    };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to complete onboarding' };
  }
};

export default submitOnboarding;
