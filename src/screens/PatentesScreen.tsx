import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import PillButton from '../components/PillButton';
import { getJson, postJson } from '../api/http';
import { niceAlert } from '../components/NiceAlert';

type PatenteRow = {
    id: number;
    codigo: string;
};

export default function PatentesScreen() {
    const nav = useNavigation<any>();
    const [rows, setRows] = useState<PatenteRow[]>([]);
    const [query, setQuery] = useState('');

    const [modalVisible, setModalVisible] = useState(false);
    const [codigoInput, setCodigoInput] = useState('');
    const [creando, setCreando] = useState(false);

    const qNorm = useMemo(() => query.toLowerCase().trim(), [query]);
    const filteredRows = useMemo(() => {
        if (!qNorm) return rows;
        return rows.filter(r => r.codigo.toLowerCase().includes(qNorm));
    }, [rows, qNorm]);

    const cargarPatentes = async () => {
        try {
            const userId = await AsyncStorage.getItem("usuario_id");
            if (!userId) return;
            const data = await getJson<PatenteRow[]>("camioneta/api/v1/patentes", userId);
            setRows(data);
        } catch (e) {
            console.log("Error cargando patentes", e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargarPatentes();
        }, [])
    );

    const handleCrear = async () => {
        if (!codigoInput.trim()) {
            niceAlert("Error", "Debes ingresar el código de la patente");
            return;
        }

        setCreando(true);
        try {
            const currentUserId = await AsyncStorage.getItem("usuario_id");
            if (!currentUserId) throw new Error("No hay sesión");

            const body = {
                patente: {
                    codigo: codigoInput.trim()
                }
            };

            await postJson("camioneta/api/v1/patentes", body, { Authorization: currentUserId });

            setModalVisible(false);
            setCodigoInput('');
            cargarPatentes();

        } catch (e: any) {
            niceAlert("Error al crear", e.message || "Verifica los datos y la conexión");
        } finally {
            setCreando(false);
        }
    };

    const renderItem = ({ item }: { item: PatenteRow }) => (
        <View style={styles.card}>
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.codigo}</Text>
                <Text style={styles.meta}>ID: {item.id}</Text>
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
                    placeholder="Buscar código de patente..."
                    style={styles.searchInput}
                    autoCapitalize="characters"
                />
            </View>

            <FlatList
                data={filteredRows}
                keyExtractor={r => String(r.id)}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 80 }}
            />

            <View style={styles.footer}>
                <PillButton title="Registrar Patente" onPress={() => setModalVisible(true)} />
            </View>

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Nueva Patente</Text>

                        <Text style={styles.label}>Código</Text>
                        <TextInput
                            style={styles.input}
                            value={codigoInput}
                            onChangeText={setCodigoInput}
                            autoCapitalize="characters"
                        />

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                            <PillButton title="Cancelar" variant="outline" onPress={() => setModalVisible(false)} disabled={creando} />
                            <PillButton title={creando ? "Guardando..." : "Guardar"} onPress={handleCrear} disabled={creando} />
                        </View>
                    </View>
                </View>
            </Modal>
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
    meta: { fontSize: 12, color: '#666', marginTop: 4 },
    footer: { padding: 12, borderTopWidth: 1, borderColor: '#ddd', backgroundColor: 'white' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
    modalBox: { backgroundColor: '#fff', padding: 20, borderRadius: 12 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    label: { fontWeight: '600', marginBottom: 4, marginTop: 12 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16 }
});