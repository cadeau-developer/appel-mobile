import React, { useCallback } from "react";
import { FlatList, StyleSheet, View, RefreshControl } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import Screen from "../../components/Screen";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import Avatar from "../../components/Avatar";
import { fetchTeachers } from "../../api/teachers";
import { colors, radius, spacing, typography } from "../../theme";

export default function TeachersScreen({ navigation }) {
  const { data: teachers = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["teachers"],
    queryFn: fetchTeachers,
    refetchOnMount: true,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return (
    <Screen scroll={false}>
      <FlatList
        contentContainerStyle={styles.list}
        data={teachers}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={typography.title}>Teachers</Text>
            <Text style={typography.subtitle}>
              {teachers.length} teacher{teachers.length === 1 ? "" : "s"} in your school
            </Text>
            <Button
              title="Register a teacher"
              icon="person-add-outline"
              onPress={() => navigation.navigate("AddTeacher")}
              style={styles.addBtn}
            />
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="people-outline"
              title="No teachers yet"
              subtitle="Register your first teacher so they can be assigned to a class."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Card padded={false} style={styles.card}>
            <View style={styles.cardBody}>
              <Avatar uri={item.avatarUrl} name={item.name} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={typography.cardTitle}>{item.name}</Text>
                <Text style={styles.email} numberOfLines={1}>
                  <Ionicons name="mail-outline" size={12} color={colors.textMuted} /> {item.email}
                </Text>
                {item.phone ? (
                  <Text style={styles.email} numberOfLines={1}>
                    <Ionicons name="call-outline" size={12} color={colors.textMuted} /> {item.phone}
                  </Text>
                ) : null}
              </View>
              <View style={styles.rightCol}>
                {(item.classTeacherOf ?? []).length > 0 ? (
                  <Badge tone="success" icon="school-outline" label={(item.classTeacherOf ?? []).map((c) => c.name).join(", ")} />
                ) : (
                  <Badge tone="neutral" label="Unassigned" />
                )}
                <TouchableOpacity
                  style={styles.assignBtn}
                  onPress={() => navigation.navigate("AssignTeacher", { teacherId: item.id })}
                >
                  <Ionicons name="swap-horizontal-outline" size={13} color={colors.primary} />
                  <Text style={styles.assignText}>{(item.classTeacherOf ?? []).length > 0 ? "Manage classes" : "Assign"}</Text>
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
  email: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  rightCol: { alignItems: "flex-end", gap: spacing(1.5) },
  assignBtn: { flexDirection: "row", alignItems: "center", gap: spacing(1), marginTop: spacing(0.5) },
  assignText: { fontSize: 12, fontWeight: "700", color: colors.primary },
});