import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import PillButton from '../components/PillButton';
import { getJson } from '../api/http';

type CheckeoRow = {
    id: number;
    check_patente_id: number;
    fecha_chequeo: string;
    completado: boolean;
    check_usuarios: { nombre: string }[];
};

export default function TodosCheckeosScreen() {
    const nav = useNavigation<any>();
    const [rows, setRows] = useState<CheckeoRow[]>([]);
    const [query, setQuery] = useState('');

    const qNorm = useMemo(() => query.toLowerCase().trim(), [query]);
    const filteredRows = useMemo(() => {
        if (!qNorm) return rows;
        return rows.filter(r => String(r.check_patente_id).includes(qNorm));
    }, [rows, qNorm]);

    const cargarCheckeos = async () => {
        try {
            const userId = await AsyncStorage.getItem("usuario_id");
            if (!userId) return;
            const data = await getJson<CheckeoRow[]>("camioneta/api/v1/checkeos", userId);
            setRows(data);
        } catch (e) {
            console.log("Error cargando todos los checkeos", e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargarCheckeos();
        }, [])
    );

    const renderItem = ({ item }: { item: CheckeoRow }) => {
        const inspectores = item.check_usuarios?.map(u => u.nombre).join(', ') || 'Sin inspectores';
        return (
            <View style={styles.card}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.title}>Patente ID: {item.check_patente_id}</Text>
                    <Text style={styles.meta}>Fecha: {item.fecha_chequeo}</Text>
                    <Text style={styles.meta}>Inspectores: {inspectores}</Text>
                    <Text style={[styles.meta, { color: item.completado ? 'green' : 'orange' }]}>
                        {item.completado ? 'Completado' : 'Pendiente'}
                    </Text>
                </View>
                <View style={{ width: 100, gap: 6 }}>
                    <PillButton title="Ver" onPress={() => nav.navigate('CheckeoForm', { checkeoId: item.id })} />
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['bottom']}>
            <View style={styles.searchWrap}>
                <Text style={styles.searchIcon}>🔎</Text>
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Buscar por ID de patente..."
                    style={styles.searchInput}
                    keyboardType="numeric"
                />
            </View>
            <FlatList
                data={filteredRows}
                keyExtractor={r => String(r.id)}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 80 }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    searchWrap: {
        marginHorizontal: 12, marginTop: 12, marginBottom: 12,
        backgroundColor: '#F2F4F7', borderWidth: 1, borderColor: '#E4E7EC',
        borderRadius: 12, flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 10, paddingVertical: 8,
    },
    searchIcon: { marginRight: 8, fontSize: 14 },
    searchInput: { flex: 1, fontSize: 14, color: '#111', paddingVertical: 0 },
    card: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderColor: '#ddd', alignItems: 'center' },
    title: { fontSize: 16, fontWeight: '600' },
    meta: { fontSize: 12, color: '#666', marginTop: 4 },
});