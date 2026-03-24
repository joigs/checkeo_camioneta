import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, AppState } from "react-native";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";

import LoginScreen from "./src/screens/LoginScreen";
import MainTabs from "./src/navigation/MainTabs";
import CheckeoFormScreen from "./src/screens/CheckeoFormScreen";
import PatenteShowScreen from "./src/screens/PatenteShowScreen";
import { initNotifications, clearAllNotifications } from "./src/notifications/setup";
import { NiceAlertHost, NiceAlertRegistrar } from "./src/components/NiceAlert";

export type RootStackParamList = {
    Login: undefined;
    Main: { screen: string } | undefined;
    CheckeoForm: { checkeoId?: number };
    PatenteShow: { patenteId: number; codigo: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
    const [bootstrapped, setBootstrapped] = useState(false);
    const [hasSession, setHasSession] = useState(false);

    useEffect(() => {
        (async () => {
            const userId = await AsyncStorage.getItem("usuario_id");
            setHasSession(!!userId);
            setBootstrapped(true);
        })();
    }, []);

    useEffect(() => {
        initNotifications();
        clearAllNotifications();
    }, []);

    useEffect(() => {
        const sub = AppState.addEventListener('change', (s) => {
            if (s === 'active') {
                clearAllNotifications();
            }
        });
        return () => sub.remove();
    }, []);

    useEffect(() => {
        const unsubOpen = messaging().onNotificationOpenedApp(async (msg) => {
            clearAllNotifications();
            if (navigationRef.isReady()) {
                navigationRef.navigate("Main", { screen: "Notificaciones" });
            }
        });

        messaging().getInitialNotification().then(async (msg) => {
            if (!msg) return;
            clearAllNotifications();
            if (navigationRef.isReady()) {
                navigationRef.navigate("Main", { screen: "Notificaciones" });
            }
        });

        return () => { unsubOpen(); };
    }, []);

    if (!bootstrapped) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator size="large" color="#0A84FF" />
            </View>
        );
    }

    return (
        <NiceAlertHost>
            <NiceAlertRegistrar />
            <NavigationContainer ref={navigationRef}>
                <Stack.Navigator
                    initialRouteName={hasSession ? "Main" : "Login"}
                    screenOptions={{
                        headerShown: true,
                        headerTitleAlign: "center",
                        headerTintColor: "#0A84FF",
                    }}
                >
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ title: "Ingreso Camioneta", headerShown: false }}
                    />
                    <Stack.Screen
                        name="Main"
                        component={MainTabs}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="CheckeoForm"
                        component={CheckeoFormScreen}
                        options={{ title: "Formulario de Chequeo" }}
                    />
                    <Stack.Screen
                        name="PatenteShow"
                        component={PatenteShowScreen}
                        options={{ title: "Detalle de Patente" }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </NiceAlertHost>
    );
}