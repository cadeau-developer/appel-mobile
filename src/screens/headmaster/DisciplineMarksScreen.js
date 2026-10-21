import React, { useState } from "react";
import { FlatList, StyleSheet, View, RefreshControl, TouchableOpacity } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import Avatar from "../../components/Avatar";
import EmptyState from "../../components/EmptyState";
import { fetchDisciplineMarks } from "../../api/discipline";
import { colors, radius, spacing, typography } from "../../theme";

export default function DisciplineMarksScreen() {
  const [onlyPunishable, setOnlyPunishable] = useState(true);
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["discipline-marks"],
    queryFn: fetchDisciplineMarks,
  });

  const rows = data?.students || [];
  const settings = data?.settings;
  const punishable = rows.filter((r) => r.punishable);
  const list = onlyPunishable ? punishable : rows;

  return (
    <Screen scroll={false}>
      <FlatList
        contentContainerStyle={styles.list}
        data={list}
        keyExtractor={(item) => String(item.student.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={
          <View>
            <Text style={typography.title}>Discipline marks</Text>
            <Text style={[typography.subtitle, styles.mt]}>
              Every student starts with {settings?.defaultMarks ?? "—"} marks. A punishment is due when{" "}
              {settings?.punishmentThreshold ?? "—"} marks or more are lost.
            </Text>
            <View style={styles.toggleRow}>
              <ToggleChip
                label={`Punishment due (${punishable.length})`}
                active={onlyPunishable}
                tone="danger"
                onPress={() => setOnlyPunishable(true)}
              />
              <ToggleChip
                label={`All students (${rows.length})`}
                active={!onlyPunishable}
                onPress={() => setOnlyPunishable(false)}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="ribbon-outline"
              title={onlyPunishable ? "No punishments due" : "No students yet"}
              subtitle={
                onlyPunishable
                  ? "No student has lost enough discipline marks this term."
                  : "Students will appear here once they are registered."
              }
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Card padded={false} style={styles.card}>
            <View style={styles.row}>
              <Avatar uri={item.student.photoUrl} name={item.student.name} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={typography.cardTitle}>{item.student.name}</Text>
                <Text style={styles.meta}>
                  {item.student.class?.name || "No class"} · lost {item.deducted} · {item.cases} case
                  {item.cases === 1 ? "" : "s"}
                </Text>
              </View>
              <View
                style={[
                  styles.marksPill,
                  (item.punishable || item.remaining <= 0) && styles.marksPillDanger,
                ]}
              >
                <Text
                  style={[
                    styles.marksValue,
                    (item.punishable || item.remaining <= 0) && styles.marksValueDanger,
                  ]}
                >
                  {item.remaining}
                </Text>
                <Text
                  style={[
                    styles.marksLabel,
                    (item.punishable || item.remaining <= 0) && styles.marksValueDanger,
                  ]}
                >
                  marks
                </Text>
              </View>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

function ToggleChip({ label, active, onPress, tone }) {
  const activeColor = tone === "danger" ? colors.danger : colors.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: activeColor, borderColor: activeColor },
      ]}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing(4), paddingBottom: spacing(10) },
  mt: { marginTop: spacing(1), marginBottom: spacing(3) },
  toggleRow: { flexDirection: "row", gap: spacing(2), marginBottom: spacing(3) },
  chip: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: { fontSize: 12.5, fontWeight: "700", color: colors.textMuted },
  chipTextActive: { color: "#fff" },
  card: { marginBottom: spacing(2.5) },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(3), padding: spacing(3.5) },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  marksPill: {
    minWidth: 56,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2),
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
  },
  marksPillDanger: { backgroundColor: colors.dangerLight },
  marksValue: { fontSize: 18, fontWeight: "800", color: colors.primary },
  marksLabel: { fontSize: 10, fontWeight: "700", color: colors.primary },
  marksValueDanger: { color: colors.danger },
});
