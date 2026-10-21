import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "./LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { PROVINCES, getDistricts, getSectors, getCells, getVillages } from "../data/rwandaLocations";
import { colors, radius, spacing } from "../theme";

const LABELS = { province: "Province", district: "District", sector: "Sector", cell: "Cell", village: "Village" };
const ICONS = { province: "location-outline", district: "map-outline", sector: "navigate-outline", cell: "pin-outline", village: "business-outline" };

function getOptions(level, sel) {
  if (level === "province") return PROVINCES;
  if (level === "district") return getDistricts(sel.province);
  if (level === "sector") return getSectors(sel.district);
  if (level === "cell") return getCells(sel.district, sel.sector);
  if (level === "village") return getVillages(sel.district, sel.sector, sel.cell);
  return [];
}

export default function LocationPicker({ value, onChange, fields = ["province", "district", "sector"] }) {
  const sel = {
    province: value?.province || null,
    district: value?.district || null,
    sector: value?.sector || null,
    cell: value?.cell || null,
    village: value?.village || null,
  };

  const filte = (v) => v && typeof v === "string" && v.trim().length > 0;
  const selectedAt = (level) => (filte(sel[level]) ? sel[level].trim() : null);
  const current = fields.find((lv) => !selectedAt(lv));
  const [openLevel, setOpenLevel] = useState(null);

  const choose = (level, item) => {
    const updated = { ...sel };
    const idx = fields.indexOf(level);
    for (let i = idx; i < fields.length; i++) updated[fields[i]] = null;
    updated[level] = item;
    onChange(updated);
    setOpenLevel(null);
  };

  const options = openLevel ? getOptions(openLevel, sel) : [];

  return (
    <View style={s.wrap}>
      <Text style={s.sectionTitle}>Location</Text>

      {fields.map((level, idx) => {
        const chosen = selectedAt(level);

        if (chosen) {
          return (
            <View key={level} style={[s.dropdown, s.dropdownDone]}>
              <Ionicons name={ICONS[level]} size={16} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={s.label}>{LABELS[level]}</Text>
                <Text style={s.value}>{chosen}</Text>
              </View>
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => {
                  const updated = { ...sel };
                  for (let i = idx; i < fields.length; i++) updated[fields[i]] = null;
                  onChange(updated);
                }}
              >
                <Ionicons name="close-circle" size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          );
        }

        if (level !== current) return null;

        const isOpen = openLevel === level;
        const opts = isOpen ? getOptions(level, sel) : [];

        return (
          <View key={level} style={s.dropdown}>
            <TouchableOpacity
              style={s.dropdownHeader}
              activeOpacity={0.7}
              onPress={() => setOpenLevel(isOpen ? null : level)}
            >
              <Ionicons name={ICONS[level]} size={16} color={colors.primary} />
              <Text style={s.placeholder}>
                {isOpen ? `Choose ${LABELS[level].toLowerCase()}` : `Select ${LABELS[level].toLowerCase()}`}
              </Text>
              <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.textLight} />
            </TouchableOpacity>

            {isOpen && (
              <View style={s.list}>
                {opts.length > 0 ? (
                  opts.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={s.option}
                      activeOpacity={0.7}
                      onPress={() => choose(level, opt)}
                    >
                      <Text style={s.optionText}>{opt}</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.textLight} />
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={s.empty}>No options available</Text>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: spacing(1) },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: spacing(2) },
  dropdown: { marginBottom: spacing(2) },
  dropdownDone: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    backgroundColor: "rgba(91,141,239,0.24)",
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.5),
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.5),
  },
  label: { fontSize: 11, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  value: { fontSize: 15, fontWeight: "700", color: colors.primary, marginTop: 1 },
  placeholder: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.textLight },
  list: {
    marginTop: spacing(1.5),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(3),
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  optionText: { fontSize: 14, fontWeight: "600", color: colors.text },
  empty: { fontSize: 13, color: colors.textMuted, fontStyle: "italic", padding: spacing(3.5) },
});