'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'onboarding_progress';

const EMPTY_DRAFT = {
  workshopInfo: { workshopName: '', description: '', phone: '', email: '', alternatePhone: '' },
  address: { building: '', floor: '', street: '', area: '', city: '', state: '', pincode: '', landmark: '' },
  location: { latitude: null, longitude: null },
  ownerDetails: { fullName: '', phone: '', dateOfBirth: '' },
  gstInfo: { hasGST: true, gstNumber: '', taxType: null },
  bankDetails: { accountNumber: '', ifsc: '', accountHolderName: '', upi: '' },
  timings: { openTime: '', closeTime: '' },
  breaks: [],
  holidays: [],
  serviceDetails: [],
  // Filenames only, so a step can say what was picked before a reload dropped it.
  fileNames: {},
};

/**
 * File slots, kept apart from the persisted draft.
 *
 * The mobile app stores `file://` URIs in AsyncStorage, which survive a JSON
 * round-trip. A browser File cannot be serialised, so files live in memory for
 * the life of this provider — which spans every step, since navigation between
 * them is client-side. A full page reload drops them, and because step
 * completion is derived from the data rather than a stored flag, the affected
 * step correctly reverts to incomplete instead of letting a vendor submit an
 * application with missing documents.
 */
const DraftContext = createContext(null);

const merge = (base, patch) => {
  const next = { ...base };
  Object.entries(patch).forEach(([key, value]) => {
    next[key] =
      value && typeof value === 'object' && !Array.isArray(value)
        ? { ...(base[key] ?? {}), ...value }
        : value;
  });
  return next;
};

export function OnboardingDraftProvider({ children }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [files, setFiles] = useState({});
  const [shopPhotos, setShopPhotos] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      // Loaded after mount because localStorage does not exist during the
      // server render; seeding it synchronously would break hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setDraft((current) => merge(current, JSON.parse(saved)));
    } catch {
      // A corrupt or unreadable draft should not block onboarding.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Private mode or a full quota — the vendor can still finish in one sitting.
    }
  }, [draft, ready]);

  const patch = useCallback((partial) => setDraft((current) => merge(current, partial)), []);

  const setFile = useCallback((key, file) => {
    setFiles((current) => ({ ...current, [key]: file }));
    setDraft((current) => ({
      ...current,
      fileNames: { ...current.fileNames, [key]: file?.name ?? null },
    }));
  }, []);

  const addShopPhoto = useCallback((file) => {
    if (file) setShopPhotos((current) => [...current, file]);
  }, []);

  const removeShopPhoto = useCallback((index) => {
    setShopPhotos((current) => current.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setFiles({});
    setShopPhotos([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
  }, []);

  const value = useMemo(
    () => ({ draft, files, shopPhotos, ready, patch, setFile, addShopPhoto, removeShopPhoto, clear }),
    [draft, files, shopPhotos, ready, patch, setFile, addShopPhoto, removeShopPhoto, clear]
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export const useDraft = () => {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useDraft must be used inside OnboardingDraftProvider');
  return ctx;
};

/**
 * Step completion is derived, never stored.
 *
 * A stored flag would keep claiming "Completed" after a reload dropped the
 * file behind it, and the vendor would only find out when the submit failed.
 */
export const stepCompletion = (draft, files, shopPhotos) => {
  const bankComplete = Boolean(
    draft.bankDetails.accountNumber && draft.bankDetails.ifsc && draft.bankDetails.accountHolderName
  );

  return {
    workshop: Boolean(
      draft.workshopInfo.workshopName &&
        shopPhotos.length > 0 &&
        draft.ownerDetails.fullName &&
        draft.ownerDetails.phone
    ),
    // GSTIN plus either bank details or UPI is the minimum, and both PAN and
    // trade licence must be uploaded before the step will save.
    documents: Boolean(
      draft.gstInfo.gstNumber &&
        files.panCard &&
        files.tradeLicense &&
        (bankComplete || draft.bankDetails.upi)
    ),
    timings: Boolean(draft.timings.openTime && draft.timings.closeTime),
    services: draft.serviceDetails.length > 0,
  };
};

export { STORAGE_KEY, EMPTY_DRAFT };
