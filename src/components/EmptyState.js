import React from "react";
import { StyleSheet, View } from "react-native";
import Text from "./LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../theme";

export default function EmptyState({ icon = "file-tray-outline", title, subtitle }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: spacing(6), paddingHorizontal: spacing(4) },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing(3),
  },
  title: { fontSize: 16, fontWeight: "700", color: colors.text, textAlign: "center" },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: "center", marginTop: spacing(1) },
});