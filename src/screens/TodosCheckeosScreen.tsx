import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import PillButton from '../components/PillButton';

type CheckeoRow = {
    id: number;
    patente_codigo: string;
    fecha: string;
    completado: boolean;
    inspectores: string[];
};

export default function TodosCheckeosScreen() {
    const nav = useNavigation<any>();
    const [rows, setRows] = useState<CheckeoRow[]>([]);
    const [query, setQuery] = useState('');

    const qNorm = useMemo(() => query.toLowerCase().trim(), [query]);
    const filteredRows = useMemo(() => {
        if (!qNorm) return rows;
        return rows.filter(r => r.patente_codigo.toLowerCase().includes(qNorm));
    }, [rows, qNorm]);

    const renderItem = ({ item }: { item: CheckeoRow }) => (
        <View style={styles.card}>
            <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.title}>{item.patente_codigo}</Text>
                <Text style={styles.meta}>Fecha: {item.fecha}</Text>
                <Text style={styles.meta}>Inspectores: {item.inspectores?.join(', ')}</Text>
                <Text style={[styles.meta, { color: item.completado ? 'green' : 'orange' }]}>
                    {item.completado ? 'Completado' : 'Pendiente'}
                </Text>
            </View>
            <View style={{ width: 100, gap: 6 }}>
                <PillButton title="Ver" onPress={() => nav.navigate('CheckeoForm', { checkeoId: item.id })} />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['bottom']}>
            <View style={styles.searchWrap}>
                <Text style={styles.searchIcon}>🔎</Text>
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Buscar patente..."
                    style={styles.searchInput}
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