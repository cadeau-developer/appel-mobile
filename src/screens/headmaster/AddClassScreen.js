import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Avatar from "../../components/Avatar";
import Card from "../../components/Card";
import { fetchTeachers } from "../../api/teachers";
import { createClass } from "../../api/classes";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { colors, radius, spacing } from "../../theme";

export default function AddClassScreen({ navigation }) {
  const { translate } = useLanguage();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: teachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: fetchTeachers });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => `${t.name} ${t.email}`.toLowerCase().includes(q));
  }, [teachers, search]);

  const selectedTeacher = teacherId ? teachers.find((t) => t.id === teacherId) : null;

  const mutation = useMutation({
    mutationFn: createClass,
    mutationKey: ["create-class"],
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["classes"] });
      const prev = queryClient.getQueryData(["classes"]);
      const teacher = (queryClient.getQueryData(["teachers"]) || []).find((t) => t.id === payload.teacherId);
      queryClient.setQueryData(["classes"], (old = []) => [
        {
          id: `temp-${Date.now()}`,
          name: payload.name,
          teacher: teacher ? { id: teacher.id, name: teacher.name, email: teacher.email } : null,
          _count: { students: 0 },
        },
        ...old,
      ]);
      return { prev };
    },
    onSuccess: (created, _vars, ctx) => {
      if (ctx) {
        queryClient.setQueryData(["classes"], (old = []) =>
          (old || []).map((c) => (String(c.id).startsWith("temp-") ? created : c))
        );
      }
      showToast("Class created", "success");
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(["classes"], ctx.prev);
      showToast(err.response?.data?.error || "Could not create class. Please try again.", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const onSubmit = () => {
    if (!name) {
      showToast("Please enter a class name", "error");
      return;
    }
    mutation.mutate({ name, teacherId });
    navigation.goBack();
  };

  return (
    <Screen padded>
      <Card style={styles.card}>
        <Text style={styles.title}>Create a class</Text>
        <View style={{ marginTop: spacing(2) }}>
          <Input
            label="Class name"
            icon="albums-outline"
            value={name}
            onChangeText={setName}
            placeholder={translate("e.g. Primary 5A")}
          />
        </View>
      </Card>

      <Text style={styles.section}>Assign a class teacher (optional)</Text>
      <Text style={styles.sectionHint}>
        The class teacher is responsible for taking daily attendance in this class.
      </Text>

      <TouchableOpacity
        style={styles.dropdownTrigger}
        onPress={() => {
          setPickerOpen((o) => !o);
          setSearch("");
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="person-outline" size={18} color={colors.textMuted} />
        <Text style={[styles.dropdownText, !selectedTeacher && styles.dropdownPlaceholder]}>
          {selectedTeacher ? selectedTeacher.name : "Search and select a teacher…"}
        </Text>
        <Ionicons name={pickerOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={colors.textLight} />
      </TouchableOpacity>

      {selectedTeacher ? (
        <View style={styles.selectedRow}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.selectedText} numberOfLines={1}>
            {selectedTeacher.name} · {selectedTeacher.email}
          </Text>
          <TouchableOpacity onPress={() => setTeacherId(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      ) : null}

      {pickerOpen ? (
        <View style={styles.dropdownPanel}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color={colors.textLight} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder={translate("Search by name or email…")}
              placeholderTextColor={colors.textLight}
              autoCorrect={false}
            />
          </View>
          {filtered.length === 0 ? (
            <View style={styles.emptyPanel}>
              <Ionicons name="person-outline" size={22} color={colors.textLight} />
              <Text style={styles.emptyPanelText}>
                {teachers.length === 0 ? "No teachers registered yet" : "No match found"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 260 }}
              renderItem={({ item }) => {
                const otherClasses = (item.classTeacherOf ?? []).length;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      setTeacherId(item.id);
                      setPickerOpen(false);
                    }}
                    style={styles.teacherRow}
                    activeOpacity={0.7}
                  >
                    <Avatar uri={item.avatarUrl} name={item.name} size={36} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teacherName}>{item.name}</Text>
                      <Text style={styles.takenText}>
                        {otherClasses > 0
                          ? `Also assigned to ${otherClasses} other class${otherClasses > 1 ? "es" : ""}`
                          : "Available"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      ) : null}

      <Button
        title="Create class"
        icon="checkmark-done-outline"
        onPress={onSubmit}
        loading={mutation.isPending}
        style={styles.submit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing(4) },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  section: { fontSize: 15, fontWeight: "800", color: colors.text, marginTop: spacing(5) },
  sectionHint: { fontSize: 13, color: colors.textMuted, marginTop: spacing(1), marginBottom: spacing(3) },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(3.5),
  },
  dropdownText: { flex: 1, fontSize: 15, fontWeight: "500", color: colors.text },
  dropdownPlaceholder: { color: colors.textLight },
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.5),
    marginTop: spacing(2.5),
  },
  selectedText: { flex: 1, fontSize: 13, fontWeight: "700", color: colors.text },
  dropdownPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing(2.5),
    overflow: "hidden",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    paddingHorizontal: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  searchInput: { flex: 1, paddingVertical: spacing(2.5), fontSize: 14, color: colors.text },
  emptyPanel: { alignItems: "center", gap: spacing(1.5), paddingVertical: spacing(6) },
  emptyPanelText: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  teacherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    padding: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  teacherAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  teacherAvatarText: { fontSize: 14, fontWeight: "800", color: colors.primary },
  teacherName: { fontSize: 14, fontWeight: "700", color: colors.text },
  takenText: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  submit: { marginTop: spacing(5) },
});