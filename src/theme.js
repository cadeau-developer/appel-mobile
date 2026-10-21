// "Attendance" design system
import { Platform } from "react-native";

export const colors = {
  primary: "#2563EB",
  primaryDark: "#1E40AF",
  primaryLight: "#DBEAFE",
  accent: "#F59E0B",
  accentLight: "#FEF3C7",
  success: "#16A34A",
  successLight: "#DCFCE7",
  danger: "#DC2626",
  dangerLight: "#FEE2E2",
  info: "#2563EB",
  infoLight: "#DBEAFE",
  background: "#E8F2FF",
  surface: "#FFFFFF",
  text: "#0F172A",
  textMuted: "#5A6B8A",
  textLight: "#94A3B8",
  border: "rgba(37,99,235,0.14)",
  surfaceMuted: "#F1F6FF",
  onPrimary: "#FFFFFF",
};

export const spacing = (n) => n * 4;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  round: 999,
};

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// Cross-platform shadow. React Native Web deprecated the legacy shadow* style
// props in favour of `boxShadow`, while native (Android/iOS) still uses
// shadowColor/shadowOffset/shadowOpacity/shadowRadius (+ elevation on Android).
export function shadowStyle({ color, offsetX = 0, offsetY = 0, radius, opacity, elevation = 0 }) {
  if (Platform.OS === "web") {
    return { boxShadow: `${offsetX}px ${offsetY}px ${radius}px ${hexToRgba(color, opacity)}` };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}

export const shadow = {
  card: shadowStyle({ color: "#1E3A8A", offsetY: 5, radius: 14, opacity: 0.08, elevation: 2 }),
  sm: shadowStyle({ color: "#1E3A8A", offsetY: 2, radius: 6, opacity: 0.06, elevation: 1 }),
};

export const typography = {
  title: { fontSize: 27, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: colors.textMuted },
  cardTitle: { fontSize: 17, fontWeight: "700", color: colors.text, letterSpacing: -0.2 },
  body: { fontSize: 15, color: colors.text },
  caption: { fontSize: 13, color: colors.textMuted },
};

export const gradient = [colors.primaryDark, colors.primary];