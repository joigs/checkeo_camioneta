import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import PillButton from '../components/PillButton';
import { getJson } from '../api/http';
import { niceAlert } from '../components/NiceAlert';

type Periodo = 'semana' | 'mes' | 'ano';

export default function PatenteShowScreen() {
    const route = useRoute<any>();
    const { patenteId, codigo } = route.params || {};

    const [periodo, setPeriodo] = useState<Periodo>('semana');
    const [historial, setHistorial] = useState<any[]>([]);
    const [fechaServidor, setFechaServidor] = useState<string>('');
    const [esDueno, setEsDueno] = useState(false);

    const cargarHistorial = async (p: Periodo) => {
        try {
            const userId = await AsyncStorage.getItem("usuario_id");
            if (!userId) return;

            const data = await getJson<any>(`patentes/${patenteId}?periodo=${p}`, userId);
            setFechaServidor(data.fecha_servidor);

            const checkeosFormateados = data.checkeos.map((c: any) => ({
                id: c.id,
                fecha: c.fecha_chequeo,
                estado: c.completado ? 'Completado' : 'Pendiente',
                inspectores: c.check_usuarios.map((u: any) => u.nombre).join(', ') || 'Sin asignar',
                soyDueno: c.check_usuarios.some((u: any) => String(u.id) === userId)
            }));

            setHistorial(checkeosFormateados);
        } catch (e) {
            niceAlert("Error", "No se pudo cargar el historial");
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargarHistorial(periodo);
        }, [periodo, patenteId])
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }} edges={['bottom']}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>

                <View style={styles.headerCard}>
                    <Text style={styles.title}>Patente: {codigo}</Text>
                </View>

                <View style={styles.tabs}>
                    {(['semana', 'mes', 'ano'] as Periodo[]).map(p => (
                        <TouchableOpacity
                            key={p}
                            style={[styles.tabBtn, periodo === p && styles.tabBtnActive]}
                            onPress={() => setPeriodo(p)}
                        >
                            <Text style={[styles.tabText, periodo === p && styles.tabTextActive]}>
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {periodo === 'ano' ? (
                    <View style={styles.placeholderBox}>
                        <Text style={styles.placeholderText}>Calendario Anual (placeholder)</Text>
                    </View>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableContainer}>
                        <View>
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <Text style={[styles.cell, styles.cellHeader, { width: 100 }]}>Fecha</Text>
                                <Text style={[styles.cell, styles.cellHeader, { width: 120 }]}>Estado</Text>
                                <Text style={[styles.cell, styles.cellHeader, { width: 180 }]}>Inspectores</Text>
                                <Text style={[styles.cell, styles.cellHeader, { width: 150 }]}>Acción</Text>
                            </View>

                            {historial.map(row => (
                                <View key={row.id} style={styles.tableRow}>
                                    <Text style={[styles.cell, { width: 100 }]}>{row.fecha}</Text>
                                    <Text style={[styles.cell, { width: 120, color: row.estado === 'Completado' ? 'green' : 'orange' }]}>
                                        {row.estado}
                                    </Text>
                                    <Text style={[styles.cell, { width: 180 }]} numberOfLines={1}>{row.inspectores}</Text>
                                    <View style={[styles.cell, { width: 150, justifyContent: 'center' }]}>
                                        {row.soyDueno ? (
                                            <PillButton size="sm" title="Corregir" onPress={() => {}} />
                                        ) : (
                                            <PillButton size="sm" variant="danger" title="Notificar error" onPress={() => {}} />
                                        )}
                                    </View>
                                </View>
                            ))}
                            {historial.length === 0 && (
                                <Text style={{ padding: 20, textAlign: 'center', color: '#666' }}>No hay registros en este periodo.</Text>
                            )}
                        </View>
                    </ScrollView>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    headerCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
    meta: { fontSize: 14, color: '#666' },
    tabs: { flexDirection: 'row', backgroundColor: '#e9ecef', borderRadius: 8, padding: 4, marginBottom: 16 },
    tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
    tabBtnActive: { backgroundColor: '#fff', elevation: 2 },
    tabText: { fontWeight: '600', color: '#6c757d' },
    tabTextActive: { color: '#212529' },
    tableContainer: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee' },
    tableHeader: { backgroundColor: '#f8f9fa' },
    cell: { padding: 12, fontSize: 14, color: '#333' },
    cellHeader: { fontWeight: '700', color: '#111' },
    placeholderBox: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', padding: 40, alignItems: 'center' },
    placeholderText: { color: '#888', fontStyle: 'italic' }
});