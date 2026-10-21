import React, { useState } from "react";
import { Image, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import Text from "../../components/LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import Input from "../../components/Input";
import Button from "../../components/Button";
import BrandHeader from "../../components/BrandHeader";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { API_BASE_URL } from "../../api/client";
import { colors, radius, shadow, spacing } from "../../theme";
import logoAsset from "../../../assets/logo.png";
import Constants from "expo-constants";

let edgeToEdgeState = "n/a";
try {
  const { isEdgeToEdge } = require("react-native-is-edge-to-edge");
  edgeToEdgeState = isEdgeToEdge() ? "on" : "off";
} catch (error) {
  edgeToEdgeState = "n/a";
}

export function loginErrorMessage(err) {
  const status = err?.response?.status;
  const serverMsg = err?.response?.data?.error;
  if (status === 401) return "Invalid email or password. Please check and try again.";
  if (status === 400) return serverMsg || "Please fill in your email and password.";
  if (!err?.response) {
    return `Cannot reach the server at ${API_BASE_URL}. Check that the backend is running and your device can reach this address.`;
  }
  return serverMsg || "Login failed. Please try again.";
}

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const demoEmail = process.env.EXPO_PUBLIC_DEMO_EMAIL;
  const demoPassword = process.env.EXPO_PUBLIC_DEMO_PASSWORD;

  const onLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(email.trim(), password);
    } catch (err) {
      const message = loginErrorMessage(err);
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padded style={{ backgroundColor: colors.background }}>
      <BrandHeader compact style={{ marginHorizontal: -spacing(4), marginTop: -spacing(4) }} />
      <View style={styles.heroCopy}>
        <Image source={logoAsset} style={styles.heroLogo} resizeMode="contain" />
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.tagline}>
          Sign in to take attendance, run your classes and keep every school day in order.
        </Text>
      </View>

      <View style={styles.card}>
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <Input
          label="Email"
          icon="mail-outline"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholder="you@school.app"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (error) setError("");
          }}
        />
        <Input
          label="Password"
          icon="lock-closed-outline"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Your password"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (error) setError("");
          }}
          onSubmitEditing={onLogin}
        />
        <Button title="Log in" icon="log-in-outline" onPress={onLogin} loading={loading} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>New school? Register it as a headmaster.</Text>
        <TouchableOpacity onPress={() => navigation.navigate("RegisterHeadmaster")}>
          <Text style={styles.link}>Create your school account →</Text>
        </TouchableOpacity>
      </View>

      {demoEmail && demoPassword ? (
        <View style={styles.demoBox}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.demoText}>
            {`Demo login — email: ${demoEmail} · password: ${demoPassword}`}
          </Text>
        </View>
      ) : null}

      {Platform.OS === "android" ? (
        <Text style={styles.buildLine}>
          {`build ${Constants.expoConfig?.android?.versionCode ?? "?"} · Android API ${Platform.Version} · edge-to-edge ${edgeToEdgeState}`}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCopy: { marginTop: spacing(6), marginBottom: spacing(5), alignItems: "center" },
  heroLogo: { width: 80, height: 80, borderRadius: radius.xl, marginBottom: spacing(3) },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, textAlign: "center" },
  tagline: { fontSize: 14, color: colors.textMuted, marginTop: spacing(1.5), lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(5),
    ...shadow.card,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    backgroundColor: colors.dangerLight,
    borderRadius: radius.sm,
    padding: spacing(3),
    marginBottom: spacing(3.5),
  },
  errorText: { flex: 1, fontSize: 13, color: colors.danger, fontWeight: "600", lineHeight: 18 },
  footer: { marginTop: spacing(6), alignItems: "center" },
  footerText: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.primary, fontWeight: "700", fontSize: 14, marginTop: spacing(1) },
  demoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing(3),
    marginTop: spacing(5),
  },
  demoText: { flex: 1, fontSize: 12, color: colors.primary, fontWeight: "600" },
  buildLine: { marginTop: spacing(4), fontSize: 10, color: colors.textLight, textAlign: "center" },
});