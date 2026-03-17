import React, { createContext, useCallback, useContext, useState } from "react";
import { Modal, View, Text } from "react-native";
import PillButton from "./PillButton";
import { Pressable} from "react-native";

type ShowFn = (title: string, message: string, okText?: string, onOk?: () => void, cancelText?: string) => void;

type AlertState = {
    visible: boolean;
    title?: string;
    message?: string;
    okText?: string;
    onOk?: () => void;
    cancelText?: string;
};

const Ctx = createContext<ShowFn | null>(null);

export function NiceAlertHost({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AlertState>({ visible: false });

    const show: ShowFn = useCallback((title, message, okText = "OK", onOk, cancelText) => {
        setState({ visible: true, title, message, okText, onOk, cancelText });
    }, []);

    const close = () => setState({ visible: false });

    const handleOk = () => {
        const cb = state.onOk;
        setState({ visible: false });
        cb?.();
    };

    return (
        <Ctx.Provider value={show}>
            {children}
            <Modal visible={state.visible} transparent animationType="fade" onRequestClose={close}>
                <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 }} onPress={close}>
                    <Pressable style={{ backgroundColor: "#fff", borderRadius: 12, padding: 20 }} onPress={(e) => e.stopPropagation()}>
                        {!!state.title && <Text style={{ fontWeight: "700", fontSize: 18, marginBottom: 8, color: '#111' }}>{state.title}</Text>}
                        {!!state.message && <Text style={{ color: "#444", marginBottom: 20, fontSize: 15, lineHeight: 22 }}>{state.message}</Text>}
                        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
                            {!!state.cancelText && (
                                <PillButton title={state.cancelText} variant="outline" onPress={close} />
                            )}
                            <PillButton title={state.okText || "OK"} onPress={handleOk} />
                        </View>
                    </Pressable>
                </Pressable>
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
export function niceAlert(title: string, message: string, okText?: string, onOk?: () => void, cancelText?: string) {
    if (extShow) extShow(title, message, okText, onOk, cancelText);
}