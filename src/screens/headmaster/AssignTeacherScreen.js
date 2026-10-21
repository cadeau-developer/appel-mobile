import React from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import { assignClassTeacher, fetchClasses } from "../../api/classes";
import { fetchTeachers } from "../../api/teachers";
import { useToast } from "../../context/ToastContext";
import { colors, radius, spacing, typography } from "../../theme";

export default function AssignTeacherScreen({ route, navigation }) {
  const { classId, teacherId } = route.params || {};
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery({ queryKey: ["classes"], queryFn: fetchClasses });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: fetchTeachers });

  const mutation = useMutation({
    mutationFn: ({ cid, tid }) => assignClassTeacher(cid, tid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      showToast(classId ? "Teacher assigned" : "Class assigned", "success");
      navigation.goBack();
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not assign. Please try again.", "error"),
  });

  let candidates = [];
  let canUnassign = false;

  if (classId) {
    const cid = Number(classId);
    const klass = classes.find((c) => c.id === cid);
    candidates = teachers
      .map((t) => ({
        id: t.id,
        title: t.name,
        subtitle: t.email,
        selected: klass?.teacher?.id === t.id,
        icon: "person-outline",
      }));
    canUnassign = !!klass?.teacher;
  } else {
    const tid = Number(teacherId);
    candidates = classes
      .map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.teacher ? `Assigned to: ${c.teacher.name}` : "No teacher assigned",
        selected: c.teacher?.id === tid,
        icon: "albums-outline",
      }));
    canUnassign = candidates.some((c) => c.selected);
  }

  const select = (id) => {
    if (classId) {
      mutation.mutate({ cid: Number(classId), tid: Number(id) });
    } else {
      mutation.mutate({ cid: Number(id), tid: Number(teacherId) });
    }
  };

  const unassign = () => {
    if (classId) {
      mutation.mutate({ cid: Number(classId), tid: null });
    } else {
      const teacher = teachers.find((t) => t.id === Number(teacherId));
      const currentClassId = teacher?.classTeacherOf?.[0]?.id;
      if (currentClassId) mutation.mutate({ cid: currentClassId, tid: null });
    }
  };

  const busy = mutation.isPending;
  const targetName = classId ? classes.find((c) => c.id === Number(classId))?.name : teachers.find((t) => t.id === Number(teacherId))?.name;

  return (
    <Screen scroll={false}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={typography.cardTitle}>{classId ? "Assign a class teacher" : "Assign to a class"}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {classId ? `Class: ${targetName}` : `Teacher: ${targetName}`}
          </Text>
        </View>
      </View>

      {canUnassign ? (
        <Button
          title={`Unassign ${classId ? "class teacher" : "from class"}`}
          icon="close-circle-outline"
          variant="ghost"
          onPress={unassign}
          loading={busy}
          style={styles.unassignBtn}
        />
      ) : null}

      <FlatList
        contentContainerStyle={styles.list}
        data={candidates}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <EmptyState
            icon="swap-horizontal-outline"
            title="Nothing available"
            subtitle={
              classId
                ? "Every teacher already has a class. Unassign one first."
                : "Every class already has a teacher."
            }
          />
        }
        renderItem={({ item }) => (
          <Card padded={false} style={[styles.card, item.selected && styles.cardSelected]}>
            <TouchableOpacity style={styles.row} onPress={() => select(item.id)} disabled={busy}>
              <View style={styles.icon}>
                <Ionicons name={item.icon} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, item.selected && { color: colors.primary }]}>{item.title}</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
              {item.selected ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
              )}
            </TouchableOpacity>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", gap: spacing(2.5), padding: spacing(4), paddingBottom: spacing(2) },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  unassignBtn: { marginHorizontal: spacing(4), marginBottom: spacing(2) },
  list: { padding: spacing(4), paddingBottom: spacing(10) },
  card: { marginBottom: spacing(2.5) },
  cardSelected: { borderColor: colors.primary },
  row: { flexDirection: "row", alignItems: "center", gap: spacing(3), padding: spacing(3.5) },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
});