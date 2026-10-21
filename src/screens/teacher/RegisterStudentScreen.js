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
import { addStudent } from "../../api/students";
import { useToast } from "../../context/ToastContext";
import { pickImageFile } from "../../utils/pickImage";
import { isRwPhone, PHONE_ERROR } from "../../utils/phone";
import { colors, radius, spacing } from "../../theme";

const GENDERS = ["Male", "Female"];

export default function RegisterStudentScreen({ route, navigation }) {
  const { classId } = route.params;
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [admissionNo, setAdmissionNo] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [gender, setGender] = useState(null);
  const [birthDate, setBirthDate] = useState("");
  const [location, setLocation] = useState({});
  const [fatherName, setFatherName] = useState("");
  const [fatherPhone, setFatherPhone] = useState("");
  const [motherName, setMotherName] = useState("");
  const [motherPhone, setMotherPhone] = useState("");

  const mutation = useMutation({
    mutationFn: (payload) => addStudent(classId, payload),
    onSuccess: (student) => {
      queryClient.setQueryData(["class-students", classId], (old = []) => [student, ...(old || [])]);
      queryClient.setQueryData(["my-class"], (old = []) =>
        (old || []).map((c) =>
          c.id === classId ? { ...c, students: [student, ...(c.students || [])] } : c
        )
      );
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      showToast("Student added", "success");
      navigation.goBack();
    },
    onError: (err) => showToast(err.response?.data?.error || "Could not register student. Please try again.", "error"),
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
      name,
      admissionNo: admissionNo || undefined,
      photoUrl: photoUrl || undefined,
      gender,
      birthDate: birthDate || undefined,
      province: location.province || undefined,
      district: location.district || undefined,
      sector: location.sector || undefined,
      cell: location.cell || undefined,
      village: location.village || undefined,
      fatherName: fatherName.trim() || undefined,
      fatherPhone: fatherPhone.trim() || undefined,
      motherName: motherName.trim() || undefined,
      motherPhone: motherPhone.trim() || undefined,
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
        <Text style={styles.title}>Register a student</Text>
        <Text style={styles.hint}>Add a student to your class so they can be marked on the register.</Text>
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
            label="Admission number (optional)"
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
            label="Birth date (optional)"
            value={birthDate}
            onChange={setBirthDate}
            placeholder="Pick birth date"
            maximumDate={new Date()}
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

          <LocationPicker
            value={location}
            onChange={setLocation}
            fields={["province", "district", "sector", "cell", "village"]}
          />

          <Button
            title="Register student"
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