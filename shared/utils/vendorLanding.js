/**
 * Where a vendor should land after authenticating.
 *
 * One rule, used by every sign-in path — Google sign-in, Google sign-up and
 * email login. Each screen used to decide for itself and they had all drifted
 * to the same wrong answer: navigate straight to HomePage regardless of state.
 * That dropped a brand-new vendor into the main app with no business name, no
 * documents, no services and no timings, and it also stranded any vendor who
 * abandoned onboarding and later logged back in.
 *
 * Pure and synchronous on purpose: the routing rule is the part worth getting
 * right, so it should be testable without a navigator or a live gateway.
 *
 * Keyed on `onboarding_completed` alone. VendorProfile also has `status`
 * (pending/approved), but in practice the two move together — there is no
 * "onboarded but awaiting approval" population. If an approval hold is ever
 * introduced, it belongs here, in the one place, rather than scattered back
 * across the screens.
 */

export const VENDOR_LANDING = {
  NEW: 'OnboardingWelcome',
  RESUME: 'OnboardingStart',
  HOME: 'HomePage',
};

/**
 * @param {object} user      The user object returned by the backend.
 * @param {boolean} isNewUser The backend's isNewUser flag (false for logins).
 * @returns {{ok: boolean, route?: string, errorTitle?: string, errorMessage?: string}}
 */
export const resolveVendorLanding = (user, isNewUser = false) => {
  if (!user) {
    return {
      ok: false,
      errorTitle: 'Sign In Failed',
      errorMessage: 'We could not read your account details. Please try again.',
    };
  }

  // A customer account signing in on the vendor app. The backend deliberately
  // will not change an existing user's role, so this account can never act as
  // a vendor — letting it through would mean vendor screens calling
  // vendor-only endpoints and failing in confusing ways.
  if (user.role !== 'vendor') {
    return {
      ok: false,
      errorTitle: 'Customer Account',
      errorMessage:
        'This email is registered as a customer account. Please use the Keplix customer app, ' +
        'or sign in with a different email to register as a partner.',
    };
  }

  // Brand new account — the profile exists but is a shell (business name is
  // whatever Google supplied, phone is empty). Start at the intro.
  if (isNewUser) {
    return { ok: true, route: VENDOR_LANDING.NEW };
  }

  // Signed up before but never filled anything in — still show the intro.
  //
  // isNewUser is true ONLY on the request that creates the account server-side.
  // Reinstalling the app, or simply signing in a second time, does not delete
  // that row, so a vendor who has never completed a single onboarding step
  // arrives here with isNewUser false and used to be dropped straight into the
  // step hub, having never seen the welcome screen at all.
  //
  // `phone` is the signal: googleLogin creates a vendorProfile with
  // business_name taken from the Google account but phone deliberately "" (see
  // keplix-backend/controllers/authController.js), and WorkshopInformation is
  // the first step that sets it. So an empty phone means nothing has been
  // entered yet. Anything already filled in means they are genuinely resuming.
  const hasStartedOnboarding = Boolean(user.phone || user.phone_number);

  if (!hasStartedOnboarding) {
    return { ok: true, route: VENDOR_LANDING.NEW };
  }

  // Returning, and partway through. Send them to the step hub so they resume at
  // the checklist rather than re-reading the welcome pitch.
  if (!user.onboarding_completed) {
    return { ok: true, route: VENDOR_LANDING.RESUME };
  }

  return { ok: true, route: VENDOR_LANDING.HOME };
};

/**
 * Dev-only wrapper that logs exactly what the rule was given and what it chose.
 *
 * The routing itself has been traced end to end and is correct, so when the
 * landing screen is wrong the cause is always the INPUT -- almost always
 * `isNewUser`, which the backend sets true only on the single request that
 * creates the account. Guessing at that from the outside is slow; this prints
 * it. Stripped from release builds by the __DEV__ guard.
 */
export const resolveVendorLandingDebug = (user, isNewUser = false) => {
  const landing = resolveVendorLanding(user, isNewUser);

  // Web port of the mobile rule: __DEV__ is a React Native global that does not
  // exist in the browser bundle.
  if (process.env.NODE_ENV !== 'production') {
    console.log('[VendorLanding] decision', {
      isNewUser,
      role: user?.role,
      phone: user?.phone ?? user?.phone_number ?? null,
      onboarding_completed: user?.onboarding_completed,
      business_name: user?.business_name,
      chosenRoute: landing.route ?? `REJECTED: ${landing.errorTitle}`,
    });
  }

  return landing;
};

export default resolveVendorLanding;
