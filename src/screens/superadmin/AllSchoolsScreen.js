import React, { useCallback } from "react";
import { StyleSheet, View, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import BrandHeader from "../../components/BrandHeader";
import EmptyState from "../../components/EmptyState";
import Avatar from "../../components/Avatar";
import { fetchAllSchools, approveSchool, rejectSchool, blockSchool, unblockSchool } from "../../api/admin";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { colors, radius, spacing, typography } from "../../theme";

const statusMeta = {
  APPROVED: { tone: "success", icon: "checkmark-circle", label: "Approved" },
  PENDING: { tone: "warning", icon: "time-outline", label: "Pending" },
  REJECTED: { tone: "danger", icon: "close-circle", label: "Rejected" },
  BLOCKED: { tone: "danger", icon: "lock-closed", label: "Blocked" },
};

export default function AllSchoolsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: schools = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["all-schools"],
    queryFn: fetchAllSchools,
    refetchOnMount: true,
    staleTime: 0,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const approveMutation = useMutation({
    mutationFn: approveSchool,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["all-schools"] });
      const prev = queryClient.getQueryData(["all-schools"]);
      queryClient.setQueryData(["all-schools"], (old = []) =>
        (old || []).map((s) => (s.id === id ? { ...s, status: "APPROVED" } : s))
      );
      return { prev };
    },
    onSuccess: () => {
      showToast("School approved", "success");
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["all-schools"], ctx.prev);
      showToast(err.response?.data?.error || "Could not approve school", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["all-schools"] });
      queryClient.invalidateQueries({ queryKey: ["pending-schools"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectSchool,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["all-schools"] });
      const prev = queryClient.getQueryData(["all-schools"]);
      queryClient.setQueryData(["all-schools"], (old = []) =>
        (old || []).map((s) => (s.id === id ? { ...s, status: "REJECTED" } : s))
      );
      return { prev };
    },
    onSuccess: () => {
      showToast("School rejected", "info");
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["all-schools"], ctx.prev);
      showToast(err.response?.data?.error || "Could not reject school", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["all-schools"] });
      queryClient.invalidateQueries({ queryKey: ["pending-schools"] });
    },
  });

  const blockMutation = useMutation({
    mutationFn: blockSchool,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["all-schools"] });
      const prev = queryClient.getQueryData(["all-schools"]);
      queryClient.setQueryData(["all-schools"], (old = []) =>
        (old || []).map((s) => (s.id === id ? { ...s, status: "BLOCKED" } : s))
      );
      return { prev };
    },
    onSuccess: () => {
      showToast("School blocked", "info");
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["all-schools"], ctx.prev);
      showToast(err.response?.data?.error || "Could not block school", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["all-schools"] });
      queryClient.invalidateQueries({ queryKey: ["pending-schools"] });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: unblockSchool,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["all-schools"] });
      const prev = queryClient.getQueryData(["all-schools"]);
      queryClient.setQueryData(["all-schools"], (old = []) =>
        (old || []).map((s) => (s.id === id ? { ...s, status: "APPROVED" } : s))
      );
      return { prev };
    },
    onSuccess: () => {
      showToast("School unblocked", "success");
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["all-schools"], ctx.prev);
      showToast(err.response?.data?.error || "Could not unblock school", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["all-schools"] });
      queryClient.invalidateQueries({ queryKey: ["pending-schools"] });
    },
  });

  const approved = schools.filter((s) => s.status === "APPROVED").length;
  const pending = schools.filter((s) => s.status === "PENDING").length;
  const rejected = schools.filter((s) => s.status === "REJECTED").length;
  const blocked = schools.filter((s) => s.status === "BLOCKED").length;

  return (
    <Screen scroll={false}>
      <BrandHeader
        title="Schools"
        subtitle={`${approved} approved · ${pending} pending · ${rejected} rejected${blocked ? ` · ${blocked} blocked` : ""}`}
        icon="apps-outline"
        right={
          <>
            <View style={styles.headerAvatar}>
              <Avatar uri={user?.avatarUrl} name={user?.name} size={30} />
            </View>
            <TouchableOpacity onPress={logout} style={styles.iconBtn}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        }
      />
      <TouchableOpacity
        accessibilityRole="button"
        style={styles.registerBtn}
        onPress={() => navigation.navigate("RegisterSchool")}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.registerText}>Register a school</Text>
      </TouchableOpacity>
      <View style={styles.summary}>
        {[
          { label: "Approved", value: approved, color: colors.success },
          { label: "Pending", value: pending, color: colors.accent },
          { label: "Rejected", value: rejected, color: colors.danger },
        ].map((s) => (
          <View key={s.label} style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={schools}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState icon="school-outline" title="No schools registered" subtitle="Schools appear here once a headmaster registers." />
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("SchoolManage", { school: item })}
          >
            <Card padded={false} style={styles.card}>
              <View style={styles.cardBody}>
                <View style={styles.schoolIcon}>
                  <Ionicons name="school-outline" size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={typography.cardTitle}>{item.name}</Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {[item.schoolType, item.city].filter(Boolean).join(" · ") || "School"}
                  </Text>
                  {item.users?.[0]?.name || item.headmasterName ? (
                    <Text style={styles.meta} numberOfLines={1}>
                      {item.users?.[0]?.name || item.headmasterName}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.rightCol}>
                  <Badge
                    tone={(statusMeta[item.status] || statusMeta.PENDING)?.tone || "neutral"}
                    icon={(statusMeta[item.status] || statusMeta.PENDING)?.icon}
                    label={(statusMeta[item.status] || statusMeta.PENDING)?.label || item.status}
                  />
                  <Text style={styles.manageText}>
                    Manage <Ionicons name="chevron-forward" size={12} color={colors.primary} />
                  </Text>
                </View>
              </View>
              {["PENDING", "REJECTED", "BLOCKED"].includes(item.status) ? (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => approveMutation.mutate(item.id)}
                    disabled={approveMutation.isPending && approveMutation.variables === item.id}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles.actionApproveText}>Approve</Text>
                  </TouchableOpacity>
                  {item.status === "PENDING" ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionRejectBtn]}
                      onPress={() => rejectMutation.mutate(item.id)}
                      disabled={rejectMutation.isPending && rejectMutation.variables === item.id}
                    >
                      <Ionicons name="close" size={16} color={colors.danger} />
                      <Text style={styles.actionRejectText}>Reject</Text>
                    </TouchableOpacity>
                  ) : null}
                  {item.status === "BLOCKED" ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionRejectBtn]}
                      onPress={() => unblockMutation.mutate(item.id)}
                      disabled={unblockMutation.isPending && unblockMutation.variables === item.id}
                    >
                      <Ionicons name="lock-open-outline" size={16} color={colors.danger} />
                      <Text style={styles.actionRejectText}>Unblock</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
              {item.status === "APPROVED" ? (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionRejectBtn]}
                    onPress={() => blockMutation.mutate(item.id)}
                    disabled={blockMutation.isPending && blockMutation.variables === item.id}
                  >
                    <Ionicons name="lock-closed-outline" size={16} color={colors.danger} />
                    <Text style={styles.actionRejectText}>Block</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </Card>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(2),
    marginHorizontal: spacing(4),
    marginTop: spacing(3),
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing(3),
  },
  registerText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  summary: { flexDirection: "row", gap: spacing(3), paddingHorizontal: spacing(4), marginTop: spacing(3) },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing(3),
    alignItems: "center",
  },
  summaryValue: { fontSize: 22, fontWeight: "800" },
  summaryLabel: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  list: { padding: spacing(4), paddingBottom: spacing(10) },
  card: { marginBottom: spacing(3) },
  cardBody: { flexDirection: "row", alignItems: "center", gap: spacing(3), padding: spacing(3.5) },
  schoolIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  rightCol: { alignItems: "flex-end", gap: spacing(1.5) },
  manageText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  actions: {
    flexDirection: "row",
    gap: spacing(2.5),
    padding: spacing(3),
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing(2),
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(1.5),
    paddingVertical: spacing(2.5),
    borderRadius: radius.md,
    backgroundColor: colors.success,
  },
  actionRejectBtn: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.dangerLight },
  actionApproveText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  actionRejectText: { color: colors.danger, fontWeight: "800", fontSize: 13 },
});