import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LANGUAGES, useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { colors, radius, spacing } from "../theme";

export default function LanguagePicker({ light = false, compact = false }) {
  const { language, ready, setLanguage, translate } = useLanguage();
  const { showToast } = useToast();
  const [visible, setVisible] = useState(false);

  const chooseLanguage = async (code) => {
    try {
      await setLanguage(code);
      setVisible(false);
    } catch (error) {
      showToast(error.message || "Could not save language preference", "error");
    }
  };

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={translate("Choose language")}
        onPress={() => setVisible(true)}
        disabled={!ready}
        style={[styles.trigger, light && styles.triggerLight]}
      >
        <Text style={[styles.code, light && styles.codeLight]}>{language.toUpperCase()}</Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.title}>{translate("Choose language")}</Text>
            {LANGUAGES.map((item) => (
              <TouchableOpacity
                key={item.code}
                style={styles.option}
                onPress={() => chooseLanguage(item.code)}
              >
                <Text style={styles.optionLabel}>{item.label}</Text>
                {language === item.code ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancel} onPress={() => setVisible(false)}>
              <Text style={styles.cancelLabel}>{translate("Cancel")}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minWidth: 46,
    height: 38,
    paddingHorizontal: spacing(2),
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing(1),
  },
  triggerLight: { backgroundColor: "rgba(255,255,255,0.16)" },
  code: { color: colors.primary, fontSize: 11, fontWeight: "800" },
  codeLight: { color: "#fff" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing(5),
  },
  dialog: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing(4),
  },
  title: { color: colors.text, fontSize: 18, fontWeight: "800", marginBottom: spacing(2) },
  option: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionLabel: { color: colors.text, fontSize: 15, fontWeight: "600" },
  cancel: { alignSelf: "flex-end", paddingTop: spacing(3), paddingHorizontal: spacing(2) },
  cancelLabel: { color: colors.primary, fontWeight: "700" },
});
