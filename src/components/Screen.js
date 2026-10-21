import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme";

export default function Screen({
  children,
  scroll = true,
  padded = false,
  stickyHeader = false,
  style,
  contentStyle,
  edges = ["top", "left", "right", "bottom"],
  keyboardVerticalOffset = 0,
}) {
  const container = (
    <>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[padded && styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          stickyHeaderIndices={stickyHeader ? [0] : undefined}
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, padded && styles.content, contentStyle]}>{children}</View>
      )}
    </>
  );

  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
        enabled={Platform.OS === "ios"}
      >
        {container}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  content: { padding: spacing(4), flexGrow: 1 },
});