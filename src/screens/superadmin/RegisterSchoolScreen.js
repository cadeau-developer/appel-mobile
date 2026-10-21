import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Avatar from "../../components/Avatar";
import LocationPicker from "../../components/LocationPicker";
import { registerSchool } from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import { pickImageFile } from "../../utils/pickImage";
import { isRwPhone, PHONE_ERROR } from "../../utils/phone";
import { colors, radius, spacing, typography } from "../../theme";

const SCHOOL_TYPES = [
  "Nursery",
  "Nursery & Primary",
  "Nursery & Primary & Secondary",
  "Nursery & Primary & Secondary & TSS",
  "Primary",
  "Primary & Secondary",
  "Primary & Secondary & TSS",
  "Secondary",
  "TSS",
];

export default function RegisterSchoolScreen({ navigation }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    schoolType: "Primary",
    phone: "",
    email: "",
    logoUrl: "",
  });
  const [location, setLocation] = useState({});

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["all-schools"] });
    queryClient.invalidateQueries({ queryKey: ["pending-schools"] });
  };

  const saveMutation = useMutation({
    mutationFn: registerSchool,
    onSuccess: () => {
      invalidate();
      showToast("School registered", "success");
      navigation.goBack();
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not register the school", "error"),
  });

  const onSave = () => {
    const trimmed = (v) => (v || "").trim();
    if (!trimmed(form.name)) {
      showToast("School name is required", "error");
      return;
    }
    if (!trimmed(form.phone)) {
      showToast("School phone is required", "error");
      return;
    }
    if (!isRwPhone(form.phone)) {
      showToast(PHONE_ERROR, "error");
      return;
    }
    if (!trimmed(form.headmasterName)) {
      showToast("Headmaster full name is required", "error");
      return;
    }
    if (!trimmed(form.headmasterEmail)) {
      showToast("Headmaster email is required", "error");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmed(form.headmasterEmail))) {
      showToast("Enter a valid headmaster email", "error");
      return;
    }
    if (!trimmed(form.headmasterPassword)) {
      showToast("Headmaster password is required", "error");
      return;
    }
    if (form.headmasterPassword.length < 6) {
      showToast("Headmaster password must be at least 6 characters", "error");
      return;
    }
    if (trimmed(form.email) && !/^\S+@\S+\.\S+$/.test(trimmed(form.email))) {
      showToast("Enter a valid school email", "error");
      return;
    }
    saveMutation.mutate({
      name: trimmed(form.name),
      schoolType: form.schoolType,
      phone: trimmed(form.phone),
      email: trimmed(form.email) || null,
      logoUrl: form.logoUrl || undefined,
      province: location.province || null,
      district: location.district || null,
      sector: location.sector || null,
      cell: location.cell || null,
      village: location.village || null,
      headmasterName: trimmed(form.headmasterName),
      headmasterEmail: trimmed(form.headmasterEmail).toLowerCase(),
      headmasterPassword: form.headmasterPassword,
      headmasterPhone: trimmed(form.headmasterPhone) || undefined,
    });
  };

  const pickLogo = () =>
    pickImageFile(
      (dataUrl) => set("logoUrl")(dataUrl),
      (err) => showToast(err, "error")
    );

  return (
    <Screen scroll padded>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={typography.cardTitle}>Register a school</Text>
      </View>

      <View style={styles.logoBlock}>
        <Avatar uri={form.logoUrl} name={form.name || "School"} size={84} />
        <Text style={[typography.title, styles.logoName]}>{form.name || "New school"}</Text>
        <TouchableOpacity onPress={pickLogo} style={styles.logoBtn}>
          <Ionicons name="camera-outline" size={16} color={colors.primary} />
          <Text style={styles.logoBtnText}>{form.logoUrl ? "Change logo" : "Add a logo (optional)"}</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>School</Text>
        <Input label="School name *" icon="school-outline" value={form.name} onChangeText={set("name")} placeholder="e.g. G.S. Nyagatare" />
        <Text style={styles.fieldLabel}>School type</Text>
        <View style={styles.chips}>
          {SCHOOL_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => set("schoolType")(t)}
              style={[styles.chip, form.schoolType === t && styles.chipActive]}
            >
              <Text style={[styles.chipText, form.schoolType === t && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <LocationPicker
          value={location}
          onChange={setLocation}
          fields={["province", "district", "sector", "cell", "village"]}
        />
        <Input label="School phone *" icon="call-outline" value={form.phone} onChangeText={(t) => set("phone")(t.replace(/[^0-9]/g, ""))} placeholder="078… / 079… / 072… / 073…" keyboardType="phone-pad" />
        <Input label="School email (optional)" icon="mail-outline" value={form.email} onChangeText={set("email")} placeholder="info@school.rw" keyboardType="email-address" autoCapitalize="none" />
        <Input label="Headmaster full name *" icon="person-circle-outline" value={form.headmasterName} onChangeText={set("headmasterName")} placeholder="e.g. Mukamana Jeanne" />
        <Input label="Headmaster email *" icon="mail-outline" value={form.headmasterEmail} onChangeText={set("headmasterEmail")} placeholder="head@school.rw" keyboardType="email-address" autoCapitalize="none" />
        <Input label="Headmaster phone (optional)" icon="call-outline" value={form.headmasterPhone} onChangeText={(t) => set("headmasterPhone")(t.replace(/[^0-9]/g, ""))} placeholder="078… / 079… / 072… / 073…" keyboardType="phone-pad" />
        <Input label="Headmaster password *" icon="lock-closed-outline" value={form.headmasterPassword} onChangeText={set("headmasterPassword")} placeholder="At least 6 characters" secureTextEntry autoCapitalize="none" />
      </Card>

      <Button title="Register school" icon="school-outline" onPress={onSave} loading={saveMutation.isPending} style={styles.saveBtn} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2.5),
    marginBottom: spacing(4),
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBlock: { alignItems: "center", marginBottom: spacing(4) },
  logoName: { marginTop: spacing(3), fontSize: 22, textAlign: "center" },
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
  sectionTitle: { fontWeight: "800", fontSize: 16, color: colors.primary, marginBottom: spacing(3) },
  fieldLabel: { fontWeight: "600", fontSize: 14, color: colors.text, marginBottom: spacing(1.5) },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing(2), marginBottom: spacing(3.5) },
  chip: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3.5),
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  chipTextActive: { color: colors.primary },
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing(3) },
  saveBtn: { marginBottom: spacing(6) },
});