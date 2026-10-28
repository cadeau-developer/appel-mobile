import React from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import Text from "../components/LocalizedText";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterHeadmasterScreen from "../screens/auth/RegisterHeadmasterScreen";
import PendingApprovalScreen from "../screens/auth/PendingApprovalScreen";
import SuperAdminNavigator from "./SuperAdminNavigator";
import HeadmasterNavigator from "./HeadmasterNavigator";
import TeacherNavigator from "./TeacherNavigator";
import ErrorBoundary from "../components/ErrorBoundary";
import ApiConnectionError from "../components/ApiConnectionError";
import Button from "../components/Button";
import Screen from "../components/Screen";
import { colors, spacing } from "../theme";

const Stack = createNativeStackNavigator();
const logoAsset = require("../../assets/logo.png");

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RegisterHeadmaster" component={RegisterHeadmasterScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading, sessionError, retrySession, logout } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <Image source={logoAsset} style={styles.splashLogo} resizeMode="contain" />
        <Text style={styles.splashTitle}>Appel</Text>
        <Text style={styles.splashSubtitle}>Cahier d'appel</Text>
        <ActivityIndicator size="small" color="#FFFFFF" style={styles.splashSpinner} />
      </View>
    );
  }

  if (!user && sessionError) {
    return (
      <Screen padded contentStyle={{ justifyContent: "center" }}>
        <ApiConnectionError
          error={sessionError}
          onRetry={retrySession}
          title="Couldn't reconnect to your account"
        />
        <Button
          title="Sign in with another account"
          variant="ghost"
          onPress={logout}
          style={{ marginTop: spacing(2) }}
        />
      </Screen>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>{renderForUser(user)}</NavigationContainer>
    </ErrorBoundary>
  );
}

function renderForUser(user) {
  if (!user) return <AuthStack />;

  if (user.role === "SUPER_ADMIN") return <SuperAdminNavigator />;

  const schoolApproved = user.school?.status === "APPROVED";
  if (!schoolApproved) return <PendingApprovalScreen />;

  if (user.role === "HEADMASTER") return <HeadmasterNavigator />;
  return <TeacherNavigator />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  splashLogo: { width: 96, height: 96, marginBottom: spacing(3) },
  splashTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "800", letterSpacing: 0.3 },
  splashSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14, marginTop: spacing(0.5) },
  splashSpinner: { marginTop: spacing(5) },
});
