import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Avatar from "../../components/Avatar";
import LocationPicker from "../../components/LocationPicker";
import { updateSchool } from "../../api/schools";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { pickImageFile } from "../../utils/pickImage";
import { isRwPhone, PHONE_ERROR } from "../../utils/phone";
import { colors, radius, spacing, typography } from "../../theme";

export default function SchoolSettingsScreen({ navigation }) {
  const { user, refreshMe } = useAuth();
  const { showToast } = useToast();
  const school = user?.school;

  const [form, setForm] = useState({
    name: school?.name || "",
    schoolType: school?.schoolType || "",
    phone: school?.phone || "",
    email: school?.email || "",
    logoUrl: school?.logoUrl || "",
  });
  const [location, setLocation] = useState({
    province: school?.province || null,
    district: school?.district || null,
    sector: school?.sector || null,
    cell: school?.cell || null,
    village: school?.village || null,
  });

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: updateSchool,
    onSuccess: async () => {
      await refreshMe();
      showToast("School updated", "success");
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not update school", "error"),
  });

  const onSave = () => {
    if (!form.name.trim()) {
      showToast("School name is required", "error");
      return;
    }
    if (form.phone.trim() && !isRwPhone(form.phone)) {
      showToast(PHONE_ERROR, "error");
      return;
    }
    saveMutation.mutate({
      name: form.name.trim(),
      schoolType: form.schoolType.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      logoUrl: form.logoUrl,
      province: location.province || null,
      district: location.district || null,
      sector: location.sector || null,
      cell: location.cell || null,
      village: location.village || null,
    });
  };

  const pickLogo = () =>
    pickImageFile(
      (dataUrl) => set("logoUrl")(dataUrl),
      (err) => showToast(err, "error")
    );

  return (
    <Screen scroll padded>
      <View style={styles.profileBlock}>
        <Avatar uri={form.logoUrl} name={form.name || school?.name} size={84} />
        <Text style={[typography.title, styles.name]}>{form.name || school?.name}</Text>
        <Text style={typography.caption}>School profile</Text>
        <TouchableOpacity onPress={pickLogo} style={styles.logoBtn}>
          <Ionicons name="camera-outline" size={16} color={colors.primary} />
          <Text style={styles.logoBtnText}>{form.logoUrl ? "Change logo" : "Set logo"}</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>School information</Text>
        <Text style={styles.hint}>
          The logo appears on the headmaster dashboard so the app feels like yours.
        </Text>
        <Input label="School name" icon="school-outline" value={form.name} onChangeText={set("name")} placeholder="e.g. G.S. Kigali" />
        <Input label="School type (optional)" icon="business-outline" value={form.schoolType} onChangeText={set("schoolType")} placeholder="e.g. Primary, Secondary" />
        <LocationPicker
          value={location}
          onChange={setLocation}
          fields={["province", "district", "sector", "cell", "village"]}
        />
        <Input label="Phone (optional)" icon="call-outline" value={form.phone} onChangeText={(t) => set("phone")(t.replace(/[^0-9]/g, ""))} placeholder="078… / 079… / 072… / 073…" keyboardType="phone-pad" />
        <Input label="Email (optional)" icon="mail-outline" value={form.email} onChangeText={set("email")} placeholder="school@example.com" keyboardType="email-address" autoCapitalize="none" />
      </Card>

      <Button title="Save school" icon="save-outline" onPress={onSave} loading={saveMutation.isPending} style={styles.saveBtn} />

      <Card style={styles.card}>
        <View style={styles.offRow}>
          <Ionicons name="today-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.offTitle}>Off days</Text>
            <Text style={styles.offHint}>Mark days when your school is closed (past or upcoming).</Text>
          </View>
        </View>
        <Button
          title="Manage off days"
          icon="calendar-outline"
          variant="secondary"
          size="sm"
          onPress={() => navigation.navigate("HeadmasterOffDays")}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileBlock: { alignItems: "center", marginBottom: spacing(4) },
  name: { marginTop: spacing(3), fontSize: 24, textAlign: "center" },
  logoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    marginTop: spacing(2.5),
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3.5),
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
  },
  logoBtnText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  card: { marginBottom: spacing(4) },
  sectionTitle: { fontWeight: "800", fontSize: 16, color: colors.primary, marginBottom: spacing(2) },
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing(3) },
  saveBtn: { marginBottom: spacing(4) },
  offRow: { flexDirection: "row", gap: spacing(3), alignItems: "flex-start", marginBottom: spacing(3) },
  offTitle: { fontWeight: "700", fontSize: 15, color: colors.text },
  offHint: { fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
});