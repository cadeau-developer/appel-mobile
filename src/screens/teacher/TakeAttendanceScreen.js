import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Button from "../../components/Button";
import Card from "../../components/Card";
import StudentRow from "../../components/StudentRow";
import EmptyState from "../../components/EmptyState";
import { fetchClassStudents } from "../../api/students";
import { fetchAttendance, submitAttendance } from "../../api/attendance";
import { fetchOffDayStatus } from "../../api/offdays";
import { useToast } from "../../context/ToastContext";
import { formatFullDate, isToday, shiftDate, todayISO } from "../../utils/date";
import { colors, radius, spacing } from "../../theme";

export default function TakeAttendanceScreen({ route }) {
  const { classId, date: initialDate } = route.params;
  const { showToast } = useToast();
  const [date, setDate] = useState(initialDate || todayISO());
  const queryClient = useQueryClient();

  const { data: students = [] } = useQuery({
    queryKey: ["class-students", classId],
    queryFn: () => fetchClassStudents(classId),
  });

  const { data: existing } = useQuery({
    queryKey: ["attendance", classId, date],
    queryFn: () => fetchAttendance(classId, date),
  });

  const { data: offDayStatus } = useQuery({
    queryKey: ["off-day-status", date],
    queryFn: () => fetchOffDayStatus(date),
    retry: false,
  });

  const [statusMap, setStatusMap] = useState({});
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setEditing(false);
  }, [date]);

  useEffect(() => {
    const map = {};
    existing?.attendance?.forEach((a) => {
      if (a.status === "UNAVAILABLE") {
        map[a.studentId] = { unavailable: true, reason: a.reason || "" };
      }
    });
    setStatusMap(map);
  }, [existing]);

  const toggleStudent = (studentId) => {
    setStatusMap((prev) => {
      const current = prev[studentId];
      if (current?.unavailable) {
        const { [studentId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [studentId]: { unavailable: true, reason: "" } };
    });
  };

  const setReason = (studentId, reason) => {
    setStatusMap((prev) => ({ ...prev, [studentId]: { ...prev[studentId], reason } }));
  };

  const mutation = useMutation({
    mutationFn: submitAttendance,
    onSuccess: (data) => {
      setEditing(false);
      queryClient.setQueryData(["attendance", classId, date], {
        date: data.date,
        attendance: (data.attendance || []).map((r) => ({
          ...r,
          student: { id: r.studentId, name: r.student?.name || "" },
        })),
        submitted: true,
        editCount: data.editCount ?? 1,
        canEdit: data.canEdit ?? false,
      });
      queryClient.invalidateQueries({ queryKey: ["attendance", classId, date] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      showToast(
        submitted
          ? `Attendance for ${formatFullDate(date)} has been updated.`
          : `${unavailableCount} student${unavailableCount === 1 ? "" : "s"} marked unavailable on ${formatFullDate(date)}. The rest are available.`,
        "success"
      );
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not submit attendance. Please try again.", "error"),
  });

  const onSubmit = () => {
    if (students.length === 0) {
      showToast("Register students first before taking attendance", "error");
      return;
    }
    const unavailable = Object.entries(statusMap).map(([studentId, v]) => ({
      studentId: Number(studentId),
      reason: v.reason,
    }));
    mutation.mutate({ classId, date, unavailable });
  };

  const unavailableCount = Object.values(statusMap).filter((v) => v.unavailable).length;
  const availableCount = students.length - unavailableCount;
  // The server decides what an off day is (explicit off days + weekends unless opened).
  const offDay = offDayStatus?.isOffDay ? offDayStatus.offDay : null;
  const submitted =
    existing?.submitted ?? (students.length > 0 && (existing?.attendance?.length ?? 0) >= students.length);
  const canEdit = existing?.canEdit ?? true;
  const locked = submitted && (!canEdit || !editing);
  const futureDay = date > todayISO();

  return (
    <Screen scroll={false}>
      <FlatList
        contentContainerStyle={styles.list}
        data={students}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View>
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
                  <TouchableOpacity onPress={() => setDate(todayISO())} style={styles.todayChip}>
                    <Text style={styles.todayChipText}>Jump to today</Text>
                  </TouchableOpacity>
                ) : null}
                <Text style={styles.dateTitle}>{formatFullDate(date)}</Text>
                <Text style={styles.dateHint}>Everyone is available by default — tap to mark unavailable</Text>
              </View>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => setDate((d) => shiftDate(d, 1))}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            </Card>

            {offDay ? (
              <View style={styles.offDayBanner}>
                <Ionicons name="calendar-outline" size={16} color={colors.danger} />
                <Text style={styles.offDayText}>
                  {formatFullDate(date)} is an off day{offDay.label ? ` (${offDay.label})` : ""} — no attendance is taken.
                </Text>
              </View>
            ) : null}

            {submitted ? (
              <View style={styles.doneBanner}>
                <Ionicons
                  name={canEdit ? "checkmark-done-circle" : "lock-closed"}
                  size={16}
                  color={colors.success}
                />
                <Text style={styles.doneText}>
                  {canEdit
                    ? `Attendance for ${formatFullDate(date)} has been submitted. You can update it once if needed.`
                    : `Attendance for ${formatFullDate(date)} was updated and can no longer be changed.`}
                </Text>
              </View>
            ) : null}

            <View style={styles.summary}>
              <View style={[styles.summaryItem, styles.summaryAvailable]}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.summaryValue}>{availableCount}</Text>
                <Text style={styles.summaryLabel}>Available</Text>
              </View>
              <View style={[styles.summaryItem, styles.summaryUnavailable]}>
                <Ionicons name="close-circle" size={18} color={colors.danger} />
                <Text style={styles.summaryValue}>{unavailableCount}</Text>
                <Text style={styles.summaryLabel}>Unavailable</Text>
              </View>
              <View style={[styles.summaryItem, styles.summaryTotal]}>
                <Ionicons name="people-outline" size={18} color={colors.primary} />
                <Text style={styles.summaryValue}>{students.length}</Text>
                <Text style={styles.summaryLabel}>Total</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No students in this class"
            subtitle="Register students first, then come back to take attendance."
          />
        }
        renderItem={({ item }) => (
          <StudentRow
            student={item}
            unavailable={!!statusMap[item.id]?.unavailable}
            reason={statusMap[item.id]?.reason || ""}
            disabled={locked}
            onToggle={() => toggleStudent(item.id)}
            onReasonChange={(text) => setReason(item.id, text)}
          />
        )}
      />

      <View style={styles.submitBar}>
        <Button
          title={
            offDay
              ? "No attendance on this off day"
              : futureDay
              ? "This day has not started yet"
              : !submitted
              ? isToday(date)
                ? "Submit attendance"
                : `Save for ${formatFullDate(date)}`
              : !canEdit
              ? "Attendance updated"
              : editing
              ? "Save update"
              : "Update attendance"
          }
          icon={
            offDay || futureDay
              ? "calendar-outline"
              : submitted && canEdit && !editing
              ? "create-outline"
              : "checkmark-done-outline"
          }
          onPress={
            offDay || futureDay
              ? undefined
              : !submitted
              ? onSubmit
              : !canEdit
              ? undefined
              : editing
              ? onSubmit
              : () => setEditing(true)
          }
          loading={mutation.isPending}
          disabled={!!offDay || futureDay || (submitted && !canEdit)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing(4), paddingBottom: spacing(4) },
  dateCard: { flexDirection: "row", alignItems: "center", padding: spacing(3), marginBottom: spacing(3) },
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
  dateHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
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
  doneBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    padding: spacing(3),
    marginBottom: spacing(3),
  },
  doneText: { flex: 1, fontSize: 13, fontWeight: "600", color: colors.success },
  summary: { flexDirection: "row", gap: spacing(2.5), marginBottom: spacing(3.5) },
  summaryItem: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing(3),
    alignItems: "center",
    borderWidth: 1,
  },
  summaryAvailable: { backgroundColor: colors.successLight, borderColor: colors.successLight },
  summaryUnavailable: { backgroundColor: colors.dangerLight, borderColor: colors.dangerLight },
  summaryTotal: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  summaryValue: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: 1 },
  summaryLabel: { fontSize: 11, fontWeight: "700", color: colors.textMuted },
  submitBar: {
    padding: spacing(4),
    paddingTop: spacing(2.5),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});