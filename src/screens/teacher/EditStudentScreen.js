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
import DatePickerField from "../../components/DatePickerField";
import { updateStudent } from "../../api/students";
import { useToast } from "../../context/ToastContext";
import { pickImageFile } from "../../utils/pickImage";
import { isRwPhone, PHONE_ERROR } from "../../utils/phone";
import { colors, radius, spacing } from "../../theme";

const GENDERS = ["Male", "Female"];

export default function EditStudentScreen({ route, navigation }) {
  const { classId, student } = route.params;
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [name, setName] = useState(student.name || "");
  const [admissionNo, setAdmissionNo] = useState(student.admissionNo || "");
  const [photoUrl, setPhotoUrl] = useState(student.photoUrl || "");
  const [gender, setGender] = useState(student.gender || null);
  const [birthDate, setBirthDate] = useState(student.birthDate ? student.birthDate.split("T")[0] : "");
  const [fatherName, setFatherName] = useState(student.fatherName || "");
  const [fatherPhone, setFatherPhone] = useState(student.fatherPhone || "");
  const [motherName, setMotherName] = useState(student.motherName || "");
  const [motherPhone, setMotherPhone] = useState(student.motherPhone || "");
  const [location, setLocation] = useState({
    province: student.province || null,
    district: student.district || null,
    sector: student.sector || null,
    cell: student.cell || null,
    village: student.village || null,
  });

  const mutation = useMutation({
    mutationFn: (payload) => updateStudent(classId, student.id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["class-students", classId], (old = []) =>
        (old || []).map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
      );
      queryClient.setQueryData(["my-class"], (old = []) =>
        (old || []).map((c) =>
          c.id === classId
            ? { ...c, students: (c.students || []).map((s) => (s.id === updated.id ? { ...s, ...updated } : s)) }
            : c
        )
      );
      queryClient.setQueryData(["teacher-dashboard"], (old) =>
        old
          ? {
              ...old,
              students: (old.students || []).map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
            }
          : old
      );
      showToast("Student updated", "success");
      navigation.goBack();
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not update student.", "error"),
  });

  const onSubmit = () => {
    if (!name.trim()) {
      showToast("Please enter the student's name", "error");
      return;
    }
    if (!gender) {
      showToast("Please select the student's gender", "error");
      return;
    }
    for (const phone of [fatherPhone, motherPhone]) {
      if (phone.trim() && !isRwPhone(phone)) {
        showToast(PHONE_ERROR, "error");
        return;
      }
    }
    mutation.mutate({
      name: name.trim(),
      admissionNo: admissionNo.trim() || null,
      photoUrl: photoUrl || null,
      gender: gender || null,
      birthDate: birthDate || null,
      province: location.province || null,
      district: location.district || null,
      sector: location.sector || null,
      cell: location.cell || null,
      village: location.village || null,
      fatherName: fatherName.trim() || null,
      fatherPhone: fatherPhone.trim() || null,
      motherName: motherName.trim() || null,
      motherPhone: motherPhone.trim() || null,
    });
  };

  const pickPhoto = (source) =>
    pickImageFile(
      (dataUrl) => setPhotoUrl(dataUrl),
      (err) => showToast(err, "error"),
      source
    );

  return (
    <Screen padded>
      <Card style={styles.card}>
        <Text style={styles.title}>Edit student</Text>
        <Text style={styles.hint}>Update the student's details below.</Text>

        <View style={styles.photoBlock}>
          <Avatar uri={photoUrl} name={(name || "?").charAt(0)} size={72} />
          <View style={styles.photoActions}>
            <TouchableOpacity onPress={() => pickPhoto("camera")} style={styles.photoBtn}>
              <Ionicons name="camera-outline" size={16} color={colors.primary} />
              <Text style={styles.photoBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => pickPhoto("library")} style={styles.photoBtn}>
              <Ionicons name="images-outline" size={16} color={colors.primary} />
              <Text style={styles.photoBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginTop: spacing(2) }}>
          <Input label="Full name (required)" icon="person-outline" value={name} onChangeText={setName} placeholder="Student's full name" />
          <Input
            label="Admission number"
            icon="card-outline"
            value={admissionNo}
            onChangeText={setAdmissionNo}
            placeholder="e.g. 2026-0145"
          />

          <Text style={styles.fieldLabel}>Gender (required)</Text>
          <View style={styles.genderRow}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderBtn, gender === g && (g === "Male" ? styles.genderBtnActiveMale : styles.genderBtnActiveFemale)]}
                onPress={() => setGender(gender === g ? null : g)}
              >
                <Ionicons
                  name={g === "Male" ? "male-outline" : "female-outline"}
                  size={16}
                  color={gender === g ? "#fff" : colors.text}
                />
                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <DatePickerField
            label="Birth date"
            value={birthDate}
            onChange={setBirthDate}
            placeholder="Pick birth date"
            maximumDate={new Date()}
          />

          <LocationPicker
            value={location}
            onChange={setLocation}
            fields={["province", "district", "sector", "cell", "village"]}
          />

          <Text style={styles.fieldLabel}>Father (optional)</Text>
          <Input
            label="Father's name"
            icon="man-outline"
            value={fatherName}
            onChangeText={setFatherName}
            placeholder="e.g. Ndayisaba Jean"
          />
          <Input
            label="Father's phone (optional)"
            icon="call-outline"
            value={fatherPhone}
            onChangeText={(t) => setFatherPhone(t.replace(/[^0-9]/g, ""))}
            placeholder="078… / 079… / 072… / 073…"
            keyboardType="phone-pad"
          />

          <Text style={styles.fieldLabel}>Mother (optional)</Text>
          <Input
            label="Mother's name"
            icon="woman-outline"
            value={motherName}
            onChangeText={setMotherName}
            placeholder="e.g. Mukamana Alice"
          />
          <Input
            label="Mother's phone (optional)"
            icon="call-outline"
            value={motherPhone}
            onChangeText={(t) => setMotherPhone(t.replace(/[^0-9]/g, ""))}
            placeholder="078… / 079… / 072… / 073…"
            keyboardType="phone-pad"
          />

          <Button
            title="Save changes"
            icon="checkmark-done-outline"
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
  card: { padding: spacing(4) },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  hint: { fontSize: 13, color: colors.textMuted, marginTop: spacing(1), lineHeight: 18 },
  photoBlock: { flexDirection: "row", alignItems: "center", gap: spacing(3), marginTop: spacing(4) },
  photoActions: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing(2) },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3.5),
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
  },
  photoBtnText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  fieldLabel: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: spacing(2), marginTop: spacing(2) },
  genderRow: { flexDirection: "row", gap: spacing(3), marginBottom: spacing(3) },
  genderBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(1.5),
    paddingVertical: spacing(2.5),
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  genderBtnActiveMale: { backgroundColor: colors.info, borderColor: colors.info },
  genderBtnActiveFemale: { backgroundColor: colors.success, borderColor: colors.success },
  genderText: { fontSize: 14, fontWeight: "700", color: colors.text },
  genderTextActive: { color: "#fff" },
});
