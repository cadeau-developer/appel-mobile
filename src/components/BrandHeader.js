import React from "react";
import { Image, StyleSheet, View } from "react-native";
import Text from "./LocalizedText";
import LanguagePicker from "./LanguagePicker";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, shadowStyle, spacing } from "../theme";
import logoAsset from "../../assets/logo.png";

// Branded hero header used at the top of dashboards and auth screens.
// `slim` produces a shorter version for home/dashboard pages.
export default function BrandHeader({
  title,
  subtitle,
  logoUri,
  right,
  compact = false,
  slim = false,
  showAppBrand = true,
  style,
}) {
  return (
    <LinearGradient
      colors={[colors.primaryDark, colors.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.hero,
        compact && styles.heroCompact,
        slim && styles.heroSlim,
        style,
      ]}
    >
      <View style={styles.glowLarge} />
      <View style={styles.glowSmall} />
      {showAppBrand ? (
        <View style={styles.brandRow}>
          <View style={styles.brandLogoWrap}>
            <Image source={logoAsset} style={styles.brandLogo} resizeMode="contain" />
          </View>
          <Text style={[styles.brand, compact && styles.brandCompact, slim && styles.brandSlim]}>
            Attendance
          </Text>
        </View>
      ) : null}
      <View style={styles.row}>
        {logoUri ? (
          <View style={styles.logoWrap}>
            <Image source={{ uri: logoUri }} style={styles.logo} resizeMode="cover" />
          </View>
        ) : null}
        <Text style={[styles.title, compact && styles.titleCompact, slim && styles.titleSlim]} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        <View style={styles.right}>
          <LanguagePicker light compact />
          {right}
        </View>
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, compact && styles.subtitleCompact, slim && styles.subtitleSlim]}>
          {subtitle}
        </Text>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    overflow: "hidden",
    position: "relative",
    paddingHorizontal: spacing(4),
    paddingTop: spacing(4),
    paddingBottom: spacing(5),
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroCompact: {
    paddingTop: spacing(2),
    paddingBottom: spacing(2),
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
  heroSlim: {
    paddingTop: spacing(2.5),
    paddingBottom: spacing(3.5),
  },
  glowLarge: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    right: -70,
    top: -115,
    backgroundColor: "rgba(255,255,255,0.08)",
    pointerEvents: "none",
  },
  glowSmall: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    right: 60,
    bottom: -60,
    backgroundColor: "rgba(255,255,255,0.06)",
    pointerEvents: "none",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing(1.5), marginBottom: spacing(1.5) },
  brandLogoWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    ...shadowStyle({ color: "#000", offsetY: 2, radius: 4, opacity: 0.15, elevation: 2 }),
  },
  brandLogo: {
    width: 21,
    height: 21,
    borderRadius: 11,
  },
  brand: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  brandCompact: { fontSize: 10 },
  brandSlim: { fontSize: 11 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing(2) },
  logoWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing(1.5),
    overflow: "hidden",
  },
  logo: { width: 28, height: 28, borderRadius: radius.sm },
  right: { flexDirection: "row", gap: spacing(2), flexShrink: 0 },
  title: { color: "#fff", fontSize: 20, fontWeight: "800", flex: 1 },
  titleCompact: { fontSize: 18 },
  titleSlim: { fontSize: 18 },
  subtitle: { color: "rgba(255,255,255,0.85)", fontSize: 12.5, marginTop: spacing(1), lineHeight: 17 },
  subtitleCompact: {
    fontSize: 11.5,
    marginTop: spacing(0.5),
    lineHeight: 15,
  },
  subtitleSlim: {
    fontSize: 11.5,
    marginTop: spacing(0.5),
    lineHeight: 15,
  },
});