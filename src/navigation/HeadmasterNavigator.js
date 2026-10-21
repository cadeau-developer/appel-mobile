import React from "react";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTabBarStyle } from "./tabBarStyle";
import Text from "../components/LocalizedText";
import LanguagePicker from "../components/LanguagePicker";

import DashboardScreen from "../screens/headmaster/DashboardScreen";
import HeadmasterProfileScreen from "../screens/headmaster/HeadmasterProfileScreen";
import SchoolSettingsScreen from "../screens/headmaster/SchoolSettingsScreen";
import HeadmasterOffDaysScreen from "../screens/headmaster/HeadmasterOffDaysScreen";
import TermsScreen from "../screens/headmaster/TermsScreen";
import TeachersScreen from "../screens/headmaster/TeachersScreen";
import AddTeacherScreen from "../screens/headmaster/AddTeacherScreen";
import ClassesScreen from "../screens/headmaster/ClassesScreen";
import AddClassScreen from "../screens/headmaster/AddClassScreen";
import AssignTeacherScreen from "../screens/headmaster/AssignTeacherScreen";
import AttendanceReportScreen from "../screens/headmaster/AttendanceReportScreen";
import StudentHistoryScreen from "../screens/headmaster/StudentHistoryScreen";
import DisciplineCasesScreen from "../screens/headmaster/DisciplineCasesScreen";
import DisciplineSettingsScreen from "../screens/headmaster/DisciplineSettingsScreen";
import DisciplineMarksScreen from "../screens/headmaster/DisciplineMarksScreen";
import { colors, shadowStyle } from "../theme";

const Tab = createBottomTabNavigator();
const DashboardStack = createNativeStackNavigator();
const TeachersStack = createNativeStackNavigator();
const ClassesStack = createNativeStackNavigator();
const AttendanceStack = createNativeStackNavigator();
const DisciplineStack = createNativeStackNavigator();

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

function DashboardStackScreen() {
  return (
    <DashboardStack.Navigator screenOptions={stackOptions}>
      <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} options={{ headerShown: false }} />
      <DashboardStack.Screen name="HeadmasterProfile" component={HeadmasterProfileScreen} options={{ title: "My profile" }} />
      <DashboardStack.Screen name="SchoolSettings" component={SchoolSettingsScreen} options={{ title: "School settings" }} />
      <DashboardStack.Screen name="HeadmasterOffDays" component={HeadmasterOffDaysScreen} options={{ title: "Off days" }} />
      <DashboardStack.Screen name="Terms" component={TermsScreen} options={{ title: "Terms" }} />
    </DashboardStack.Navigator>
  );
}

function TeachersStackScreen() {
  return (
    <TeachersStack.Navigator screenOptions={stackOptions}>
      <TeachersStack.Screen name="TeachersList" component={TeachersScreen} options={{ title: "Teachers" }} />
      <TeachersStack.Screen name="AddTeacher" component={AddTeacherScreen} options={{ title: "Register teacher" }} />
      <TeachersStack.Screen name="AssignTeacher" component={AssignTeacherScreen} options={{ title: "Assign to class" }} />
    </TeachersStack.Navigator>
  );
}

function ClassesStackScreen() {
  return (
    <ClassesStack.Navigator screenOptions={stackOptions}>
      <ClassesStack.Screen name="ClassesList" component={ClassesScreen} options={{ title: "Classes" }} />
      <ClassesStack.Screen name="AddClass" component={AddClassScreen} options={{ title: "Create class" }} />
      <ClassesStack.Screen name="AssignTeacher" component={AssignTeacherScreen} options={{ title: "Assign class teacher" }} />
    </ClassesStack.Navigator>
  );
}

function AttendanceStackScreen() {
  return (
    <AttendanceStack.Navigator screenOptions={stackOptions}>
      <AttendanceStack.Screen
        name="AttendanceReportHome"
        component={AttendanceReportScreen}
        options={{ title: "Attendance report" }}
      />
      <AttendanceStack.Screen
        name="StudentHistory"
        component={StudentHistoryScreen}
        options={{ title: "Student history" }}
      />
    </AttendanceStack.Navigator>
  );
}

function DisciplineStackScreen() {
  return (
    <DisciplineStack.Navigator screenOptions={stackOptions}>
      <DisciplineStack.Screen name="DisciplineHome" component={DisciplineCasesScreen} options={{ title: "Discipline" }} />
      <DisciplineStack.Screen
        name="DisciplineMarks"
        component={DisciplineMarksScreen}
        options={{ title: "Discipline marks" }}
      />
      <DisciplineStack.Screen
        name="DisciplineSettings"
        component={DisciplineSettingsScreen}
        options={{ title: "Discipline settings" }}
      />
    </DisciplineStack.Navigator>
  );
}

const icons = {
  Dashboard: "home-outline",
  Teachers: "people-outline",
  Classes: "albums-outline",
  AttendanceReport: "calendar-outline",
  DisciplineCases: "flag-outline",
};

const tabTitles = {
  Dashboard: "Home",
  Teachers: "Teachers",
  Classes: "Classes",
  AttendanceReport: "Attendance",
  DisciplineCases: "Discipline",
};

export default function HeadmasterNavigator() {
  const tabBarStyle = useTabBarStyle();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: (() => {
          const focused = getFocusedRouteNameFromRoute(route);
          if (focused === "DashboardHome") return [styles.tabBar, tabBarStyle];
          if (focused === "TeachersList") return [styles.tabBar, tabBarStyle];
          if (focused === "ClassesList") return [styles.tabBar, tabBarStyle];
          if (focused === "AttendanceReportHome") return [styles.tabBar, tabBarStyle];
          if (focused === "DisciplineHome") return [styles.tabBar, tabBarStyle];
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
      <Tab.Screen name="Dashboard" component={DashboardStackScreen} options={{ title: "Home" }} />
      <Tab.Screen name="Teachers" component={TeachersStackScreen} options={{ title: "Teachers" }} />
      <Tab.Screen name="Classes" component={ClassesStackScreen} options={{ title: "Classes" }} />
      <Tab.Screen name="AttendanceReport" component={AttendanceStackScreen} options={{ title: "Attendance" }} />
      <Tab.Screen name="DisciplineCases" component={DisciplineStackScreen} options={{ title: "Discipline" }} />
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