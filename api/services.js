import api, { uploadWithFetch } from '@/lib/api';

// Shared by the create and update multipart paths so a service photo upload
// sends exactly the same fields either way.
const buildServiceForm = (serviceData, imageFile) => {
  const form = new FormData();
  form.append('name', serviceData.name || '');
  form.append('description', serviceData.description || '');
  form.append('price', String(serviceData.price));
  form.append('duration', String(serviceData.duration));
  form.append('category', serviceData.category || 'General');
  form.append('is_active', String(serviceData.is_active !== false));

  // multer turns every non-file field into a string, so the backend validator
  // accepts segment_prices as a JSON string here and as a real array on the
  // plain-JSON path below.
  if (Array.isArray(serviceData.segment_prices) && serviceData.segment_prices.length > 0) {
    form.append('segment_prices', JSON.stringify(serviceData.segment_prices));
  }
  if (serviceData.vehicle_note) form.append('vehicle_note', serviceData.vehicle_note);

  if (imageFile) form.append('image', imageFile);
  else if (serviceData.image_url) form.append('image_url', serviceData.image_url);

  return form;
};

const normalize = (serviceData) => ({
  ...serviceData,
  ...(serviceData.price !== undefined && {
    price: typeof serviceData.price === 'string' ? parseFloat(serviceData.price) : serviceData.price,
  }),
  ...(serviceData.duration !== undefined && {
    duration:
      typeof serviceData.duration === 'string'
        ? parseInt(serviceData.duration, 10)
        : serviceData.duration,
  }),
});

export const servicesAPI = {
  getVendorServices: (vendorId) => api.get(`/service_api/vendor/${vendorId}/services`),

  createService: (vendorId, serviceData) =>
    api.post(`/service_api/vendor/${vendorId}/services/create`, {
      ...normalize(serviceData),
      is_active: serviceData.is_active !== undefined ? serviceData.is_active : true,
    }),

  createServiceWithImage: (vendorId, serviceData, imageFile) =>
    uploadWithFetch(
      'POST',
      `/service_api/vendor/${vendorId}/services/create`,
      buildServiceForm(serviceData, imageFile)
    ),

  updateService: (vendorId, serviceId, serviceData) =>
    api.put(`/service_api/vendor/${vendorId}/services/update/${serviceId}`, normalize(serviceData)),

  updateServiceWithImage: (vendorId, serviceId, serviceData, imageFile) =>
    uploadWithFetch(
      'PUT',
      `/service_api/vendor/${vendorId}/services/update/${serviceId}`,
      buildServiceForm(serviceData, imageFile)
    ),

  deleteService: (vendorId, serviceId) =>
    api.delete(`/service_api/vendor/${vendorId}/services/delete/${serviceId}`),
};

export default servicesAPI;
