'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { rules, validate } from '@/shared/utils/validation';
import { toMinutes } from './TimeSelect';

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
 *
 * Presence alone is not enough either: each step applies the same rules its own
 * screen does, so a malformed GSTIN or a closing time before opening leaves the
 * step incomplete rather than unlocking a submit the backend would reject.
 */
export const stepCompletion = (draft, files, shopPhotos) => {
  const passes = (values, schema) => validate(values, schema).isValid;

  const bankComplete =
    Boolean(
      draft.bankDetails.accountNumber &&
        draft.bankDetails.ifsc &&
        draft.bankDetails.accountHolderName
    ) &&
    passes(draft.bankDetails, {
      accountNumber: [rules.accountNumber],
      ifsc: [rules.ifsc],
    });

  const upiComplete = Boolean(draft.bankDetails.upi) && passes(draft.bankDetails, { upi: [rules.upi] });

  const open = toMinutes(draft.timings.openTime);
  const close = toMinutes(draft.timings.closeTime);
  const hoursValid = open !== null && close !== null && close > open;

  return {
    workshop:
      shopPhotos.length > 0 &&
      passes(draft.workshopInfo, { workshopName: [rules.required('Workshop name')] }) &&
      passes(draft.address, {
        street: [rules.required('Road')],
        area: [rules.required('Area')],
        city: [rules.required('City')],
        pincode: [rules.required('Pincode'), rules.pincode],
      }) &&
      passes(draft.ownerDetails, {
        fullName: [rules.required('Owner name')],
        phone: [rules.required('Owner phone'), rules.mobile],
      }),

    // GSTIN plus either bank details or UPI is the minimum, and both PAN and
    // trade licence must be uploaded before the step will save.
    documents:
      Boolean(files.panCard && files.tradeLicense) &&
      passes(draft.gstInfo, { gstNumber: [rules.required('GSTIN'), rules.gstin] }) &&
      (bankComplete || upiComplete),

    timings:
      hoursValid &&
      draft.breaks.every((item) => {
        const start = toMinutes(item.start);
        const end = toMinutes(item.end);
        return start !== null && end !== null && end > start && start >= open && end <= close;
      }),

    services:
      draft.serviceDetails.length > 0 &&
      draft.serviceDetails.every((service) =>
        passes(service, {
          name: [rules.required('Service name')],
          price: [rules.required('Price'), rules.positiveNumber('Price')],
        })
      ),
  };
};

export { STORAGE_KEY, EMPTY_DRAFT };
