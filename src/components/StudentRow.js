import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "./LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { ABSENCE_REASONS } from "../constants/absenceReasons";
import Avatar from "./Avatar";
import { colors, radius, spacing } from "../theme";

export default function StudentRow({ student, unavailable, reason, onToggle, onReasonChange, disabled }) {
  const isCustom = unavailable && !!reason && !ABSENCE_REASONS.includes(reason);
  const selectedChip = unavailable && !isCustom ? reason || "" : "";

  return (
    <View style={[styles.row, unavailable && styles.rowUnavailable]}>
      <View style={styles.header}>
        <Avatar uri={student.photoUrl} name={student.name} size={36} />
        <Text style={styles.name} numberOfLines={1}>
          {student.name}
        </Text>
        <TouchableOpacity
          style={[styles.pill, unavailable ? styles.pillUnavailable : styles.pillAvailable]}
          onPress={disabled ? undefined : onToggle}
          disabled={disabled}
          activeOpacity={0.8}
        >
          {disabled ? (
            <Ionicons name="lock-closed" size={14} color={colors.textLight} />
          ) : unavailable ? (
            <Ionicons name="close-circle" size={14} color={colors.danger} />
          ) : (
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          )}
          <Text style={[styles.pillText, unavailable && styles.pillTextUnavailable, disabled && styles.pillTextDisabled]}>
            {unavailable ? "Absent" : "Present"}
          </Text>
        </TouchableOpacity>
      </View>
      {unavailable ? (
        <View style={styles.reasonWrap}>
          <Text style={styles.reasonLabel}>Reason</Text>
          <View style={styles.chips}>
            {ABSENCE_REASONS.map((label) => {
              const active = selectedChip === label;
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.chip, active && styles.chipActive, disabled && styles.chipDisabled]}
                  onPress={disabled ? undefined : () => onReasonChange(label)}
                  disabled={disabled}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
            {isCustom ? (
              <View style={[styles.chip, styles.chipActive, styles.chipCustom]}>
                <Text style={[styles.chipText, styles.chipTextActive]}>{reason}</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(3),
    marginBottom: spacing(2.5),
  },
  rowUnavailable: { borderColor: colors.dangerLight },
  header: { flexDirection: "row", alignItems: "center", gap: spacing(2.5) },
  name: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.text },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.round,
  },
  pillAvailable: { backgroundColor: colors.successLight },
  pillUnavailable: { backgroundColor: colors.dangerLight },
  pillText: { color: colors.success, fontWeight: "700", fontSize: 12 },
  pillTextUnavailable: { color: colors.danger },
  pillTextDisabled: { color: colors.textLight },
  chipDisabled: { opacity: 0.6 },
  reasonWrap: {
    marginTop: spacing(3),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing(2.5),
  },
  reasonLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, marginBottom: spacing(1.5) },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1.5) },
  chip: {
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2.5),
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.danger, borderColor: colors.danger },
  chipCustom: { opacity: 0.75 },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  chipTextActive: { color: "#fff", fontWeight: "700" },
});