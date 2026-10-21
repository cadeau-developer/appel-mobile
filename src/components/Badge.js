import React from "react";
import { StyleSheet, View } from "react-native";
import Text from "./LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../theme";

const tones = {
  primary: { bg: colors.primaryLight, text: colors.primary },
  success: { bg: colors.successLight, text: colors.success },
  danger: { bg: colors.dangerLight, text: colors.danger },
  warning: { bg: colors.accentLight, text: colors.accent },
  info: { bg: colors.infoLight, text: colors.info },
  neutral: { bg: colors.surfaceMuted, text: colors.textMuted },
};

export default function Badge({ tone = "neutral", icon, label, style }) {
  const t = tones[tone] || tones.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={t.text} /> : null}
      <Text style={[styles.text, { color: t.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1),
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
    borderRadius: radius.round,
    alignSelf: "flex-start",
  },
  text: { fontSize: 12, fontWeight: "700" },
});