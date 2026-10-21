import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "./LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../theme";

export default function Select({
  label,
  icon,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  error,
  style,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const items = value && !options.includes(value) ? [value, ...options] : options;

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.box, error && styles.boxError, disabled && styles.boxDisabled]}
        onPress={() => (disabled ? undefined : setOpen(true))}
        activeOpacity={0.8}
        disabled={disabled}
      >
        {icon ? <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.icon} /> : null}
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {label || "Select an option"}
              </Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.list} bounces={false}>
              {items.map((opt) => {
                const active = opt === value;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{opt}</Text>
                    {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing(3.5) },
  label: { marginBottom: spacing(1.5), fontWeight: "600", color: colors.text, fontSize: 14 },
  box: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: 54,
    paddingHorizontal: spacing(3.5),
    backgroundColor: colors.surface,
  },
  boxError: { borderColor: colors.danger },
  boxDisabled: { opacity: 0.6 },
  icon: { marginRight: spacing(2.5) },
  value: { flex: 1, paddingVertical: spacing(3), fontSize: 15, color: colors.text },
  placeholder: { color: colors.textLight },
  errorText: { color: colors.danger, fontSize: 12, marginTop: spacing(1) },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 17, 21, 0.55)",
    justifyContent: "center",
    paddingHorizontal: spacing(5),
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: "75%",
    overflow: "hidden",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: { fontSize: 15, fontWeight: "800", color: colors.text, flex: 1, marginRight: spacing(2) },
  list: { paddingHorizontal: spacing(2.5), paddingVertical: spacing(2) },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(3),
    borderRadius: radius.md,
  },
  optionActive: { backgroundColor: colors.primaryLight },
  optionText: { fontSize: 15, color: colors.text, fontWeight: "600", flex: 1, marginRight: spacing(2) },
  optionTextActive: { color: colors.primary },
});
