import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { fetchDisciplineSettings, updateDisciplineSettings } from "../../api/discipline";
import { useToast } from "../../context/ToastContext";
import { colors, radius, spacing, typography } from "../../theme";

export default function DisciplineSettingsScreen() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ["discipline-settings"], queryFn: fetchDisciplineSettings });

  const [defaultMarks, setDefaultMarks] = useState("");
  const [threshold, setThreshold] = useState("");

  useEffect(() => {
    if (settings) {
      setDefaultMarks(String(settings.defaultMarks));
      setThreshold(String(settings.punishmentThreshold));
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: updateDisciplineSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discipline-settings"] });
      queryClient.invalidateQueries({ queryKey: ["discipline-marks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      showToast("Discipline policy saved", "success");
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not save the policy", "error"),
  });

  const dm = Number(defaultMarks || 0);
  const th = Number(threshold || 0);
  const minMarks = Math.max(0, dm - th);

  const onSave = () => {
    if (!Number.isInteger(dm) || dm < 1 || dm > 100) {
      showToast("Starting marks must be a whole number between 1 and 100", "error");
      return;
    }
    if (!Number.isInteger(th) || th < 0 || th > dm) {
      showToast("Punishment marks must be between 0 and the starting marks", "error");
      return;
    }
    mutation.mutate({ defaultMarks: dm, punishmentThreshold: th });
  };

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={typography.title}>Discipline policy</Text>
        <Text style={[typography.subtitle, styles.mt]}>
          Set the marks every student starts a term with, and how many marks they can lose before a punishment.
        </Text>

        <Card style={styles.card}>
          <Input
            label="Starting marks per term"
            icon="ribbon-outline"
            value={defaultMarks}
            onChangeText={(t) => setDefaultMarks(t.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            placeholder="40"
          />
          <Input
            label="Marks lost before punishment"
            icon="alert-circle-outline"
            value={threshold}
            onChangeText={(t) => setThreshold(t.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            placeholder="10"
          />
        </Card>

        <Card style={styles.preview}>
          <View style={styles.previewRow}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.previewText}>
              Each student starts with {dm || 0} marks. When they lose {th || 0} or more, they drop to {minMarks} marks
              or below and get a punishment.
            </Text>
          </View>
        </Card>

        <Button title="Save policy" icon="save-outline" onPress={onSave} loading={mutation.isPending} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing(4), paddingBottom: spacing(10) },
  mt: { marginTop: spacing(1), marginBottom: spacing(4) },
  card: { marginBottom: spacing(4) },
  preview: { marginBottom: spacing(4), backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  previewRow: { flexDirection: "row", gap: spacing(3), alignItems: "flex-start" },
  previewText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
});
