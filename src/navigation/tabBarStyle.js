import { useSafeAreaInsets } from "react-native-safe-area-context";

// Bottom clearance for a bottom tab bar. Edge-to-edge is disabled (see app.json),
// so the system already keeps the app window clear of the navigation bar and the
// safe-area inset is the correct, non-overlapping bottom clearance.
const TAB_BAR_CONTENT_HEIGHT = 74;
const TAB_BAR_BOTTOM_GAP = 6;

export function useTabBarStyle() {
  const insets = useSafeAreaInsets();

  return {
    height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
    paddingBottom: TAB_BAR_BOTTOM_GAP + insets.bottom,
  };
}
