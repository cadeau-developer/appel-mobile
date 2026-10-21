import React from "react";
import { FlatList, StyleSheet, View, RefreshControl, TouchableOpacity } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import BrandHeader from "../../components/BrandHeader";
import EmptyState from "../../components/EmptyState";
import Avatar from "../../components/Avatar";
import { fetchMyClasses } from "../../api/classes";
import { updateStudent } from "../../api/students";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { pickImageFile } from "../../utils/pickImage";
import { formatFullDate, todayISO } from "../../utils/date";
import { colors, radius, spacing, typography } from "../../theme";

export default function MyClassScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: classes = [], isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["my-class"],
    queryFn: fetchMyClasses,
    retry: false,
  });

  const klass = classes[0] || null;

  const photoMutation = useMutation({
    mutationFn: ({ studentId, photoUrl, classId }) => updateStudent(classId, studentId, { photoUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-class"] });
      showToast("Student photo updated", "success");
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not update photo", "error"),
  });

  const setStudentPhoto = (studentId) =>
    pickImageFile(
      (dataUrl) => photoMutation.mutate({ studentId, photoUrl: dataUrl, classId: klass.id }),
      (err) => showToast(err, "error")
    );

  if (!isLoading && isError) {
    return (
      <Screen padded stickyHeader>
        <BrandHeader
          showAppBrand={false}
          compact
          style={{ marginHorizontal: -spacing(4), marginTop: -spacing(4) }}
        />
        <View style={styles.noClass}>
          <View style={styles.noClassIcon}>
            <Ionicons name="school-outline" size={30} color={colors.primary} />
          </View>
          <Text style={typography.title}>No class assigned</Text>
          <Text style={[typography.subtitle, styles.noClassText]}>
            {error.response?.data?.error || "Ask your headmaster to assign you as a class teacher."}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutTextBtn} onPress={logout}>
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const students = klass?.students || [];

  return (
    <Screen scroll={false}>
      <BrandHeader
        showAppBrand={false}
        title={klass?.name || "My class"}
        subtitle={
          klass
            ? `${user?.school?.name ? user.school.name + " · " : ""}${klass.students.length} student${klass.students.length === 1 ? "" : "s"} ·
               ${formatFullDate(todayISO())}`
            : "Loading…"
        }
        icon="book-outline"
        right={
          <View style={styles.headerBtns}>
            <TouchableOpacity onPress={() => navigation.navigate("TeacherProfile")} style={styles.headerAvatar}>
              <Avatar uri={user?.avatarUrl} name={user?.name} size={30} />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.iconBtn}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        }
      />
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        data={students}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={
          klass ? (
            <View>
              <View style={styles.actions}>
              <TouchableOpacity style={[styles.action, styles.actionPrimary]} onPress={() => navigation.navigate("TakeAttendance", { classId: klass.id })}>
                <Ionicons name="checkmark-done-outline" size={22} color="#fff" />
                <Text style={styles.actionPrimaryText}>Take today's attendance</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.action, styles.actionSecondary]} onPress={() => navigation.navigate("RegisterStudent", { classId: klass.id })}>
                <Ionicons name="person-add-outline" size={20} color={colors.primary} />
                <Text style={styles.actionSecondaryText}>Register student</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.action, styles.actionDanger]} onPress={() => navigation.navigate("SubmitDiscipline")}>
                <Ionicons name="flag-outline" size={20} color={colors.danger} />
                <Text style={styles.actionDangerText}>Discipline case</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rows}>
              <Badge tone="success" icon="people-outline" label={`${students.length} students`} />
              <Badge tone="info" icon="today-outline" label={formatFullDate(todayISO()).split(" ")[0]} />
            </View>
            <Text style={styles.sectionTitle}>Students</Text>
            </View>
          ) : (
            <Text style={styles.sectionTitle}>Loading class…</Text>
          )
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="people-outline"
              title="No students yet"
              subtitle="Register the first student in this class to start taking attendance."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Card padded={false} style={styles.studentCard}>
            <View style={styles.studentBody}>
              <View style={styles.avatarWrap}>
                <Avatar uri={item.photoUrl} name={item.name} size={38} />
                <TouchableOpacity
                  style={styles.cameraBtn}
                  onPress={() => setStudentPhoto(item.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera-outline" size={12} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.cardTitle}>{item.name}</Text>
                {item.admissionNo ? (
                  <Text style={styles.admNo}>Adm. No: {item.admissionNo}</Text>
                ) : (
                  <Text style={styles.admNo}>No admission number</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate("EditStudent", { classId: klass.id, student: item })}
              >
                <Ionicons name="pencil-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBtns: { flexDirection: "row", alignItems: "center", gap: spacing(2.5) },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    overflow: "hidden",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  noClass: { alignItems: "center", marginTop: spacing(8), paddingHorizontal: spacing(4) },
  noClassIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing(3),
  },
  noClassText: { textAlign: "center", marginTop: spacing(1.5), lineHeight: 20 },
  retryBtn: { flexDirection: "row", gap: spacing(1.5), marginTop: spacing(4), alignItems: "center" },
  retryText: { color: colors.primary, fontWeight: "700" },
  logoutTextBtn: { marginTop: spacing(2) },
  logoutText: { color: colors.textMuted, fontWeight: "600" },
  list: { padding: spacing(4), paddingBottom: spacing(10) },
  actions: { flexDirection: "row", gap: spacing(3), marginTop: spacing(4), marginBottom: spacing(3) },
  action: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing(3),
    alignItems: "center",
    gap: spacing(1.5),
  },
  actionPrimary: { backgroundColor: colors.primary },
  actionSecondary: { backgroundColor: colors.primaryLight },
  actionDanger: { backgroundColor: colors.dangerLight },
  actionPrimaryText: { color: "#fff", fontSize: 11, fontWeight: "700", textAlign: "center" },
  actionSecondaryText: { color: colors.primary, fontSize: 11, fontWeight: "700", textAlign: "center" },
  actionDangerText: { color: colors.danger, fontSize: 11, fontWeight: "700", textAlign: "center" },
  rows: { flexDirection: "row", gap: spacing(2), flexWrap: "wrap", marginBottom: spacing(3) },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: spacing(2) },
  studentCard: { marginBottom: spacing(2.5) },
  studentBody: { flexDirection: "row", alignItems: "center", gap: spacing(3), padding: spacing(3) },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBtn: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "800", color: colors.primary },
  admNo: { fontSize: 12, color: colors.textMuted },
});