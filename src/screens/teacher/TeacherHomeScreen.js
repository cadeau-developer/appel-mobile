import React from "react";
import { StyleSheet, View, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import BrandHeader from "../../components/BrandHeader";
import EmptyState from "../../components/EmptyState";
import Avatar from "../../components/Avatar";
import ApiConnectionError from "../../components/ApiConnectionError";
import { fetchTeacherDashboard } from "../../api/classes";
import { useAuth } from "../../context/AuthContext";
import { useSchoolYear } from "../../hooks/useSchoolYear";
import { formatFullDate, todayISO } from "../../utils/date";
import { colors, radius, spacing, shadow, typography } from "../../theme";

export default function TeacherHomeScreen({ navigation }) {
  const { user } = useAuth();
  const schoolYear = useSchoolYear();
  const { data, error, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["teacher-dashboard"],
    queryFn: fetchTeacherDashboard,
    retry: false,
  });

  const genderCounts = data?.genderCounts || {};
  const genderEntries = Object.entries(genderCounts).filter(([, count]) => count !== null && count !== undefined);
  const absenceRanking = (data?.students || [])
    .filter((s) => s.absentDays > 0)
    .sort((a, b) => b.absentDays - a.absentDays || b.absenceRate - a.absenceRate);
  const lowDiscipline = data?.lowDiscipline || [];

  return (
    <Screen scroll={false}>
      <BrandHeader
        slim
        showAppBrand={false}
        title={data?.class?.name || "My class"}
        subtitle={
          data?.class
            ? `${user?.school?.name ? user.school.name + " · " : ""}${data.totalStudents} student${data.totalStudents === 1 ? "" : "s"} · ${formatFullDate(todayISO())}${schoolYear ? ` · Year ${schoolYear}` : ""}`
            : "Loading…"
        }
        icon="book-outline"
        logoUri={user?.school?.logoUrl}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {isError ? (
          <View style={styles.center}>
            <ApiConnectionError error={error} onRetry={refetch} title="Couldn't load your class" />
          </View>
        ) : isLoading ? (
          <View style={styles.center}>
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ) : data?.class ? (
          <>
            <View style={styles.grid}>
              <View style={[styles.statCard, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="people-outline" size={22} color={colors.primary} />
                <Text style={styles.statValue}>{data.totalStudents}</Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
              {genderEntries.map(([gender, count]) => (
                <View
                  key={gender}
                  style={[styles.statCard, { backgroundColor: gender === "Male" ? colors.infoLight : gender === "Female" ? colors.successLight : colors.accentLight }]}
                >
                  <Ionicons
                    name={gender === "Male" ? "male-outline" : gender === "Female" ? "female-outline" : "help-circle-outline"}
                    size={22}
                    color={gender === "Male" ? colors.info : gender === "Female" ? colors.success : colors.accent}
                  />
                  <Text style={styles.statValue}>{count}</Text>
                  <Text style={styles.statLabel}>{gender}</Text>
                </View>
              ))}
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.qaCard} onPress={() => navigation.navigate("TakeAttendance", { classId: data.class.id })}>
                <View style={[styles.qaIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="checkmark-done-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.qaText}>Take attendance</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qaCard} onPress={() => navigation.navigate("RegisterStudent", { classId: data.class.id })}>
                <View style={[styles.qaIcon, { backgroundColor: colors.successLight }]}>
                  <Ionicons name="person-add-outline" size={20} color={colors.success} />
                </View>
                <Text style={styles.qaText}>Register student</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qaCard} onPress={() => navigation.navigate("SubmitDiscipline")}>
                <View style={[styles.qaIcon, { backgroundColor: colors.dangerLight }]}>
                  <Ionicons name="flag-outline" size={20} color={colors.danger} />
                </View>
                <Text style={styles.qaText}>Discipline case</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qaCard} onPress={() => navigation.navigate("TeacherProfile")}>
                <View style={[styles.qaIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="person-outline" size={20} color={colors.accent} />
                </View>
                <Text style={styles.qaText}>My profile</Text>
              </TouchableOpacity>
            </View>

            {absenceRanking.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Absence by student</Text>
                {absenceRanking.map((s, idx) => (
                  <Card key={s.id} padded={false} style={styles.studentCard}>
                    <View style={styles.studentRow}>
                      <View style={[styles.rankBadge, idx < 3 && styles.rankBadgeTop]}>
                        <Text style={[styles.rankText, idx < 3 && styles.rankTextTop]}>{idx + 1}</Text>
                      </View>
                      <Avatar uri={s.photoUrl} name={s.name} size={36} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentName}>{s.name}</Text>
                        <Text style={styles.studentMeta}>
                          out of {s.totalDays} day{s.totalDays === 1 ? "" : "s"} · {s.absenceRate}%
                        </Text>
                      </View>
                      <View style={styles.absentCount}>
                        <Text style={styles.absentCountValue}>{s.absentDays}</Text>
                        <Text style={styles.absentCountLabel}>{s.absentDays === 1 ? "absence" : "absences"}</Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            )}
            {lowDiscipline.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Low discipline marks{data?.term ? ` · ${data.term.name}` : ""}</Text>
                {lowDiscipline.map((s) => (
                  <Card key={s.id} padded={false} style={styles.studentCard}>
                    <View style={styles.studentRow}>
                      <Avatar uri={s.photoUrl} name={s.name} size={36} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentName}>{s.name}</Text>
                        <Text style={styles.studentMeta}>
                          {s.disciplineCases} case{s.disciplineCases === 1 ? "" : "s"} · {s.disciplineRemaining} of{" "}
                          {data?.disciplineSetting?.defaultMarks ?? 40} marks left
                        </Text>
                      </View>
                      <View style={styles.absentCount}>
                        <Text style={styles.absentCountValue}>-{s.disciplineDeducted}</Text>
                        <Text style={styles.absentCountLabel}>lost</Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing(4), paddingBottom: spacing(10) },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing(4) },
  loadingText: { fontSize: 14, color: colors.textMuted },
  grid: { flexDirection: "row", gap: spacing(3), marginBottom: spacing(4), flexWrap: "wrap" },
  statCard: {
    minWidth: "46%",
    flexGrow: 1,
    borderRadius: radius.lg,
    padding: spacing(4),
    alignItems: "center",
    gap: spacing(1),
  },
  statValue: { fontSize: 24, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  quickActions: { flexDirection: "row", gap: spacing(3), flexWrap: "wrap", marginBottom: spacing(4) },
  qaCard: {
    width: "46%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(3.5),
    alignItems: "center",
    gap: spacing(2),
  },
  qaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  qaText: { fontSize: 13, fontWeight: "700", color: colors.text, textAlign: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: spacing(3) },
  studentCard: { marginBottom: spacing(2) },
  studentRow: { flexDirection: "row", alignItems: "center", gap: spacing(3), padding: spacing(3) },
  studentName: { fontSize: 15, fontWeight: "700", color: colors.text },
  studentMeta: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeTop: { backgroundColor: colors.danger },
  rankText: { fontSize: 13, fontWeight: "800", color: colors.primary },
  rankTextTop: { color: "#fff" },
  absentCount: { alignItems: "center", backgroundColor: colors.dangerLight, borderRadius: radius.md, paddingHorizontal: spacing(2.5), paddingVertical: spacing(1.5) },
  absentCountValue: { fontSize: 18, fontWeight: "800", color: colors.danger },
  absentCountLabel: { fontSize: 10, fontWeight: "700", color: colors.danger },
});
