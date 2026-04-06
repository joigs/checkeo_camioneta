import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import PillButton from '../components/PillButton';
import { getJson } from '../api/http';
import { niceAlert } from '../components/NiceAlert';

type Periodo = 'semana' | 'mes' | 'año';

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function PatenteShowScreen() {
    const route = useRoute<any>();
    const nav = useNavigation<any>();
    const { patenteId, codigo } = route.params || {};

    const [periodo, setPeriodo] = useState<Periodo>('semana');
    const [historial, setHistorial] = useState<any[]>([]);
    const [fechaServidor, setFechaServidor] = useState<string>('');
    const [modalData, setModalData] = useState<any | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [ultimaInspeccion, setUltimaInspeccion] = useState<any | null>(null);
    const [anoSeleccionado, setAnoSeleccionado] = useState<number>(new Date().getFullYear());
    const [cargando, setCargando] = useState(false);

    const cargarHistorial = async (p: Periodo) => {
        try {
            setCargando(true);
            setHistorial([]);
            const userId = await AsyncStorage.getItem("usuario_id");
            setCurrentUserId(userId);
            if (!userId) return;

            const periodoQuery = p === 'año' ? 'ano' : p;
            const anoQuery = p === 'año' ? `&ano=${anoSeleccionado}` : '';
            const data = await getJson<any>(`patentes/${patenteId}?periodo=${periodoQuery}${anoQuery}`, userId);
            setFechaServidor(data.fecha_servidor);
            setUltimaInspeccion(data.ultima_inspeccion || null);

            const checkeosOrdenados = (data.checkeos || []).sort((a: any, b: any) =>
                new Date(b.fecha_chequeo).getTime() - new Date(a.fecha_chequeo).getTime()
            );

            setHistorial(checkeosOrdenados);
        } catch (e) {
            niceAlert("Error", "No se pudo cargar el historial");
        } finally {
            setCargando(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargarHistorial(periodo);
        }, [periodo, patenteId, anoSeleccionado])
    );

    const formatFecha = (f: string) => f ? f.split('-').reverse().join('/') : '';

    const formatFechaConDia = (f: string) => {
        if (!f) return '';
        const [y, m, d] = f.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const dia = DIAS_SEMANA[date.getDay()];
        const dd = String(d).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        return `${dia}\n${dd}/${mm}`;
    };

    const evaluarEstadoGeneral = () => {
        if (!ultimaInspeccion) return { texto: 'Sin Inspecciones', color: '#666' };
        if (!ultimaInspeccion.completado) return { texto: 'Pendiente', color: 'orange' };
        return ultimaInspeccion.conforme ? { texto: 'Conforme', color: 'green' } : { texto: 'No Conforme', color: 'red' };
    };

    const estadoGeneral = evaluarEstadoGeneral();

    const renderValorTabla = (valor: any, tipo: 'booleano' | 'extintor' | 'kit' | 'cantidad', req: number = 0) => {
        if (valor === null || valor === undefined || valor === '') {
            return <Text style={[styles.cellValue, { color: '#888' }]}>Sin responder</Text>;
        }

        if (tipo === 'extintor') {
            const esVerde = valor === 'extintor_si';
            const texto = valor === 'extintor_si' ? 'Sí' : (valor === 'extintor_no' ? 'No' : 'Vencido');
            return <Text style={[styles.cellValue, { color: esVerde ? 'green' : 'red' }]}>{texto}</Text>;
        }

        if (tipo === 'kit') {
            const esVerde = valor === 'kit_si';
            const texto = valor === 'kit_si' ? 'Sí' : (valor === 'kit_no' ? 'No' : (valor === 'kit_falta_pala' ? 'Sin Pala' : 'Sin Bolsa'));
            return <Text style={[styles.cellValue, { color: esVerde ? 'green' : 'red' }]}>{texto}</Text>;
        }

        if (tipo === 'booleano') {
            return <Text style={[styles.cellValue, { color: valor ? 'green' : 'red' }]}>{valor ? 'Sí' : 'No'}</Text>;
        }

        const num = Number(valor) || 0;
        const esValido = num >= req;
        return <Text style={[styles.cellValue, { color: esValido ? 'green' : 'red' }]}>{num} / {req}</Text>;
    };

    const formatearValorParaModal = (valor: any, tipo: 'booleano' | 'extintor' | 'kit') => {
        if (valor === null || valor === undefined || valor === '') return "Sin responder";
        if (tipo === 'extintor') return valor === 'extintor_si' ? 'Sí' : (valor === 'extintor_no' ? 'No' : 'Vencido');
        if (tipo === 'kit') return valor === 'kit_si' ? 'Sí' : (valor === 'kit_no' ? 'No' : (valor === 'kit_falta_pala' ? 'Sin Pala' : 'Sin Bolsa'));
        return valor ? 'Sí' : 'No';
    };

    const renderSelectorAno = () => {
        const currentYear = fechaServidor ? parseInt(fechaServidor.split('-')[0], 10) : new Date().getFullYear();
        const years = [];
        for (let y = currentYear; y >= 2025; y--) {
            years.push(y);
        }

        return (
            <View style={styles.yearSelector}>
                {years.map(y => (
                    <Pressable
                        key={y}
                        style={[styles.yearBtn, anoSeleccionado === y && styles.yearBtnActive]}
                        onPress={() => setAnoSeleccionado(y)}
                    >
                        <Text style={[styles.yearText, anoSeleccionado === y && styles.yearTextActive]}>{y}</Text>
                    </Pressable>
                ))}
            </View>
        );
    };

    const renderCalendarioAnual = () => {
        const year = anoSeleccionado;
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
                        Estado de última inspección: <Text style={{ color: estadoGeneral.color, fontWeight: '700' }}>{estadoGeneral.texto}</Text>
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

                {periodo === 'año' && renderSelectorAno()}

                {cargando ? (
                    <View style={styles.emptyTable}>
                        <Text style={{ color: '#888', fontStyle: 'italic', padding: 20 }}>Cargando...</Text>
                    </View>
                ) : periodo === 'año' ? (
                    renderCalendarioAnual()
                ) : (
                    <View style={styles.horizontalWrapper}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                            <View style={styles.gridContainer}>
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

                                {historial.map((col, idx) => {
                                    const inspectores = col.check_usuarios?.map((u: any) => u.nombre).join(', ') || 'Sin asignar';
                                    const soyDueno = col.check_usuarios?.some((u: any) => String(u.id) === currentUserId);
                                    const esHoy = col.fecha_chequeo === new Date().toISOString().split('T')[0];
                                    const textoBoton = soyDueno ? (esHoy ? "Realizar" : "Corregir") : "Reportar";

                                    return (
                                        <View key={col.id} style={[styles.dataColumn, idx % 2 === 1 && styles.dataColumnAlt]}>
                                            <Text style={[styles.cellValue, styles.headerCell, { fontWeight: '700' }]}>{formatFechaConDia(col.fecha_chequeo)}</Text>
                                            <Text style={[styles.cellValue, styles.headerCell]} numberOfLines={2}>{inspectores}</Text>
                                            <View style={[styles.cellAction, styles.headerCell]}>
                                                <PillButton
                                                    size="sm"
                                                    title={textoBoton}
                                                    variant={soyDueno ? "primary" : "outline"}
                                                    onPress={() => nav.navigate('CheckeoForm', { checkeoId: col.id })}
                                                />
                                            </View>

                                            {renderValorTabla(col.extintor, 'extintor')}
                                            {renderValorTabla(col.kit_derrame, 'kit')}
                                            {renderValorTabla(col.botiquin, 'booleano')}
                                            {renderValorTabla(col.gata, 'booleano')}
                                            {renderValorTabla(col.cadenas, 'booleano')}
                                            {renderValorTabla(col.llave_rueda, 'booleano')}
                                            {renderValorTabla(col.antena_radio, 'booleano')}
                                            {renderValorTabla(col.permiso_circulacion, 'booleano')}
                                            {renderValorTabla(col.revision_tecnica, 'booleano')}
                                            {renderValorTabla(col.soap, 'booleano')}
                                            {renderValorTabla(col.alcohol, 'booleano')}
                                            {renderValorTabla(col.protector_solar, 'booleano')}
                                            {renderValorTabla(col.carpeta, 'booleano')}
                                            {renderValorTabla(col.panos_limpieza, 'booleano')}
                                            {renderValorTabla(col.conos, 'booleano')}
                                            {renderValorTabla(col.radio_comunicacion, 'booleano')}
                                            {renderValorTabla(col.espejo_inspeccion, 'booleano')}
                                            {renderValorTabla(col.toldo, 'booleano')}
                                            {renderValorTabla(col.pie_de_metro, 'booleano')}
                                            {renderValorTabla(col.tintas, 'booleano')}
                                            {renderValorTabla(col.arnes, 'booleano')}

                                            <Text style={[styles.cellValue, styles.sectionHeaderCell]}></Text>
                                            {renderValorTabla(col.falta_diclofenaco_cant, 'cantidad', 3)}
                                            {renderValorTabla(col.falta_guantes_cant, 'cantidad', 3)}
                                            {renderValorTabla(col.falta_parche_curita_cant, 'cantidad', 5)}
                                            {renderValorTabla(col.falta_gasa_cant, 'cantidad', 10)}
                                            {renderValorTabla(col.falta_venda_cant, 'cantidad', 1)}
                                            {renderValorTabla(col.falta_suero_cant, 'cantidad', 3)}
                                            {renderValorTabla(col.falta_tela_adhesiva_cant, 'cantidad', 1)}
                                            {renderValorTabla(col.falta_palitos_cant, 'cantidad', 6)}
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

            <Modal visible={!!modalData} transparent animationType="fade" onRequestClose={() => setModalData(null)}>
                <View style={styles.modalFullBackdrop}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalData(null)} />
                    <View style={styles.modalLargeContent}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>Datos de la Inspección</Text>
                            <Pressable onPress={() => setModalData(null)} hitSlop={10}>
                                <Text style={styles.closeBtnX}>✕</Text>
                            </Pressable>
                        </View>

                        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={true}>
                            {modalData && (
                                <View style={{ gap: 8 }}>
                                    <Text style={styles.dataRow}>Fecha: {formatFecha(modalData.fecha_chequeo)}</Text>

                                    <Text style={[styles.dataRow, { marginTop: 12, fontWeight: '700' }]}>Estado General:</Text>
                                    <Text style={styles.dataRow}>Extintor: {formatearValorParaModal(modalData.extintor, 'extintor')}</Text>
                                    <Text style={styles.dataRow}>Kit Derrame: {formatearValorParaModal(modalData.kit_derrame, 'kit')}</Text>
                                    <Text style={styles.dataRow}>Botiquín: {formatearValorParaModal(modalData.botiquin, 'booleano')}</Text>
                                    <Text style={styles.dataRow}>Gata: {formatearValorParaModal(modalData.gata, 'booleano')}</Text>
                                    <Text style={styles.dataRow}>Cadenas: {formatearValorParaModal(modalData.cadenas, 'booleano')}</Text>
                                    <Text style={styles.dataRow}>Llave de rueda: {formatearValorParaModal(modalData.llave_rueda, 'booleano')}</Text>
                                    <Text style={styles.dataRow}>Antena de radio: {formatearValorParaModal(modalData.antena_radio, 'booleano')}</Text>
                                    <Text style={styles.dataRow}>Permiso circulación: {formatearValorParaModal(modalData.permiso_circulacion, 'booleano')}</Text>
                                    <Text style={styles.dataRow}>Revisión técnica: {formatearValorParaModal(modalData.revision_tecnica, 'booleano')}</Text>
                                    <Text style={styles.dataRow}>SOAP: {formatearValorParaModal(modalData.soap, 'booleano')}</Text>
                                    <Text style={styles.dataRow}>Alcohol: {formatearValorParaModal(modalData.alcohol, 'booleano')}</Text>
                                    <Text style={styles.dataRow}>Protector Solar: {formatearValorParaModal(modalData.protector_solar, 'booleano')}</Text>
                                    <Text style={styles.dataRow}>Carpeta: {formatearValorParaModal(modalData.carpeta, 'booleano')}</Text>
                                    <Text style={styles.dataRow}>Paños limpieza: {formatearValorParaModal(modalData.panos_limpieza, 'booleano')}</Text>
                                    <Text style={styles.dataRow}>Conos: {formatearValorParaModal(modalData.conos, 'booleano')}</Text>
                                    <Text style={styles.dataRow}>Radio comunicación: {formatearValorParaModal(modalData.radio_comunicacion, 'booleano')}</Text>
                                    <Text style={styles.dataRow}>Espejo de inspección: {formatearValorParaModal(modalData.espejo_inspeccion, 'booleano')}</Text>
                                    <Text style={styles.dataRow}>Toldo: {formatearValorParaModal(modalData.toldo, 'booleano')}</Text>
                                    <Text style={styles.dataRow}>Pie de metro: {formatearValorParaModal(modalData.pie_de_metro, 'booleano')}</Text>
                                    <Text style={styles.dataRow}>Tintas: {formatearValorParaModal(modalData.tintas, 'booleano')}</Text>
                                    <Text style={styles.dataRow}>Arnés: {formatearValorParaModal(modalData.arnes, 'booleano')}</Text>

                                    <Text style={[styles.dataRow, { marginTop: 12, fontWeight: '700' }]}>Faltantes Botiquín:</Text>
                                    <Text style={styles.dataRow}>Diclofenaco: {modalData.falta_diclofenaco_cant ?? 'Sin responder'} / 3</Text>
                                    <Text style={styles.dataRow}>Guantes: {modalData.falta_guantes_cant ?? 'Sin responder'} / 3</Text>
                                    <Text style={styles.dataRow}>Parches: {modalData.falta_parche_curita_cant ?? 'Sin responder'} / 5</Text>
                                    <Text style={styles.dataRow}>Gasa: {modalData.falta_gasa_cant ?? 'Sin responder'} / 10</Text>
                                    <Text style={styles.dataRow}>Venda: {modalData.falta_venda_cant ?? 'Sin responder'} / 1</Text>
                                    <Text style={styles.dataRow}>Suero: {modalData.falta_suero_cant ?? 'Sin responder'} / 3</Text>
                                    <Text style={styles.dataRow}>Tela Adhesiva: {modalData.falta_tela_adhesiva_cant ?? 'Sin responder'} / 1</Text>
                                    <Text style={styles.dataRow}>Palitos: {modalData.falta_palitos_cant ?? 'Sin responder'} / 6</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
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

    yearSelector: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
    yearBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 6, backgroundColor: '#e9ecef' },
    yearBtnActive: { backgroundColor: '#0A84FF' },
    yearText: { fontWeight: '600', color: '#6c757d', fontSize: 14 },
    yearTextActive: { color: '#fff' },

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

    modalFullBackdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16, zIndex: 999 },
    modalLargeContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '80%' },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 12 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    closeBtnX: { fontSize: 24, fontWeight: '800', color: '#666', paddingHorizontal: 8 },
    dataRow: { fontSize: 15, color: '#333', paddingVertical: 4 }
});