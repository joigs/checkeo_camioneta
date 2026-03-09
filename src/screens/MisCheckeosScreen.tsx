import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import PillButton from '../components/PillButton';
import { getJson, postJson } from '../api/http';
import { niceAlert } from '../components/NiceAlert';

type CheckeoRow = {
    id: number;
    check_patente_id: number;
    fecha_chequeo: string;
    completado: boolean;
};

export default function MisCheckeosScreen() {
    const nav = useNavigation<any>();
    const [rows, setRows] = useState<CheckeoRow[]>([]);
    const [query, setQuery] = useState('');

    const [modalVisible, setModalVisible] = useState(false);
    const [patenteIdInput, setPatenteIdInput] = useState('');
    const [usuariosIdsInput, setUsuariosIdsInput] = useState('');
    const [creando, setCreando] = useState(false);

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
            console.log("Error cargando checkeos", e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargarCheckeos();
        }, [])
    );

    const handleCrear = async () => {
        if (!patenteIdInput.trim()) {
            niceAlert("Error", "Debes ingresar un ID de patente");
            return;
        }

        setCreando(true);
        try {
            const currentUserId = await AsyncStorage.getItem("usuario_id");
            if (!currentUserId) throw new Error("No hay sesión");

            let usuariosArray = usuariosIdsInput.split(",").map(id => id.trim()).filter(id => id !== "");
            if (!usuariosArray.includes(currentUserId)) {
                usuariosArray.push(currentUserId);
            }

            const body = {
                checkeo: {
                    check_patente_id: parseInt(patenteIdInput, 10),
                    fecha_chequeo: new Date().toISOString().split('T')[0]
                },
                usuario_ids: usuariosArray
            };

            await postJson("camioneta/api/v1/checkeos", body, { Authorization: currentUserId });

            setModalVisible(false);
            setPatenteIdInput('');
            setUsuariosIdsInput('');
            cargarCheckeos();

        } catch (e: any) {
            niceAlert("Error al crear", e.message || "Verifica los datos y la conexión");
        } finally {
            setCreando(false);
        }
    };

    const renderItem = ({ item }: { item: CheckeoRow }) => (
        <View style={styles.card}>
            <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.title}>Patente ID: {item.check_patente_id}</Text>
                <Text style={styles.meta}>Fecha: {item.fecha_chequeo}</Text>
                <Text style={[styles.meta, { color: item.completado ? 'green' : 'orange' }]}>
                    {item.completado ? 'Completado' : 'Pendiente'}
                </Text>
            </View>
            <View style={{ width: 100, gap: 6 }}>
                <PillButton title="Realizar" onPress={() => nav.navigate('CheckeoForm', { checkeoId: item.id })} />
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

            <View style={styles.footer}>
                <PillButton title="Crear Nuevo Chequeo" onPress={() => setModalVisible(true)} />
            </View>

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Nuevo Chequeo</Text>

                        <Text style={styles.label}>ID Patente</Text>
                        <TextInput
                            style={styles.input}
                            value={patenteIdInput}
                            onChangeText={setPatenteIdInput}
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Otros Inspectores (IDs separados por coma)</Text>
                        <TextInput
                            style={styles.input}
                            value={usuariosIdsInput}
                            onChangeText={setUsuariosIdsInput}
                            placeholder="Ej: 2, 5"
                        />

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                            <PillButton title="Cancelar" variant="outline" onPress={() => setModalVisible(false)} disabled={creando} />
                            <PillButton title={creando ? "Creando..." : "Guardar"} onPress={handleCrear} disabled={creando} />
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
    title: { fontSize: 16, fontWeight: '600' },
    meta: { fontSize: 12, color: '#666', marginTop: 4 },
    footer: { padding: 12, borderTopWidth: 1, borderColor: '#ddd', backgroundColor: 'white' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
    modalBox: { backgroundColor: '#fff', padding: 20, borderRadius: 12 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    label: { fontWeight: '600', marginBottom: 4, marginTop: 12 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16 }
});