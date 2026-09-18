// Web port of the mobile app's services/sessionExpiry.js.
//
// The API layer cannot navigate on its own (it has no router), so it announces
// the expiry and AuthContext subscribes. Returning `requiresLogin` from the
// failing call is not enough on its own: only the caller that checks the flag
// would react, leaving every other screen stuck on data it can no longer load.

let listener = null;

export const onSessionExpired = (callback) => {
  listener = callback;
  return () => {
    if (listener === callback) listener = null;
  };
};

export const notifySessionExpired = () => {
  if (listener) listener();
};
