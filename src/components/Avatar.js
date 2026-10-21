import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

function initialsOf(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export default function Avatar({ uri, name, size = 40, style }) {
  if (uri) {
    return <Image source={{ uri }} style={[{ width: size, height: size, borderRadius: size / 2 }, style]} />;
  }
  return (
    <View
      style={[
        styles.initials,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  initials: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: "#fff", fontWeight: "700" },
});