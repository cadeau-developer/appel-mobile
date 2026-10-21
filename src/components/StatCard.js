import React from "react";
import { StyleSheet, View } from "react-native";
import Text from "./LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../theme";

const tones = {
  primary: { bg: colors.primaryLight, icon: colors.primary },
  success: { bg: colors.successLight, icon: colors.success },
  danger: { bg: colors.dangerLight, icon: colors.danger },
  warning: { bg: colors.accentLight, icon: "#B45309" },
  info: { bg: colors.infoLight, icon: colors.info },
};

export default function StatCard({ label, value, icon, tone = "primary", onPress }) {
  const t = tones[tone];
  return (
    <View style={[styles.card, onPress && styles.pressable]}>
      <View style={[styles.iconCircle, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={20} color={t.icon} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(3.5),
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
  },
  pressable: {},
  iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  textWrap: { flexShrink: 1 },
  value: { fontSize: 22, fontWeight: "800", color: colors.text },
  label: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
});