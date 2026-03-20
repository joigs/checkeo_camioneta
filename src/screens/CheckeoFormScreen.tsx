import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, TextInput, KeyboardAvoidingView, Platform, Modal, Pressable, TouchableOpacity, Keyboard } from 'react-native';
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
    const itemY = useRef<number[]>([]);
    const inputRefs = useRef<Array<TextInput | null>>([]);
    const botiquinBlockY = useRef<number>(0);

    const [valores, setValores] = useState<Record<string, any>>({});
    const [esDueno, setEsDueno] = useState(false);
    const [estadoEliminacionPropio, setEstadoEliminacionPropio] = useState(0);
    const [patente, setPatente] = useState('');
    const [inspectoresNombres, setInspectoresNombres] = useState<string>('');
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

            const nombres = data.check_usuarios?.map((u: any) => u.nombre).join(', ') || 'Sin asignar';
            setInspectoresNombres(nombres);

        } catch (e) {
            niceAlert("Error", "No se pudo cargar la inspección");
        }
    }, [checkeoId]);

    useEffect(() => {
        cargarDatosIniciales();
    }, [cargarDatosIniciales]);

    const focusNext = (index: number) => {
        const nextInput = inputRefs.current[index + 1];
        if (nextInput) {
            nextInput.focus();
        } else {
            Keyboard.dismiss();
        }
    };

    const handleFocus = (index: number) => {
        if (!esDueno) return;
        const absoluteY = botiquinBlockY.current + (itemY.current[index] || 0);
        const targetY = Math.max(0, absoluteY - height * 0.25);
        scrollRef.current?.scrollTo({ y: targetY, animated: true });
    };

    const updateVal = (key: string, val: any) => {
        if (!esDueno) return;
        setValores(prev => ({ ...prev, [key]: val }));
    };

    const esValidoParaCompletar = () => {
        const camposObligatorios = ['extintor', 'kit_derrame', ...BOLEANOS.map(b => b.key), ...BOTIQUIN_CANTIDADES.map(b => b.key)];
        for (let key of camposObligatorios) {
            if (valores[key] === null || valores[key] === undefined || valores[key] === '') {
                return false;
            }
        }
        return true;
    };

    const guardarCambios = async () => {
        setGuardando(true);
        try {
            const currentUserId = await AsyncStorage.getItem("usuario_id");
            const completado = esValidoParaCompletar();
            await putJson(`checkeos/${checkeoId}`, { checkeo: { ...valores, completado } }, { Authorization: `Bearer ${currentUserId}` });
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

    const ext = valores.extintor;
    const kit = valores.kit_derrame;

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                ref={scrollRef}
                style={{ flex: 1, backgroundColor: '#f8f9fa' }}
                contentContainerStyle={{ padding: 12, paddingBottom: height * 0.6 }}
                keyboardShouldPersistTaps="handled"
            >
                {!esDueno && (
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>Modo Solo Lectura</Text>
                    </View>
                )}

                <View style={styles.headerContainer}>
                    <Text style={styles.header}>Inspección: {patente}</Text>
                    <Text style={styles.subHeader}>Inspectores: {inspectoresNombres}</Text>
                </View>

                <View style={{ marginBottom: 20 }}>
                    <PillButton title="Reportar Problema" variant="outline" onPress={() => setModalReporte(true)} />
                </View>

                <View style={styles.block}>
                    <Text style={styles.sectionTitle}>Estado General</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Extintor</Text>
                        <View style={styles.radioGroup}>
                            <Pressable style={[styles.radioBtn, ext === 'extintor_si' ? styles.radioSi : null]} onPress={() => updateVal('extintor', 'extintor_si')} disabled={!esDueno}>
                                <Text style={[styles.radioText, ext === 'extintor_si' ? styles.radioTextActive : null]}>Sí</Text>
                            </Pressable>
                            <Pressable style={[styles.radioBtn, ext === 'extintor_no' ? styles.radioNo : null]} onPress={() => updateVal('extintor', 'extintor_no')} disabled={!esDueno}>
                                <Text style={[styles.radioText, ext === 'extintor_no' ? styles.radioTextActive : null]}>No</Text>
                            </Pressable>
                            <Pressable style={[styles.radioBtn, ext === 'extintor_vencido' ? styles.radioNo : null]} onPress={() => updateVal('extintor', 'extintor_vencido')} disabled={!esDueno}>
                                <Text style={[styles.radioText, ext === 'extintor_vencido' ? styles.radioTextActive : null]}>Vencido</Text>
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Kit de Derrame</Text>
                        <View style={styles.radioGroup}>
                            <Pressable style={[styles.radioBtn, kit === 'kit_si' ? styles.radioSi : null]} onPress={() => updateVal('kit_derrame', 'kit_si')} disabled={!esDueno}>
                                <Text style={[styles.radioText, kit === 'kit_si' ? styles.radioTextActive : null]}>Sí</Text>
                            </Pressable>
                            <Pressable style={[styles.radioBtn, kit === 'kit_no' ? styles.radioNo : null]} onPress={() => updateVal('kit_derrame', 'kit_no')} disabled={!esDueno}>
                                <Text style={[styles.radioText, kit === 'kit_no' ? styles.radioTextActive : null]}>No</Text>
                            </Pressable>
                            <Pressable style={[styles.radioBtn, kit === 'kit_falta_pala' ? styles.radioNo : null]} onPress={() => updateVal('kit_derrame', 'kit_falta_pala')} disabled={!esDueno}>
                                <Text style={[styles.radioText, kit === 'kit_falta_pala' ? styles.radioTextActive : null]}>Sin Pala</Text>
                            </Pressable>
                            <Pressable style={[styles.radioBtn, kit === 'kit_falta_bolsa' ? styles.radioNo : null]} onPress={() => updateVal('kit_derrame', 'kit_falta_bolsa')} disabled={!esDueno}>
                                <Text style={[styles.radioText, kit === 'kit_falta_bolsa' ? styles.radioTextActive : null]}>Sin Bolsa</Text>
                            </Pressable>
                        </View>
                    </View>

                    {BOLEANOS.map((campo) => {
                        const boolVal = valores[campo.key];
                        return (
                            <View key={campo.key} style={styles.switchRow}>
                                <Text style={styles.label}>{campo.label}</Text>
                                <View style={styles.radioGroup}>
                                    <Pressable
                                        style={[styles.radioBtn, boolVal === true ? styles.radioSi : null]}
                                        onPress={() => updateVal(campo.key, true)}
                                        disabled={!esDueno}
                                    >
                                        <Text style={[styles.radioText, boolVal === true ? styles.radioTextActive : null]}>Sí</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.radioBtn, boolVal === false ? styles.radioNo : null]}
                                        onPress={() => updateVal(campo.key, false)}
                                        disabled={!esDueno}
                                    >
                                        <Text style={[styles.radioText, boolVal === false ? styles.radioTextActive : null]}>No</Text>
                                    </Pressable>
                                </View>
                            </View>
                        );
                    })}
                </View>

                <View
                    style={styles.block}
                    onLayout={e => { botiquinBlockY.current = e.nativeEvent.layout.y; }}
                >
                    <Text style={styles.sectionTitle}>Elementos del Botiquín</Text>
                    {BOTIQUIN_CANTIDADES.map((campo, index) => (
                        <View
                            key={campo.key}
                            style={styles.row}
                            onLayout={e => { itemY.current[index] = e.nativeEvent.layout.y; }}
                        >
                            <Text style={styles.label}>{campo.label} (Req: {campo.req})</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    ref={(ref) => { inputRefs.current[index] = ref; }}
                                    editable={esDueno}
                                    value={valores[campo.key] === null || valores[campo.key] === undefined ? '' : String(valores[campo.key])}
                                    onChangeText={txt => updateVal(campo.key, txt.replace(/[^0-9]/g, ''))}
                                    onFocus={() => handleFocus(index)}
                                    onSubmitEditing={() => focusNext(index)}
                                    keyboardType="numeric"
                                    returnKeyType={index === BOTIQUIN_CANTIDADES.length - 1 ? "done" : "next"}
                                    placeholder="Vacío"
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
            </ScrollView>
            <Modal visible={modalReporte} animationType="slide" transparent={true} onRequestClose={() => setModalReporte(false)}>
                <View style={styles.modalBackdrop}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalReporte(false)} />
                    <View style={styles.modalBox}>
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
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    statusBadge: { backgroundColor: '#e2e3e5', alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
    statusText: { color: '#383d41', fontSize: 12, fontWeight: '700' },
    headerContainer: { alignItems: 'center', marginBottom: 16 },
    header: { fontSize: 20, fontWeight: '700', marginBottom: 4, color: '#111' },
    subHeader: { fontSize: 14, color: '#555', fontWeight: '500', textAlign: 'center' },
    block: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0A84FF', marginBottom: 12, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 6 },
    row: { marginBottom: 16 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingVertical: 4 },
    label: { fontSize: 15, fontWeight: '600', marginBottom: 8, color: '#333', flex: 1 },
    radioGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    radioBtn: { borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, minWidth: 60, alignItems: 'center' },
    radioSi: { backgroundColor: '#28a745', borderColor: '#28a745' },
    radioNo: { backgroundColor: '#dc3545', borderColor: '#dc3545' },
    radioText: { color: '#666', fontWeight: '600' },
    radioTextActive: { color: '#fff' },
    inputContainer: { flexDirection: 'row', alignItems: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, width: 80, textAlign: 'center' },
    inputDisabled: { backgroundColor: '#f1f1f1', color: '#888' },
    suffix: { fontSize: 16, fontWeight: '600', color: '#666', marginLeft: 8 },
    footerActions: { gap: 12, marginTop: 12 },
    modalBackdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20, zIndex: 999 },
    modalBox: { backgroundColor: '#fff', padding: 20, borderRadius: 12 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 }
});