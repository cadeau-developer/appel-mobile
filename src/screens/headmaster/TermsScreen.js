import React, { useState } from "react";
import { StyleSheet, View, ScrollView, RefreshControl, Modal, Pressable } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import { fetchTerms, startTerm, endTerm } from "../../api/terms";
import { fetchYears, startYear, endYear, revertYear } from "../../api/years";
import { fetchUndergraduates } from "../../api/records";
import { useToast } from "../../context/ToastContext";
import { formatFullDate } from "../../utils/date";
import { colors, radius, spacing } from "../../theme";

const CURRENT_YEAR = new Date().getFullYear();

// Headmaster: the school year and its terms. The year must be open before a
// term can start; ending the year archives every student and can be reverted.
export default function TermsScreen() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [confirmEndTerm, setConfirmEndTerm] = useState(false);
  const [confirmEndYear, setConfirmEndYear] = useState(false);
  const [confirmRevertYear, setConfirmRevertYear] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["terms"],
    queryFn: fetchTerms,
  });
  const { data: yearData, isRefetching: isYearRefetching } = useQuery({
    queryKey: ["years"],
    queryFn: fetchYears,
  });
  const { data: undergrads } = useQuery({
    queryKey: ["undergraduates", CURRENT_YEAR],
    queryFn: () => fetchUndergraduates(),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["terms"] });
    queryClient.invalidateQueries({ queryKey: ["years"] });
    queryClient.invalidateQueries({ queryKey: ["undergraduates"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] });
  };

  const startTermMutation = useMutation({
    mutationFn: startTerm,
    onSuccess: (result) => {
      invalidateAll();
      showToast(`${result.currentTerm.name} started`, "success");
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not start the term", "error"),
  });

  const endTermMutation = useMutation({
    mutationFn: endTerm,
    onSuccess: (result) => {
      invalidateAll();
      showToast(`${result.ended.name} ended`, "success");
      setConfirmEndTerm(false);
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not end the term", "error"),
  });

  const startYearMutation = useMutation({
    mutationFn: startYear,
    onSuccess: (result) => {
      invalidateAll();
      showToast(`School year ${result.currentYear.year} started`, "success");
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not start the school year", "error"),
  });

  const endYearMutation = useMutation({
    mutationFn: endYear,
    onSuccess: (result) => {
      invalidateAll();
      showToast(`School year ended — ${result.archived} students archived`, "success");
      setConfirmEndYear(false);
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not end the school year", "error"),
  });

  const revertYearMutation = useMutation({
    mutationFn: () => revertYear(CURRENT_YEAR),
    onSuccess: (result) => {
      invalidateAll();
      showToast(`Year reopened — ${result.reverted} students restored`, "success");
      setConfirmRevertYear(false);
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not reopen the school year", "error"),
  });

  const currentTerm = data?.currentTerm;
  const terms = data?.terms || [];
  const nextTermNumber = terms.length ? Math.max(...terms.map((t) => t.number)) + 1 : 1;
  const history = terms.filter((t) => !t.current);

  const currentYear = yearData?.currentYear;
  const archivedCount = undergrads?.records?.length || 0;
  const yearClosedWithStudents = !currentYear && archivedCount > 0;

  return (
    <Screen scroll={false}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || isYearRefetching}
            onRefresh={() => {
              refetch();
              queryClient.invalidateQueries({ queryKey: ["years"] });
            }}
          />
        }
      >
        {isLoading ? (
          <Text style={styles.loadingText}>Loading…</Text>
        ) : (
          <>
            <Text style={styles.sectionTitle}>School year</Text>
            <Card style={styles.card}>
              <View style={styles.termHeader}>
                <View style={[styles.iconCircle, !currentYear ? styles.iconCircleMuted : undefined]}>
                  <Ionicons name="school-outline" size={20} color={currentYear ? colors.primary : colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.termLabel}>
                    {currentYear ? `School year ${currentYear.year}` : `School year ${CURRENT_YEAR}`}
                  </Text>
                  <Text style={styles.termName}>
                    {currentYear ? "Open" : yearClosedWithStudents ? "Closed" : "Not started"}
                  </Text>
                </View>
                <Badge tone={currentYear ? "success" : "neutral"} label={currentYear ? "Open" : "Closed"} />
              </View>
              <Text style={styles.termDates}>
                {currentYear
                  ? `Started ${formatFullDate(currentYear.starts)}. Terms can only run while the year is open.`
                  : yearClosedWithStudents
                    ? `${archivedCount} student${archivedCount === 1 ? "" : "s"} archived as undergraduates. Reopen the year to restore them.`
                    : "Start the school year to be able to start terms."}
              </Text>
              {currentYear ? (
                <Button
                  title={`End school year (${currentYear.year})`}
                  icon="flag-outline"
                  variant="danger"
                  onPress={() => setConfirmEndYear(true)}
                  loading={endYearMutation.isPending}
                  style={{ marginTop: spacing(4) }}
                />
              ) : yearClosedWithStudents ? (
                <Button
                  title={`Reopen year (${CURRENT_YEAR})`}
                  icon="arrow-undo-outline"
                  variant="secondary"
                  onPress={() => setConfirmRevertYear(true)}
                  loading={revertYearMutation.isPending}
                  style={{ marginTop: spacing(4) }}
                />
              ) : (
                <Button
                  title={`Start year ${CURRENT_YEAR}`}
                  icon="play-outline"
                  onPress={() => startYearMutation.mutate({})}
                  loading={startYearMutation.isPending}
                  style={{ marginTop: spacing(4) }}
                />
              )}
            </Card>

            <Text style={styles.sectionTitle}>Terms</Text>
            {currentTerm ? (
              <Card style={styles.card}>
                <View style={styles.termHeader}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.termLabel}>Current term</Text>
                    <Text style={styles.termName}>{currentTerm.name}</Text>
                  </View>
                  <Badge tone="success" label="Running" />
                </View>
                <Text style={styles.termDates}>Started {formatFullDate(currentTerm.starts)}</Text>
                <Button
                  title={`End ${currentTerm.name}`}
                  icon="flag-outline"
                  variant="danger"
                  onPress={() => setConfirmEndTerm(true)}
                  loading={endTermMutation.isPending}
                  style={{ marginTop: spacing(4) }}
                />
              </Card>
            ) : (
              <Card style={styles.card}>
                <EmptyState
                  icon="calendar-outline"
                  title="No term running"
                  subtitle={
                    currentYear
                      ? `Start Term ${nextTermNumber} to begin tracking attendance and discipline by term.`
                      : "Start the school year first, then start a term."
                  }
                />
                <Button
                  title={`Start Term ${nextTermNumber}`}
                  icon="play-outline"
                  onPress={() => startTermMutation.mutate({})}
                  loading={startTermMutation.isPending}
                  disabled={!currentYear}
                  style={{ marginTop: spacing(3) }}
                />
              </Card>
            )}

            {history.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Term history</Text>
                {history.map((t) => (
                  <Card key={t.id} style={styles.historyCard}>
                    <View style={styles.historyRow}>
                      <View style={[styles.iconCircle, styles.iconCircleMuted]}>
                        <Ionicons name="checkmark-done-outline" size={18} color={colors.textMuted} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyName}>{t.name}</Text>
                        <Text style={styles.historyDates}>
                          {formatFullDate(t.starts)} — {t.ends ? formatFullDate(t.ends) : "ongoing"}
                        </Text>
                      </View>
                      <Badge tone="neutral" label="Ended" />
                    </View>
                  </Card>
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      <Modal visible={confirmEndTerm} transparent animationType="fade" onRequestClose={() => setConfirmEndTerm(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirmEndTerm(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Ionicons name="alert-circle-outline" size={34} color={colors.danger} />
            <Text style={styles.modalTitle}>End {currentTerm?.name}?</Text>
            <Text style={styles.modalText}>
              Attendance and discipline records for {currentTerm?.name} become history and can no longer be edited.
              The next term is started separately whenever you are ready.
            </Text>
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setConfirmEndTerm(false)} style={{ flex: 1 }} />
              <Button
                title="End term"
                variant="danger"
                onPress={() => endTermMutation.mutate()}
                loading={endTermMutation.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={confirmEndYear} transparent animationType="fade" onRequestClose={() => setConfirmEndYear(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirmEndYear(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Ionicons name="alert-circle-outline" size={34} color={colors.danger} />
            <Text style={styles.modalTitle}>End school year {currentYear?.year}?</Text>
            <Text style={styles.modalText}>
              Every student in the school is archived as an undergraduate, all class rosters are emptied and any
              running term is closed. You can reopen the year from this screen, but only before students are repeated,
              promoted or transferred.
            </Text>
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setConfirmEndYear(false)} style={{ flex: 1 }} />
              <Button
                title="End year"
                variant="danger"
                onPress={() => endYearMutation.mutate()}
                loading={endYearMutation.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={confirmRevertYear} transparent animationType="fade" onRequestClose={() => setConfirmRevertYear(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirmRevertYear(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Ionicons name="arrow-undo-outline" size={34} color={colors.primary} />
            <Text style={styles.modalTitle}>Reopen year {CURRENT_YEAR}?</Text>
            <Text style={styles.modalText}>
              All {archivedCount} archived students are restored to the class they were in before the year was ended.
              Students who were already repeated, promoted or transferred keep their new class.
            </Text>
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setConfirmRevertYear(false)} style={{ flex: 1 }} />
              <Button
                title="Reopen year"
                onPress={() => revertYearMutation.mutate()}
                loading={revertYearMutation.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing(4), paddingBottom: spacing(10) },
  loadingText: { fontSize: 14, color: colors.textMuted, textAlign: "center", marginTop: spacing(6) },
  card: { marginBottom: spacing(4) },
  termHeader: { flexDirection: "row", alignItems: "center", gap: spacing(3) },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleMuted: { backgroundColor: colors.surfaceMuted || colors.border },
  termLabel: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  termName: { fontSize: 18, fontWeight: "800", color: colors.text, marginTop: 1 },
  termDates: { fontSize: 13, color: colors.textMuted, marginTop: spacing(3) },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: spacing(3) },
  historyCard: { marginBottom: spacing(2) },
  historyRow: { flexDirection: "row", alignItems: "center", gap: spacing(3) },
  historyName: { fontSize: 15, fontWeight: "700", color: colors.text },
  historyDates: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing(5),
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing(5),
    alignItems: "center",
    gap: spacing(2),
    maxWidth: 400,
    width: "100%",
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  modalText: { fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 19 },
  modalActions: { flexDirection: "row", gap: spacing(3), marginTop: spacing(3), width: "100%" },
});
