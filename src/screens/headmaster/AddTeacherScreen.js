import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import Text from "../../components/LocalizedText";
import { StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Avatar from "../../components/Avatar";
import { createTeacher } from "../../api/teachers";
import { useToast } from "../../context/ToastContext";
import { pickImageFile } from "../../utils/pickImage";
import { isRwPhone, PHONE_ERROR } from "../../utils/phone";
import { colors, radius, spacing } from "../../theme";

export default function AddTeacherScreen({ navigation }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", avatarUrl: "" });

  const update = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const pickAvatar = () =>
    pickImageFile(
      (dataUrl) => update("avatarUrl")(dataUrl),
      (err) => showToast(err, "error")
    );

  const mutation = useMutation({
    mutationFn: createTeacher,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["teachers"] });
      const prev = queryClient.getQueryData(["teachers"]);
      const tempId = `temp-${Date.now()}`;
      queryClient.setQueryData(["teachers"], (old = []) => [
        { id: tempId, name: payload.name, email: payload.email, phone: payload.phone || null, avatarUrl: payload.avatarUrl || null, classTeacherOf: [] },
        ...old,
      ]);
      return { prev, tempId };
    },
    onSuccess: (teacher, _vars, ctx) => {
      if (ctx?.tempId) {
        queryClient.setQueryData(["teachers"], (old = []) =>
          (old || []).map((t) => (t.id === ctx.tempId ? teacher : t))
        );
      }
      showToast(`${form.name} added. They can log in with the credentials you set.`, "success");
      navigation.goBack();
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["teachers"], ctx.prev);
      showToast(err.response?.data?.error || "Could not add teacher. Please try again.", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const onSubmit = () => {
    if (!form.name || !form.email || !form.password) {
      showToast("Name, email and password are required", "error");
      return;
    }
    if (form.password.length < 6) {
      showToast("Use at least 6 characters for the temporary password", "error");
      return;
    }
    if (form.phone && !isRwPhone(form.phone)) {
      showToast(PHONE_ERROR, "error");
      return;
    }
    mutation.mutate(form);
  };

  return (
    <Screen padded>
      <Card>
        <Text style={styles.title}>Register a teacher</Text>
        <Text style={styles.hint}>
          The teacher uses the email and password you set here to log in. Share them securely.
        </Text>
        <View style={styles.photoBlock}>
          <Avatar uri={form.avatarUrl} name={form.name || "Teacher"} size={68} />
          <View style={styles.photoCopy}>
            <Text style={styles.photoTitle}>Teacher profile photo</Text>
            <Text style={styles.photoHint}>Help students recognize their teacher.</Text>
            <TouchableOpacity onPress={pickAvatar} style={styles.photoBtn}>
              <Ionicons name="camera-outline" size={16} color={colors.primary} />
              <Text style={styles.photoBtnText}>{form.avatarUrl ? "Change photo" : "Add photo"}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ marginTop: spacing(3) }}>
          <Input label="Full name" icon="person-outline" value={form.name} onChangeText={update("name")} />
          <Input
            label="Email (login)"
            icon="mail-outline"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={update("email")}
          />
          <Input label="Phone (optional)" icon="call-outline" keyboardType="phone-pad" value={form.phone} onChangeText={(t) => update("phone")(t.replace(/[^0-9]/g, ""))} placeholder="078… / 079… / 072… / 073…" />
          <Input
            label="Temporary password"
            icon="lock-closed-outline"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={form.password}
            onChangeText={update("password")}
          />
          <Button
            title="Register teacher"
            icon="person-add-outline"
            onPress={onSubmit}
            loading={mutation.isPending}
            style={{ marginTop: spacing(1) }}
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  hint: { fontSize: 13, color: colors.textMuted, marginTop: spacing(1), lineHeight: 18 },
  photoBlock: { flexDirection: "row", alignItems: "center", gap: spacing(3), marginTop: spacing(4) },
  photoCopy: { flex: 1 },
  photoTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  photoHint: { fontSize: 12, color: colors.textMuted, marginTop: spacing(0.5) },
  photoBtn: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: spacing(1.5), marginTop: spacing(1.5), paddingVertical: spacing(1.5), paddingHorizontal: spacing(3), borderRadius: radius.round, backgroundColor: colors.primaryLight },
  photoBtnText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
});