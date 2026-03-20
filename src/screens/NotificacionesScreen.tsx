import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import { getJson, patchJson } from '../api/http';
import { niceAlert } from '../components/NiceAlert';

type Notificacion = {
    id: number;
    tipo_notificacion: string | number;
    leida: boolean;
    mensaje: string;
    created_at: string;
};

type Categoria = 'invitacion_chequeo' | 'solicitud_eliminacion' | 'mensaje_error' | 'todas' | null;

const NotificacionItem = ({ item, onRead }: { item: Notificacion, onRead: (id: number, leida: boolean) => void }) => {
    const [expandido, setExpandido] = useState(false);

    const d = new Date(item.created_at);
    const fecha = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    const isLongMessage = item.mensaje.length > 100;

    return (
        <Pressable
            style={[styles.notifCard, !item.leida && styles.notifCardUnread]}
            onPress={() => {
                onRead(item.id, item.leida);
                if (isLongMessage) setExpandido(!expandido);
            }}
        >
            <View style={styles.notifHeader}>
                <Text style={[styles.notifDate, !item.leida && styles.textBold]}>{fecha}</Text>
                {!item.leida && <View style={styles.unreadDot} />}
            </View>
            <Text
                style={[styles.notifMessage, !item.leida && styles.textBold]}
                numberOfLines={expandido ? undefined : 3}
            >
                {item.mensaje}
            </Text>
            {isLongMessage && (
                <Text style={styles.verMasText}>
                    {expandido ? 'Ver menos' : 'Ver más...'}
                </Text>
            )}
        </Pressable>
    );
};

export default function NotificacionesScreen() {
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria>(null);

    const cargarNotificaciones = async () => {
        try {
            const userId = await AsyncStorage.getItem("usuario_id");
            if (!userId) return;
            const data = await getJson<Notificacion[]>("notificaciones", userId);
            setNotificaciones(data);
        } catch (e) {
            niceAlert("Error", "No se pudieron cargar las notificaciones");
        }
    };

    useFocusEffect(
        useCallback(() => {
            cargarNotificaciones();

            const onBackPress = () => {
                if (categoriaSeleccionada) {
                    setCategoriaSeleccionada(null);
                    return true;
                }
                return false;
            };

            const backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => backHandlerSubscription.remove();
        }, [categoriaSeleccionada])
    );

    const marcarComoLeida = async (id: number, leida: boolean) => {
        if (leida) return;
        try {
            const userId = await AsyncStorage.getItem("usuario_id");
            await patchJson(`notificaciones/${id}/marcar_leida`, {}, { Authorization: `Bearer ${userId}` });
            setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
        } catch (e) {}
    };

    const countUnread = (tipo: string | number) => {
        return notificaciones.filter(n => !n.leida && (n.tipo_notificacion === tipo || Number(n.tipo_notificacion) === tipo)).length;
    };

    const countAllUnread = () => notificaciones.filter(n => !n.leida).length;

    const renderCategoria = (titulo: string, icono: string, tipo: Categoria, count: number) => (
        <Pressable style={styles.catRow} onPress={() => setCategoriaSeleccionada(tipo)}>
            <View style={styles.catLeft}>
                <Ionicons name={icono as any} size={28} color="#0A84FF" style={styles.catIcon} />
                <Text style={styles.catTitle}>{titulo}</Text>
            </View>
            <View style={[styles.badge, count === 0 && styles.badgeEmpty]}>
                <Text style={[styles.badgeText, count === 0 && styles.badgeTextEmpty]}>{count}</Text>
            </View>
        </Pressable>
    );

    const getListaFiltrada = () => {
        if (categoriaSeleccionada === 'todas') return notificaciones;
        const catId = categoriaSeleccionada === 'mensaje_error' ? 0 : (categoriaSeleccionada === 'invitacion_chequeo' ? 1 : 2);
        return notificaciones.filter(n => n.tipo_notificacion === categoriaSeleccionada || Number(n.tipo_notificacion) === catId);
    };

    if (categoriaSeleccionada) {
        let headerTitle = "Notificaciones";
        if (categoriaSeleccionada === 'invitacion_chequeo') headerTitle = "Invitaciones";
        if (categoriaSeleccionada === 'solicitud_eliminacion') headerTitle = "Solicitudes";
        if (categoriaSeleccionada === 'mensaje_error') headerTitle = "Reportes";

        return (
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <View style={styles.headerBarActive}>
                    <Pressable
                        onPress={() => setCategoriaSeleccionada(null)}
                        style={styles.backBtn}
                        hitSlop={15}
                    >
                        <Ionicons name="arrow-back" size={26} color="#0A84FF" />
                        <Text style={styles.backBtnText}>Volver</Text>
                    </Pressable>
                    <Text style={styles.headerTitleCenter}>{headerTitle}</Text>
                    <View style={{ width: 80 }} />
                </View>
                <FlatList
                    data={getListaFiltrada()}
                    keyExtractor={n => String(n.id)}
                    renderItem={({ item }) => <NotificacionItem item={item} onRead={marcarComoLeida} />}
                    contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
                    ListEmptyComponent={<Text style={styles.emptyText}>No hay notificaciones en esta categoría.</Text>}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <View style={[styles.headerBar, { paddingHorizontal: 20 }]}>
                <Text style={styles.headerTitle}>Notificaciones</Text>
            </View>
            <View style={styles.listContainer}>
                {renderCategoria("Invitaciones", "person-add-outline", "invitacion_chequeo", countUnread('invitacion_chequeo') || countUnread(1))}
                {renderCategoria("Solicitudes", "document-text-outline", "solicitud_eliminacion", countUnread('solicitud_eliminacion') || countUnread(2))}
                {renderCategoria("Reportes", "warning-outline", "mensaje_error", countUnread('mensaje_error') || countUnread(0))}
                <View style={styles.divider} />
                {renderCategoria("Todas", "grid-outline", "todas", countAllUnread())}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    headerBar: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#eee' },
    headerBarActive: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
    backBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, width: 80 },
    backBtnText: { color: '#0A84FF', fontSize: 14, marginLeft: 4, fontWeight: '500' },
    headerTitle: { flex: 1, color: '#333', fontSize: 20, fontWeight: '700' },
    headerTitleCenter: { color: '#333', fontSize: 18, fontWeight: '700', textAlign: 'center' },
    listContainer: { paddingVertical: 12 },
    catRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, paddingHorizontal: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f1f1' },
    catLeft: { flexDirection: 'row', alignItems: 'center' },
    catIcon: { marginRight: 16 },
    catTitle: { fontSize: 16, color: '#333', fontWeight: '500' },
    badge: { backgroundColor: '#0A84FF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, minWidth: 36, alignItems: 'center' },
    badgeEmpty: { backgroundColor: '#e9ecef' },
    badgeText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    badgeTextEmpty: { color: '#888' },
    divider: { height: 24, backgroundColor: '#f8f9fa' },
    notifCard: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
    notifCardUnread: { backgroundColor: '#eef6ff', borderColor: '#cce5ff' },
    notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    notifDate: { fontSize: 12, color: '#666' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0A84FF' },
    notifMessage: { fontSize: 15, color: '#222', lineHeight: 22 },
    verMasText: { color: '#0A84FF', fontWeight: '600', marginTop: 8, fontSize: 13 },
    textBold: { fontWeight: '700', color: '#111' },
    emptyText: { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 15 }
});