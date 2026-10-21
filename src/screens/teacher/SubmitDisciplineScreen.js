import React, { useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Avatar from "../../components/Avatar";
import EmptyState from "../../components/EmptyState";
import { searchStudents } from "../../api/students";
import { createDisciplineCase, fetchStudentDiscipline } from "../../api/discipline";
import { useToast } from "../../context/ToastContext";
import { colors, radius, spacing } from "../../theme";

export default function SubmitDisciplineScreen({ navigation }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [description, setDescription] = useState("");
  const [marks, setMarks] = useState("1");
  const [submitted, setSubmitted] = useState([]);

  const { data: results = [] } = useQuery({
    queryKey: ["student-search", search],
    queryFn: () => searchStudents(search),
    enabled: search.length > 1,
  });

  const { data: discipline } = useQuery({
    queryKey: ["student-discipline", selected?.id],
    queryFn: () => fetchStudentDiscipline(selected.id),
    enabled: !!selected,
  });

  const mutation = useMutation({
    mutationFn: createDisciplineCase,
    onSuccess: (_data, vars) => {
      const entry = {
        id: Date.now(),
        studentName: selected.name,
        className: selected.class.name,
        description: vars.description,
        marksDeducted: vars.marksDeducted,
      };
      setSubmitted((prev) => [entry, ...prev]);
      queryClient.invalidateQueries({ queryKey: ["student-discipline", selected.id] });
      queryClient.invalidateQueries({ queryKey: ["discipline-cases"] });
      queryClient.invalidateQueries({ queryKey: ["discipline-marks"] });
      queryClient.invalidateQueries({ queryKey: ["headmaster-dashboard"] });
      showToast("Case submitted — you can add another", "success");
      setSelected(null);
      setSearch("");
      setDescription("");
      setMarks("1");
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not submit the case. Please try again.", "error"),
  });

  const marksValue = Number(marks || 0);

  const onSubmit = () => {
    if (!selected || !description) {
      showToast("Please pick a student and describe the case", "error");
      return;
    }
    if (!Number.isInteger(marksValue) || marksValue < 0) {
      showToast("Marks to remove must be a whole number of 0 or more", "error");
      return;
    }
    mutation.mutate({ studentId: selected.id, description, marksDeducted: marksValue });
  };

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Submit a discipline case</Text>
            <Text style={styles.subtitle}>
              Any teacher can report a student in the school. The headmaster will see it immediately.
            </Text>
          </View>
          {submitted.length > 0 && (
            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.doneText}>Done ({submitted.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.stepWrap}>
          <StepLabel n={1} label="Choose the student (any class)" />
          {selected ? (
            <Card padded={false} style={styles.selectedCard}>
              <View style={styles.selectedRow}>
                <Avatar uri={selected.photoUrl} name={selected.name} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedName}>{selected.name}</Text>
                  <Text style={styles.selectedMeta}>{selected.class.name}</Text>
                  {discipline ? (
                    <Text style={[styles.marksMeta, discipline.punishable && styles.marksMetaDanger]}>
                      Discipline marks: {discipline.remaining} / {discipline.settings.defaultMarks}
                      {discipline.punishable ? " · punishment due" : ""}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setSelected(null);
                    setSearch("");
                  }}
                  style={styles.changeBtn}
                >
                  <Ionicons name="close" size={16} color={colors.primary} />
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ) : (
            <View style={styles.searchArea}>
              <Input
                icon="search-outline"
                placeholder="Type a student's name…"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 1 ? (
                <View style={styles.results}>
                  {results.length === 0 ? (
                    <EmptyState icon="search-outline" title="No matches" subtitle="Try a different name." />
                  ) : (
                    results.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.resultRow}
                        onPress={() => setSelected(item)}
                      >
                        <Avatar uri={item.photoUrl} name={item.name} size={38} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.resultName}>{item.name}</Text>
                          <Text style={styles.resultMeta}>{item.class.name}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.stepWrap}>
          <StepLabel n={2} label="Describe what happened" />
          <Card>
            <Input
              icon="document-text-outline"
              placeholder="What happened? Be specific…"
              value={description}
              onChangeText={setDescription}
              multiline
              inputStyle={{ minHeight: 90, paddingTop: spacing(2.5) }}
            />
            <Input
              label="Discipline marks to remove"
              icon="remove-circle-outline"
              placeholder="0"
              value={marks}
              onChangeText={(t) => setMarks(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
            />
            {discipline ? (
              <Text style={styles.marksHint}>
                {selected?.name} will have {Math.max(0, discipline.remaining - marksValue)} /{" "}
                {discipline.settings.defaultMarks} marks left.
                {discipline.settings.punishmentThreshold > 0
                  ? ` Punishment at ${discipline.settings.punishmentThreshold} lost marks.`
                  : ""}
              </Text>
            ) : null}
            <Button title="Submit case" icon="flag-outline" onPress={onSubmit} loading={mutation.isPending} />
          </Card>
        </View>

        {submitted.length > 0 && (
          <View style={styles.stepWrap}>
            <StepLabel n={3} label={`Submitted cases (${submitted.length})`} />
            {submitted.map((s) => (
              <Card key={s.id} padded={false} style={styles.submittedCard}>
                <View style={styles.submittedRow}>
                  <View style={styles.submittedIcon}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.submittedName}>{s.studentName}</Text>
                    <Text style={styles.submittedMeta}>
                      {s.className} · {s.marksDeducted > 0 ? `-${s.marksDeducted} marks · ` : ""}
                      {s.description.length > 50 ? s.description.slice(0, 50) + "…" : s.description}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

function StepLabel({ n, label }) {
  return (
    <View style={styles.stepLabelRow}>
      <View style={styles.stepDot}>
        <Text style={styles.stepDotText}>{n}</Text>
      </View>
      <Text style={styles.stepLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing(4), paddingBottom: spacing(10) },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing(3) },
  doneBtn: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2),
    borderRadius: radius.round,
    marginTop: spacing(1),
  },
  doneText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: spacing(1), lineHeight: 20 },
  stepWrap: { marginTop: spacing(5) },
  stepLabelRow: { flexDirection: "row", alignItems: "center", gap: spacing(2), marginBottom: spacing(2.5) },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  stepLabel: { fontSize: 15, fontWeight: "700", color: colors.text },
  selectedCard: { marginBottom: spacing(2) },
  selectedRow: { flexDirection: "row", alignItems: "center", gap: spacing(3), padding: spacing(3.5) },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "800", color: colors.primary },
  selectedName: { fontSize: 15, fontWeight: "700", color: colors.text },
  selectedMeta: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  marksMeta: { fontSize: 12, fontWeight: "700", color: colors.primary, marginTop: 3 },
  marksMetaDanger: { color: colors.danger },
  marksHint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing(3), lineHeight: 17 },
  changeBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  changeText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  searchArea: {},
  results: { borderTopWidth: 1, borderTopColor: colors.border },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    paddingVertical: spacing(2.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultName: { fontSize: 14, fontWeight: "600", color: colors.text },
  resultMeta: { fontSize: 12, color: colors.textMuted },
  submittedCard: { marginBottom: spacing(2) },
  submittedRow: { flexDirection: "row", alignItems: "center", gap: spacing(2.5), padding: spacing(3) },
  submittedIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.successLight, alignItems: "center", justifyContent: "center" },
  submittedName: { fontSize: 14, fontWeight: "700", color: colors.text },
  submittedMeta: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
});