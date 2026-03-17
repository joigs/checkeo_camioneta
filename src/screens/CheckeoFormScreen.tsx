import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, TextInput, Switch, KeyboardAvoidingView, Platform, Modal, Pressable } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import PillButton from '../components/PillButton';
import { getJson, putJson, postJson } from '../api/http';
import { niceAlert } from '../components/NiceAlert';

const BOLEANOS = [
    { key: 'botiquin', label: 'Botiquín' },
    { key: 'gata', label: 'Gata' },
    { key: 'cadenas', label: 'Cadenas' },
    { key: 'llave_rueda', label: 'Llave de rueda' },
    { key: 'antena_radio', label: 'Antena de radio' },
    { key: 'permiso_circulacion', label: 'Permiso circulación' },
    { key: 'revision_tecnica', label: 'Revisión técnica' },
    { key: 'soap', label: 'SOAP' },
    { key: 'alcohol', label: 'Alcohol' },
    { key: 'protector_solar', label: 'Protector Solar' },
    { key: 'carpeta', label: 'Carpeta' },
    { key: 'panos_limpieza', label: 'Paños limpieza' },
    { key: 'conos', label: 'Conos (2 un)' },
    { key: 'radio_comunicacion', label: 'Radio comunicación' },
    { key: 'espejo_inspeccion', label: 'Espejo de inspección' },
    { key: 'toldo', label: 'Toldo' },
    { key: 'pie_de_metro', label: 'Pie de metro' },
    { key: 'tintas', label: 'Tintas (revelador y líquido)' },
    { key: 'arnes', label: 'Arnés' }
];

const BOTIQUIN_CANTIDADES = [
    { key: 'falta_diclofenaco_cant', label: 'Cápsulas Diclofenaco', req: 3 },
    { key: 'falta_guantes_cant', label: 'Pares Guantes Vinilo', req: 3 },
    { key: 'falta_parche_curita_cant', label: 'Parches Curita', req: 5 },
    { key: 'falta_gasa_cant', label: 'Gasas No Tejida', req: 10 },
    { key: 'falta_venda_cant', label: 'Venda Elástica', req: 1 },
    { key: 'falta_suero_cant', label: 'Ampollas Suero Fisiológico', req: 3 },
    { key: 'falta_tela_adhesiva_cant', label: 'Tela Adhesiva', req: 1 },
    { key: 'falta_palitos_cant', label: 'Palitos Estabilizadores', req: 6 }
];

export default function CheckeoFormScreen() {
    const route = useRoute<any>();
    const nav = useNavigation<any>();
    const { checkeoId } = route.params || {};
    const { height } = useWindowDimensions();
    const scrollRef = useRef<ScrollView>(null);
    const itemY = useRef<Record<string, number>>({});

    const [valores, setValores] = useState<Record<string, any>>({});
    const [esDueno, setEsDueno] = useState(false);
    const [estadoEliminacionPropio, setEstadoEliminacionPropio] = useState(0);
    const [patente, setPatente] = useState('');
    const [guardando, setGuardando] = useState(false);

    const [modalReporte, setModalReporte] = useState(false);
    const [mensajeReporte, setMensajeReporte] = useState('');

    const cargarDatosIniciales = useCallback(async () => {
        try {
            const currentUserId = await AsyncStorage.getItem("usuario_id");
            if (!currentUserId || !checkeoId) return;

            const data = await getJson<any>(`checkeos/${checkeoId}`, currentUserId);
            setValores(data);
            setPatente(data.check_patente?.codigo || '');
            setEstadoEliminacionPropio(data.estado_eliminacion_propio || 0);

            const dueno = data.check_usuarios?.some((u: any) => String(u.id) === currentUserId);
            setEsDueno(dueno);
        } catch (e) {
            niceAlert("Error", "No se pudo cargar la inspección");
        }
    }, [checkeoId]);

    useEffect(() => {
        cargarDatosIniciales();
    }, [cargarDatosIniciales]);

    const handleFocus = (key: string) => {
        if (!esDueno) return;
        const absoluteY = itemY.current[key] || 0;
        const targetY = Math.max(0, absoluteY - height * 0.25);
        scrollRef.current?.scrollTo({ y: targetY, animated: true });
    };

    const updateVal = (key: string, val: any) => {
        if (!esDueno) return;
        setValores(prev => ({ ...prev, [key]: val }));
    };

    const guardarCambios = async () => {
        setGuardando(true);
        try {
            const currentUserId = await AsyncStorage.getItem("usuario_id");
            await putJson(`checkeos/${checkeoId}`, { checkeo: valores }, { Authorization: `Bearer ${currentUserId}` });
            niceAlert("Éxito", "Inspección guardada correctamente");
            nav.goBack();
        } catch (e) {
            niceAlert("Error", "No se pudo guardar");
        } finally {
            setGuardando(false);
        }
    };

    const confirmarEliminacion = () => {
        niceAlert(
            "Eliminar Inspección",
            "¿Estás seguro de que quieres solicitar la eliminación de esta inspección? Se notificará a los demás inspectores para su aprobación.",
            "Sí, Eliminar",
            async () => {
                try {
                    const currentUserId = await AsyncStorage.getItem("usuario_id");
                    await postJson(`checkeos/${checkeoId}/solicitar_eliminacion`, {}, { Authorization: `Bearer ${currentUserId}` });
                    setEstadoEliminacionPropio(1);
                    niceAlert("Solicitud enviada", "Se ha notificado a los demás inspectores.");
                } catch (e) {
                    niceAlert("Error", "No se pudo enviar la solicitud");
                }
            },
            "Cancelar"
        );
    };

    const cancelarEliminacion = () => {
        niceAlert(
            "Cancelar Eliminación",
            "¿Deseas cancelar tu solicitud de eliminación para esta inspección?",
            "Sí, Cancelar",
            async () => {
                try {
                    const currentUserId = await AsyncStorage.getItem("usuario_id");
                    await postJson(`checkeos/${checkeoId}/cancelar_eliminacion`, {}, { Authorization: `Bearer ${currentUserId}` });
                    setEstadoEliminacionPropio(0);
                    niceAlert("Cancelado", "Tu solicitud de eliminación ha sido cancelada.");
                } catch (e) {
                    niceAlert("Error", "No se pudo cancelar la solicitud");
                }
            },
            "Cerrar"
        );
    };

    const enviarReporte = async () => {
        if (!mensajeReporte.trim()) return;
        try {
            const currentUserId = await AsyncStorage.getItem("usuario_id");
            await postJson(`checkeos/${checkeoId}/reportar_error`, { mensaje: mensajeReporte }, { Authorization: `Bearer ${currentUserId}` });
            setModalReporte(false);
            setMensajeReporte('');
            niceAlert("Enviado", "Reporte enviado a los inspectores.");
        } catch (e) {
            niceAlert("Error", "No se pudo enviar el reporte");
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                ref={scrollRef}
                style={{ flex: 1, backgroundColor: '#f8f9fa' }}
                contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled"
            >
                {!esDueno && (
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>Modo Solo Lectura</Text>
                    </View>
                )}

                <Text style={styles.header}>Inspección: {patente}</Text>

                <View style={styles.block}>
                    <Text style={styles.sectionTitle}>Estado General</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Extintor</Text>
                        <View style={styles.pillGroup}>
                            <PillButton size="sm" title="Sí" disabled={!esDueno} variant={valores.extintor === 'extintor_si' || valores.extintor === 0 ? 'primary' : 'outline'} onPress={() => updateVal('extintor', 0)} />
                            <PillButton size="sm" title="No" disabled={!esDueno} variant={valores.extintor === 'extintor_no' || valores.extintor === 1 ? 'primary' : 'outline'} onPress={() => updateVal('extintor', 1)} />
                            <PillButton size="sm" title="Vencido" disabled={!esDueno} variant={valores.extintor === 'extintor_vencido' || valores.extintor === 2 ? 'primary' : 'outline'} onPress={() => updateVal('extintor', 2)} />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Kit de Derrame</Text>
                        <View style={styles.pillGroup}>
                            <PillButton size="sm" title="Sí" disabled={!esDueno} variant={valores.kit_derrame === 'kit_si' || valores.kit_derrame === 0 ? 'primary' : 'outline'} onPress={() => updateVal('kit_derrame', 0)} />
                            <PillButton size="sm" title="No" disabled={!esDueno} variant={valores.kit_derrame === 'kit_no' || valores.kit_derrame === 1 ? 'primary' : 'outline'} onPress={() => updateVal('kit_derrame', 1)} />
                            <PillButton size="sm" title="Sin Pala" disabled={!esDueno} variant={valores.kit_derrame === 'kit_falta_pala' || valores.kit_derrame === 2 ? 'primary' : 'outline'} onPress={() => updateVal('kit_derrame', 2)} />
                            <PillButton size="sm" title="Sin Bolsa" disabled={!esDueno} variant={valores.kit_derrame === 'kit_falta_bolsa' || valores.kit_derrame === 3 ? 'primary' : 'outline'} onPress={() => updateVal('kit_derrame', 3)} />
                        </View>
                    </View>

                    {BOLEANOS.map((campo) => (
                        <View key={campo.key} style={styles.switchRow}>
                            <Text style={styles.label}>{campo.label}</Text>
                            <Switch
                                disabled={!esDueno}
                                value={!!valores[campo.key]}
                                onValueChange={(val) => updateVal(campo.key, val)}
                            />
                        </View>
                    ))}
                </View>

                <View style={styles.block}>
                    <Text style={styles.sectionTitle}>Elementos del Botiquín</Text>
                    {BOTIQUIN_CANTIDADES.map((campo) => (
                        <View
                            key={campo.key}
                            style={styles.row}
                            onLayout={e => { itemY.current[campo.key] = e.nativeEvent.layout.y; }}
                        >
                            <Text style={styles.label}>{campo.label} (Req: {campo.req})</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    editable={esDueno}
                                    value={valores[campo.key]?.toString() || ''}
                                    onChangeText={txt => updateVal(campo.key, txt.replace(/[^0-9]/g, ''))}
                                    onFocus={() => handleFocus(campo.key)}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    style={[styles.input, !esDueno && styles.inputDisabled]}
                                />
                                <Text style={styles.suffix}>/ {campo.req}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {esDueno && (
                    <View style={styles.footerActions}>
                        <PillButton title={guardando ? "Guardando..." : "Guardar Cambios"} onPress={guardarCambios} disabled={guardando} />
                        {estadoEliminacionPropio === 1 ? (
                            <PillButton title="Cancelar Eliminación" variant="outline" onPress={cancelarEliminacion} />
                        ) : (
                            <PillButton title="Eliminar Inspección" variant="danger" onPress={confirmarEliminacion} />
                        )}
                    </View>
                )}

                <View style={{ marginTop: 20, marginBottom: 40 }}>
                    <PillButton title="Reportar Problema" variant="outline" onPress={() => setModalReporte(true)} />
                </View>
            </ScrollView>
            <Modal visible={modalReporte} animationType="slide" transparent={true} onRequestClose={() => setModalReporte(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setModalReporte(false)}>
                    <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.modalTitle}>Reportar Problema</Text>
                        <Text style={styles.label}>Mensaje a los inspectores:</Text>
                        <TextInput
                            style={[styles.input, { width: '100%', height: 100, textAlignVertical: 'top', textAlign: 'left' }]}
                            multiline
                            value={mensajeReporte}
                            onChangeText={setMensajeReporte}
                        />
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                            <PillButton title="Cancelar" variant="outline" onPress={() => setModalReporte(false)} />
                            <PillButton title="Enviar" onPress={enviarReporte} />
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    statusBadge: { backgroundColor: '#e2e3e5', alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
    statusText: { color: '#383d41', fontSize: 12, fontWeight: '700' },
    header: { fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
    block: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0A84FF', marginBottom: 12, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 6 },
    row: { marginBottom: 16 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingVertical: 4 },
    label: { fontSize: 15, fontWeight: '600', marginBottom: 8, color: '#333' },
    pillGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, width: 80, textAlign: 'center' },
    inputDisabled: { backgroundColor: '#f1f1f1', color: '#888' },
    suffix: { fontSize: 16, fontWeight: '600', color: '#666', marginLeft: 8 },
    footerActions: { gap: 12, marginTop: 12 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
    modalBox: { backgroundColor: '#fff', padding: 20, borderRadius: 12 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 }
});