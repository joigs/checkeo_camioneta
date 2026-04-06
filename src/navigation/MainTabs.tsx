import React from "react";
import { TouchableOpacity, Alert, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClipboardCheck, ListChecks, Car, Bell } from "lucide-react-native";

import MisCheckeosScreen from "../screens/MisCheckeosScreen";
import TodosCheckeosScreen from "../screens/TodosCheckeosScreen";
import PatentesScreen from "../screens/PatentesScreen";
import NotificacionesScreen from "../screens/NotificacionesScreen";
import { niceAlert } from "../components/NiceAlert";

export type MainTabParamList = {
    MisCheckeos: undefined;
    TodosCheckeos: undefined;
    Patentes: undefined;
    Notificaciones: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
    const nav = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const handleLogout = () => {
        niceAlert(
            "Cerrar Sesión",
            "¿Estás seguro de que deseas cerrar sesión?",
            "Cerrar Sesión",
            async () => {
                try {
                    await AsyncStorage.multiRemove(["usuario_id", "usuario_nombre"]);
                    nav.reset({ index: 0, routes: [{ name: "Login" }] });
                } catch (e) {
                    Alert.alert("Error", "No se pudo cerrar sesión");
                }
            },
            "Cancelar"
        );
    };

    const headerRight = () => (
        <TouchableOpacity onPress={handleLogout} style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
            <Text style={{ color: "#0A84FF", fontWeight: "600", fontSize: 16 }}>
                Cerrar sesión
            </Text>
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
                tabBarLabelStyle: { fontSize: 12, marginBottom: 4 },
                tabBarStyle: {
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom || 8,
                },
                tabBarIcon: ({ color, size }) => {
                    if (route.name === "MisCheckeos") {
                        return <ClipboardCheck size={size} color={color} strokeWidth={1.8} />;
                    }
                    if (route.name === "TodosCheckeos") {
                        return <ListChecks size={size} color={color} strokeWidth={1.8} />;
                    }
                    if (route.name === "Patentes") {
                        return <Car size={size} color={color} strokeWidth={1.8} />;
                    }
                    if (route.name === "Notificaciones") {
                        return <Bell size={size} color={color} strokeWidth={1.8} />;
                    }
                    return null;
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
                component={NotificacionesScreen}
                options={{ title: "Notificaciones", headerTitle: "Notificaciones" }}
            />
        </Tab.Navigator>
    );
}