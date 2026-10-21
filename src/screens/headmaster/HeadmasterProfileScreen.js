import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import Screen from "../../components/Screen";
import Card from "../../components/Card";
import Avatar from "../../components/Avatar";
import Button from "../../components/Button";
import { updateMe } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { pickImageFile } from "../../utils/pickImage";
import { colors, radius, spacing, typography } from "../../theme";

export default function HeadmasterProfileScreen() {
  const { user, refreshMe } = useAuth();
  const { showToast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");

  const saveMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: async () => {
      await refreshMe();
      showToast("Profile photo updated", "success");
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not update profile photo", "error"),
  });

  const pickAvatar = () =>
    pickImageFile(
      (dataUrl) => setAvatarUrl(dataUrl),
      (err) => showToast(err, "error")
    );

  return (
    <Screen padded>
      <Card style={styles.card}>
        <View style={styles.profile}>
          <Avatar uri={avatarUrl} name={user?.name} size={104} />
          <Text style={[typography.title, styles.name]}>{user?.name}</Text>
          <Text style={typography.caption}>{user?.email}</Text>
          <TouchableOpacity onPress={pickAvatar} style={styles.photoBtn}>
            <Ionicons name="camera-outline" size={17} color={colors.primary} />
            <Text style={styles.photoBtnText}>{avatarUrl ? "Change profile photo" : "Add profile photo"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.noteText}>Your photo will appear on your school dashboard.</Text>
        </View>
        <Button
          title="Save profile photo"
          icon="save-outline"
          onPress={() => saveMutation.mutate({ avatarUrl })}
          loading={saveMutation.isPending}
          style={styles.save}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing(4) },
  profile: { alignItems: "center", paddingVertical: spacing(3) },
  name: { marginTop: spacing(3), fontSize: 23 },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    marginTop: spacing(3),
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3.5),
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
  },
  photoBtnText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing(3),
    marginTop: spacing(2),
  },
  noteText: { flex: 1, fontSize: 13, color: colors.primary, lineHeight: 19 },
  save: { marginTop: spacing(4) },
});
