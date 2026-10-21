import React, { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View, RefreshControl, TouchableOpacity } from "react-native";
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
import { updateStudent, leaveStudents } from "../../api/students";
import { fetchTransferClasses, transferStudents } from "../../api/records";
import { useToast } from "../../context/ToastContext";
import { pickImageFile } from "../../utils/pickImage";
import { colors, radius, spacing, typography } from "../../theme";

export default function StudentsScreen({ navigation }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: classes = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-class"],
    queryFn: fetchMyClasses,
    retry: false,
  });

  const klass = classes[0] || null;
  const students = klass?.students || [];

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [transferOpen, setTransferOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggleSelect = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const clearSelection = () => setSelected([]);
  const toggleSelectMode = () => {
    setSelectMode((m) => !m);
    clearSelection();
  };

  const invalidateRoster = (classId) => {
    queryClient.invalidateQueries({ queryKey: ["my-class"] });
    queryClient.invalidateQueries({ queryKey: ["class-students", classId] });
    queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["transfer-classes"] });
    queryClient.invalidateQueries({ queryKey: ["incoming-transfers"] });
  };

  const photoMutation = useMutation({
    mutationFn: ({ studentId, photoUrl, classId }) => updateStudent(classId, studentId, { photoUrl }),
    onSuccess: (updated, vars) => {
      const cid = vars.classId;
      queryClient.setQueryData(["my-class"], (old = []) =>
        (old || []).map((c) =>
          c.id === cid
            ? { ...c, students: (c.students || []).map((s) => (s.id === updated.id ? { ...s, photoUrl: updated.photoUrl } : s)) }
            : c
        )
      );
      queryClient.setQueryData(["class-students", cid], (old = []) =>
        (old || []).map((s) => (s.id === updated.id ? { ...s, photoUrl: updated.photoUrl } : s))
      );
      queryClient.setQueryData(["teacher-dashboard"], (old) =>
        old
          ? {
              ...old,
              students: (old.students || []).map((s) => (s.id === updated.id ? { ...s, photoUrl: updated.photoUrl } : s)),
            }
          : old
      );
      showToast("Student photo updated", "success");
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not update photo", "error"),
  });

  const setStudentPhoto = (studentId) =>
    pickImageFile(
      (dataUrl) => photoMutation.mutate({ studentId, photoUrl: dataUrl, classId: klass.id }),
      (err) => showToast(err, "error")
    );

  const leaveMutation = useMutation({
    mutationFn: (studentIds) => leaveStudents(klass.id, studentIds),
    onSuccess: (data) => {
      invalidateRoster(klass.id);
      clearSelection();
      setSelectMode(false);
      showToast(
        `${data.count} student${data.count === 1 ? "" : "s"} removed from the class`,
        "success"
      );
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not update students", "error"),
  });

  const { data: transferClasses = [] } = useQuery({
    queryKey: ["transfer-classes"],
    queryFn: fetchTransferClasses,
    enabled: transferOpen && !!klass,
  });

  const transferMutation = useMutation({
    mutationFn: (toClassId) => transferStudents(selected, toClassId),
    onSuccess: async (data) => {
      invalidateRoster(klass.id);
      queryClient.invalidateQueries({ queryKey: ["transfer-classes"] });
      clearSelection();
      setSelectMode(false);
      setTransferOpen(false);
      showToast(
        `${data.requested} student${data.requested === 1 ? "" : "s"} removed from ${klass?.name} and sent to ${data.toClassName}. Waiting for the class teacher to receive them.`,
        "success"
      );
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not transfer students", "error"),
  });

  const onConfirm = () => {
    const ids = [...selected];
    setConfirmAction(null);
    leaveMutation.mutate(ids);
  };

  const destinations = transferClasses.filter((c) => c.id !== klass?.id);

  return (
    <Screen scroll={false}>
      <BrandHeader
        showAppBrand={false}
        compact
        title="Students"
        subtitle={klass ? `${klass.name} · ${students.length} student${students.length === 1 ? "" : "s"}` : "No class assigned"}
        icon="people-outline"
        style={{ marginTop: -spacing(1.5) }}
      />

      {klass ? (
        <View style={styles.headerActions}>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.selectBtn}
            onPress={toggleSelectMode}
          >
            <Ionicons
              name={selectMode ? "close-outline" : "checkmark-circle-outline"}
              size={16}
              color={colors.primary}
            />
            <Text style={styles.selectBtnText}>{selectMode ? "Cancel" : "Select"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.registerBtn}
            onPress={() => navigation.navigate("RegisterStudent", { classId: klass.id })}
          >
            <Ionicons name="person-add-outline" size={18} color="#fff" />
            <Text style={styles.registerBtnText}>Register student</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        data={students}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="people-outline"
              title="No students yet"
              subtitle="Register the first student in this class."
            />
          ) : null
        }
        renderItem={({ item }) => {
          const isSelected = selectedSet.has(item.id);
          const body = (
            <View style={styles.studentBody}>
              {selectMode ? (
                <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>
                  {isSelected ? <Ionicons name="checkmark" size={15} color="#fff" /> : null}
                </View>
              ) : (
                <View style={styles.avatarWrap}>
                  <Avatar uri={item.photoUrl} name={item.name} size={40} />
                  <TouchableOpacity
                    style={styles.cameraBtn}
                    onPress={() => setStudentPhoto(item.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera-outline" size={11} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={typography.cardTitle}>{item.name}</Text>
                <View style={styles.metaRow}>
                  {item.gender ? (
                    <Badge tone={item.gender === "Male" ? "info" : "success"} label={item.gender} />
                  ) : null}
                  {item.admissionNo ? (
                    <Text style={styles.admNo}>#{item.admissionNo}</Text>
                  ) : null}
                </View>
              </View>
              {!selectMode ? (
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => navigation.navigate("EditStudent", { classId: klass.id, student: item })}
                >
                  <Ionicons name="pencil-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
              ) : null}
            </View>
          );

          return (
            <Card padded={false} style={[styles.studentCard, isSelected && styles.studentCardSelected]}>
              {selectMode ? (
                <TouchableOpacity activeOpacity={0.8} onPress={() => toggleSelect(item.id)}>
                  {body}
                </TouchableOpacity>
              ) : (
                body
              )}
            </Card>
          );
        }}
      />

      {selectMode ? (
        <View style={styles.actionBar}>
          <Text style={styles.actionCount}>
            {selected.length} selected
          </Text>
          <View style={styles.actionRow}>
            <ActionButton
              icon="school-outline"
              label="Another school"
              disabled={selected.length === 0}
              onPress={() =>
                setConfirmAction({
                  title: "Mark as left school",
                  message: `${selected.length} student${selected.length === 1 ? "" : "s"} will be removed from ${klass?.name} and marked as having left the school.`,
                  confirmLabel: "Mark as left",
                })
              }
            />
            <ActionButton
              icon="swap-horizontal-outline"
              label="Transfer"
              disabled={selected.length === 0}
              onPress={() => setTransferOpen(true)}
            />
            <ActionButton
              icon="person-remove-outline"
              label="Remove from class"
              tone="danger"
              disabled={selected.length === 0}
              onPress={() =>
                setConfirmAction({
                  title: "Remove from class",
                  message: `${selected.length} student${selected.length === 1 ? "" : "s"} will be removed from ${klass?.name}.`,
                  confirmLabel: "Remove",
                })
              }
            />
          </View>
        </View>
      ) : null}

      <Modal visible={!!confirmAction} transparent animationType="fade" onRequestClose={() => setConfirmAction(null)}>
        <Pressable style={styles.backdrop} onPress={() => setConfirmAction(null)}>
          <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.dialogTitle}>{confirmAction?.title}</Text>
            <Text style={styles.dialogMessage}>{confirmAction?.message}</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogCancel} onPress={() => setConfirmAction(null)}>
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogConfirm}
                onPress={onConfirm}
                disabled={leaveMutation.isPending}
              >
                <Text style={styles.dialogConfirmText}>
                  {leaveMutation.isPending ? "Working…" : confirmAction?.confirmLabel || "Confirm"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={transferOpen} transparent animationType="fade" onRequestClose={() => setTransferOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setTransferOpen(false)}>
          <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.dialogTitle}>Transfer to another class</Text>
            <Text style={styles.dialogMessage}>
              {selected.length} selected. The receiving class teacher must accept them.
            </Text>
            {destinations.length === 0 ? (
              <Text style={styles.dialogMessage}>No other classes available.</Text>
            ) : (
              destinations.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.classOption}
                  onPress={() => transferMutation.mutate(c.id)}
                  disabled={transferMutation.isPending}
                >
                  <Ionicons name="school-outline" size={18} color={colors.primary} />
                  <Text style={styles.classOptionText}>{c.name}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity style={styles.cancel} onPress={() => setTransferOpen(false)}>
              <Text style={styles.cancelLabel}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function ActionButton({ icon, label, onPress, disabled, tone }) {
  const color = tone === "danger" ? colors.danger : colors.primary;
  return (
    <TouchableOpacity
      style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={19} color={disabled ? colors.textLight : color} />
      <Text style={[styles.actionBtnText, { color: disabled ? colors.textLight : color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing(4),
    paddingTop: spacing(2),
  },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1),
    backgroundColor: colors.primaryLight,
    borderRadius: radius.round,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
  },
  selectBtnText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3.5),
  },
  registerBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  list: { padding: spacing(4), paddingTop: spacing(2), paddingBottom: spacing(10) },
  studentCard: { marginBottom: spacing(2.5) },
  studentCardSelected: { borderColor: colors.primary, borderWidth: 1.5 },
  studentBody: { flexDirection: "row", alignItems: "center", gap: spacing(3), padding: spacing(3) },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBtn: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginTop: 3 },
  admNo: { fontSize: 12, color: colors.textMuted },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing(4),
    paddingTop: spacing(2.5),
    paddingBottom: spacing(3),
  },
  actionCount: { fontSize: 12, fontWeight: "700", color: colors.textMuted, marginBottom: spacing(2) },
  actionRow: { flexDirection: "row", gap: spacing(2) },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(1),
    paddingVertical: spacing(2.5),
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
  },
  actionBtnDisabled: { backgroundColor: colors.surfaceMuted },
  actionBtnText: { fontSize: 11.5, fontWeight: "700", textAlign: "center" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing(5),
  },
  dialog: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing(4),
  },
  dialogTitle: { color: colors.text, fontSize: 18, fontWeight: "800", marginBottom: spacing(2) },
  dialogMessage: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: spacing(3) },
  dialogActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing(2) },
  dialogCancel: { paddingVertical: spacing(2.5), paddingHorizontal: spacing(4), borderRadius: radius.lg },
  dialogCancelText: { color: colors.textMuted, fontWeight: "700" },
  dialogConfirm: {
    paddingVertical: spacing(2.5),
    paddingHorizontal: spacing(4),
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  dialogConfirmText: { color: "#fff", fontWeight: "700" },
  classOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  classOptionText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: "600" },
  cancel: { alignSelf: "flex-end", paddingTop: spacing(3), paddingHorizontal: spacing(2) },
  cancelLabel: { color: colors.primary, fontWeight: "700" },
});
