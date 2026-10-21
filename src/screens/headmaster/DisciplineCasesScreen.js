import React from "react";
import { FlatList, StyleSheet, View, RefreshControl, TouchableOpacity } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import Avatar from "../../components/Avatar";
import EmptyState from "../../components/EmptyState";
import { fetchDisciplineCases, markDisciplineCaseReviewed } from "../../api/discipline";
import { useToast } from "../../context/ToastContext";
import { formatShortDate, formatWeekday } from "../../utils/date";
import { colors, radius, spacing, typography } from "../../theme";

export default function DisciplineCasesScreen({ navigation }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: cases = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["discipline-cases"],
    queryFn: fetchDisciplineCases,
  });

  const reviewMutation = useMutation({
    mutationFn: markDisciplineCaseReviewed,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["discipline-cases"] });
      const previous = queryClient.getQueryData(["discipline-cases"]);
      queryClient.setQueryData(["discipline-cases"], (old = []) =>
        old.map((c) => (c.id === id ? { ...c, reviewed: !c.reviewed } : c))
      );
      return { previous };
    },
    onSuccess: (updated) => {
      showToast(updated.reviewed ? "Case marked as reviewed" : "Case unmarked", "success");
    },
    onError: (err, _id, context) => {
      queryClient.setQueryData(["discipline-cases"], context.previous);
      showToast(err.response?.data?.error || "Could not update the case", "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["discipline-cases"] }),
  });

  const pendingCount = cases.filter((c) => !c.reviewed).length;

  return (
    <Screen scroll={false}>
      <FlatList
        contentContainerStyle={styles.list}
        data={cases}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={typography.title}>Discipline cases</Text>
            <Text style={[typography.subtitle, styles.mt]}>
              {cases.length} case{cases.length === 1 ? "" : "s"} reported by teachers in your school ·{" "}
              {pendingCount} pending review.
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerBtn}
                onPress={() => navigation.navigate("DisciplineMarks")}
                activeOpacity={0.8}
              >
                <Ionicons name="ribbon-outline" size={16} color={colors.primary} />
                <Text style={styles.headerBtnText}>Marks & punishments</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerBtn}
                onPress={() => navigation.navigate("DisciplineSettings")}
                activeOpacity={0.8}
              >
                <Ionicons name="settings-outline" size={16} color={colors.primary} />
                <Text style={styles.headerBtnText}>Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="flag-outline"
              title="No discipline cases"
              subtitle="Cases submitted by teachers will show up here."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Card padded={false} style={styles.card}>
            <View style={styles.cardHeader}>
              <Avatar uri={item.student.photoUrl} name={item.student.name} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={typography.cardTitle}>{item.student.name}</Text>
                <Text style={styles.meta}>
                  <Ionicons name="albums-outline" size={12} color={colors.textMuted} /> {item.student.class.name}
                </Text>
              </View>
              {item.reviewed ? (
                <Badge tone="success" icon="checkmark-circle" label="Reviewed" />
              ) : (
                <Badge tone="warning" icon="time-outline" label="Pending" />
              )}
            </View>
            <View style={styles.description}>
              <Text style={styles.descriptionText}>{item.description}</Text>
              {item.marksDeducted > 0 ? (
                <View style={styles.marksChip}>
                  <Ionicons name="remove-circle" size={13} color={colors.danger} />
                  <Text style={styles.marksChipText}>-{item.marksDeducted} marks</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                <Ionicons name="person-outline" size={12} color={colors.textMuted} /> Reported by{" "}
                {item.reportedBy.name}
              </Text>
              <Text style={styles.footerText}>
                {formatWeekday(item.date.slice(0, 10))} {formatShortDate(item.date.slice(0, 10))}
              </Text>
            </View>
            {!item.reviewed ? (
              <TouchableOpacity
                style={styles.reviewBtn}
                onPress={() => reviewMutation.mutate(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-done-outline" size={16} color={colors.success} />
                <Text style={styles.reviewBtnText}>Mark as reviewed</Text>
              </TouchableOpacity>
            ) : null}
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing(4), paddingBottom: spacing(10) },
  header: { marginBottom: spacing(3) },
  mt: { marginTop: spacing(1) },
  headerActions: { flexDirection: "row", gap: spacing(2), marginTop: spacing(3) },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
  },
  headerBtnText: { fontSize: 12.5, fontWeight: "700", color: colors.primary },
  marksChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginTop: spacing(2),
    paddingVertical: 3,
    paddingHorizontal: spacing(2),
    borderRadius: radius.round,
    backgroundColor: colors.surface,
  },
  marksChipText: { fontSize: 11, fontWeight: "800", color: colors.danger },
  card: { marginBottom: spacing(3) },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing(3), padding: spacing(3.5) },
  flagIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  flagIconReviewed: { backgroundColor: colors.success },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  description: {
    marginHorizontal: spacing(3.5),
    backgroundColor: colors.dangerLight,
    borderRadius: radius.sm,
    padding: spacing(3),
  },
  descriptionText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing(3.5),
    paddingTop: spacing(2.5),
  },
  footerText: { fontSize: 12, color: colors.textMuted },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(1.5),
    marginHorizontal: spacing(3.5),
    marginBottom: spacing(3),
    paddingVertical: spacing(2.5),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  reviewBtnText: { color: colors.success, fontWeight: "700", fontSize: 13 },
});