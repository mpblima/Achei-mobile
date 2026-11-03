import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, Field, Page } from '@/components/MobileUI';
import { apiRequest } from '@/lib/api';
import { useMobileSession } from '@/lib/session';
import { theme } from '@/lib/theme';
import type { InventoryLocation } from '@/lib/types';

export default function NewItemScreen() {
  const { token, tenant } = useMobileSession();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [locationID, setLocationID] = useState('');
  const [containerID, setContainerID] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (token) void apiRequest<InventoryLocation[]>('/locations', token, tenant?.id).then(setLocations).catch(e => setError(e.message)); }, [token, tenant?.id]);
  const rooms = locations.filter(loc => ['Casa', 'Cômodo', 'Local'].includes(loc.kind));
  const containers = locations.filter(loc => loc.kind === 'Recipiente');
  async function save() {
    if (!token) return;
    const amount = Number(quantity);
    if (!name.trim() || !Number.isInteger(amount) || amount < 1) { setError('Informe o nome e uma quantidade inteira válida.'); return; }
    setSaving(true); setError('');
    try {
      await apiRequest('/items', token, tenant?.id, { method: 'POST', body: JSON.stringify({ name: name.trim(), category: category.trim(), quantity: amount, location_id: locationID || undefined, container_id: containerID || undefined }) });
      Alert.alert('Item cadastrado', 'O QR da etiqueta foi criado. Você poderá etiquetar o item ou somente o recipiente.');
      router.replace('/items');
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível cadastrar o item.'); }
    finally { setSaving(false); }
  }
  return <Page title="Cadastrar item" subtitle="Registre o que existe no tenant e onde está guardado.">
    <Field label="Nome do item" value={name} onChangeText={setName} placeholder="Ex.: Copos de vidro" />
    <Field label="Categoria" value={category} onChangeText={setCategory} placeholder="Ex.: Cozinha" />
    <Field label="Quantidade" value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="1" />
    <View style={styles.block}><Text style={styles.label}>Local</Text><View style={styles.options}>{rooms.map(loc => <Pressable key={loc.id} onPress={() => setLocationID(loc.id)} style={[styles.option, locationID === loc.id && styles.selected]}><Text style={[styles.optionText, locationID === loc.id && styles.selectedText]}>{loc.name}</Text></Pressable>)}</View></View>
    <View style={styles.block}><Text style={styles.label}>Recipiente (opcional)</Text><View style={styles.options}>{containers.map(loc => <Pressable key={loc.id} onPress={() => setContainerID(containerID === loc.id ? '' : loc.id)} style={[styles.option, containerID === loc.id && styles.selected]}><Text style={[styles.optionText, containerID === loc.id && styles.selectedText]}>{loc.name}</Text></Pressable>)}</View><Text style={styles.helper}>As etiquetas por item são opcionais. Você também pode identificar apenas um recipiente.</Text></View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Action label={saving ? 'Salvando…' : 'Cadastrar item'} disabled={saving} onPress={() => void save()} />
  </Page>;
}
const styles = StyleSheet.create({ block: { gap: 9 }, label: { color: theme.ink, fontSize: 13, fontWeight: '700' }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, option: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 }, selected: { backgroundColor: theme.ink, borderColor: theme.ink }, optionText: { color: theme.ink, fontSize: 13 }, selectedText: { color: '#FFF', fontWeight: '700' }, helper: { color: theme.muted, fontSize: 12, lineHeight: 17 }, error: { color: '#A32F21' } });
