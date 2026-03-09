import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, Keyboard, TextInput } from 'react-native';

const CAMPOS_FORMULARIO = [
    { key: 'extintor', label: 'Extintor' },
    { key: 'botiquin', label: 'Botiquín' },
    { key: 'gata', label: 'Gata' },
    { key: 'falta_diclofenaco_cant', label: 'Falta Diclofenaco (Cant)' },
    { key: 'falta_guantes_cant', label: 'Falta Guantes (Cant)' }
];

export default function CheckeoFormScreen() {
    const { height } = useWindowDimensions();
    const scrollRef = useRef<ScrollView>(null);
    const refs = useRef<Array<TextInput | null>>([]);
    const itemY = useRef<number[]>([]);

    const [valores, setValores] = useState<Record<string, string>>({});

    const focusNext = (i: number) => {
        const next = refs.current[i + 1];
        if (next) {
            next.focus();
        } else {
            Keyboard.dismiss();
        }
    };

    const handleFocus = (index: number) => {
        const absoluteY = itemY.current[index] || 0;
        const targetY = Math.max(0, absoluteY - height * 0.25);
        scrollRef.current?.scrollTo({ y: targetY, animated: true });
    };

    return (
        <ScrollView
            ref={scrollRef}
            style={{ flex: 1, backgroundColor: '#f8f9fa' }}
            contentContainerStyle={{ padding: 12, paddingBottom: height * 0.6 }}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.header}>Inspección de Camioneta</Text>

            <View style={styles.block}>
                {CAMPOS_FORMULARIO.map((campo, i) => (
                    <View
                        key={campo.key}
                        style={styles.row}
                        onLayout={e => { itemY.current[i] = e.nativeEvent.layout.y; }}
                    >
                        <Text style={styles.label}>{campo.label}</Text>
                        <TextInput
                            ref={ref => { refs.current[i] = ref; }}
                            value={valores[campo.key] || ''}
                            onChangeText={txt => setValores(prev => ({ ...prev, [campo.key]: txt }))}
                            onFocus={() => handleFocus(i)}
                            onSubmitEditing={() => focusNext(i)}
                            returnKeyType={i === CAMPOS_FORMULARIO.length - 1 ? 'done' : 'next'}
                            style={styles.input}
                        />
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    header: { fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
    block: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12 },
    row: { marginBottom: 16 },
    label: { fontSize: 15, fontWeight: '600', marginBottom: 8, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, fontSize: 16 }
});