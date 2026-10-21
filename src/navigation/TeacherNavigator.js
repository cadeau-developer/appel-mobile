import React from "react";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTabBarStyle } from "./tabBarStyle";
import Text from "../components/LocalizedText";
import LanguagePicker from "../components/LanguagePicker";

import TeacherHomeScreen from "../screens/teacher/TeacherHomeScreen";
import StudentsScreen from "../screens/teacher/StudentsScreen";
import TakeAttendanceScreen from "../screens/teacher/TakeAttendanceScreen";
import RegisterStudentScreen from "../screens/teacher/RegisterStudentScreen";
import EditStudentScreen from "../screens/teacher/EditStudentScreen";
import TodayAttendanceScreen from "../screens/teacher/TodayAttendanceScreen";
import SubmitDisciplineScreen from "../screens/teacher/SubmitDisciplineScreen";
import TeacherProfileScreen from "../screens/teacher/TeacherProfileScreen";
import { colors, shadowStyle } from "../theme";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const StudentsStack = createNativeStackNavigator();
const AttendanceStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

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

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={stackOptions}>
      <HomeStack.Screen name="TeacherHome" component={TeacherHomeScreen} options={{ title: "Home", headerShown: false }} />
      <HomeStack.Screen name="TakeAttendance" component={TakeAttendanceScreen} options={{ title: "Take attendance" }} />
      <HomeStack.Screen name="RegisterStudent" component={RegisterStudentScreen} options={{ title: "Register student" }} />
      <HomeStack.Screen name="EditStudent" component={EditStudentScreen} options={{ title: "Edit student" }} />
      <HomeStack.Screen name="SubmitDiscipline" component={SubmitDisciplineScreen} options={{ title: "Discipline case" }} />
    </HomeStack.Navigator>
  );
}

function StudentsStackScreen() {
  return (
    <StudentsStack.Navigator screenOptions={stackOptions}>
      <StudentsStack.Screen name="StudentsList" component={StudentsScreen} options={{ title: "Students", headerShown: false }} />
      <StudentsStack.Screen name="RegisterStudent" component={RegisterStudentScreen} options={{ title: "Register student" }} />
      <StudentsStack.Screen name="EditStudent" component={EditStudentScreen} options={{ title: "Edit student" }} />
    </StudentsStack.Navigator>
  );
}

function AttendanceStackScreen() {
  return (
    <AttendanceStack.Navigator screenOptions={stackOptions}>
      <AttendanceStack.Screen
        name="TodayAttendance"
        component={TodayAttendanceScreen}
        options={{ title: "Today's attendance", headerShown: false }}
      />
      <AttendanceStack.Screen
        name="TakeAttendance"
        component={TakeAttendanceScreen}
        options={{ title: "Take attendance" }}
      />
    </AttendanceStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={stackOptions}>
      <ProfileStack.Screen
        name="TeacherProfile"
        component={TeacherProfileScreen}
        options={{ title: "My profile", headerShown: false }}
      />
    </ProfileStack.Navigator>
  );
}

const icons = {
  HomeTab: "home-outline",
  StudentsTab: "people-outline",
  AttendanceTab: "checkmark-done-outline",
  ProfileTab: "person-outline",
};

const tabTitles = {
  HomeTab: "Home",
  StudentsTab: "Students",
  AttendanceTab: "Attendance",
  ProfileTab: "Profile",
};

export default function TeacherNavigator() {
  const tabBarStyle = useTabBarStyle();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: (() => {
          const focused = getFocusedRouteNameFromRoute(route);
          if (focused === "TeacherHome") return [styles.tabBar, tabBarStyle];
          if (focused === "StudentsList") return [styles.tabBar, tabBarStyle];
          if (focused === "TodayAttendance") return [styles.tabBar, tabBarStyle];
          if (focused === "TeacherProfile") return [styles.tabBar, tabBarStyle];
          return focused ? styles.hiddenTabBar : [styles.tabBar, tabBarStyle];
        })(),
        tabBarLabel: () => <Text style={styles.label}>{tabTitles[route.name]}</Text>,
        tabBarActiveTintColor: colors.onPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarActiveBackgroundColor: colors.primary,
        tabBarInactiveBackgroundColor: "transparent",
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.label,
        tabBarIconStyle: styles.iconStyle,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name]} size={22} color={color} />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackScreen} options={{ title: "Home" }} />
      <Tab.Screen name="StudentsTab" component={StudentsStackScreen} options={{ title: "Students" }} />
      <Tab.Screen name="AttendanceTab" component={AttendanceStackScreen} options={{ title: "Attendance" }} />
      <Tab.Screen name="ProfileTab" component={ProfileStackScreen} options={{ title: "Profile" }} />
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
  iconStyle: { marginBottom: -2 },
});
