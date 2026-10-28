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
import Select from "../../components/Select";
import { SCHOOL_TYPES } from "../../constants/schoolTypes";
import { registerSchool } from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import { pickImageFile } from "../../utils/pickImage";
import { isRwPhone, PHONE_ERROR } from "../../utils/phone";
import { colors, radius, spacing, typography } from "../../theme";

export default function RegisterSchoolScreen({ navigation }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    schoolType: "",
    phone: "",
    email: "",
    logoUrl: "",
    headmasterName: "",
    headmasterPhone: "",
    headmasterPassword: "",
    confirmPassword: "",
  });
  const [location, setLocation] = useState({});

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: registerSchool,
    mutationKey: ["create-school"],
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["all-schools"] });
      await queryClient.cancelQueries({ queryKey: ["pending-schools"] });
      const prevAll = queryClient.getQueryData(["all-schools"]);
      const prevPending = queryClient.getQueryData(["pending-schools"]);
      const temp = {
        id: `temp-school-${Date.now()}`,
        name: payload.name,
        schoolType: payload.schoolType,
        phone: payload.phone,
        email: payload.email || null,
        logoUrl: payload.logoUrl || null,
        headmasterName: payload.headmasterName || null,
        headmasterPhone: payload.headmasterPhone || null,
        status: "PENDING",
      };
      queryClient.setQueryData(["pending-schools"], (old = []) => [temp, ...(old || [])]);
      queryClient.setQueryData(["all-schools"], (old = []) => [temp, ...(old || [])]);
      return { prevAll, prevPending, tempId: temp.id };
    },
    onSuccess: (result, _vars, ctx) => {
      const school = result?.school;
      if (ctx?.tempId && school) {
        queryClient.setQueryData(["pending-schools"], (old = []) =>
          (old || []).map((s) => (s.id === ctx.tempId ? school : s))
        );
        queryClient.setQueryData(["all-schools"], (old = []) =>
          (old || []).map((s) => (s.id === ctx.tempId ? school : s))
        );
      }
      showToast("School registered", "success");
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prevPending !== undefined) queryClient.setQueryData(["pending-schools"], ctx.prevPending);
      if (ctx?.prevAll !== undefined) queryClient.setQueryData(["all-schools"], ctx.prevAll);
      showToast(err.response?.data?.error || "Could not register the school", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["all-schools"] });
      queryClient.invalidateQueries({ queryKey: ["pending-schools"] });
    },
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
    if (!trimmed(form.email)) {
      showToast("School email is required because the headmaster signs in with it", "error");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmed(form.email))) {
      showToast("Enter a valid school email", "error");
      return;
    }
    if (!trimmed(form.headmasterName)) {
      showToast("Headmaster full name is required", "error");
      return;
    }
    if (trimmed(form.headmasterPhone) && !isRwPhone(trimmed(form.headmasterPhone))) {
      showToast(PHONE_ERROR, "error");
      return;
    }
    if (form.headmasterPassword.length < 6) {
      showToast("Headmaster password must be at least 6 characters", "error");
      return;
    }
    if (form.headmasterPassword !== form.confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    saveMutation.mutate({
      name: trimmed(form.name),
      schoolType: form.schoolType,
      phone: trimmed(form.phone),
      email: trimmed(form.email),
      logoUrl: form.logoUrl || undefined,
      province: location.province || null,
      district: location.district || null,
      sector: location.sector || null,
      cell: location.cell || null,
      village: location.village || null,
      headmasterName: trimmed(form.headmasterName),
      headmasterPhone: trimmed(form.headmasterPhone) || null,
      headmasterPassword: form.headmasterPassword,
      status: "PENDING",
    });
    navigation.goBack();
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
        <Select
          label="School type"
          icon="business-outline"
          value={form.schoolType}
          onChange={set("schoolType")}
          options={SCHOOL_TYPES}
          placeholder="Select school type"
        />
        <LocationPicker
          value={location}
          onChange={setLocation}
          fields={["province", "district", "sector", "cell", "village"]}
        />
        <Input label="School phone *" icon="call-outline" value={form.phone} onChangeText={(t) => set("phone")(t.replace(/[^0-9]/g, ""))} placeholder="078… / 079… / 072… / 073…" keyboardType="phone-pad" />
        <Input label="School email (used for login) *" icon="mail-outline" value={form.email} onChangeText={set("email")} placeholder="info@school.rw" keyboardType="email-address" autoCapitalize="none" />
        <Input label="Headmaster full name *" icon="person-circle-outline" value={form.headmasterName} onChangeText={set("headmasterName")} placeholder="e.g. Mukamana Jeanne" />
        <Input label="Headmaster phone (optional)" icon="call-outline" value={form.headmasterPhone} onChangeText={(t) => set("headmasterPhone")(t.replace(/[^0-9]/g, ""))} placeholder="078. / 079. / 072. / 073." keyboardType="phone-pad" />
        <Input label="Headmaster password *" icon="lock-closed-outline" value={form.headmasterPassword} onChangeText={set("headmasterPassword")} secureTextEntry autoCapitalize="none" placeholder="At least 6 characters" />
        <Input label="Confirm headmaster password *" icon="lock-closed-outline" value={form.confirmPassword} onChangeText={set("confirmPassword")} secureTextEntry autoCapitalize="none" placeholder="Repeat the password" />
        <Text style={styles.hint}>The headmaster signs in with the school email and this password.</Text>
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
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing(3) },
  saveBtn: { marginBottom: spacing(6) },
});