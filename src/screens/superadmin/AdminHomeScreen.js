import React, { useCallback } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View, RefreshControl } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import BrandHeader from "../../components/BrandHeader";
import Avatar from "../../components/Avatar";
import { fetchAllSchools } from "../../api/admin";
import { useSchoolYear } from "../../hooks/useSchoolYear";
import { useAuth } from "../../context/AuthContext";
import { colors, radius, spacing } from "../../theme";

const SCHOOL_TYPES = ["Primary", "Secondary", "College", "Other"];

const CATEGORY_ICONS = {
  Primary: "school-outline",
  Secondary: "book-outline",
  College: "business-outline",
  Other: "albums-outline",
};

const CATEGORY_COLORS = {
  Primary: colors.success,
  Secondary: colors.info,
  College: colors.primary,
  Other: colors.accent,
};

export default function AdminHomeScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const schoolYear = useSchoolYear();
  const queryClient = useQueryClient();
  const { data: schools = [], refetch, isRefetching } = useQuery({
    queryKey: ["all-schools"],
    queryFn: fetchAllSchools,
    refetchOnMount: true,
  });

  useFocusEffect(
    useCallback(() => {
      // A school is still being registered — let the optimistic entry stand.
      if (queryClient.isMutating({ mutationKey: ["create-school"] }) > 0) return;
      refetch();
    }, [refetch, queryClient])
  );

  const approved = schools.filter((s) => s.status === "APPROVED").length;
  const pending = schools.filter((s) => s.status === "PENDING").length;
  const rejected = schools.filter((s) => s.status === "REJECTED").length;

  const byType = SCHOOL_TYPES.map((type) => ({
    type,
    count: schools.filter((s) => (s.schoolType || "Other") === type).length,
  }));

  const quickActions = [
    { label: "All schools", icon: "albums-outline", color: colors.info, route: "AllSchools" },
    { label: "Pending review", icon: "time-outline", color: colors.accent, route: "AllSchools" },
    { label: "Off days", icon: "calendar-outline", color: colors.danger, route: "OffDays" },
  ];

  const categoryItems = byType;

  return (
    <Screen scroll={false}>
      <BrandHeader
        slim
        title="Admin dashboard"
        subtitle={`${schools.length} school${schools.length === 1 ? "" : "s"} registered in total.${
          schoolYear ? ` · Year ${schoolYear}` : ""
        }`}
        icon="home-outline"
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
        data={categoryItems}
        keyExtractor={(item) => item.type}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={
          <View>
            <View style={styles.summary}>
              {[
                { label: "Approved", value: approved, color: colors.success, bg: colors.successLight },
                { label: "Pending", value: pending, color: colors.accent, bg: colors.accentLight },
                { label: "Rejected", value: rejected, color: colors.danger, bg: colors.dangerLight },
              ].map((s) => (
                <View key={s.label} style={[styles.summaryItem, { backgroundColor: s.bg }]}>
                  <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.summaryLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate("SchoolYear")}>
              <Card padded={false} style={styles.yearCard}>
                <View style={styles.yearIcon}>
                  <Ionicons name="calendar" size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.yearLabel}>School year</Text>
                  <Text style={styles.yearValue}>{schoolYear || "Not set"}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
              </Card>
            </TouchableOpacity>

            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Schools by category</Text>
                <Ionicons name="stats-chart-outline" size={18} color={colors.primary} />
              </View>
            </Card>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("AllSchools")}
          >
            <Card padded={false} style={styles.categoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: CATEGORY_COLORS[item.type] }]}>
                <Ionicons name={CATEGORY_ICONS[item.type]} size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.categoryName}>{item.type}</Text>
                <Text style={styles.categorySub}>
                  {item.count} school{item.count === 1 ? "" : "s"}
                </Text>
              </View>
              <View style={styles.categoryCount}>
                <Text style={styles.categoryCountText}>{item.count}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textLight} />
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <View style={styles.quickRow}>
            {quickActions.map((q) => (
              <TouchableOpacity
                key={q.label}
                style={styles.quickCard}
                onPress={() => navigation.navigate(q.route)}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIcon, { backgroundColor: q.color }]}>
                  <Ionicons name={q.icon} size={16} color="#fff" />
                </View>
                <Text style={styles.quickText}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        }
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
  list: { padding: spacing(4), paddingBottom: spacing(10) },
  summary: { flexDirection: "row", gap: spacing(3), marginBottom: spacing(4) },
  summaryItem: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing(3),
    alignItems: "center",
  },
  summaryValue: { fontSize: 22, fontWeight: "800" },
  summaryLabel: { fontSize: 12, color: colors.textMuted, marginTop: 1, fontWeight: "600" },
  card: { marginBottom: spacing(3), padding: spacing(4) },
  yearCard: {
    marginBottom: spacing(3),
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(3),
    padding: spacing(3.5),
  },
  yearIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  yearLabel: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  yearValue: { fontSize: 16, fontWeight: "800", color: colors.text, marginTop: 1 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  categoryCard: { marginBottom: spacing(2.5), flexDirection: "row", alignItems: "center", gap: spacing(3), padding: spacing(3.5) },
  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: { fontSize: 15, fontWeight: "700", color: colors.text },
  categorySub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  categoryCount: { flexDirection: "row", alignItems: "center", gap: spacing(1) },
  categoryCountText: { fontSize: 18, fontWeight: "800", color: colors.primary },
  quickRow: { flexDirection: "row", gap: spacing(3), marginTop: spacing(2) },
  quickCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing(3.5),
    gap: spacing(2),
  },
  quickIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickText: { fontSize: 12, fontWeight: "700", color: colors.text },
});