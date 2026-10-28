import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, RefreshControl, TouchableOpacity } from "react-native";
import Screen from "../../components/Screen";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import BrandHeader from "../../components/BrandHeader";
import EmptyState from "../../components/EmptyState";
import Avatar from "../../components/Avatar";
import { approveSchool, fetchPendingSchools, rejectSchool } from "../../api/admin";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { colors, radius, spacing, typography } from "../../theme";

export default function PendingSchoolsScreen() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { data: schools = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["pending-schools"],
    queryFn: fetchPendingSchools,
    refetchOnMount: true,
    staleTime: 0,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["pending-schools"] });
    queryClient.invalidateQueries({ queryKey: ["all-schools"] });
  };

  const approveMutation = useMutation({
    mutationFn: approveSchool,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["pending-schools"] });
      const prevPending = queryClient.getQueryData(["pending-schools"]);
      const prevAll = queryClient.getQueryData(["all-schools"]);
      queryClient.setQueryData(["pending-schools"], (old = []) => old.filter((s) => s.id !== id));
      queryClient.setQueryData(["all-schools"], (old = []) =>
        (old || []).map((s) => (s.id === id ? { ...s, status: "APPROVED" } : s))
      );
      return { prevPending, prevAll };
    },
    onSuccess: () => {
      showToast("School approved", "success");
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prevPending) queryClient.setQueryData(["pending-schools"], ctx.prevPending);
      if (ctx?.prevAll) queryClient.setQueryData(["all-schools"], ctx.prevAll);
      showToast(err.response?.data?.error || "Could not approve school", "error");
    },
    onSettled: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: rejectSchool,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["pending-schools"] });
      const prevPending = queryClient.getQueryData(["pending-schools"]);
      const prevAll = queryClient.getQueryData(["all-schools"]);
      queryClient.setQueryData(["pending-schools"], (old = []) => old.filter((s) => s.id !== id));
      queryClient.setQueryData(["all-schools"], (old = []) =>
        (old || []).map((s) => (s.id === id ? { ...s, status: "REJECTED" } : s))
      );
      return { prevPending, prevAll };
    },
    onSuccess: () => {
      showToast("School rejected", "info");
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prevPending) queryClient.setQueryData(["pending-schools"], ctx.prevPending);
      if (ctx?.prevAll) queryClient.setQueryData(["all-schools"], ctx.prevAll);
      showToast(err.response?.data?.error || "Could not reject school", "error");
    },
    onSettled: invalidate,
  });

  return (
    <Screen scroll={false}>
      <BrandHeader
        title="Pending schools"
        subtitle={`${schools.length} school${schools.length === 1 ? "" : "s"} waiting for review.`}
        icon="time-outline"
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
      <FlatList
        contentContainerStyle={styles.list}
        data={schools}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="checkmark-done-outline"
              title="All caught up"
              subtitle="No schools are waiting for approval right now."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Card padded={false} style={styles.schoolCard}>
            <View style={styles.cardHeader}>
              <View style={styles.schoolIcon}>
                <Ionicons name="school-outline" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.cardTitle}>{item.name}</Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.schoolType || "School"}
                </Text>
              </View>
              <Badge tone="warning" icon="time-outline" label="Pending" />
            </View>

            {item.address || item.city ? (
              <Text style={styles.detailRow}>
                <Ionicons name="location-outline" size={14} color={colors.textMuted} />{" "}
                {[item.address, item.city].filter(Boolean).join(", ")}
              </Text>
            ) : null}
            {item.phone || item.email ? (
              <Text style={styles.detailRow}>
                <Ionicons name="call-outline" size={14} color={colors.textMuted} /> {item.phone || "—"}
                {"   "}
                <Ionicons name="mail-outline" size={14} color={colors.textMuted} /> {item.email || "—"}
              </Text>
            ) : null}
            {item.users?.[0]?.name || item.headmasterName ? (
              <View style={styles.headmasterRow}>
                <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                <Text style={styles.detailRowText}>
                  {item.users?.[0]?.name || item.headmasterName}
                  {item.users?.[0]?.email || item.users?.[0]?.phone
                    ? ` · ${item.users[0].email || item.users[0].phone}`
                    : item.headmasterPhone
                    ? ` · ${item.headmasterPhone}`
                    : ""}
                </Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Approve"
                  icon="checkmark"
                  size="sm"
                  onPress={() => approveMutation.mutate(item.id)}
                  loading={approveMutation.isPending && approveMutation.variables === item.id}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Reject"
                  icon="close"
                  size="sm"
                  variant="secondary"
                  onPress={() => rejectMutation.mutate(item.id)}
                  loading={rejectMutation.isPending && rejectMutation.variables === item.id}
                />
              </View>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing(4), paddingTop: spacing(4), paddingBottom: spacing(10) },
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
  schoolCard: { marginBottom: spacing(4), overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing(3), padding: spacing(4) },
  schoolIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    fontSize: 13,
    color: colors.textMuted,
    paddingHorizontal: spacing(4),
    paddingBottom: spacing(1),
  },
  detailRowText: { fontSize: 13, color: colors.textMuted, flex: 1, marginLeft: spacing(1.5) },
  headmasterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing(4),
    paddingTop: spacing(1),
  },
  actions: {
    flexDirection: "row",
    gap: spacing(3),
    padding: spacing(4),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing(2),
  },
});