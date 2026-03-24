import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, Modal, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import PillButton from '../components/PillButton';
import { getJson, postJson } from '../api/http';
import { niceAlert } from '../components/NiceAlert';

type CheckeoRow = {
    id: number;
    check_patente?: { codigo: string };
    fecha_chequeo: string;
    completado: boolean;
    conforme?: boolean;
    check_usuarios: any[];
};

export default function MisCheckeosScreen() {
    const nav = useNavigation<any>();
    const [rows, setRows] = useState<CheckeoRow[]>([]);
    const [query, setQuery] = useState('');

    const [modalVisible, setModalVisible] = useState(false);
    const [patenteCodigoInput, setPatenteCodigoInput] = useState('');

    const [allPatentes, setAllPatentes] = useState<any[]>([]);
    const [allUsuarios, setAllUsuarios] = useState<any[]>([]);
    const [showPatentesList, setShowPatentesList] = useState(false);
    const [showUsuariosList, setShowUsuariosList] = useState(false);

    const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<{id: string, nombre: string}[]>([]);
    const [usuarioSearch, setUsuarioSearch] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [creando, setCreando] = useState(false);

    const qNorm = useMemo(() => query.toLowerCase().trim(), [query]);
    const filteredRows = useMemo(() => {
        if (!qNorm) return rows;
        return rows.filter(r => (r.check_patente?.codigo || '').toLowerCase().includes(qNorm));
    }, [rows, qNorm]);

    const cargarCheckeos = async () => {
        try {
            const userId = await AsyncStorage.getItem("usuario_id");
            setCurrentUserId(userId);
            if (!userId) return;
            const data = await getJson<CheckeoRow[]>("checkeos", userId);
            const misCheckeos = data.filter(c => c.check_usuarios?.some(u => String(u.id) === userId));
            setRows(misCheckeos);
        } catch (e) {
            niceAlert("Error", "No se pudieron cargar las inspecciones");
        }
    };

    const cargarOpcionesModal = async () => {
        try {
            const userId = await AsyncStorage.getItem("usuario_id");
            if (!userId) return;
            const pData = await getJson<any[]>("patentes", userId);
            const uData = await getJson<any[]>("usuarios", userId);
            setAllPatentes(pData);
            setAllUsuarios(uData);
        } catch (e) {}
    };

    useFocusEffect(
        useCallback(() => {
            cargarCheckeos();
        }, [])
    );

    const abrirModal = () => {
        setPatenteCodigoInput('');
        setUsuarioSearch('');
        setUsuariosSeleccionados([]);
        setShowPatentesList(false);
        setShowUsuariosList(false);
        setModalVisible(true);
        cargarOpcionesModal();
    };

    const handleCrear = async () => {
        if (!patenteCodigoInput.trim()) {
            niceAlert("Error", "Debes ingresar o seleccionar el código de la patente");
            return;
        }

        setCreando(true);
        try {
            if (!currentUserId) throw new Error("No hay sesión");

            let usuariosArray = usuariosSeleccionados.map(u => String(u.id));
            if (!usuariosArray.includes(currentUserId)) {
                usuariosArray.push(currentUserId);
            }

            const body = {
                checkeo: {
                    patente_codigo: patenteCodigoInput.trim().toUpperCase(),
                    fecha_chequeo: new Date().toISOString().split('T')[0]
                },
                usuario_ids: usuariosArray
            };

            await postJson("checkeos", body, { Authorization: `Bearer ${currentUserId}` });

            setModalVisible(false);
            cargarCheckeos();

        } catch (e: any) {
            niceAlert("No se pudo crear", e.message);
        } finally {
            setCreando(false);
        }
    };

    const formatFecha = (f: string) => f ? f.split('-').reverse().join('/') : '';

    const renderItem = ({ item }: { item: CheckeoRow }) => {
        const esHoy = item.fecha_chequeo === new Date().toISOString().split('T')[0];

        const otrosInspectores = item.check_usuarios
            ?.filter((u: any) => String(u.id) !== String(currentUserId))
            .map((u: any) => u.nombre)
            .join(', ');

        const textoInspectores = otrosInspectores ? otrosInspectores : '(Solo tú)';

        return (
            <View style={styles.card}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.title}>Patente: {item.check_patente?.codigo || 'Sin código'}</Text>
                    <Text style={styles.meta}>Fecha: {formatFecha(item.fecha_chequeo)}</Text>
                    <Text style={styles.meta}>Otros inspectores: <Text style={{ color: '#333' }}>{textoInspectores}</Text></Text>
                    <Text style={[styles.meta, { color: item.completado ? 'green' : 'orange' }]}>
                        {item.completado ? 'Completada' : 'Pendiente'}
                        {item.completado ? <Text style={{ color: item.conforme ? 'green' : 'red' }}> • {item.conforme ? 'Conforme' : 'No Conforme'}</Text> : null}
                    </Text>
                </View>
                <View style={{ width: 100, gap: 6 }}>
                    <PillButton
                        title={esHoy ? "Realizar" : "Corregir"}
                        onPress={() => nav.navigate('CheckeoForm', { checkeoId: item.id })}
                    />
                </View>
            </View>
        );
    };

    const patentesFiltradas = allPatentes.filter(p => p.codigo.toLowerCase().startsWith(patenteCodigoInput.toLowerCase()));
    const usuariosFiltrados = allUsuarios.filter(u =>
        u.nombre.toLowerCase().includes(usuarioSearch.toLowerCase()) &&
        !usuariosSeleccionados.some(sel => sel.id === u.id) &&
        String(u.id) !== currentUserId
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['left', 'right']}>
            <View style={styles.searchWrap}>
                <Text style={styles.searchIcon}>🔎</Text>
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Buscar patente..."
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
                <PillButton title="Crear Nueva Inspección" onPress={abrirModal} />
            </View>

            <Modal visible={modalVisible} animationType="fade" transparent={true} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
                    <View
                        style={styles.modalBox}
                        onStartShouldSetResponder={() => { setShowPatentesList(false); setShowUsuariosList(false); return false; }}
                    >
                        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
                            <Text style={styles.modalTitle}>Nueva Inspección</Text>

                            <Text style={styles.label}>Código Patente</Text>
                            <View style={{ zIndex: 2 }}>
                                <TextInput
                                    style={styles.input}
                                    value={patenteCodigoInput}
                                    onChangeText={(val) => { setPatenteCodigoInput(val); setShowPatentesList(true); setShowUsuariosList(false); }}
                                    onFocus={() => { setShowPatentesList(true); setShowUsuariosList(false); }}
                                    placeholder=" "
                                    autoCapitalize="characters"
                                />
                                {showPatentesList && patentesFiltradas.length > 0 && (
                                    <View style={styles.autocompleteList}>
                                        <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
                                            {patentesFiltradas.map(p => (
                                                <Pressable key={p.id} style={styles.autocompleteItem} onPress={() => { setPatenteCodigoInput(p.codigo); setShowPatentesList(false); }}>
                                                    <Text style={styles.autocompleteText}>{p.codigo}</Text>
                                                </Pressable>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            <Text style={styles.label}>Otros Inspectores</Text>
                            <View style={{ zIndex: 1 }}>
                                <TextInput
                                    style={styles.input}
                                    value={usuarioSearch}
                                    onChangeText={(val) => { setUsuarioSearch(val); setShowUsuariosList(true); setShowPatentesList(false); }}
                                    onFocus={() => { setShowUsuariosList(true); setShowPatentesList(false); }}
                                    placeholder="Buscar usuario..."
                                />
                                {showUsuariosList && usuariosFiltrados.length > 0 && (
                                    <View style={styles.autocompleteList}>
                                        <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
                                            {usuariosFiltrados.map(u => (
                                                <Pressable key={u.id} style={styles.autocompleteItem} onPress={() => { setUsuariosSeleccionados([...usuariosSeleccionados, u]); setUsuarioSearch(''); setShowUsuariosList(false); }}>
                                                    <Text style={styles.autocompleteText}>{u.nombre}</Text>
                                                </Pressable>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            <View style={styles.chipsContainer}>
                                {usuariosSeleccionados.map(u => (
                                    <View key={u.id} style={styles.chip}>
                                        <Text style={styles.chipText}>{u.nombre}</Text>
                                        <Pressable onPress={() => setUsuariosSeleccionados(usuariosSeleccionados.filter(sel => sel.id !== u.id))}>
                                            <Text style={styles.chipClose}>✕</Text>
                                        </Pressable>
                                    </View>
                                ))}
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                                <PillButton title="Cancelar" variant="outline" onPress={() => setModalVisible(false)} disabled={creando} />
                                <PillButton title={creando ? "Creando..." : "Guardar"} onPress={handleCrear} disabled={creando} />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    searchWrap: { marginHorizontal: 12, marginTop: 12, marginBottom: 12, backgroundColor: '#F2F4F7', borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8 },
    searchIcon: { marginRight: 8, fontSize: 14 },
    searchInput: { flex: 1, fontSize: 14, color: '#111', paddingVertical: 0 },
    card: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderColor: '#ddd', alignItems: 'center' },
    title: { fontSize: 16, fontWeight: '600' },
    meta: { fontSize: 12, color: '#666', marginTop: 4 },
    footer: { padding: 12, borderTopWidth: 1, borderColor: '#ddd', backgroundColor: 'white' },
    modalBackdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20, zIndex: 999 },
    modalBox: { backgroundColor: '#fff', padding: 20, borderRadius: 12, maxHeight: '80%' },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    label: { fontWeight: '600', marginBottom: 4, marginTop: 12 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16 },
    autocompleteList: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderTopWidth: 0, maxHeight: 150, position: 'absolute', top: 44, left: 0, right: 0, borderRadius: 8, borderTopLeftRadius: 0, borderTopRightRadius: 0, elevation: 5, zIndex: 10 },
    autocompleteItem: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
    autocompleteText: { fontSize: 15, color: '#333' },
    chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e2e3e5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    chipText: { fontSize: 14, color: '#333', marginRight: 6 },
    chipClose: { fontSize: 14, color: '#888', fontWeight: '700', paddingHorizontal: 4 }
});