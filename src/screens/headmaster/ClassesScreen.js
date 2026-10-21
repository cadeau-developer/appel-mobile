import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, View, RefreshControl, TouchableOpacity } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import Screen from "../../components/Screen";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import { deleteClass, fetchClasses } from "../../api/classes";
import { useToast } from "../../context/ToastContext";
import { colors, radius, spacing, typography } from "../../theme";

export default function ClassesScreen({ navigation }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [confirmId, setConfirmId] = useState(null);
  const confirmTimer = useRef(null);

  useEffect(() => () => clearTimeout(confirmTimer.current), []);

  const { data: classes = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["classes"],
    queryFn: fetchClasses,
  });

  useFocusEffect(
    useCallback(() => {
      // A class is still being created or deleted — let the optimistic list stand.
      if (
        queryClient.isMutating({ mutationKey: ["create-class"] }) > 0 ||
        queryClient.isMutating({ mutationKey: ["delete-class"] }) > 0
      )
        return;
      refetch();
    }, [refetch, queryClient])
  );

  const deleteMutation = useMutation({
    mutationFn: deleteClass,
    mutationKey: ["delete-class"],
    onMutate: async (classId) => {
      await queryClient.cancelQueries({ queryKey: ["classes"] });
      const prev = queryClient.getQueryData(["classes"]);
      queryClient.setQueryData(["classes"], (old = []) => (old || []).filter((c) => c.id !== classId));
      return { prev };
    },
    onSuccess: () => showToast("Class deleted", "success"),
    onError: (err, _classId, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(["classes"], ctx.prev);
      showToast(err.response?.data?.error || "Could not delete the class", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });

  const onDelete = (klass) => {
    if (deleteMutation.isPending) return;
    if (confirmId !== klass.id) {
      setConfirmId(klass.id);
      showToast(`Tap Delete again to remove ${klass.name}`, "info");
      clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmId(null), 4000);
      return;
    }
    clearTimeout(confirmTimer.current);
    setConfirmId(null);
    deleteMutation.mutate(klass.id);
  };

  return (
    <Screen scroll={false}>
      <FlatList
        contentContainerStyle={styles.list}
        data={classes}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={typography.title}>Classes</Text>
            <Text style={typography.subtitle}>
              {classes.length} class{classes.length === 1 ? "" : "es"} in your school
            </Text>
            <Button
              title="Create a class"
              icon="add-circle-outline"
              onPress={() => navigation.navigate("AddClass")}
              style={styles.addBtn}
            />
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="albums-outline"
              title="No classes yet"
              subtitle="Create your first class so a teacher can start taking attendance."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Card padded={false} style={styles.card}>
            <View style={styles.cardBody}>
              <View style={styles.classIcon}>
                <Ionicons name="albums-outline" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.cardTitle}>{item.name}</Text>
                <Text style={styles.teacherLine} numberOfLines={1}>
                  {item.teacher ? (
                    <>
                      <Ionicons name="person-outline" size={13} color={colors.textMuted} />{" "}
                      {item.teacher.name}
                    </>
                  ) : (
                    "No class teacher assigned"
                  )}
                </Text>
              </View>
              <View style={styles.countCol}>
                <Badge tone={(item._count?.students ?? 0) > 0 ? "info" : "neutral"} icon="people-outline" label={`${item._count?.students ?? 0} students`} />
                <TouchableOpacity
                  style={styles.assignBtn}
                  onPress={() => navigation.navigate("AssignTeacher", { classId: item.id })}
                >
                  <Ionicons name="swap-horizontal-outline" size={13} color={colors.primary} />
                  <Text style={styles.assignText}>{item.teacher ? "Change" : "Assign"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => onDelete(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  disabled={deleteMutation.isPending}
                  activeOpacity={0.7}
                >
                  <Ionicons name={confirmId === item.id ? "trash" : "trash-outline"} size={13} color={colors.danger} />
                  <Text style={[styles.deleteText, confirmId === item.id && styles.deleteTextActive]}>
                    {confirmId === item.id ? "Tap again" : "Delete"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing(4), paddingBottom: spacing(10) },
  header: { marginBottom: spacing(3) },
  addBtn: { marginTop: spacing(3) },
  card: { marginBottom: spacing(3) },
  cardBody: { flexDirection: "row", alignItems: "center", gap: spacing(3), padding: spacing(3.5) },
  classIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  teacherLine: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  countCol: { alignItems: "flex-end", gap: spacing(1.5) },
  assignBtn: { flexDirection: "row", alignItems: "center", gap: spacing(1), marginTop: spacing(0.5) },
  assignText: { fontSize: 12, fontWeight: "700", color: colors.primary },
  deleteBtn: { flexDirection: "row", alignItems: "center", gap: spacing(1), marginTop: spacing(0.5) },
  deleteText: { fontSize: 12, fontWeight: "700", color: colors.danger },
  deleteTextActive: { textDecorationLine: "underline" },
});