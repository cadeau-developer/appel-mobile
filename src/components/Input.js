import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import Text from "./LocalizedText";
import { useLanguage } from "../context/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadowStyle, spacing } from "../theme";

export default function Input({
  label,
  icon,
  style,
  inputStyle,
  error,
  secureTextEntry,
  right,
  placeholder,
  ...props
}) {
  const { translate } = useLanguage();
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const [focused, setFocused] = useState(false);
  const eyeShown = !!secureTextEntry;
  const { onFocus, onBlur } = props;

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.box, focused && styles.boxFocused, error && styles.boxError]}>
        {icon ? <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.icon} /> : null}
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={colors.textLight}
          secureTextEntry={eyeShown ? hidden : undefined}
          {...props}
          placeholder={placeholder ? translate(placeholder) : placeholder}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {eyeShown ? (
          <TouchableOpacity onPress={() => setHidden((h) => !h)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ) : right ? (
          right
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing(3.5) },
  label: { marginBottom: spacing(1.5), fontWeight: "600", color: colors.text, fontSize: 14 },
  box: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: 54,
    paddingHorizontal: spacing(3.5),
    backgroundColor: colors.surface,
  },
  boxFocused: { borderColor: colors.primary, backgroundColor: colors.surfaceMuted, ...shadowStyle({ color: colors.primary, radius: 8, opacity: 0.08, elevation: 1 }) },
  boxError: { borderColor: colors.danger },
  icon: { marginRight: spacing(2.5) },
  input: { flex: 1, paddingVertical: spacing(3), fontSize: 15, color: colors.text },
  errorText: { color: colors.danger, fontSize: 12, marginTop: spacing(1) },
});