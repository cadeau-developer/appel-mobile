import React from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "./LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, spacing } from "../theme";

export default function Button({
  title,
  onPress,
  loading,
  disabled,
  icon,
  iconColor,
  variant = "primary",
  block = true,
  size = "md",
  style,
  textStyle,
}) {
  const v = variants[variant];
  const isSmall = size === "sm";
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        styles.base,
        v.container,
        block && styles.block,
        isSmall && styles.small,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {variant === "primary" ? (
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, isSmall && styles.smallGradient]}
        >
          {renderContent()}
        </LinearGradient>
      ) : renderContent()}
    </TouchableOpacity>
  );

  function renderContent() {
    return loading ? (
      <ActivityIndicator color={v.spinner} />
    ) : (
      <View style={styles.content}>
        {icon ? <Ionicons name={icon} size={isSmall ? 16 : 18} color={iconColor || v.text} /> : null}
        <Text style={[styles.label, { color: v.text }, isSmall && styles.smallLabel, textStyle]}>
          {title}
        </Text>
      </View>
    );
  }
}

const variants = {
  primary: { container: { backgroundColor: colors.primaryDark }, text: colors.onPrimary, spinner: "#fff" },
  secondary: { container: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, text: colors.primary, spinner: colors.primary },
  danger: { container: { backgroundColor: colors.danger }, text: "#fff", spinner: "#fff" },
  ghost: { container: { backgroundColor: "transparent" }, text: colors.primary, spinner: colors.primary },
};

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  gradient: { minHeight: 52, alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
  block: { alignSelf: "stretch" },
  small: { minHeight: 38, paddingVertical: spacing(1.5), paddingHorizontal: spacing(3), borderRadius: radius.sm },
  smallGradient: { minHeight: 38 },
  disabled: { opacity: 0.55 },
  content: { flexDirection: "row", alignItems: "center", gap: spacing(2) },
  label: { fontWeight: "700", fontSize: 16 },
  smallLabel: { fontSize: 13 },
});