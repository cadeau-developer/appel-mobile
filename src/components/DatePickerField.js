import React, { useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "./LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../theme";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function toLocalISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISO(iso) {
  return new Date(`${iso}T00:00:00`);
}

function formatDate(iso) {
  if (!iso) return "";
  const d = parseISO(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${mon}/${d.getFullYear()}`;
}

export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Pick a date",
  icon = "calendar-outline",
  maximumDate,
}) {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState("days");
  const [viewYear, setViewYear] = useState(
    value ? parseISO(value).getFullYear() : new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    value ? parseISO(value).getMonth() : new Date().getMonth()
  );

  const maxDateObj = maximumDate ? new Date(maximumDate.getFullYear(), maximumDate.getMonth(), maximumDate.getDate()) : null;
  const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const maxYear = Math.max(maxDateObj ? maxDateObj.getFullYear() : today.getFullYear(), today.getFullYear());
  const minYear = maxYear - 90;
  const years = useMemo(() => {
    const arr = [];
    for (let y = maxYear; y >= minYear; y--) arr.push(y);
    return arr;
  }, [minYear, maxYear]);

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const offset = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const arr = [];
    for (let i = 0; i < offset; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(viewYear, viewMonth, d));
    return arr;
  }, [viewYear, viewMonth]);

  const canGoNext = useMemo(() => {
    if (mode === "years") return viewYear < maxYear;
    if (!maxDateObj) return true;
    const nextMonth = new Date(viewYear, viewMonth + 1, 1);
    return nextMonth.getTime() <= maxDateObj.getTime();
  }, [viewYear, viewMonth, mode, maxDateObj, maxYear]);

  const canGoPrev = useMemo(() => {
    if (mode === "years") return viewYear > minYear;
    return viewYear > minYear || viewMonth > 0;
  }, [viewYear, viewMonth, mode, minYear]);

  const open = () => {
    const base = value ? parseISO(value) : new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setMode("days");
    setShow(true);
  };

  const goPrev = () => {
    if (mode === "years") {
      setViewYear((y) => Math.max(y - 1, minYear));
    } else if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (mode === "years") {
      setViewYear((y) => Math.min(y + 1, maxYear));
    } else if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const pick = (day) => {
    onChange(toLocalISO(day));
    setShow(false);
  };

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity onPress={open} style={styles.trigger}>
        <Ionicons name={icon} size={18} color={colors.textMuted} />
        <Text style={[styles.text, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="chevron-down-outline" size={16} color={colors.textLight} />
      </TouchableOpacity>

      <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShow(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.panel}>
            <View style={styles.calHeader}>
              <TouchableOpacity
                style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
                disabled={!canGoPrev}
                onPress={goPrev}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={20} color={canGoPrev ? colors.primary : colors.textLight} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMode(mode === "days" ? "months" : mode === "months" ? "years" : "days")}
                style={styles.calTitleBtn}
              >
                <Text style={styles.calTitle}>
                  {mode === "years" ? "Select year" : `${MONTHS[viewMonth]} ${viewYear}`}
                </Text>
                <Ionicons name="chevron-down-outline" size={14} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
                disabled={!canGoNext}
                onPress={goNext}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-forward" size={20} color={canGoNext ? colors.primary : colors.textLight} />
              </TouchableOpacity>
            </View>

            {mode === "days" ? (
              <>
                <View style={styles.weekRow}>
                  {WEEKDAYS.map((w) => (
                    <Text key={w} style={styles.weekday}>{w}</Text>
                  ))}
                </View>
                <View style={styles.daysGrid}>
                  {cells.map((day, i) => {
                    if (!day) return <View key={`b-${i}`} style={styles.dayCell} />;
                    const iso = toLocalISO(day);
                    const selected = iso === value;
                    const isToday = day.getTime() === today.getTime();
                    const disabled = maxDateObj && day.getTime() > maxDateObj.getTime();
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.dayCell,
                          selected && styles.dayCellSelected,
                          disabled && styles.dayCellDisabled,
                        ]}
                        disabled={disabled}
                        onPress={() => pick(day)}
                      >
                        <Text style={[styles.dayText, selected && styles.dayTextSelected, isToday && !selected && styles.dayTextToday]}>
                          {day.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : mode === "months" ? (
              <View style={styles.monthGrid}>
                {MONTHS_SHORT.map((m, idx) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.monthCell, viewMonth === idx && styles.monthCellActive]}
                    onPress={() => { setViewMonth(idx); setMode("days"); }}
                  >
                    <Text style={[styles.monthText, viewMonth === idx && styles.monthTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.yearGrid}>
                {years.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.yearCell, viewYear === y && styles.yearCellActive]}
                    onPress={() => { setViewYear(y); setMode("months"); }}
                  >
                    <Text style={[styles.yearText, viewYear === y && styles.yearTextActive]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity onPress={() => setShow(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing(3) },
  label: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: spacing(1.5) },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
  },
  text: { flex: 1, fontSize: 15, color: colors.text, fontWeight: "500" },
  placeholder: { color: colors.textLight },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing(4),
  },
  panel: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing(4),
  },
  calHeader: { flexDirection: "row", alignItems: "center", gap: spacing(2), marginBottom: spacing(3) },
  navBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" },
  navBtnDisabled: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  calTitleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing(1.5) },
  calTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  weekRow: { flexDirection: "row", marginBottom: spacing(1.5) },
  weekday: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: colors.textMuted },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: "14.2857%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  dayCellSelected: { backgroundColor: colors.primary, borderRadius: radius.round },
  dayCellDisabled: { opacity: 0.3 },
  dayText: { fontSize: 14, fontWeight: "600", color: colors.text },
  dayTextSelected: { color: "#fff", fontWeight: "800" },
  dayTextToday: { color: colors.primary, fontWeight: "800" },
  monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1.5) },
  monthCell: {
    width: "17%",
    flexGrow: 1,
    paddingVertical: spacing(2.5),
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  monthCellActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  monthText: { fontSize: 13, fontWeight: "700", color: colors.text },
  monthTextActive: { color: "#fff" },
  yearGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1.5), maxHeight: 260 },
  yearCell: {
    width: "17%",
    flexGrow: 1,
    paddingVertical: spacing(2.5),
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  yearCellActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  yearText: { fontSize: 13, fontWeight: "700", color: colors.text },
  yearTextActive: { color: "#fff" },
  cancelBtn: { marginTop: spacing(2), alignItems: "center", paddingVertical: spacing(2) },
  cancelText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
});