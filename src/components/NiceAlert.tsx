import React, { createContext, useCallback, useContext, useState } from "react";
import { Modal, View, Text } from "react-native";
import PillButton from "./PillButton";

type ShowFn = (title: string, message: string, okText?: string, onOk?: () => void) => void;

type AlertState = {
    visible: boolean;
    title?: string;
    message?: string;
    okText?: string;
    onOk?: () => void;
};

const Ctx = createContext<ShowFn | null>(null);

export function NiceAlertHost({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AlertState>({ visible: false });

    const show: ShowFn = useCallback((title, message, okText = "OK", onOk) => {
        setState({ visible: true, title, message, okText, onOk });
    }, []);

    const close = () => {
        const cb = state.onOk;
        setState({ visible: false });
        cb?.();
    };

    return (
        <Ctx.Provider value={show}>
            {children}
            <Modal visible={state.visible} transparent animationType="fade" onRequestClose={close}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "center", padding: 24 }}>
                    <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 16 }}>
                        {!!state.title && <Text style={{ fontWeight: "700", fontSize: 16, marginBottom: 6 }}>{state.title}</Text>}
                        {!!state.message && <Text style={{ color: "#333", marginBottom: 14 }}>{state.message}</Text>}
                        <View style={{ alignItems: "flex-end" }}>
                            <PillButton title={state.okText || "OK"} onPress={close} />
                        </View>
                    </View>
                </View>
            </Modal>
        </Ctx.Provider>
    );
}

export function useNiceAlert(): ShowFn {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("NiceAlert context not found. Mount <NiceAlertHost /> near the root.");
    return ctx;
}

let extShow: ShowFn | null = null;
export function NiceAlertRegistrar() {
    const show = useNiceAlert();
    extShow = show;
    return null;
}
export function niceAlert(title: string, message: string, okText?: string, onOk?: () => void) {
    if (extShow) extShow(title, message, okText, onOk);
}
