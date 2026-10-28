import React, { useState } from "react";
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View, RefreshControl } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import DatePickerField from "../../components/DatePickerField";
import {
  fetchOffDaysBundle,
  addOffDay,
  deleteOffDay,
  fetchWeekendAttendanceDays,
  allowWeekendAttendance,
  removeWeekendAttendance,
} from "../../api/offdays";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { formatFullDate, todayISO } from "../../utils/date";
import { colors, radius, spacing, typography } from "../../theme";

// Headmaster: manages the off days of HIS school. Past dates are allowed so a
// headmaster can mark a previous day as off after the fact.
export default function HeadmasterOffDaysScreen({ navigation }) {
  const { translate } = useLanguage();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [date, setDate] = useState("");
  const [weekendDate, setWeekendDate] = useState("");
  const [label, setLabel] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [confirmWeekendDate, setConfirmWeekendDate] = useState(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["off-days"],
    queryFn: fetchOffDaysBundle,
  });
  const offDays = data?.offDays || [];
  const autoOffDays = data?.autoOffDays || [];
  const weekendOffDays = data?.weekendOffDays || [];
  const upcomingWeekends = weekendOffDays.filter((d) => d.date >= todayISO()).slice(0, 10);

  const { data: weekendAttendanceDays = [], refetch: refetchWeekendDays } = useQuery({
    queryKey: ["weekend-attendance-days"],
    queryFn: fetchWeekendAttendanceDays,
  });

  const addMutation = useMutation({
    mutationFn: addOffDay,
    onSuccess: (offDay) => {
      queryClient.invalidateQueries({ queryKey: ["off-days"] });
      queryClient.invalidateQueries({ queryKey: ["weekend-attendance-days"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      showToast(`Off day added for ${formatFullDate(offDay.date)}`, "success");
      setDate("");
      setLabel("");
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not add the off day", "error"),
  });

  const removeMutation = useMutation({
    mutationFn: deleteOffDay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["off-days"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      showToast("Off day removed", "success");
      setConfirmId(null);
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not remove the off day", "error"),
  });

  const allowWeekendMutation = useMutation({
    mutationFn: allowWeekendAttendance,
    onSuccess: (weekendDay) => {
      queryClient.invalidateQueries({ queryKey: ["weekend-attendance-days"] });
      queryClient.invalidateQueries({ queryKey: ["off-days"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      showToast(`Attendance allowed for ${formatFullDate(weekendDay.date)}`, "success");
      setWeekendDate("");
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not allow weekend attendance", "error"),
  });

  const removeWeekendMutation = useMutation({
    mutationFn: removeWeekendAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekend-attendance-days"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      showToast("Weekend attendance permission removed", "success");
      setConfirmWeekendDate(null);
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not remove weekend permission", "error"),
  });

  const onAdd = () => {
    if (!date) {
      showToast("Pick a date from the calendar", "error");
      return;
    }
    addMutation.mutate({ date, label: label.trim() || undefined });
  };

  const onAllowWeekend = () => {
    if (!weekendDate) {
      showToast("Pick a Saturday or Sunday from the calendar", "error");
      return;
    }
    const weekday = new Date(`${weekendDate}T00:00:00`).getDay();
    if (weekday !== 0 && weekday !== 6) {
      showToast("Only a Saturday or Sunday can be opened for attendance", "error");
      return;
    }
    allowWeekendMutation.mutate(weekendDate);
  };

  return (
    <Screen scroll={false}>
      <FlatList
        contentContainerStyle={styles.list}
        data={offDays}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
              refetchWeekendDays();
            }}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={typography.title}>Off days</Text>
            <Text style={[typography.subtitle, styles.mt]}>
              Mark days when your school is closed — past or future dates. No attendance can be taken on these dates in your school.
            </Text>

            <Card style={styles.addCard}>
              <Text style={styles.sectionTitle}>Add an off day</Text>
              <View style={styles.inputRow}>
                <DatePickerField value={date} onChange={setDate} placeholder="Pick a date from the calendar" icon="calendar-outline" />
                <TextInput
                  style={styles.labelInput}
                  value={label}
                  onChangeText={setLabel}
                  placeholder={translate("Reason (optional)")}
                  placeholderTextColor={colors.textLight}
                />
              </View>
              <Button
                title="Mark this day as off"
                icon="calendar-outline"
                onPress={onAdd}
                loading={addMutation.isPending}
                size="sm"
              />
            </Card>

            <Card style={styles.addCard}>
              <Text style={styles.sectionTitle}>Allow attendance on a weekend</Text>
              <Text style={styles.helperText}>
                Saturdays and Sundays are closed by default. Choose a specific weekend date to open attendance for your school.
              </Text>
              <View style={styles.weekendInput}>
                <DatePickerField
                  value={weekendDate}
                  onChange={setWeekendDate}
                  placeholder="Pick a Saturday or Sunday"
                  icon="calendar-outline"
                />
              </View>
              <Button
                title="Allow attendance on this date"
                icon="checkmark-circle-outline"
                onPress={onAllowWeekend}
                loading={allowWeekendMutation.isPending}
                size="sm"
              />
            </Card>

            <View style={styles.countRow}>
              <Text style={styles.count}>Weekend dates open for attendance</Text>
              <Badge tone="success" icon="checkmark-circle-outline" label={`${weekendAttendanceDays.length} open`} />
            </View>
            {!weekendAttendanceDays.length ? (
              <Text style={styles.helperText}>No weekend dates are open. Weekends remain closed by default.</Text>
            ) : null}
            {weekendAttendanceDays.map((item) => {
              const itemDate = item.date.slice(0, 10);
              const confirming = confirmWeekendDate === itemDate;
              return (
                <Card key={item.id} padded={false} style={styles.card}>
                  <View style={styles.cardBody}>
                    <View style={[styles.calIcon, styles.openIcon]}>
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dateText}>{formatFullDate(item.date)}</Text>
                      <Text style={styles.labelText}>Attendance allowed</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.deleteBtn, confirming && styles.deleteBtnConfirm]}
                      onPress={() => {
                        if (confirming) {
                          removeWeekendMutation.mutate(itemDate);
                        } else {
                          setConfirmWeekendDate(itemDate);
                          setTimeout(() => setConfirmWeekendDate((cur) => (cur === itemDate ? null : cur)), 3000);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close-outline" size={16} color={confirming ? "#fff" : colors.danger} />
                      <Text style={[styles.deleteText, confirming && styles.deleteTextConfirm]}>
                        {confirming ? "Confirm" : "Close"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}

            <View style={styles.countRow}>
              <Text style={styles.count}>Weekend off days (default)</Text>
              <Badge tone="neutral" icon="moon-outline" label={`${weekendOffDays.length} this year`} />
            </View>
            <Text style={styles.helperText}>
              Every Saturday and Sunday is closed by default. Open a specific weekend above if your school has
              lessons that day.
            </Text>
            {upcomingWeekends.map((item) => (
              <Card key={item.date} padded={false} style={styles.card}>
                <View style={styles.cardBody}>
                  <View style={[styles.calIcon, styles.weekendIcon]}>
                    <Ionicons name="moon" size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dateText}>{formatFullDate(item.date)}</Text>
                    <Text style={styles.labelText}>{item.label}</Text>
                  </View>
                  <Badge tone="neutral" label="Off" />
                </View>
              </Card>
            ))}
            {weekendOffDays.length > upcomingWeekends.length ? (
              <Text style={styles.helperText}>
                +{weekendOffDays.length - upcomingWeekends.length} more weekend days this year
              </Text>
            ) : null}

            {autoOffDays.length > 0 ? (
              <>
                <View style={styles.countRow}>
                  <Text style={styles.count}>Automatically detected ({autoOffDays.length})</Text>
                  <Badge tone="neutral" icon="moon-outline" label="No attendance" />
                </View>
                <Text style={styles.helperText}>
                  Recent days when no class took attendance school-wide. These days count as off days and are not
                  counted in attendance — no action is needed.
                </Text>
                {autoOffDays.slice(0, 10).map((item) => (
                  <Card key={item.date} padded={false} style={styles.card}>
                    <View style={styles.cardBody}>
                      <View style={[styles.calIcon, styles.openIcon]}>
                        <Ionicons name="moon" size={16} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dateText}>{formatFullDate(item.date)}</Text>
                        <Text style={styles.labelText}>{item.label}</Text>
                      </View>
                      <Badge tone="neutral" label="Off" />
                    </View>
                  </Card>
                ))}
                {autoOffDays.length > 10 ? (
                  <Text style={styles.helperText}>+{autoOffDays.length - 10} more older days</Text>
                ) : null}
              </>
            ) : null}

            <View style={styles.countRow}>
              <Text style={styles.count}>
                {offDays.length} off day{offDays.length === 1 ? "" : "s"} scheduled
              </Text>
              <Badge tone="info" icon="calendar-outline" label="No attendance" />
            </View>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="calendar-outline"
              title="No off days scheduled"
              subtitle="Add one above and your teachers won't be able to record attendance that day."
            />
          ) : null
        }
        renderItem={({ item }) => {
          const isOffToday = item.date.slice(0, 10) === todayISO();
          const isGlobal = item.schoolId === null || item.schoolId === undefined;
          const confirming = confirmId === item.id;
          return (
            <Card padded={false} style={styles.card}>
              <View style={styles.cardBody}>
                <View style={styles.calIcon}>
                  <Ionicons name="calendar" size={16} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateText}>{formatFullDate(item.date)}</Text>
                  <Text style={styles.labelText}>
                    {item.label || "Off day"}
                    {isOffToday ? " · today" : ""}
                  </Text>
                </View>
                {isGlobal ? (
                  <Badge tone="primary" label="All schools" />
                ) : (
                  <TouchableOpacity
                    style={[styles.deleteBtn, confirming && styles.deleteBtnConfirm]}
                    onPress={() => {
                      if (confirming) {
                        removeMutation.mutate(item.id);
                      } else {
                        setConfirmId(item.id);
                        setTimeout(() => setConfirmId((cur) => (cur === item.id ? null : cur)), 3000);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={16} color={confirming ? "#fff" : colors.danger} />
                    <Text style={[styles.deleteText, confirming && styles.deleteTextConfirm]}>
                      {confirming ? "Confirm" : "Remove"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing(4), paddingBottom: spacing(10) },
  mt: { marginTop: spacing(1), marginBottom: spacing(3) },
  addCard: { padding: spacing(3.5), marginBottom: spacing(3) },
  sectionTitle: { fontWeight: "800", fontSize: 15, color: colors.primary, marginBottom: spacing(2.5) },
  inputRow: { gap: spacing(2.5), marginBottom: spacing(2.5) },
  weekendInput: { marginTop: spacing(2.5), marginBottom: spacing(2.5) },
  helperText: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  labelInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.5),
    fontSize: 14,
    color: colors.text,
  },
  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing(2.5),
  },
  count: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  card: { marginBottom: spacing(2.5) },
  cardBody: { flexDirection: "row", alignItems: "center", gap: spacing(3), padding: spacing(3.5) },
  calIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  openIcon: { backgroundColor: colors.success },
  weekendIcon: { backgroundColor: colors.textMuted },
  dateText: { fontSize: 15, fontWeight: "700", color: colors.text },
  labelText: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1),
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2.5),
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.dangerLight,
    backgroundColor: colors.surface,
  },
  deleteBtnConfirm: { backgroundColor: colors.danger, borderColor: colors.danger },
  deleteText: { color: colors.danger, fontWeight: "700", fontSize: 11 },
  deleteTextConfirm: { color: "#fff" },
});