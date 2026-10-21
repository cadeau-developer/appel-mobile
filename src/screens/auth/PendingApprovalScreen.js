import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import Button from "../../components/Button";
import Card from "../../components/Card";
import BrandHeader from "../../components/BrandHeader";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { colors, radius, spacing } from "../../theme";

export default function PendingApprovalScreen() {
  const { user, refreshMe, logout } = useAuth();
  const { showToast } = useToast();
  const [checking, setChecking] = useState(false);
  const school = user?.school;

  const onCheck = async () => {
    setChecking(true);
    try {
      const me = await refreshMe();
      if (me.school?.status === "APPROVED") {
        showToast(`${school?.name} has been approved. Welcome!`, "success");
      } else {
        showToast("Your school is still awaiting approval", "info");
      }
    } catch {
      showToast("Could not check your school status. Try again.", "error");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Screen padded style={{ backgroundColor: colors.surfaceMuted }}>
      <BrandHeader
        compact
        style={{ marginHorizontal: -spacing(4), marginTop: -spacing(4) }}
      />
      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Ionicons name="hourglass-outline" size={34} color={colors.accent} />
        </View>
        <Text style={styles.title}>Awaiting approval</Text>
        <Text style={styles.tagline}>
          Your school is being reviewed by a super admin. Once approved you'll be able to add
          teachers, create classes and take attendance.
        </Text>
      </View>

      <Card>
        <View style={styles.schoolRow}>
          <View style={styles.schoolIcon}>
            <Ionicons name="school-outline" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.schoolName}>{school?.name}</Text>
            <Text style={styles.schoolMeta}>
              {school?.schoolType ? `${school.schoolType} · ` : ""}
              Registration pending
            </Text>
          </View>
        </View>
        {school?.city || school?.address ? (
          <Text style={styles.where}>
            {[school?.address, school?.city].filter(Boolean).join(", ")}
          </Text>
        ) : null}
      </Card>

      <Button
        title="Check status"
        icon="refresh-outline"
        onPress={onCheck}
        loading={checking}
        style={styles.gap}
      />
      <Button title="Log out" variant="ghost" icon="log-out-outline" onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", marginTop: spacing(6), marginBottom: spacing(5) },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing(3),
  },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  tagline: { fontSize: 14, color: colors.textMuted, textAlign: "center", marginTop: spacing(1.5), lineHeight: 20 },
  schoolRow: { flexDirection: "row", alignItems: "center", gap: spacing(3) },
  schoolIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  schoolName: { fontSize: 16, fontWeight: "700", color: colors.text },
  schoolMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  where: { color: colors.textMuted, fontSize: 13, marginTop: spacing(3) },
  gap: { marginTop: spacing(4) },
});