import React, { useMemo, useState } from "react";
import {
    View, Text, TextInput, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { onlyDigits, formatWithDots, computeDv, buildRutNormalized } from "../utils/rut";
import { niceAlert } from "../components/NiceAlert";
import PillButton from "../components/PillButton";
import { postJson } from "../api/http";

type RootStackParamList = { Login: undefined; Main: undefined };
type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
    const [digits, setDigits] = useState("");
    const [loading, setLoading] = useState(false);

    const masked = useMemo(() => formatWithDots(digits), [digits]);
    const dv = useMemo(() => (digits.length >= 7 ? computeDv(digits) : ""), [digits]);

    const onChangeDigits = (txt: string) => {
        const next = onlyDigits(txt);
        if (next.length > 8) return;
        setDigits(next);
    };

    const ready = digits.length >= 7;

    const onLogin = async () => {
        try {
            setLoading(true);
            const rutNorm = buildRutNormalized(digits);
            if (!rutNorm.includes("-")) throw new Error("RUT incompleto");

            const resp = await postJson<any>("login", { rut: rutNorm });
            if (resp.success) {
                await AsyncStorage.setItem("usuario_id", String(resp.usuario.id));
                await AsyncStorage.setItem("usuario_nombre", resp.usuario.nombre);
                navigation.reset({ index: 0, routes: [{ name: "Main" as never }] });
            } else {
                niceAlert("Error", "Usuario no encontrado");
            }
        } catch (e: any) {
            niceAlert("Error", "RUT inválido o problema de conexión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    padding: 24,
                    paddingTop: 80,
                    justifyContent: "flex-start",
                    gap: 16,
                }}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={{ fontSize: 28, fontWeight: "700", textAlign: "center", color: "#111", marginBottom: 20 }}>
                    Camioneta
                </Text>

                <Text style={{ fontWeight: "600", color: "#111", marginTop: 6 }}>RUT</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TextInput
                        value={masked}
                        onChangeText={onChangeDigits}
                        autoCapitalize="none"
                        autoCorrect={false}
                        inputMode="numeric"
                        keyboardType="number-pad"
                        returnKeyType="done"
                        onSubmitEditing={() => ready && onLogin()}
                        maxLength={10}
                        style={{
                            flex: 1,
                            borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 10,
                            fontSize: 18, marginRight: 8, color: "#111",
                            backgroundColor: "white",
                        }}
                    />
                    <Text style={{ fontSize: 18, marginRight: 8, color: "#666" }}>-</Text>
                    <TextInput
                        editable={false}
                        value={dv}
                        style={{
                            width: 48,
                            borderWidth: 1,
                            borderColor: "#ddd",
                            backgroundColor: "#f1f1f1",
                            color: "#333",
                            textAlign: "center",
                            paddingVertical: 12,
                            borderRadius: 10,
                            fontSize: 18,
                        }}
                    />
                </View>

                <View style={{ marginTop: 24 }}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#0A84FF" />
                    ) : (
                        <PillButton title="Ingresar" onPress={onLogin} disabled={!ready} />
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}