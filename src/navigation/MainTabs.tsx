import React from "react";
import { Platform, TouchableOpacity, Text, Alert } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

import MisCheckeosScreen from "../screens/MisCheckeosScreen";
import TodosCheckeosScreen from "../screens/TodosCheckeosScreen";
import PatentesScreen from "../screens/PatentesScreen";
import NotificacionesPlaceholder from "../screens/NotificacionesPlaceholder";

export type MainTabParamList = {
    MisCheckeos: undefined;
    TodosCheckeos: undefined;
    Patentes: undefined;
    Notificaciones: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
    const nav = useNavigation<any>();

    const handleLogout = async () => {
        try {
            await AsyncStorage.multiRemove(["usuario_id", "usuario_nombre"]);
            nav.reset({ index: 0, routes: [{ name: "Login" }] });
        } catch (e) {
            Alert.alert("Error", "No se pudo cerrar sesión");
        }
    };

    const headerRight = () => (
        <TouchableOpacity onPress={handleLogout} style={{ paddingHorizontal: 16 }}>
            <Ionicons name="log-out-outline" size={24} color="#0A84FF" />
        </TouchableOpacity>
    );

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: true,
                headerTitleAlign: "center",
                headerRight: headerRight,
                tabBarActiveTintColor: "#0A84FF",
                tabBarInactiveTintColor: "#8e8e93",
                tabBarLabelStyle: { fontSize: 12, marginBottom: Platform.OS === "android" ? 4 : 0 },
                tabBarStyle: { height: Platform.OS === "android" ? 60 : 85, paddingBottom: Platform.OS === "android" ? 8 : 25 },
                tabBarIcon: ({ color, size }) => {
                    let iconName = "ellipse-outline";

                    if (route.name === "MisCheckeos") iconName = "checkmark-circle-outline";
                    else if (route.name === "TodosCheckeos") iconName = "list-outline";
                    else if (route.name === "Patentes") iconName = "car-outline";
                    else if (route.name === "Notificaciones") iconName = "notifications-outline";

                    return <Ionicons name={iconName as any} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="MisCheckeos"
                component={MisCheckeosScreen}
                options={{ title: "Mis Chequeos", headerTitle: "Mis Chequeos" }}
            />
            <Tab.Screen
                name="TodosCheckeos"
                component={TodosCheckeosScreen}
                options={{ title: "Todos", headerTitle: "Todos los Chequeos" }}
            />
            <Tab.Screen
                name="Patentes"
                component={PatentesScreen}
                options={{ title: "Patentes", headerTitle: "Registro de Patentes" }}
            />
            <Tab.Screen
                name="Notificaciones"
                component={NotificacionesPlaceholder}
                options={{ title: "Notificaciones", headerTitle: "Notificaciones" }}
            />
        </Tab.Navigator>
    );
}