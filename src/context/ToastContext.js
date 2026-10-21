import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Text from "../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow, spacing } from "../theme";

const ToastContext = createContext(null);

const icons = {
  success: { name: "checkmark-circle", color: colors.success },
  error: { name: "alert-circle", color: colors.danger },
  info: { name: "information-circle", color: colors.info },
};

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const insets = useSafeAreaInsets();

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "success") => {
      const id = nextId++;
      setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
      setTimeout(() => dismiss(id), 2800);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={[styles.host, { bottom: spacing(5) + insets.bottom }]}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  const icon = icons[toast.type] || icons.info;

  Animated.parallel([
    Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: Platform.OS !== "web" }),
    Animated.spring(translateY, { toValue: 0, speed: 18, bounciness: 6, useNativeDriver: Platform.OS !== "web" }),
  ]).start();

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: toast.type === "error" ? colors.dangerLight : colors.successLight, borderColor: icon.color },
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <Ionicons name={icon.name} size={20} color={icon.color} />
      <Text style={styles.message}>{toast.message}</Text>
    </Animated.View>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    bottom: spacing(5),
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
    pointerEvents: "none",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    maxWidth: 420,
    marginBottom: spacing(2),
    ...shadow.card,
  },
  message: { flexShrink: 1, fontSize: 14, fontWeight: "600", color: colors.text },
});