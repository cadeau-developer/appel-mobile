import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View, Modal, Pressable } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import BrandHeader from "../../components/BrandHeader";
import { fetchSettings, updateSettings } from "../../api/settings";
import { fetchYearStatus, startYearAllSchools } from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import { colors, radius, spacing, typography } from "../../theme";

function formatYearInput(text) {
  const digits = text.replace(/[^0-9]/g, "").slice(0, 8);
  return digits.length > 4 ? `${digits.slice(0, 4)}/${digits.slice(4)}` : digits;
}

const CURRENT_CALENDAR_YEAR = new Date().getFullYear();

export default function SchoolYearScreen() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const { data: yearStatus } = useQuery({
    queryKey: ["admin-year-status", CURRENT_CALENDAR_YEAR],
    queryFn: () => fetchYearStatus(CURRENT_CALENDAR_YEAR),
  });

  const [value, setValue] = useState("");
  const [confirmStartAll, setConfirmStartAll] = useState(false);

  useEffect(() => {
    if (settings) setValue(settings.schoolYear || "");
  }, [settings]);

  const baseYear = new Date().getFullYear();
  const presets = [`${baseYear - 1}/${baseYear}`, `${baseYear}/${baseYear + 1}`, `${baseYear + 1}/${baseYear + 2}`];

  const saveMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (saved) => {
      queryClient.setQueryData(["settings"], saved);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      showToast(saved.schoolYear ? "School year saved" : "School year cleared", "success");
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not save the school year", "error"),
  });

  const startAllMutation = useMutation({
    mutationFn: () => startYearAllSchools(CURRENT_CALENDAR_YEAR),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["admin-year-status"] });
      const prev = queryClient.getQueryData(["admin-year-status", CURRENT_CALENDAR_YEAR]);
      if (prev) {
        queryClient.setQueryData(["admin-year-status", CURRENT_CALENDAR_YEAR], {
          ...prev,
          openSchools: prev.approvedSchools,
        });
      }
      return { prev };
    },
    onSuccess: (result) => {
      showToast(
        result.opened === 0
          ? `Year ${result.year} was already open for every school`
          : `Year ${result.year} opened for ${result.opened} school${result.opened === 1 ? "" : "s"}`,
        "success"
      );
      setConfirmStartAll(false);
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(["admin-year-status", CURRENT_CALENDAR_YEAR], ctx.prev);
      }
      showToast(err.response?.data?.error || "Could not start the year for all schools", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-year-status"] });
      queryClient.invalidateQueries({ queryKey: ["years"] });
    },
  });

  const onSave = () => {
    const trimmed = value.trim();
    if (trimmed) {
      const match = trimmed.match(/^(\d{4})\/(\d{4})$/);
      if (!match) {
        showToast("School year must look like 2026/2027", "error");
        return;
      }
      if (Number(match[2]) !== Number(match[1]) + 1) {
        showToast("The two years must be consecutive (e.g. 2026/2027)", "error");
        return;
      }
    }
    saveMutation.mutate({ schoolYear: trimmed || null });
  };

  const allOpen =
    yearStatus && yearStatus.approvedSchools > 0 && yearStatus.openSchools >= yearStatus.approvedSchools;

  return (
    <Screen>
      <BrandHeader
        showAppBrand={false}
        compact
        title="School year"
        subtitle="The academic year shown across the whole app."
        style={{ marginTop: -spacing(1.5) }}
      />

      <View style={styles.content}>
        <Card style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusLabel}>Current school year</Text>
              <Text style={styles.statusValue}>{settings?.schoolYear || "Not set"}</Text>
            </View>
          </View>

          <Input
            label="Academic year"
            icon="calendar-outline"
            value={value}
            onChangeText={(t) => setValue(formatYearInput(t))}
            placeholder="2026/2027"
            keyboardType="number-pad"
          />

          <View style={styles.presetRow}>
            {presets.map((preset) => {
              const active = value === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  onPress={() => setValue(preset)}
                  activeOpacity={0.8}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{preset}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button
            title="Save school year"
            icon="save-outline"
            onPress={onSave}
            loading={saveMutation.isPending}
            style={{ marginTop: spacing(4) }}
          />
        </Card>

        <Card style={styles.card}>
          <View style={styles.statusRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="school-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusLabel}>Start year for all schools</Text>
              <Text style={styles.statusValue}>
                {yearStatus
                  ? `${yearStatus.openSchools} of ${yearStatus.approvedSchools} schools open`
                  : "Loading…"}
              </Text>
            </View>
            {yearStatus ? (
              <Badge tone={allOpen ? "success" : "neutral"} label={allOpen ? "All open" : "Partial"} />
            ) : null}
          </View>
          <Text style={styles.noteInline}>
            Opens school year {CURRENT_CALENDAR_YEAR} for every approved school that does not have it open yet.
            Headmasters can still end or reopen the year for their own school afterwards.
          </Text>
          <Button
            title={`Start year ${CURRENT_CALENDAR_YEAR} for all schools`}
            icon="play-outline"
            variant={allOpen ? "secondary" : "primary"}
            onPress={() => setConfirmStartAll(true)}
            loading={startAllMutation.isPending}
            style={{ marginTop: spacing(3) }}
          />
        </Card>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.noteText}>
            The label applies to every school across the app. Starting the year for all schools lets headmasters
            immediately start terms; a day with no attendance from any class automatically counts as an off day.
            Leave the label field empty to clear it.
          </Text>
        </View>
      </View>

      <Modal visible={confirmStartAll} transparent animationType="fade" onRequestClose={() => setConfirmStartAll(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirmStartAll(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Ionicons name="school-outline" size={34} color={colors.primary} />
            <Text style={styles.modalTitle}>Start year {CURRENT_CALENDAR_YEAR} everywhere?</Text>
            <Text style={styles.modalText}>
              Every approved school without an open year gets one — {yearStatus?.openSchools || 0} of{" "}
              {yearStatus?.approvedSchools || 0} already have it. Schools that already have the year open are not
              affected.
            </Text>
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setConfirmStartAll(false)} style={{ flex: 1 }} />
              <Button
                title="Start year"
                onPress={() => {
                  setConfirmStartAll(false);
                  startAllMutation.mutate();
                }}
                loading={startAllMutation.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing(4), paddingBottom: spacing(10) },
  card: { marginBottom: spacing(4) },
  statusRow: { flexDirection: "row", alignItems: "center", gap: spacing(3), marginBottom: spacing(4) },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  statusLabel: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  statusValue: { fontSize: 18, fontWeight: "800", color: colors.text, marginTop: 1 },
  presetRow: { flexDirection: "row", gap: spacing(2), flexWrap: "wrap" },
  chip: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  chipTextActive: { color: "#fff" },
  note: {
    flexDirection: "row",
    gap: spacing(3),
    alignItems: "flex-start",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing(3.5),
    marginBottom: spacing(4),
  },
  noteText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 19 },
  noteInline: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: spacing(1) },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing(5),
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing(5),
    alignItems: "center",
    gap: spacing(2),
    maxWidth: 400,
    width: "100%",
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  modalText: { fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 19 },
  modalActions: { flexDirection: "row", gap: spacing(3), marginTop: spacing(3), width: "100%" },
});
