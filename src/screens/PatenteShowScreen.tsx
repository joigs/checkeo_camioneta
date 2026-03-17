import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import PillButton from '../components/PillButton';
import { getJson } from '../api/http';
import { niceAlert } from '../components/NiceAlert';

type Periodo = 'semana' | 'mes' | 'año';

export default function PatenteShowScreen() {
    const route = useRoute<any>();
    const nav = useNavigation<any>();
    const { patenteId, codigo } = route.params || {};

    const [periodo, setPeriodo] = useState<Periodo>('semana');
    const [historial, setHistorial] = useState<any[]>([]);
    const [fechaServidor, setFechaServidor] = useState<string>('');
    const [modalData, setModalData] = useState<any | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const cargarHistorial = async (p: Periodo) => {
        try {
            const userId = await AsyncStorage.getItem("usuario_id");
            setCurrentUserId(userId);
            if (!userId) return;

            const periodoQuery = p === 'año' ? 'ano' : p;
            const data = await getJson<any>(`patentes/${patenteId}?periodo=${periodoQuery}`, userId);
            setFechaServidor(data.fecha_servidor);

            const checkeosOrdenados = (data.checkeos || []).sort((a: any, b: any) =>
                new Date(b.fecha_chequeo).getTime() - new Date(a.fecha_chequeo).getTime()
            );

            setHistorial(checkeosOrdenados);
        } catch (e) {
            niceAlert("Error", "No se pudo cargar el historial");
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargarHistorial(periodo);
        }, [periodo, patenteId])
    );

    const formatFecha = (f: string) => f ? f.split('-').reverse().join('/') : '';

    const evaluarEstadoGeneral = () => {
        if (historial.length === 0) return { texto: 'Sin Inspecciones', color: '#666' };
        const ultima = historial[0];

        if (!ultima.completado) return { texto: 'Pendiente', color: 'orange' };

        const tieneFallos =
            ultima.extintor !== 0 || ultima.kit_derrame !== 0 ||
            !ultima.botiquin || !ultima.gata || !ultima.cadenas ||
            !ultima.llave_rueda || !ultima.antena_radio || !ultima.permiso_circulacion ||
            !ultima.revision_tecnica || !ultima.soap || !ultima.alcohol ||
            !ultima.protector_solar || !ultima.carpeta || !ultima.panos_limpieza ||
            !ultima.conos || !ultima.radio_comunicacion || !ultima.espejo_inspeccion ||
            !ultima.toldo || !ultima.pie_de_metro || !ultima.tintas || !ultima.arnes ||
            ultima.falta_diclofenaco_cant < 3 || ultima.falta_guantes_cant < 3 ||
            ultima.falta_parche_curita_cant < 5 || ultima.falta_gasa_cant < 10 ||
            ultima.falta_venda_cant < 1 || ultima.falta_suero_cant < 3 ||
            ultima.falta_tela_adhesiva_cant < 1 || ultima.falta_palitos_cant < 6;

        return tieneFallos ? { texto: 'No Conforme', color: 'red' } : { texto: 'Conforme', color: 'green' };
    };

    const estadoGeneral = evaluarEstadoGeneral();

    const renderValorTabla = (valor: any, esBooleano: boolean = true, req: number = 0, opciones?: any) => {
        if (opciones) {
            const index = Number(valor);
            const esValido = index === 0;
            return <Text style={[styles.cellValue, { color: esValido ? 'green' : 'red' }]}>{opciones[index] || 'Desconocido'}</Text>;
        }

        if (esBooleano) {
            return <Text style={[styles.cellValue, { color: valor ? 'green' : 'red' }]}>{valor ? 'Sí' : 'No'}</Text>;
        }

        const num = Number(valor) || 0;
        const esValido = num >= req;
        return <Text style={[styles.cellValue, { color: esValido ? 'green' : 'red' }]}>{num} / {req}</Text>;
    };

    const renderCalendarioAnual = () => {
        const year = fechaServidor ? parseInt(fechaServidor.split('-')[0], 10) : new Date().getFullYear();
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        return (
            <View style={styles.calendarContainer}>
                {months.map((name, mIndex) => {
                    const daysInMonth = new Date(year, mIndex + 1, 0).getDate();
                    return (
                        <View key={name} style={styles.monthBlock}>
                            <Text style={styles.monthTitle}>{name}</Text>
                            <View style={styles.daysGrid}>
                                {Array.from({ length: daysInMonth }).map((_, dIndex) => {
                                    const mStr = String(mIndex + 1).padStart(2, '0');
                                    const dStr = String(dIndex + 1).padStart(2, '0');
                                    const dateStr = `${year}-${mStr}-${dStr}`;

                                    const checkeo = historial.find(h => h.fecha_chequeo === dateStr);

                                    return (
                                        <TouchableOpacity
                                            key={dIndex}
                                            style={[styles.dayBox, checkeo ? styles.dayHasData : null]}
                                            onPress={() => checkeo && setModalData(checkeo)}
                                            disabled={!checkeo}
                                        >
                                            <Text style={[styles.dayText, checkeo ? styles.dayTextActive : null]}>
                                                {dIndex + 1}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }} edges={['bottom']}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View style={styles.headerCard}>
                    <Text style={styles.title}>Patente: {codigo}</Text>
                    <Text style={styles.statusLine}>
                        Estado actual: <Text style={{ color: estadoGeneral.color, fontWeight: '700' }}>{estadoGeneral.texto}</Text>
                    </Text>
                </View>

                <View style={styles.tabs}>
                    {(['semana', 'mes', 'año'] as Periodo[]).map(p => (
                        <Pressable
                            key={p}
                            style={[styles.tabBtn, periodo === p && styles.tabBtnActive]}
                            onPress={() => setPeriodo(p)}
                        >
                            <Text style={[styles.tabText, periodo === p && styles.tabTextActive]}>
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {periodo === 'año' ? (
                    renderCalendarioAnual()
                ) : (
                    <View style={styles.horizontalWrapper}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                            <View style={styles.gridContainer}>
                                {/* Columna Izquierda: Etiquetas Fijas */}
                                <View style={styles.labelsColumn}>
                                    <Text style={[styles.cellLabel, styles.headerCell]}>Fecha</Text>
                                    <Text style={[styles.cellLabel, styles.headerCell]}>Inspectores</Text>
                                    <Text style={[styles.cellLabel, styles.headerCell]}>Acción</Text>

                                    <Text style={styles.cellLabel}>Extintor</Text>
                                    <Text style={styles.cellLabel}>Kit Derrame</Text>
                                    <Text style={styles.cellLabel}>Botiquín</Text>
                                    <Text style={styles.cellLabel}>Gata</Text>
                                    <Text style={styles.cellLabel}>Cadenas</Text>
                                    <Text style={styles.cellLabel}>Llave de rueda</Text>
                                    <Text style={styles.cellLabel}>Antena de radio</Text>
                                    <Text style={styles.cellLabel}>Permiso circulación</Text>
                                    <Text style={styles.cellLabel}>Revisión técnica</Text>
                                    <Text style={styles.cellLabel}>SOAP</Text>
                                    <Text style={styles.cellLabel}>Alcohol</Text>
                                    <Text style={styles.cellLabel}>Protector Solar</Text>
                                    <Text style={styles.cellLabel}>Carpeta</Text>
                                    <Text style={styles.cellLabel}>Paños limpieza</Text>
                                    <Text style={styles.cellLabel}>Conos</Text>
                                    <Text style={styles.cellLabel}>Radio</Text>
                                    <Text style={styles.cellLabel}>Espejo</Text>
                                    <Text style={styles.cellLabel}>Toldo</Text>
                                    <Text style={styles.cellLabel}>Pie de metro</Text>
                                    <Text style={styles.cellLabel}>Tintas</Text>
                                    <Text style={styles.cellLabel}>Arnés</Text>

                                    <Text style={[styles.cellLabel, styles.sectionHeaderCell]}>Cantidades Botiquín</Text>
                                    <Text style={styles.cellLabel}>Diclofenaco (Req: 3)</Text>
                                    <Text style={styles.cellLabel}>Guantes (Req: 3)</Text>
                                    <Text style={styles.cellLabel}>Parches (Req: 5)</Text>
                                    <Text style={styles.cellLabel}>Gasa (Req: 10)</Text>
                                    <Text style={styles.cellLabel}>Venda (Req: 1)</Text>
                                    <Text style={styles.cellLabel}>Suero (Req: 3)</Text>
                                    <Text style={styles.cellLabel}>Tela Adhesiva (Req: 1)</Text>
                                    <Text style={styles.cellLabel}>Palitos (Req: 6)</Text>
                                </View>

                                {/* Columnas Dinámicas: Una por cada Inspección */}
                                {historial.map((col, idx) => {
                                    const inspectores = col.check_usuarios?.map((u: any) => u.nombre).join(', ') || 'Sin asignar';
                                    const soyDueno = col.check_usuarios?.some((u: any) => String(u.id) === currentUserId);

                                    return (
                                        <View key={col.id} style={[styles.dataColumn, idx % 2 === 1 && styles.dataColumnAlt]}>
                                            <Text style={[styles.cellValue, styles.headerCell, { fontWeight: '700' }]}>{formatFecha(col.fecha_chequeo)}</Text>
                                            <Text style={[styles.cellValue, styles.headerCell]} numberOfLines={2}>{inspectores}</Text>
                                            <View style={[styles.cellAction, styles.headerCell]}>
                                                <PillButton
                                                    size="sm"
                                                    title={soyDueno ? "Realizar/Corregir" : "Reportar"}
                                                    variant={soyDueno ? "primary" : "outline"}
                                                    onPress={() => nav.navigate('CheckeoForm', { checkeoId: col.id })}
                                                />
                                            </View>

                                            {renderValorTabla(col.extintor, false, 0, {0: 'Sí', 1: 'No', 2: 'Vencido'})}
                                            {renderValorTabla(col.kit_derrame, false, 0, {0: 'Sí', 1: 'No', 2: 'Sin Pala', 3: 'Sin Bolsa'})}
                                            {renderValorTabla(col.botiquin)}
                                            {renderValorTabla(col.gata)}
                                            {renderValorTabla(col.cadenas)}
                                            {renderValorTabla(col.llave_rueda)}
                                            {renderValorTabla(col.antena_radio)}
                                            {renderValorTabla(col.permiso_circulacion)}
                                            {renderValorTabla(col.revision_tecnica)}
                                            {renderValorTabla(col.soap)}
                                            {renderValorTabla(col.alcohol)}
                                            {renderValorTabla(col.protector_solar)}
                                            {renderValorTabla(col.carpeta)}
                                            {renderValorTabla(col.panos_limpieza)}
                                            {renderValorTabla(col.conos)}
                                            {renderValorTabla(col.radio_comunicacion)}
                                            {renderValorTabla(col.espejo_inspeccion)}
                                            {renderValorTabla(col.toldo)}
                                            {renderValorTabla(col.pie_de_metro)}
                                            {renderValorTabla(col.tintas)}
                                            {renderValorTabla(col.arnes)}

                                            <Text style={[styles.cellValue, styles.sectionHeaderCell]}></Text>
                                            {renderValorTabla(col.falta_diclofenaco_cant, false, 3)}
                                            {renderValorTabla(col.falta_guantes_cant, false, 3)}
                                            {renderValorTabla(col.falta_parche_curita_cant, false, 5)}
                                            {renderValorTabla(col.falta_gasa_cant, false, 10)}
                                            {renderValorTabla(col.falta_venda_cant, false, 1)}
                                            {renderValorTabla(col.falta_suero_cant, false, 3)}
                                            {renderValorTabla(col.falta_tela_adhesiva_cant, false, 1)}
                                            {renderValorTabla(col.falta_palitos_cant, false, 6)}
                                        </View>
                                    );
                                })}

                                {historial.length === 0 && (
                                    <View style={styles.emptyTable}>
                                        <Text style={{ color: '#888', fontStyle: 'italic', padding: 20 }}>No hay inspecciones en este periodo.</Text>
                                    </View>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                )}
            </ScrollView>

            {/* Modal solo para el calendario Anual */}
            <Modal visible={!!modalData} transparent animationType="fade" onRequestClose={() => setModalData(null)}>
                <Pressable style={styles.modalFullBackdrop} onPress={() => setModalData(null)}>
                    <Pressable style={styles.modalLargeContent} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>Datos de la Inspección</Text>
                            <Pressable onPress={() => setModalData(null)} hitSlop={10}>
                                <Text style={styles.closeBtnX}>✕</Text>
                            </Pressable>
                        </View>

                        <ScrollView style={{ flex: 1 }}>
                            {modalData && (
                                <View style={{ gap: 8 }}>
                                    <Text style={styles.dataRow}>Fecha: {formatFecha(modalData.fecha_chequeo)}</Text>
                                    <Text style={styles.dataRow}>Extintor: {modalData.extintor}</Text>
                                    <Text style={styles.dataRow}>Kit Derrame: {modalData.kit_derrame}</Text>
                                    <Text style={styles.dataRow}>Botiquín: {modalData.botiquin ? 'Sí' : 'No'}</Text>
                                    <Text style={styles.dataRow}>Gata: {modalData.gata ? 'Sí' : 'No'}</Text>
                                    <Text style={styles.dataRow}>Cadenas: {modalData.cadenas ? 'Sí' : 'No'}</Text>
                                    <Text style={styles.dataRow}>Llave de rueda: {modalData.llave_rueda ? 'Sí' : 'No'}</Text>
                                    <Text style={styles.dataRow}>Antena de radio: {modalData.antena_radio ? 'Sí' : 'No'}</Text>
                                    <Text style={styles.dataRow}>Permiso circulación: {modalData.permiso_circulacion ? 'Sí' : 'No'}</Text>
                                    <Text style={styles.dataRow}>Revisión técnica: {modalData.revision_tecnica ? 'Sí' : 'No'}</Text>
                                    <Text style={styles.dataRow}>SOAP: {modalData.soap ? 'Sí' : 'No'}</Text>
                                    <Text style={styles.dataRow}>Alcohol: {modalData.alcohol ? 'Sí' : 'No'}</Text>
                                    <Text style={styles.dataRow}>Protector Solar: {modalData.protector_solar ? 'Sí' : 'No'}</Text>
                                    <Text style={styles.dataRow}>Carpeta: {modalData.carpeta ? 'Sí' : 'No'}</Text>
                                    <Text style={styles.dataRow}>Paños limpieza: {modalData.panos_limpieza ? 'Sí' : 'No'}</Text>
                                    <Text style={styles.dataRow}>Conos: {modalData.conos ? 'Sí' : 'No'}</Text>
                                    <Text style={styles.dataRow}>Radio comunicación: {modalData.radio_comunicacion ? 'Sí' : 'No'}</Text>
                                    <Text style={styles.dataRow}>Espejo de inspección: {modalData.espejo_inspeccion ? 'Sí' : 'No'}</Text>
                                    <Text style={styles.dataRow}>Toldo: {modalData.toldo ? 'Sí' : 'No'}</Text>
                                    <Text style={styles.dataRow}>Pie de metro: {modalData.pie_de_metro ? 'Sí' : 'No'}</Text>
                                    <Text style={styles.dataRow}>Tintas: {modalData.tintas ? 'Sí' : 'No'}</Text>
                                    <Text style={styles.dataRow}>Arnés: {modalData.arnes ? 'Sí' : 'No'}</Text>

                                    <Text style={[styles.dataRow, { marginTop: 12, fontWeight: '700' }]}>Faltantes Botiquín:</Text>
                                    <Text style={styles.dataRow}>Diclofenaco: {modalData.falta_diclofenaco_cant}</Text>
                                    <Text style={styles.dataRow}>Guantes: {modalData.falta_guantes_cant}</Text>
                                    <Text style={styles.dataRow}>Parches: {modalData.falta_parche_curita_cant}</Text>
                                    <Text style={styles.dataRow}>Gasa: {modalData.falta_gasa_cant}</Text>
                                    <Text style={styles.dataRow}>Venda: {modalData.falta_venda_cant}</Text>
                                    <Text style={styles.dataRow}>Suero: {modalData.falta_suero_cant}</Text>
                                    <Text style={styles.dataRow}>Tela Adhesiva: {modalData.falta_tela_adhesiva_cant}</Text>
                                    <Text style={styles.dataRow}>Palitos: {modalData.falta_palitos_cant}</Text>
                                </View>
                            )}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    headerCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: '700' },
    statusLine: { fontSize: 16, marginTop: 8, color: '#333' },
    tabs: { flexDirection: 'row', backgroundColor: '#e9ecef', borderRadius: 8, padding: 4, marginBottom: 16 },
    tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
    tabBtnActive: { backgroundColor: '#fff', elevation: 2 },
    tabText: { fontWeight: '600', color: '#6c757d' },
    tabTextActive: { color: '#212529' },

    horizontalWrapper: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', overflow: 'hidden' },
    gridContainer: { flexDirection: 'row' },
    labelsColumn: { width: 160, backgroundColor: '#f8f9fa', borderRightWidth: 1, borderColor: '#ddd' },
    dataColumn: { width: 140, borderRightWidth: 1, borderColor: '#eee' },
    dataColumnAlt: { backgroundColor: '#fdfdfd' },

    cellLabel: { padding: 12, fontSize: 13, color: '#333', fontWeight: '600', borderBottomWidth: 1, borderColor: '#eee', height: 46, textAlignVertical: 'center' },
    cellValue: { padding: 12, fontSize: 13, borderBottomWidth: 1, borderColor: '#eee', height: 46, textAlign: 'center', textAlignVertical: 'center', fontWeight: '600' },
    cellAction: { paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee', height: 46 },

    headerCell: { height: 60, backgroundColor: '#f1f1f1' },
    sectionHeaderCell: { height: 30, backgroundColor: '#e9ecef', color: '#666', fontSize: 11, paddingVertical: 6 },

    emptyTable: { justifyContent: 'center', alignItems: 'center', flex: 1, minWidth: 200 },

    calendarContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    monthBlock: { width: '48%', backgroundColor: '#fff', borderRadius: 8, padding: 8, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
    monthTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, textAlign: 'center', color: '#555' },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    dayBox: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#f1f1f1', justifyContent: 'center', alignItems: 'center' },
    dayHasData: { backgroundColor: '#0A84FF' },
    dayText: { fontSize: 10, color: '#999' },
    dayTextActive: { color: '#fff', fontWeight: '700' },

    modalFullBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 },
    modalLargeContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '80%' },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 12 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    closeBtnX: { fontSize: 24, fontWeight: '800', color: '#666', paddingHorizontal: 8 },
    dataRow: { fontSize: 15, color: '#333', paddingVertical: 4 }
});