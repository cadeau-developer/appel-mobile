import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import Avatar from "../../components/Avatar";
import { fetchStudentHistory } from "../../api/students";
import { formatFullDate } from "../../utils/date";
import { colors, radius, spacing, typography } from "../../theme";

export default function StudentHistoryScreen({ route }) {
  const { studentId, studentName } = route.params;

  const { data, isLoading } = useQuery({
    queryKey: ["student-history", studentId],
    queryFn: () => fetchStudentHistory(studentId),
  });

  const days = data?.unavailableDays || [];
  const cases = data?.disciplineCases || [];
  const stats = data?.stats;

  const ListHeader = (
    <View>
      <View style={styles.profile}>
        <Avatar uri={data?.student?.photoUrl} name={studentName} size={48} />
        <View style={{ flex: 1 }}>
          <Text style={typography.title}>{studentName}</Text>
          <Text style={typography.subtitle}>
            {data ? `${data.student.class.name} · ${stats.recordedDays} day${stats.recordedDays === 1 ? "" : "s"} recorded` : "Loading…"}
          </Text>
        </View>
      </View>

      {stats ? (
        <View style={styles.statGrid}>
          <View style={[styles.stat, styles.statTotal]}>
            <Text style={styles.statValue}>{stats.recordedDays}</Text>
            <Text style={styles.statLabel}>Recorded days</Text>
          </View>
          <View style={[styles.stat, styles.statPresent]}>
            <Text style={styles.statValue}>{stats.presentCount}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={[styles.stat, styles.statUnavailable]}>
            <Text style={styles.statValue}>{stats.unavailableCount}</Text>
            <Text style={styles.statLabel}>Unavailable</Text>
          </View>
          <View style={[styles.stat, styles.statRate]}>
            <Text style={styles.statValue}>{stats.presenceRate}%</Text>
            <Text style={styles.statLabel}>Presence rate</Text>
          </View>
        </View>
      ) : null}

      {cases.length ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Discipline cases</Text>
            <Badge tone="danger" label={`${cases.length}`} />
          </View>
          {cases.slice(0, 5).map((c) => (
            <Card padded={false} key={c.id} style={styles.caseCard}>
              <View style={styles.caseBody}>
                <View style={styles.caseIcon}>
                  <Ionicons name="flag" size={14} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.caseText} numberOfLines={2}>
                    {c.description}
                  </Text>
                  <Text style={styles.caseMeta}>{formatFullDate(c.date)}</Text>
                </View>
                {c.reviewed ? (
                  <Badge tone="success" icon="checkmark-circle" label="Reviewed" />
                ) : (
                  <Badge tone="warning" label="Pending" />
                )}
              </View>
            </Card>
          ))}
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Unavailable days</Text>
        <Badge tone="danger" label={`${days.length}`} />
      </View>
      <View style={styles.banner}>
        <Ionicons name="time-outline" size={18} color={colors.primary} />
        <Text style={styles.bannerText}>
          Every recorded day this student was unavailable at school, with the reason chosen by the teacher.
        </Text>
      </View>
    </View>
  );

  return (
    <Screen scroll={false}>
      <FlatList
        contentContainerStyle={styles.list}
        data={days}
        keyExtractor={(item, idx) => `${item.date}-${idx}`}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="checkmark-done-outline"
              title="Always available"
              subtitle="This student has been available on every recorded day."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Card padded={false} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <View style={styles.calIcon}>
                <Ionicons name="calendar-outline" size={16} color={colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dayTitle}>{formatFullDate(item.date)}</Text>
              </View>
              <Badge tone="danger" icon="close-circle" label="Unavailable" />
            </View>
            <View style={styles.dayReason}>
              <Text style={styles.reasonLabel}>Reason</Text>
              <Text style={styles.reasonText}>{item.reason || "No reason given"}</Text>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing(4), paddingBottom: spacing(10) },
  profile: { flexDirection: "row", alignItems: "center", gap: spacing(3), marginBottom: spacing(3) },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2.5), marginBottom: spacing(4) },
  stat: {
    width: "48%",
    flexGrow: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing(3),
    alignItems: "center",
    borderWidth: 1,
  },
  statTotal: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  statPresent: { backgroundColor: colors.successLight, borderColor: colors.successLight },
  statUnavailable: { backgroundColor: colors.dangerLight, borderColor: colors.dangerLight },
  statRate: { backgroundColor: colors.accentLight, borderColor: colors.accentLight },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: 11, fontWeight: "700", color: colors.textMuted, marginTop: 2 },
  section: { marginBottom: spacing(4) },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing(2.5),
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  caseCard: { marginBottom: spacing(2.5) },
  caseBody: { flexDirection: "row", alignItems: "center", gap: spacing(2.5), padding: spacing(3) },
  caseIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  caseText: { fontSize: 13, fontWeight: "600", color: colors.text },
  caseMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  banner: {
    flexDirection: "row",
    gap: spacing(2.5),
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing(3),
    alignItems: "flex-start",
    marginBottom: spacing(3),
  },
  bannerText: { flex: 1, fontSize: 13, color: colors.primary, fontWeight: "600" },
  dayCard: { marginBottom: spacing(3) },
  dayHeader: { flexDirection: "row", alignItems: "center", gap: spacing(2.5), padding: spacing(3.5) },
  calIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
  dayTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  dayReason: { paddingHorizontal: spacing(3.5), paddingBottom: spacing(3.5), paddingTop: spacing(1) },
  reasonLabel: { fontSize: 11, fontWeight: "700", color: colors.textLight, textTransform: "uppercase" },
  reasonText: { fontSize: 14, color: colors.text, marginTop: spacing(1) },
});