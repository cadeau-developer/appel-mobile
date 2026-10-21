import React, { useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import LocationPicker from "../../components/LocationPicker";
import Select from "../../components/Select";
import { SCHOOL_TYPES } from "../../constants/schoolTypes";
import { deleteSchool, updateSchool } from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import { isRwPhone, PHONE_ERROR } from "../../utils/phone";
import { colors, radius, spacing, typography } from "../../theme";

const STATUSES = [
  { key: "APPROVED", label: "Approved", icon: "checkmark-circle", color: colors.success, bg: colors.successLight },
  { key: "PENDING", label: "Pending", icon: "time-outline", color: colors.accent, bg: colors.accentLight },
  { key: "REJECTED", label: "Rejected", icon: "close-circle", color: colors.danger, bg: colors.dangerLight },
];

export default function SchoolManagementScreen({ route, navigation }) {
  const { school } = route.params;
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const headmaster = school.users?.[0] || {};

  const [form, setForm] = useState({
    name: school.name || "",
    schoolType: school.schoolType || "",
    phone: school.phone || "",
    email: school.email || "",
    headmasterName: headmaster.name || "",
    headmasterPhone: headmaster.phone || "",
    headmasterEmail: headmaster.email || "",
    newPassword: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState(school.status || "PENDING");
  const [location, setLocation] = useState({
    province: school.province || null,
    district: school.district || null,
    sector: school.sector || null,
    cell: school.cell || null,
    village: school.village || null,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const confirmTimer = useRef(null);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["all-schools"] });
    queryClient.invalidateQueries({ queryKey: ["pending-schools"] });
  };

  const saveMutation = useMutation({
    mutationFn: updateSchool,
    onSuccess: () => {
      invalidate();
      showToast("School information saved", "success");
      navigation.goBack();
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not save changes", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSchool,
    onMutate: async (id) => {
      const prev = queryClient.getQueryData(["all-schools"]);
      queryClient.setQueryData(["all-schools"], (old = []) => (old || []).filter((s) => s.id !== id));
      return { prev };
    },
    onSuccess: () => {
      invalidate();
      showToast("School removed", "success");
      navigation.navigate("AllSchoolsList");
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["all-schools"], ctx.prev);
      showToast(err.response?.data?.error || "Could not remove school", "error");
    },
  });

  const onSave = () => {
    if (!form.name.trim()) {
      showToast("School name is required", "error");
      return;
    }
    const hasHeadmaster = !!school.users?.[0];
    const enteringHeadmaster = form.headmasterName.trim() || form.headmasterEmail.trim();
    if (hasHeadmaster && (!form.headmasterName.trim() || !form.headmasterEmail.trim())) {
      showToast("Headmaster name and email are required", "error");
      return;
    }
    if (form.phone.trim() && !isRwPhone(form.phone)) {
      showToast(PHONE_ERROR, "error");
      return;
    }
    if (form.headmasterPhone.trim() && !isRwPhone(form.headmasterPhone)) {
      showToast(PHONE_ERROR, "error");
      return;
    }
    if (!hasHeadmaster && enteringHeadmaster) {
      if (!/^\S+@\S+\.\S+$/.test(form.headmasterEmail.trim())) {
        showToast("Enter a valid headmaster email", "error");
        return;
      }
      if (form.newPassword.length < 6) {
        showToast("Set a headmaster password of at least 6 characters to create the account", "error");
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        showToast("Passwords do not match", "error");
        return;
      }
    }
    const payload = {
      name: form.name.trim(),
      schoolType: form.schoolType,
      phone: form.phone.trim(),
      email: form.email.trim(),
      headmasterName: hasHeadmaster || enteringHeadmaster ? form.headmasterName.trim() : undefined,
      headmasterPhone: hasHeadmaster || enteringHeadmaster ? form.headmasterPhone.trim() : undefined,
      headmasterEmail: hasHeadmaster || enteringHeadmaster ? form.headmasterEmail.trim() : undefined,
      status,
      province: location.province || null,
      district: location.district || null,
      sector: location.sector || null,
      cell: location.cell || null,
      village: location.village || null,
    };
    if (form.newPassword) {
      if (form.newPassword.length < 6) {
        showToast("Password must be at least 6 characters", "error");
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        showToast("Passwords do not match", "error");
        return;
      }
      payload.headmasterPassword = form.newPassword;
    }
    saveMutation.mutate({ id: school.id, payload });
  };

  const onDeleteTap = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      confirmTimer.current = setTimeout(() => setConfirmDelete(false), 6000);
      return;
    }
    clearTimeout(confirmTimer.current);
    deleteMutation.mutate(school.id);
  };

  return (
    <Screen scroll padded>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={typography.cardTitle}>Manage school</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>School</Text>
        <Input label="School name" icon="school-outline" value={form.name} onChangeText={set("name")} placeholder="e.g. G.S. Nyagatare" />
        <Select
          label="School type"
          icon="business-outline"
          value={form.schoolType}
          onChange={set("schoolType")}
          options={SCHOOL_TYPES}
          placeholder="Select school type"
        />
        <Input label="School phone" icon="call-outline" value={form.phone} onChangeText={(t) => set("phone")(t.replace(/[^0-9]/g, ""))} placeholder="078… / 079… / 072… / 073…" keyboardType="phone-pad" />
        <Input label="School email" icon="mail-outline" value={form.email} onChangeText={set("email")} placeholder="info@school.rw" keyboardType="email-address" autoCapitalize="none" />
        <LocationPicker
          value={location}
          onChange={setLocation}
          fields={["province", "district", "sector", "cell", "village"]}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Headmaster</Text>
        <Input label="Headmaster name" icon="person-outline" value={form.headmasterName} onChangeText={set("headmasterName")} />
        <Input label="Headmaster phone" icon="call-outline" value={form.headmasterPhone} onChangeText={(t) => set("headmasterPhone")(t.replace(/[^0-9]/g, ""))} placeholder="078… / 079… / 072… / 073…" keyboardType="phone-pad" />
        <Input label="Headmaster email" icon="mail-outline" value={form.headmasterEmail} onChangeText={set("headmasterEmail")} placeholder="headmaster@school.rw" keyboardType="email-address" autoCapitalize="none" />
        <Text style={styles.hint}>Leave the password fields blank to keep the current password.</Text>
        <Input label="New password" icon="key-outline" value={form.newPassword} onChangeText={set("newPassword")} secureTextEntry placeholder="At least 6 characters" />
        <Input label="Confirm new password" icon="lock-closed-outline" value={form.confirmPassword} onChangeText={set("confirmPassword")} secureTextEntry placeholder="Repeat the new password" />
      </Card>

      <Button
        title="Save changes"
        icon="save-outline"
        onPress={onSave}
        loading={saveMutation.isPending}
        style={styles.saveBtn}
      />

      <Card style={[styles.card, styles.dangerCard]}>
        <View style={styles.dangerRow}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={styles.dangerTitle}>Remove this school</Text>
            <Text style={styles.dangerHint}>Deletes the school, its headmaster, teachers, classes and students permanently.</Text>
          </View>
        </View>
        <Button
          title={confirmDelete ? "Tap again to confirm removal" : "Remove school"}
          icon={confirmDelete ? "warning-outline" : "trash-outline"}
          variant="danger"
          onPress={onDeleteTap}
          loading={deleteMutation.isPending}
        />
      </Card>
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
  card: { marginBottom: spacing(4) },
  sectionTitle: {
    fontWeight: "800",
    fontSize: 16,
    color: colors.primary,
    marginBottom: spacing(3),
  },
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing(3) },
  saveBtn: { marginBottom: spacing(4) },
  dangerCard: { borderColor: colors.dangerLight, backgroundColor: "rgba(255,107,107,0.08)" },
  dangerRow: { flexDirection: "row", gap: spacing(3), alignItems: "flex-start", marginBottom: spacing(3) },
  dangerTitle: { fontWeight: "700", fontSize: 15, color: colors.danger },
  dangerHint: { fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
});