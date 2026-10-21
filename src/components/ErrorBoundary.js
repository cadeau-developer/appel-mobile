import React from "react";
import { View, TouchableOpacity, StyleSheet, Text as NativeText } from "react-native";
import LocalizedText from "./LocalizedText";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../theme";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // `bare` is used for the outermost boundary, which sits above the language
      // provider, so it must render plain React Native text.
      const Text = this.props.bare ? NativeText : LocalizedText;
      return (
        <View style={styles.container}>
          <View style={styles.iconCircle}>
            <Ionicons name="warning-outline" size={36} color={colors.danger} />
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            {this.state.error?.message || "An unexpected error occurred."}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Ionicons name="refresh-outline" size={18} color="#fff" />
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing(6),
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing(4),
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: spacing(2), textAlign: "center" },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: "center", marginBottom: spacing(5), lineHeight: 20 },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    backgroundColor: colors.primary,
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(3),
    borderRadius: 999,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
