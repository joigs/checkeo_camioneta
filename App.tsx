import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Alert, TouchableOpacity, Text, AppState } from "react-native";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";

import LoginScreen from "./src/screens/LoginScreen";
import MainTabs from "./src/navigation/MainTabs";
import CheckeoFormScreen from "./src/screens/CheckeoFormScreen";
import PatenteShowScreen from "./src/screens/PatenteShowScreen";

import { NiceAlertHost, NiceAlertRegistrar } from "./src/components/NiceAlert";

export type RootStackParamList = {
    Login: undefined;
    Main: undefined;
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
        const sub = AppState.addEventListener('change', (s) => {
            if (s === 'active') {
            }
        });
        return () => sub.remove();
    }, []);

    useEffect(() => {
        const unsubOpen = messaging().onNotificationOpenedApp(async (msg) => {
            if (navigationRef.isReady()) {
                navigationRef.navigate("Main");
            }
        });

        messaging().getInitialNotification().then(async (msg) => {
            if (!msg) return;
            if (navigationRef.isReady()) {
                navigationRef.navigate("Main");
            }
        });

        return () => { unsubOpen(); };
    }, []);

    const headerRight = () => (
        <TouchableOpacity
            onPress={async () => {
                try {
                    await AsyncStorage.multiRemove(["usuario_id", "usuario_nombre"]);
                    setHasSession(false);
                    if (navigationRef.isReady()) {
                        navigationRef.reset({ index: 0, routes: [{ name: "Login" }] });
                    }
                } catch (e: any) {
                    Alert.alert("Error", "No se pudo cerrar sesión");
                }
            }}
            style={{ paddingHorizontal: 12, paddingVertical: 6 }}
        >
            <Text style={{ color: "#0A84FF", fontWeight: "600" }}>Cerrar sesión</Text>
        </TouchableOpacity>
    );

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
                        options={{ title: "Camioneta", headerRight, headerShown: false }}
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