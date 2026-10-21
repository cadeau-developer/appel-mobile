import React from "react";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTabBarStyle } from "./tabBarStyle";
import Text from "../components/LocalizedText";
import AdminHomeScreen from "../screens/superadmin/AdminHomeScreen";
import AllSchoolsScreen from "../screens/superadmin/AllSchoolsScreen";
import SchoolManagementScreen from "../screens/superadmin/SchoolManagementScreen";
import RegisterSchoolScreen from "../screens/superadmin/RegisterSchoolScreen";
import ProfileScreen from "../screens/superadmin/ProfileScreen";
import OffDaysScreen from "../screens/superadmin/OffDaysScreen";
import SchoolYearScreen from "../screens/superadmin/SchoolYearScreen";
import LanguagePicker from "../components/LanguagePicker";
import { colors, shadowStyle } from "../theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const stackOptions = {
  headerStyle: {
    backgroundColor: colors.primaryDark,
    borderBottomWidth: 0,
    ...shadowStyle({ color: "#0F172A", offsetY: 2, radius: 6, opacity: 0.1, elevation: 4 }),
  },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "700", color: "#fff" },
  headerBackTitle: "Back",
  headerTitle: ({ children }) => <Text style={{ color: "#fff" }}>{children}</Text>,
  headerRight: () => <LanguagePicker />,
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SchoolYear" component={SchoolYearScreen} options={{ title: "School year" }} />
    </Stack.Navigator>
  );
}

function SchoolsStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="AllSchoolsList" component={AllSchoolsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SchoolManage" component={SchoolManagementScreen} options={{ title: "Manage school" }} />
      <Stack.Screen name="RegisterSchool" component={RegisterSchoolScreen} options={{ title: "Register school" }} />
    </Stack.Navigator>
  );
}

const icons = {
  Home: "home-outline",
  AllSchools: "albums-outline",
  OffDays: "calendar-outline",
  Profile: "person-circle-outline",
};

const iconFocused = {
  Home: "home",
  AllSchools: "albums",
  OffDays: "calendar",
  Profile: "person-circle",
};

const tabTitles = {
  Home: "Home",
  AllSchools: "Schools",
  OffDays: "Off days",
  Profile: "Profile",
};

export default function SuperAdminNavigator() {
  const tabBarStyle = useTabBarStyle();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: (() => {
          const focused = getFocusedRouteNameFromRoute(route);
          if (focused === "AdminHome") return [styles.tabBar, tabBarStyle];
          if (focused === "AllSchoolsList") return [styles.tabBar, tabBarStyle];
          return focused ? styles.hiddenTabBar : [styles.tabBar, tabBarStyle];
        })(),
        tabBarLabel: () => <Text style={styles.label}>{tabTitles[route.name]}</Text>,
        tabBarActiveTintColor: colors.onPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarActiveBackgroundColor: colors.primary,
        tabBarInactiveBackgroundColor: "transparent",
        tabBarItemStyle: styles.tabBarItem,
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={focused ? iconFocused[route.name] : icons[route.name]} size={size} color={color} />
        ),
        tabBarLabelStyle: styles.label,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ title: "Home" }} />
      <Tab.Screen name="AllSchools" component={SchoolsStack} options={{ title: "Schools" }} />
      <Tab.Screen name="OffDays" component={OffDaysScreen} options={{ title: "Off days" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  hiddenTabBar: { display: "none" },
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: 6,
    ...shadowStyle({ color: "#0F172A", offsetY: -3, radius: 10, opacity: 0.08, elevation: 10 }),
  },
  tabBarItem: {
    marginHorizontal: 4,
    marginVertical: 4,
    borderRadius: 18,
    overflow: "hidden",
  },
  label: { fontWeight: "700", fontSize: 11, marginTop: 3 },
});