import React, { useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View, RefreshControl } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import Avatar from "../../components/Avatar";
import EmptyState from "../../components/EmptyState";
import { fetchAttendanceReport } from "../../api/attendance";
import { formatFullDate, isToday, shiftDate, todayISO } from "../../utils/date";
import { colors, radius, spacing, typography } from "../../theme";

export default function AttendanceReportScreen({ navigation }) {
  const [date, setDate] = useState(todayISO());

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["attendance-report", date],
    queryFn: () => fetchAttendanceReport(date),
  });

  const list = data?.unavailable || [];

  return (
    <Screen scroll={false}>
      <FlatList
        contentContainerStyle={styles.list}
        data={list}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={
          <View>
            <Text style={typography.title}>Attendance report</Text>
            <Text style={[typography.subtitle, styles.mt]}>
              Students marked unavailable across the school on the selected day.
            </Text>

            <Card style={styles.dateCard}>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => setDate((d) => shiftDate(d, -1))}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>
              <View style={styles.dateCenter}>
                {!isToday(date) ? (
                  <TouchableOpacity
                    onPress={() => setDate(todayISO())}
                    style={styles.todayChip}
                  >
                    <Text style={styles.todayChipText}>Back to today</Text>
                  </TouchableOpacity>
                ) : null}
                <Text style={styles.dateTitle}>{formatFullDate(date)}</Text>
                <Text style={styles.dateCount}>
                  {list.length} unavailable student{list.length === 1 ? "" : "s"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => setDate((d) => shiftDate(d, 1))}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            </Card>

            {data?.offDay ? (
              <View style={styles.offDayBanner}>
                <Ionicons name="calendar-outline" size={16} color={colors.danger} />
                <Text style={styles.offDayText}>
                  {data.offDay.weekend
                    ? `${formatFullDate(date)} is closed for attendance by default on weekends. Open this specific date from "Off days" if your school will meet.`
                    : data.offDay.auto
                    ? `${formatFullDate(date)} had no attendance submitted — automatically marked as an off day. You can still mark it off explicitly in "Off days".`
                    : `${formatFullDate(date)} is an off day${data.offDay.label ? ` (${data.offDay.label})` : ""} — no attendance was taken.`}
                </Text>
              </View>
            ) : data?.pendingClasses?.length ? (
              <Card style={styles.pendingCard}>
                <View style={styles.cardHeader}>
                  <Text style={typography.cardTitle}>Classes without attendance</Text>
                  <Badge tone="warning" label={`${data.pendingClasses.length}`} />
                </View>
                {data.pendingClasses.map((c) => (
                  <View key={c.id} style={styles.pendingRow}>
                    <View style={styles.pendingIcon}>
                      <Ionicons name="albums-outline" size={14} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pendingName}>{c.name}</Text>
                      <Text style={styles.pendingMeta}>
                        {c.teacher ? `Class teacher: ${c.teacher}` : "No class teacher"}
                      </Text>
                    </View>
                    <Badge tone="warning" label="No attendance" />
                  </View>
                ))}
              </Card>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="checkmark-done-outline"
              title="No one unavailable"
              subtitle="Every submitted student was available that day."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("StudentHistory", {
                studentId: item.student.id,
                studentName: item.student.name,
              })
            }
          >
            <Card padded={false} style={styles.studentCard}>
              <View style={styles.studentBody}>
                <Avatar uri={item.student.photoUrl} name={item.student.name} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={typography.cardTitle}>{item.student.name}</Text>
                  <Text style={styles.meta}>
                    <Ionicons name="albums-outline" size={12} color={colors.textMuted} />{" "}
                    {item.class.name}
                  </Text>
                  <View style={styles.reasonRow}>
                    <Ionicons name="information-circle-outline" size={13} color={colors.danger} />
                    <Text style={styles.reason} numberOfLines={2}>
                      {item.reason || "No reason given"}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing(4), paddingBottom: spacing(10) },
  mt: { marginTop: spacing(1), marginBottom: spacing(3) },
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing(2.5),
    marginBottom: spacing(3),
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  dateCenter: { flex: 1, alignItems: "center", paddingHorizontal: spacing(2) },
  todayChip: { marginBottom: spacing(1) },
  todayChipText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  dateTitle: { fontSize: 15, fontWeight: "800", color: colors.text, textAlign: "center" },
  dateCount: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  offDayBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing(3),
    marginBottom: spacing(3),
  },
  offDayText: { flex: 1, fontSize: 13, fontWeight: "600", color: colors.danger },
  pendingCard: { padding: spacing(3.5), marginBottom: spacing(3) },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing(2.5),
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    paddingVertical: spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pendingIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingName: { fontSize: 14, fontWeight: "700", color: colors.text },
  pendingMeta: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  studentCard: { marginBottom: spacing(3) },
  studentBody: { flexDirection: "row", alignItems: "center", gap: spacing(3), padding: spacing(3.5) },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "800", color: colors.danger },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  reasonRow: { flexDirection: "row", alignItems: "flex-start", gap: 4, marginTop: spacing(1.5) },
  reason: { fontSize: 13, color: colors.textMuted, flex: 1 },
});