import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Card from "../../components/Card";
import BrandHeader from "../../components/BrandHeader";
import Avatar from "../../components/Avatar";
import { updateMe } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { pickImageFile } from "../../utils/pickImage";
import { isRwPhone, PHONE_ERROR } from "../../utils/phone";
import { colors, radius, spacing, typography } from "../../theme";

export default function TeacherProfileScreen({ navigation }) {
  const { user, logout, refreshMe } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    avatarUrl: user?.avatarUrl || "",
    newPassword: "",
    confirmPassword: "",
  });

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: async () => {
      await refreshMe();
      showToast("Profile updated", "success");
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not update profile", "error"),
  });

  const onSave = () => {
    if (!form.name.trim()) {
      showToast("Name is required", "error");
      return;
    }
    if (form.phone.trim() && !isRwPhone(form.phone)) {
      showToast(PHONE_ERROR, "error");
      return;
    }
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      avatarUrl: form.avatarUrl,
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
      payload.password = form.newPassword;
      setForm((f) => ({ ...f, newPassword: "", confirmPassword: "" }));
    }
    saveMutation.mutate(payload);
  };

  const pickAvatar = () =>
    pickImageFile(
      (dataUrl) => set("avatarUrl")(dataUrl),
      (err) => showToast(err, "error")
    );

  return (
    <Screen scroll padded stickyHeader>
      <BrandHeader
        showAppBrand={false}
        compact
        icon="person-circle-outline"
        style={{ marginHorizontal: -spacing(4), marginTop: -spacing(4) }}
      />

      <View style={styles.profileBlock}>
        <Avatar uri={form.avatarUrl} name={form.name || user?.name} size={84} />
        <Text style={[typography.title, styles.name]}>{form.name || user?.name}</Text>
        <Text style={typography.caption}>{user?.email}</Text>
        <TouchableOpacity onPress={pickAvatar} style={styles.avatarBtn}>
          <Ionicons name="camera-outline" size={16} color={colors.primary} />
          <Text style={styles.avatarBtnText}>{form.avatarUrl ? "Change picture" : "Set picture"}</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Personal information</Text>
        <Input label="Full name" icon="person-outline" value={form.name} onChangeText={set("name")} placeholder="Your name" />
        <Input label="Phone (optional)" icon="call-outline" value={form.phone} onChangeText={(t) => set("phone")(t.replace(/[^0-9]/g, ""))} placeholder="078… / 079… / 072… / 073…" keyboardType="phone-pad" />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Change password</Text>
        <Text style={styles.hint}>Leave these fields empty to keep your current password.</Text>
        <Input label="New password" icon="key-outline" value={form.newPassword} onChangeText={set("newPassword")} secureTextEntry placeholder="At least 6 characters" />
        <Input label="Confirm new password" icon="lock-closed-outline" value={form.confirmPassword} onChangeText={set("confirmPassword")} secureTextEntry placeholder="Repeat the new password" />
      </Card>

      <Button title="Save profile" icon="save-outline" onPress={onSave} loading={saveMutation.isPending} style={styles.saveBtn} />

      <Button title="Log out" icon="log-out-outline" variant="danger" onPress={logout} style={styles.logoutBtn} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileBlock: { alignItems: "center", marginBottom: spacing(4) },
  name: { marginTop: spacing(3), fontSize: 24 },
  avatarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    marginTop: spacing(2.5),
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3.5),
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
  },
  avatarBtnText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  card: { marginBottom: spacing(4) },
  sectionTitle: { fontWeight: "800", fontSize: 16, color: colors.primary, marginBottom: spacing(3) },
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing(3) },
  saveBtn: { marginBottom: spacing(3) },
  logoutBtn: { marginBottom: spacing(6) },
});