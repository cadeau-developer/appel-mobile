import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import BrandHeader from "../../components/BrandHeader";
import EmptyState from "../../components/EmptyState";
import { fetchMyClasses } from "../../api/classes";
import { fetchAttendance } from "../../api/attendance";
import { useAuth } from "../../context/AuthContext";
import { formatFullDate, isToday, shiftDate, todayISO } from "../../utils/date";
import { colors, radius, spacing, typography } from "../../theme";

export default function TodayAttendanceScreen({ navigation }) {
  const { user } = useAuth();
  const [date, setDate] = useState(todayISO());
  const { data: classes = [] } = useQuery({ queryKey: ["my-class"], queryFn: fetchMyClasses, retry: false });
  const klass = classes[0] || null;

  const { data: attData, isLoading } = useQuery({
    queryKey: ["attendance", klass?.id, date],
    queryFn: () => fetchAttendance(klass.id, date),
    enabled: !!klass,
    retry: false,
  });

  const attendance = attData?.attendance || [];
  const totalStudents = klass?.students?.length || 0;
  const presentCount = attendance.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendance.filter((a) => a.status === "UNAVAILABLE").length;
  const isComplete = attData?.submitted ?? (attendance.length > 0 && attendance.length >= totalStudents);
  const canEdit = attData?.canEdit ?? false;

  return (
    <Screen stickyHeader>
      <BrandHeader
        showAppBrand={false}
        title="Attendance"
        subtitle={
          klass
            ? `${user?.school?.name ? user.school.name + " · " : ""}${formatFullDate(date)}`
            : "Loading…"
        }
        icon="checkmark-done-outline"
        compact
        style={{ marginTop: -spacing(1.5) }}
      />
      {!klass ? (
        <View style={styles.center}>
          <EmptyState icon="school-outline" title="No class assigned" subtitle="Ask your headmaster to assign you as a class teacher." />
        </View>
      ) : isLoading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading attendance…</Text>
        </View>
      ) : (
        <>
          <Card style={styles.dateCard}>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => setDate((d) => shiftDate(d, -1))}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.dateCenter}>
              {!isToday(date) && (
                <TouchableOpacity onPress={() => setDate(todayISO())} style={styles.todayChip}>
                  <Text style={styles.todayChipText}>Back to today</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.dateTitle}>{formatFullDate(date)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.navBtn, isToday(date) && styles.navBtnDisabled]}
              onPress={() => !isToday(date) && setDate((d) => shiftDate(d, 1))}
              disabled={isToday(date)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-forward" size={20} color={isToday(date) ? colors.textLight : colors.primary} />
            </TouchableOpacity>
          </Card>
          <View style={styles.container}>
          {isComplete ? (
            <View style={styles.banner}>
              <View style={styles.bannerIconCircle}>
                <Ionicons name="checkmark-done" size={32} color="#fff" />
              </View>
              <Text style={styles.bannerTitle}>Attendance completed!</Text>
              <Text style={styles.bannerSubtitle}>
                {presentCount} present, {absentCount} absent — recorded for {formatFullDate(date)}.
              </Text>
              <Text style={styles.bannerNote}>
                {canEdit
                  ? "Attendance has been submitted."
                  : "This attendance has been submitted and cannot be updated."}
              </Text>
              {canEdit ? (
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => navigation.navigate("TakeAttendance", { classId: klass.id, date })}
                >
                  <Ionicons name="create-outline" size={18} color="#fff" />
                  <Text style={styles.editBtnText}>Update attendance</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.lockedChip}>
                  <Ionicons name="lock-closed" size={14} color="#fff" />
                  <Text style={styles.editBtnText}>Locked</Text>
                </View>
              )}
            </View>
          ) : (
            <>
              <View style={styles.statusCard}>
                <View style={[styles.statusIcon, styles.statusPending]}>
                  <Ionicons name="time-outline" size={28} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusTitle}>Attendance pending</Text>
                  <Text style={styles.statusSubtitle}>
                    {presentCount} of {totalStudents} students marked
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.takeBtn}
                onPress={() => navigation.navigate("TakeAttendance", { classId: klass.id, date })}
              >
                <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
                <Text style={styles.takeBtnText}>
                  {attendance.length > 0 ? "Continue attendance" : "Take attendance"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.sectionTitle}>Students</Text>
          {totalStudents === 0 ? (
            <EmptyState icon="people-outline" title="No students" subtitle="Register students first." />
          ) : (
            klass.students.map((student) => {
              const att = attendance.find((a) => a.student.id === student.id);
              const status = att?.status;
              return (
                <Card key={student.id} padded={false} style={styles.studentCard}>
                  <View style={styles.studentRow}>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      {att?.reason ? <Text style={styles.reason}>{att.reason}</Text> : null}
                    </View>
                    {status === "PRESENT" ? (
                      <Badge tone="success" icon="checkmark-circle-outline" label="Present" />
                    ) : status === "UNAVAILABLE" ? (
                      <Badge tone="danger" icon="close-circle-outline" label="Absent" />
                    ) : (
                      <Badge tone="neutral" icon="help-circle-outline" label="Not marked" />
                    )}
                  </View>
                </Card>
              );
            })
          )}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing(4), paddingTop: spacing(2) },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing(4) },
  loadingText: { fontSize: 14, color: colors.textMuted },
  dateCard: { flexDirection: "row", alignItems: "center", padding: spacing(3), marginTop: spacing(3) },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnDisabled: { backgroundColor: colors.surface },
  dateCenter: { flex: 1, alignItems: "center", paddingHorizontal: spacing(2) },
  todayChip: { marginBottom: spacing(1), backgroundColor: colors.primaryLight, borderRadius: radius.sm, paddingHorizontal: spacing(2), paddingVertical: spacing(0.5) },
  todayChipText: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  dateTitle: { fontSize: 15, fontWeight: "800", color: colors.text, textAlign: "center" },
  banner: {
    alignItems: "center",
    backgroundColor: colors.success,
    borderRadius: radius.xl,
    padding: spacing(6),
    marginBottom: spacing(4),
  },
  bannerIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing(3),
  },
  bannerTitle: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: spacing(1) },
  bannerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.9)", textAlign: "center", lineHeight: 20 },
  bannerNote: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: spacing(2), fontWeight: "600" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    marginTop: spacing(4),
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radius.lg,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(5),
  },
  editBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  lockedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    marginTop: spacing(4),
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: radius.round,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4),
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing(4),
    marginBottom: spacing(4),
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  statusDone: { backgroundColor: colors.success },
  statusPending: { backgroundColor: colors.accent },
  statusTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  statusSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  takeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing(3.5),
    marginBottom: spacing(4),
  },
  takeBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: spacing(3) },
  studentCard: { marginBottom: spacing(2) },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing(3),
  },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: "700", color: colors.text },
  reason: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
