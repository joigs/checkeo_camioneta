import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, TextInput, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import PillButton from '../components/PillButton';

const BOLEANOS = [
    { key: 'botiquin', label: 'Botiquín' },
    { key: 'gata', label: 'Gata' },
    { key: 'cadenas', label: 'Cadenas' },
    { key: 'llave_rueda', label: 'Llave de rueda' },
    { key: 'antena_radio', label: 'Antena de radio' },
    { key: 'permiso_circulacion', label: 'Permiso circulación' },
    { key: 'revision_tecnica', label: 'Revisión técnica' },
    { key: 'soap', label: 'SOAP' },
    { key: 'alcohol', label: 'Alcohol' },
    { key: 'protector_solar', label: 'Protector Solar' },
    { key: 'carpeta', label: 'Carpeta' },
    { key: 'panos_limpieza', label: 'Paños limpieza' },
    { key: 'conos', label: 'Conos (2 un)' },
    { key: 'radio_comunicacion', label: 'Radio comunicación' },
    { key: 'espejo_inspeccion', label: 'Espejo de inspección' },
    { key: 'toldo', label: 'Toldo' },
    { key: 'pie_de_metro', label: 'Pie de metro' },
    { key: 'tintas', label: 'Tintas (revelador y líquido)' },
    { key: 'arnes', label: 'Arnés' }
];

const BOTIQUIN_CANTIDADES = [
    { key: 'falta_diclofenaco_cant', label: 'Cápsulas Diclofenaco', req: 3 },
    { key: 'falta_guantes_cant', label: 'Pares Guantes Vinilo', req: 3 },
    { key: 'falta_parche_curita_cant', label: 'Parches Curita', req: 5 },
    { key: 'falta_gasa_cant', label: 'Gasas No Tejida', req: 10 },
    { key: 'falta_venda_cant', label: 'Venda Elástica', req: 1 },
    { key: 'falta_suero_cant', label: 'Ampollas Suero Fisiológico', req: 3 },
    { key: 'falta_tela_adhesiva_cant', label: 'Tela Adhesiva', req: 1 },
    { key: 'falta_palitos_cant', label: 'Palitos Estabilizadores', req: 6 }
];

export default function CheckeoFormScreen() {
    const { height } = useWindowDimensions();
    const scrollRef = useRef<ScrollView>(null);
    const itemY = useRef<Record<string, number>>({});

    const [valores, setValores] = useState<Record<string, any>>({
        extintor: 0,
        kit_derrame: 0,
    });

    const handleFocus = (key: string) => {
        const absoluteY = itemY.current[key] || 0;
        const targetY = Math.max(0, absoluteY - height * 0.25);
        scrollRef.current?.scrollTo({ y: targetY, animated: true });
    };

    const updateVal = (key: string, val: any) => {
        setValores(prev => ({ ...prev, [key]: val }));
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                ref={scrollRef}
                style={{ flex: 1, backgroundColor: '#f8f9fa' }}
                contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.header}>Inspección de Camioneta</Text>

                <View style={styles.block}>
                    <Text style={styles.sectionTitle}>Estado General</Text>

                    <View style={styles.row}>
                        <Text style={styles.label}>Extintor</Text>
                        <View style={styles.pillGroup}>
                            <PillButton size="sm" title="Sí" variant={valores.extintor === 0 ? 'primary' : 'outline'} onPress={() => updateVal('extintor', 0)} />
                            <PillButton size="sm" title="No" variant={valores.extintor === 1 ? 'primary' : 'outline'} onPress={() => updateVal('extintor', 1)} />
                            <PillButton size="sm" title="Vencido" variant={valores.extintor === 2 ? 'primary' : 'outline'} onPress={() => updateVal('extintor', 2)} />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Kit de Derrame</Text>
                        <View style={styles.pillGroup}>
                            <PillButton size="sm" title="Sí" variant={valores.kit_derrame === 0 ? 'primary' : 'outline'} onPress={() => updateVal('kit_derrame', 0)} />
                            <PillButton size="sm" title="No" variant={valores.kit_derrame === 1 ? 'primary' : 'outline'} onPress={() => updateVal('kit_derrame', 1)} />
                            <PillButton size="sm" title="Sin Pala" variant={valores.kit_derrame === 2 ? 'primary' : 'outline'} onPress={() => updateVal('kit_derrame', 2)} />
                            <PillButton size="sm" title="Sin Bolsa" variant={valores.kit_derrame === 3 ? 'primary' : 'outline'} onPress={() => updateVal('kit_derrame', 3)} />
                        </View>
                    </View>

                    {BOLEANOS.map((campo) => (
                        <View key={campo.key} style={styles.switchRow}>
                            <Text style={styles.label}>{campo.label}</Text>
                            <Switch
                                value={!!valores[campo.key]}
                                onValueChange={(val) => updateVal(campo.key, val)}
                            />
                        </View>
                    ))}
                </View>

                <View style={styles.block}>
                    <Text style={styles.sectionTitle}>Elementos del Botiquín (Cantidades)</Text>
                    {BOTIQUIN_CANTIDADES.map((campo) => (
                        <View
                            key={campo.key}
                            style={styles.row}
                            onLayout={e => { itemY.current[campo.key] = e.nativeEvent.layout.y; }}
                        >
                            <Text style={styles.label}>{campo.label} (Req: {campo.req})</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    value={valores[campo.key]?.toString() || ''}
                                    onChangeText={txt => updateVal(campo.key, txt.replace(/[^0-9]/g, ''))}
                                    onFocus={() => handleFocus(campo.key)}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    style={styles.input}
                                />
                                <Text style={styles.suffix}>/ {campo.req}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    header: { fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
    block: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0A84FF', marginBottom: 12, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 6 },
    row: { marginBottom: 16 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingVertical: 4 },
    label: { fontSize: 15, fontWeight: '600', marginBottom: 8, color: '#333' },
    pillGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, width: 80, textAlign: 'center' },
    suffix: { fontSize: 16, fontWeight: '600', color: '#666', marginLeft: 8 }
});