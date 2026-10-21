import { Alert } from "react-native";

// Last-resort handler for uncaught JavaScript errors.
//
// This module is imported first (before any other module) in App.js so that even
// a crash during module evaluation - e.g. a native module that failed to link -
// is surfaced to the user as a readable alert instead of the app silently
// closing with no explanation.
function reportError(error, isFatal) {
  try {
    const message = (error && (error.message || String(error))) || "Unknown error";
    const stack = (error && error.stack) || "";
    const title = isFatal ? "App crash" : "App error";
    Alert.alert(title, `${message}\n\n${stack}`.slice(0, 1800), [{ text: "OK" }]);
  } catch (_) {
    // Never let the reporter itself throw.
  }
}

const root = typeof global !== "undefined" ? global : undefined;

if (root && root.ErrorUtils && typeof root.ErrorUtils.setGlobalHandler === "function") {
  const previousHandler =
    typeof root.ErrorUtils.getGlobalHandler === "function"
      ? root.ErrorUtils.getGlobalHandler()
      : null;

  root.ErrorUtils.setGlobalHandler((error, isFatal) => {
    reportError(error, isFatal);
    if (typeof previousHandler === "function") previousHandler(error, isFatal);
  });
}

export const globalErrorHandlerInstalled = Boolean(root && root.ErrorUtils);
