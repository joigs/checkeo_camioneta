import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import PillButton from '../components/PillButton';

type Periodo = 'semana' | 'mes' | 'ano';

export default function PatenteShowScreen() {
    const route = useRoute<any>();
    const nav = useNavigation<any>();
    const { patenteId, codigo } = route.params || {};

    const [periodo, setPeriodo] = useState<Periodo>('semana');

    const [historial] = useState([
        { id: 1, fecha: '2023-10-01', estado: 'Completado', inspectores: 'Inspector 1, Inspector 2' },
        { id: 2, fecha: '2023-10-02', estado: 'Pendiente', inspectores: 'Inspector 3' },
    ]);

    const esDueno = true;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }} edges={['bottom']}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>

                <View style={styles.headerCard}>
                    <Text style={styles.title}>Patente: {codigo}</Text>
                    <Text style={styles.status}>Estado Actual: <Text style={{ color: 'green' }}>Óptimo</Text></Text>
                    <Text style={styles.meta}>Últimos inspectores: Inspector 1, Inspector 2</Text>
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
                        <Text style={styles.placeholderText}>Calendario Anual (En construcción)</Text>
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
                                        {esDueno ? (
                                            <PillButton size="sm" title="Corregir" onPress={() => {}} />
                                        ) : (
                                            <PillButton size="sm" variant="danger" title="Notificar error" onPress={() => {}} />
                                        )}
                                    </View>
                                </View>
                            ))}
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
    status: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    meta: { fontSize: 14, color: '#666' },

    tabs: { flexDirection: 'row', backgroundColor: '#e9ecef', borderRadius: 8, padding: 4, marginBottom: 16 },
    tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
    tabBtnActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
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