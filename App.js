import "./src/utils/globalErrorHandler";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "./src/context/AuthContext";
import { ToastProvider } from "./src/context/ToastContext";
import { LanguageProvider } from "./src/context/LanguageContext";
import ErrorBoundary from "./src/components/ErrorBoundary";
import RootNavigator from "./src/navigation/RootNavigator";
import { colors } from "./src/theme";

// Reuse recent screen data for quick navigation, then refresh stale results in
// the background. Auth changes clear this cache to keep accounts isolated.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 60 * 1000,
      retry: 1,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

// On web, hide the browser/scroll view scrollbars and paint the page soft blue
// so the app fills the viewport without an ugly side scrollbar.
function WebChrome() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const style = document.createElement("style");
    style.setAttribute("data-attendance-web", "true");
    style.textContent = `
      * { scrollbar-width: none; -ms-overflow-style: none; }
      *::-webkit-scrollbar { width: 0; height: 0; display: none; }
      html, body, #root { margin: 0; padding: 0; height: 100%; background-color: #E8F2FF; }
      #root { display: flex; flex-direction: column; }
      [role="tab"] { border-radius: 16px; transition: background-color 120ms ease, color 120ms ease; }
      [role="tab"]:hover, [role="tab"]:hover * { color: #FFFFFF !important; }
      [role="tab"]:hover { background-color: #2563EB; }
    `;
    document.head.appendChild(style);
    return () => {
      if (style.parentNode) style.parentNode.removeChild(style);
    };
  }, []);
  return null;
}

export default function App() {
  return (
    <View style={styles.root}>
      <ErrorBoundary bare>
        <SafeAreaProvider>
          <WebChrome />
          <QueryClientProvider client={queryClient}>
            <LanguageProvider>
              <ToastProvider>
                <AuthProvider>
                  <StatusBar
                    style="light"
                    backgroundColor={colors.primaryDark}
                    translucent={false}
                  />
                  <RootNavigator />
                </AuthProvider>
              </ToastProvider>
            </LanguageProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
});