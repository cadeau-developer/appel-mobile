import React, { useState } from "react";
import { ScrollView, StyleSheet, View, TouchableOpacity, RefreshControl } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import StatCard from "../../components/StatCard";
import BrandHeader from "../../components/BrandHeader";
import EmptyState from "../../components/EmptyState";
import Badge from "../../components/Badge";
import ApiConnectionError from "../../components/ApiConnectionError";
import { fetchDashboard } from "../../api/dashboard";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useSchoolYear } from "../../hooks/useSchoolYear";
import { formatShortDate, isToday, relativeLabel } from "../../utils/date";
import { colors, radius, shadowStyle, spacing, typography } from "../../theme";

const MAX_BAR = 5;

function GenderBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <View style={gStyles.row}>
      <Text style={gStyles.label}>{label}</Text>
      <View style={gStyles.barBg}>
        <View style={[gStyles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={gStyles.value}>{count} ({pct}%)</Text>
    </View>
  );
}

const gStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing(2), marginBottom: spacing(2) },
  label: { width: 60, fontSize: 13, fontWeight: "600", color: colors.text },
  barBg: { flex: 1, height: 14, borderRadius: 7, backgroundColor: colors.border, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 7 },
  value: { width: 80, fontSize: 12, fontWeight: "700", color: colors.textMuted, textAlign: "right" },
});

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { translate } = useLanguage();
  const schoolYear = useSchoolYear();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data, error, isError, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  const stats = data?.stats;
  const maxCount = Math.max(MAX_BAR, ...(data?.weekly || []).map((w) => w.count));
  const genderEntries = data?.genderCounts ? Object.entries(data.genderCounts) : [];
  const totalStudents = genderEntries.reduce((sum, [, c]) => sum + c, 0);
  const absentGenderEntries = data?.absentGenderCounts ? Object.entries(data.absentGenderCounts) : [];
  const totalAbsent = absentGenderEntries.reduce((sum, [, c]) => sum + c, 0);
  const presentToday = (stats?.totalStudents ?? 0) - totalAbsent;

  return (
    <Screen scroll={false} padded={false}>
      <BrandHeader
        slim
        showAppBrand={false}
        title={user?.school?.name}
        subtitle={`${user?.school?.schoolType ? `${user.school.schoolType} · ` : ""}${
          user?.school?.city || "School overview"
        }${schoolYear ? ` · Year ${schoolYear}` : ""}`}
        icon="school-outline"
        logoUri={user?.school?.logoUrl}
      />

      <View style={styles.menuArea}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={translate("Open menu")}
          accessibilityState={{ expanded: menuOpen }}
          onPress={() => setMenuOpen((open) => !open)}
          style={styles.menuButton}
        >
          <Ionicons name="reorder-two-outline" size={25} color={colors.primary} />
        </TouchableOpacity>
        {menuOpen ? (
          <View style={styles.menu}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate("SchoolSettings");
              }}
              style={styles.menuItem}
            >
              <Ionicons name="settings-outline" size={18} color={colors.textMuted} />
              <Text style={styles.menuLabel}>School settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate("Terms");
              }}
              style={styles.menuItem}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
              <Text style={styles.menuLabel}>Terms</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate("DisciplineCases", { screen: "DisciplineSettings" });
              }}
              style={styles.menuItem}
            >
              <Ionicons name="ribbon-outline" size={18} color={colors.textMuted} />
              <Text style={styles.menuLabel}>Discipline policy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                setMenuOpen(false);
                logout();
              }}
              style={styles.menuItem}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={[styles.menuLabel, styles.logoutLabel]}>Log out</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {isError && !data ? (
          <ApiConnectionError error={error} onRetry={refetch} title="Couldn't load your dashboard" />
        ) : (
          <>
            {data?.offDay ? (
              <View style={styles.offDayBanner}>
                <Ionicons name="calendar-outline" size={16} color={colors.danger} />
                <Text style={styles.offDayText}>
                  Today is an off day{data.offDay.label ? ` (${data.offDay.label})` : ""} — no attendance is expected.
                </Text>
              </View>
            ) : null}
            <Text style={styles.hello}>Bonjour, {user?.name?.split(" ")[0]} 👋</Text>
            <Text style={styles.hint}>Here's how your school is doing today.</Text>

            <View style={styles.grid}>
              <StatCard icon="people-outline" tone="primary" label="Students" value={stats?.totalStudents ?? "—"} />
              <StatCard icon="person-outline" tone="info" label="Teachers" value={stats?.totalTeachers ?? "—"} />
            </View>
            <View style={styles.grid}>
              <StatCard icon="albums-outline" tone="success" label="Classes" value={stats?.totalClasses ?? "—"} />
              <StatCard icon="checkmark-circle-outline" tone="success" label="Present today" value={presentToday} />
            </View>
            <View style={styles.grid}>
              <StatCard icon="close-circle-outline" tone="danger" label="Absent today" value={totalAbsent} />
              <StatCard icon="flag-outline" tone="warning" label="Discipline" value={stats?.disciplineCases ?? "—"} />
            </View>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={typography.cardTitle}>Students by gender</Text>
            <Ionicons name="people-outline" size={18} color={colors.primary} />
          </View>
          {genderEntries.length > 0 ? (
            genderEntries.map(([g, c]) => (
              <GenderBar
                key={g}
                label={g}
                count={c}
                total={totalStudents}
                color={g === "Male" ? colors.info : g === "Female" ? colors.danger : colors.accent}
              />
            ))
          ) : (
            <EmptyState icon="people-outline" title="No data" subtitle="No students registered yet." />
          )}
        </Card>

        {totalAbsent > 0 && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={typography.cardTitle}>Absent today by gender</Text>
              <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
            </View>
            {absentGenderEntries.map(([g, c]) => (
              <GenderBar
                key={g}
                label={g}
                count={c}
                total={totalAbsent}
                color={g === "Male" ? colors.info : g === "Female" ? colors.danger : colors.accent}
              />
            ))}
          </Card>
        )}

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={typography.cardTitle}>Attendance due today</Text>
            <Ionicons name="alert-circle-outline" size={18} color={colors.accent} />
          </View>
          {data?.pendingAttendance?.length ? (
            data.pendingAttendance.map((c) => (
              <View key={c.id} style={styles.caseRow}>
                <View style={[styles.caseIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="albums-outline" size={14} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.caseName}>{c.name}</Text>
                  <Text style={styles.caseMeta} numberOfLines={1}>
                    {c.teacher ? `Class teacher: ${c.teacher.name}` : "No class teacher"} · {c._count?.students ?? 0} student{(c._count?.students ?? 0) === 1 ? "" : "s"}
                  </Text>
                </View>
                <Badge tone="warning" label="No attendance" />
              </View>
            ))
          ) : (
            <EmptyState
              icon="checkmark-done-outline"
              title="All classes done"
              subtitle="Every class has submitted today's attendance."
            />
          )}
        </Card>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={typography.cardTitle}>Absences this week</Text>
            <Ionicons name="analytics-outline" size={18} color={colors.primary} />
          </View>
          {data?.weekly?.length ? (
            <View style={styles.bars}>
              {data.weekly.map((w) => {
                const height = Math.max(4, Math.round((w.count / maxCount) * 52));
                const today = isToday(w.date);
                return (
                  <View key={w.date} style={styles.barCol}>
                    <Text style={styles.barValue}>{w.count}</Text>
                    <View
                      style={[
                        styles.bar,
                        { height, backgroundColor: today ? colors.primary : colors.primaryLight },
                      ]}
                    />
                    <Text style={[styles.barLabel, today && styles.barLabelToday]}>
                      {relativeLabel(w.date) === "Today" || relativeLabel(w.date) === "Yesterday"
                        ? relativeLabel(w.date)
                        : formatShortDate(w.date).split(" ")[1]}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState icon="analytics-outline" title="No data yet" subtitle="Absences will appear once teachers submit attendance." />
          )}
        </Card>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={typography.cardTitle}>Recent discipline cases</Text>
            <Ionicons name="flag-outline" size={18} color={colors.danger} />
          </View>
          {data?.latestDiscipline?.length ? (
            data.latestDiscipline.map((c) => (
              <View key={c.id} style={styles.caseRow}>
                <View style={styles.caseIcon}>
                  <Ionicons name="flag" size={14} color={colors.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.caseName}>{c.student.name}</Text>
                  <Text style={styles.caseMeta} numberOfLines={1}>
                    {c.student.class.name} · by {c.reportedBy.name} · {c.description}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <EmptyState icon="flag-outline" title="No discipline cases" subtitle="Cases reported by teachers will appear here." />
          )}
        </Card>

        {data?.punishableStudents?.length ? (
          <Card style={[styles.card, styles.punishCard]}>
            <View style={styles.cardHeader}>
              <Text style={[typography.cardTitle, styles.punishTitle]}>
                Punishment due ({data.punishableStudents.length})
              </Text>
              <Ionicons name="warning" size={18} color={colors.danger} />
            </View>
            <Text style={styles.punishHint}>
              Students who lost {data.disciplineSetting?.punishmentThreshold ?? 0} marks or more this term.
            </Text>
            {data.punishableStudents.slice(0, 5).map((s) => (
              <View key={s.id} style={styles.caseRow}>
                <View style={styles.caseIcon}>
                  <Ionicons name="warning" size={14} color={colors.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.caseName}>{s.name}</Text>
                  <Text style={styles.caseMeta} numberOfLines={1}>
                    {s.class?.name || "No class"} · lost {s.deducted} marks · {s.remaining} left
                  </Text>
                </View>
              </View>
            ))}
            {data.punishableStudents.length > 5 ? (
              <Text style={styles.punishHint}>+{data.punishableStudents.length - 5} more</Text>
            ) : null}
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => navigation.navigate("DisciplineCases", { screen: "DisciplineMarks" })}
              activeOpacity={0.8}
            >
              <Text style={styles.seeAllText}>See all discipline marks</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </Card>
        ) : null}

        {data?.atRisk?.lowAttendance?.length ? (
          <Card style={[styles.card, styles.punishCard]}>
            <View style={styles.cardHeader}>
              <Text style={[typography.cardTitle, styles.punishTitle]}>
                Low attendance ({data.atRisk.lowAttendance.length})
              </Text>
              <Ionicons name="trending-down-outline" size={18} color={colors.accent} />
            </View>
            <Text style={styles.punishHint}>
              Students with 10% or more absences this year{data.atRisk.term ? ` · ${data.atRisk.term.name}` : ""}.
            </Text>
            {data.atRisk.lowAttendance.slice(0, 5).map((row) => (
              <View key={row.student.id} style={styles.caseRow}>
                <View style={[styles.caseIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="person-outline" size={14} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.caseName}>{row.student.name}</Text>
                  <Text style={styles.caseMeta} numberOfLines={1}>
                    {row.student.class?.name || "No class"} · {row.absentDays} absence{row.absentDays === 1 ? "" : "s"} · {row.absenceRate}%
                  </Text>
                </View>
              </View>
            ))}
            {data.atRisk.lowAttendance.length > 5 ? (
              <Text style={styles.punishHint}>+{data.atRisk.lowAttendance.length - 5} more</Text>
            ) : null}
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => navigation.navigate("AttendanceReport")}
              activeOpacity={0.8}
            >
              <Text style={styles.seeAllText}>See attendance report</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </Card>
        ) : null}

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.qaCard} onPress={() => navigation.navigate("AttendanceReport")}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.qaText}>Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qaCard} onPress={() => navigation.navigate("HeadmasterOffDays")}>
            <Ionicons name="today-outline" size={20} color={colors.accent} />
            <Text style={styles.qaText}>Off days</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qaCard} onPress={() => navigation.navigate("DisciplineCases")}>
            <Ionicons name="flag-outline" size={20} color={colors.danger} />
            <Text style={styles.qaText}>Discipline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qaCard} onPress={() => navigation.navigate("Classes")}>
            <Ionicons name="albums-outline" size={20} color={colors.success} />
            <Text style={styles.qaText}>Classes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qaCard} onPress={() => navigation.navigate("Teachers")}>
            <Ionicons name="people-outline" size={20} color={colors.info} />
            <Text style={styles.qaText}>Teachers</Text>
          </TouchableOpacity>
        </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  menuArea: {
    alignItems: "flex-end",
    paddingHorizontal: spacing(4),
    paddingTop: spacing(2),
    zIndex: 1,
  },
  menuButton: {
    width: 42,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  menu: {
    width: 190,
    marginTop: spacing(1),
    paddingHorizontal: spacing(3),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    ...shadowStyle({ color: "#26345F", offsetY: 3, radius: 8, opacity: 0.12, elevation: 5 }),
  },
  menuItem: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLabel: { color: colors.text, fontSize: 14, fontWeight: "600" },
  logoutLabel: { color: colors.danger },
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
  content: { padding: spacing(4), paddingBottom: spacing(12) },
  hello: { fontSize: 18, fontWeight: "800", color: colors.text, marginTop: spacing(4) },
  hint: { fontSize: 14, color: colors.textMuted, marginTop: spacing(1), marginBottom: spacing(4) },
  grid: { flexDirection: "row", gap: spacing(3), marginBottom: spacing(3) },
  card: { marginBottom: spacing(4), padding: spacing(4) },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing(3),
  },
  bars: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 82 },
  barCol: { alignItems: "center", flex: 1 },
  barValue: { fontSize: 11, fontWeight: "700", color: colors.textMuted, marginBottom: 3 },
  bar: { width: 18, borderRadius: 6 },
  barLabel: { fontSize: 10, color: colors.textLight, marginTop: 4, fontWeight: "600" },
  barLabelToday: { color: colors.primary },
  caseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    paddingVertical: spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  caseIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
  caseName: { fontSize: 14, fontWeight: "700", color: colors.text },
  caseMeta: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  quickActions: { flexDirection: "row", gap: spacing(3), flexWrap: "wrap" },
  qaCard: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(4),
    alignItems: "center",
    gap: spacing(2),
  },
  qaText: { fontSize: 13, fontWeight: "700", color: colors.text },
  punishCard: { borderColor: colors.dangerLight },
  punishTitle: { color: colors.danger },
  punishHint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing(2) },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
  },
  seeAllText: { fontSize: 13, fontWeight: "700", color: colors.primary },
});