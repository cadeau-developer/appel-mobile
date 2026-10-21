import React, { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import Text from "../../components/LocalizedText";
import Screen from "../../components/Screen";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Card from "../../components/Card";
import BrandHeader from "../../components/BrandHeader";
import LocationPicker from "../../components/LocationPicker";
import Select from "../../components/Select";
import { SCHOOL_TYPES } from "../../constants/schoolTypes";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { isRwPhone, PHONE_ERROR } from "../../utils/phone";
import { colors, radius, spacing } from "../../theme";
import logoAsset from "../../../assets/logo.png";

export default function RegisterHeadmasterScreen({ navigation }) {
  const { registerHeadmaster } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    schoolName: "",
    schoolType: "",
    schoolPhone: "",
    schoolEmail: "",
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [location, setLocation] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async () => {
    const { schoolName, name, email, password, schoolPhone, phone } = form;
    if (!schoolName || !name || !email || !password) {
      showToast("School name, your name, email and password are required", "error");
      return;
    }
    if ((schoolPhone && !isRwPhone(schoolPhone)) || (phone && !isRwPhone(phone))) {
      showToast(PHONE_ERROR, "error");
      return;
    }
    setLoading(true);
    try {
      await registerHeadmaster({
        ...form,
        schoolEmail: form.schoolEmail || undefined,
        province: location.province || undefined,
        district: location.district || undefined,
        sector: location.sector || undefined,
        cell: location.cell || undefined,
        village: location.village || undefined,
      });
    } catch (err) {
      showToast(err.response?.data?.error || "Registration failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={{ backgroundColor: colors.background }}>
      <BrandHeader
        compact
        style={{ marginHorizontal: -spacing(4) }}
      />
      <View style={styles.sectionTop}>
        <Image source={logoAsset} style={styles.heroLogo} resizeMode="contain" />
        <Text style={styles.title}>Register your school</Text>
        <Text style={styles.tagline}>
          A super admin reviews and approves new schools. Fill in your school's details so it's
          ready to go as soon as it's approved.
        </Text>
      </View>

      <Card>
        <SectionTitle icon="school-outline" label="School information" />
        <Input label="School name *" icon="business-outline" value={form.schoolName} onChangeText={update("schoolName")} />

        <Select
          label="School type"
          icon="business-outline"
          value={form.schoolType}
          onChange={update("schoolType")}
          options={SCHOOL_TYPES}
          placeholder="Select school type"
        />

        <LocationPicker
          value={location}
          onChange={setLocation}
          fields={["province", "district", "sector", "cell", "village"]}
        />
        <Input label="School phone" icon="call-outline" keyboardType="phone-pad" value={form.schoolPhone} onChangeText={(t) => update("schoolPhone")(t.replace(/[^0-9]/g, ""))} placeholder="078… / 079… / 072… / 073…" />
        <Input
          label="School email"
          icon="mail-outline"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.schoolEmail}
          onChangeText={update("schoolEmail")}
        />
      </Card>

      <Card style={styles.cardGap}>
        <SectionTitle icon="person-circle-outline" label="Headmaster account" />
        <Input label="Your full name *" icon="person-outline" value={form.name} onChangeText={update("name")} />
        <Input label="Phone" icon="call-outline" keyboardType="phone-pad" value={form.phone} onChangeText={(t) => update("phone")(t.replace(/[^0-9]/g, ""))} placeholder="078… / 079… / 072… / 073…" />
        <Input
          label="Email (login) *"
          icon="mail-outline"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={update("email")}
        />
        <Input
          label="Password *"
          icon="lock-closed-outline"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={form.password}
          onChangeText={update("password")}
        />
        <Button title="Register school" icon="checkmark-circle-outline" onPress={onSubmit} loading={loading} />
      </Card>

      <Button title="Back to login" variant="ghost" icon="arrow-back-outline" onPress={() => navigation.goBack()} />
    </Screen>
  );
}

function SectionTitle({ icon, label }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionIcon}>
        <Text style={styles.sectionIconText}>›</Text>
      </View>
      <Text style={styles.sectionTitleLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTop: { marginTop: spacing(5), marginBottom: spacing(4), alignItems: "center" },
  heroLogo: { width: 72, height: 72, borderRadius: radius.xl, marginBottom: spacing(2) },
  title: { fontSize: 26, fontWeight: "800", color: colors.text, textAlign: "center" },
  tagline: { fontSize: 14, color: colors.textMuted, marginTop: spacing(1.5), lineHeight: 20 },
  cardGap: { marginTop: spacing(4) },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing(2), marginBottom: spacing(3) },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionIconText: { color: colors.primary, fontWeight: "900", fontSize: 15 },
  sectionTitleLabel: { fontSize: 15, fontWeight: "800", color: colors.text },
});