import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import PillButton from '../components/PillButton';

type PatenteRow = {
    id: number;
    codigo: string;
};

export default function PatentesScreen() {
    const nav = useNavigation<any>();
    const [rows, setRows] = useState<PatenteRow[]>([]);
    const [query, setQuery] = useState('');

    const qNorm = useMemo(() => query.toLowerCase().trim(), [query]);
    const filteredRows = useMemo(() => {
        if (!qNorm) return rows;
        return rows.filter(r => r.codigo.toLowerCase().includes(qNorm));
    }, [rows, qNorm]);

    const renderItem = ({ item }: { item: PatenteRow }) => (
        <View style={styles.card}>
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.codigo}</Text>
            </View>
            <View style={{ width: 100 }}>
                <PillButton title="Ver" onPress={() => nav.navigate('PatenteShow', { patenteId: item.id, codigo: item.codigo })} />
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
    title: { fontSize: 18, fontWeight: '700' },
});