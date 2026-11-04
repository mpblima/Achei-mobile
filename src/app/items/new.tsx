import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Action, Field, Page } from '@/components/MobileUI';
import { apiRequest } from '@/lib/api';
import { useMobileSession } from '@/lib/session';
import { theme } from '@/lib/theme';
import type { InventoryLocation } from '@/lib/types';

async function preparePhoto(uri: string) {
  const context = ImageManipulator.ImageManipulator.manipulate(uri, { maxWidth: 1600, maxHeight: 1600 });
  const rendered = await context.renderAsync();
  const compressed = await rendered.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress: 0.7, base64: true });
  context.release();
  rendered.release();
  if (!compressed.base64) throw new Error('Não foi possível preparar a foto.');
  return `data:image/jpeg;base64,${compressed.base64}`;
}

export default function NewItemScreen() {
  const { token, tenant } = useMobileSession();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [locationID, setLocationID] = useState('');
  const [containerID, setContainerID] = useState('');
  const [photoDataURL, setPhotoDataURL] = useState('');
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (token) void apiRequest<InventoryLocation[]>('/locations', token, tenant?.id).then(setLocations).catch(e => setError(e.message)); }, [token, tenant?.id]);
  useEffect(() => {
    let active = true;
    void ImagePicker.getPendingResultAsync().then(async result => {
      if (!active || !result) return;
      if ('assets' in result && !result.canceled && result.assets[0]) {
        try { setPhotoDataURL(await preparePhoto(result.assets[0].uri)); }
        catch (e) { if (active) setError(e instanceof Error ? e.message : 'Não foi possível recuperar a foto.'); }
      } else if ('code' in result) setError(result.message || 'Não foi possível recuperar a foto.');
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Não foi possível recuperar a foto.'); });
    return () => { active = false; };
  }, []);
  const rooms = locations.filter(loc => ['Casa', 'Cômodo', 'Local'].includes(loc.kind));
  const containers = locations.filter(loc => loc.kind === 'Recipiente');
  async function takePhoto() {
    setError('');
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { setError('Permita o acesso à câmera para fotografar o item.'); return; }
    try {
      // Leave the crop ratio open so Android's native editor lets the user
      // choose the framing and zoom before we normalize the image.
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.9 });
      if (result.canceled) return;
      setPhotoDataURL(await preparePhoto(result.assets[0].uri));
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível tirar a foto.'); }
  }
  async function choosePhoto() {
    setError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError('Permita o acesso às fotos para escolher a imagem do item.'); return; }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.9 });
      if (result.canceled) return;
      setPhotoDataURL(await preparePhoto(result.assets[0].uri));
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível escolher a foto.'); }
  }
  async function save() {
    if (!token) return;
    const amount = Number(quantity);
    if (!name.trim() || !Number.isInteger(amount) || amount < 1) { setError('Informe o nome e uma quantidade inteira válida.'); return; }
    setSaving(true); setError('');
    try {
      const item = await apiRequest<{ id: string }>('/items', token, tenant?.id, { method: 'POST', body: JSON.stringify({ name: name.trim(), category: category.trim(), quantity: amount, location_id: locationID || undefined, container_id: containerID || undefined }) });
      if (photoDataURL) {
        try { await apiRequest(`/items/${item.id}/photos`, token, tenant?.id, { method: 'POST', body: JSON.stringify({ data_url: photoDataURL }) }); }
        catch { Alert.alert('Item cadastrado', 'O item foi salvo, mas a foto não foi enviada. Você pode adicionar a foto depois pelo Achei Web.'); router.replace('/items'); return; }
      }
      Alert.alert('Item cadastrado', photoDataURL ? 'O item e sua foto foram salvos.' : 'O QR da etiqueta foi criado. Você poderá etiquetar o item ou somente o recipiente.');
      router.replace('/items');
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível cadastrar o item.'); }
    finally { setSaving(false); }
  }
  function review() {
    const amount = Number(quantity);
    if (!name.trim() || !Number.isInteger(amount) || amount < 1) { setError('Informe o nome e uma quantidade inteira válida.'); return; }
    setError('');
    setReviewing(true);
  }
  const selectedLocation = locations.find(loc => loc.id === locationID);
  const selectedContainer = locations.find(loc => loc.id === containerID);
  return <Page title={reviewing ? 'Revisar cadastro' : 'Cadastrar item'} subtitle={reviewing ? 'Confira os dados antes de salvar o item.' : 'Registre o que existe no tenant e onde está guardado.'}>
    {!reviewing ? <>
    <Field label="Nome do item" value={name} onChangeText={setName} placeholder="Ex.: Copos de vidro" />
    <Field label="Categoria" value={category} onChangeText={setCategory} placeholder="Ex.: Cozinha" />
    <Field label="Quantidade" value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="1" />
    <View style={styles.block}><Text style={styles.label}>Foto do item (opcional)</Text>{photoDataURL ? <Image source={{ uri: photoDataURL }} style={styles.preview} resizeMode="contain" /> : null}<Text style={styles.helper}>Ajuste o zoom e escolha o enquadramento antes de usar a foto.</Text><Action label={photoDataURL ? 'Tirar outra foto' : 'Tirar foto com a câmera'} onPress={() => void takePhoto()} secondary /><Action label="Escolher foto da galeria" onPress={() => void choosePhoto()} secondary /></View>
    <View style={styles.block}><Text style={styles.label}>Local</Text><View style={styles.options}>{rooms.map(loc => <Pressable key={loc.id} onPress={() => setLocationID(loc.id)} style={[styles.option, locationID === loc.id && styles.selected]}><Text style={[styles.optionText, locationID === loc.id && styles.selectedText]}>{loc.name}</Text></Pressable>)}</View></View>
    <View style={styles.block}><Text style={styles.label}>Recipiente (opcional)</Text><View style={styles.options}>{containers.map(loc => <Pressable key={loc.id} onPress={() => setContainerID(containerID === loc.id ? '' : loc.id)} style={[styles.option, containerID === loc.id && styles.selected]}><Text style={[styles.optionText, containerID === loc.id && styles.selectedText]}>{loc.name}</Text></Pressable>)}</View><Text style={styles.helper}>As etiquetas por item são opcionais. Você também pode identificar apenas um recipiente.</Text></View>
    </> : <View style={styles.reviewCard}>
      {photoDataURL ? <Image source={{ uri: photoDataURL }} style={styles.preview} resizeMode="cover" /> : null}
      <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Item</Text><Text style={styles.reviewValue}>{name.trim()}</Text></View>
      <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Categoria</Text><Text style={styles.reviewValue}>{category.trim() || 'Sem categoria'}</Text></View>
      <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Quantidade</Text><Text style={styles.reviewValue}>{quantity}</Text></View>
      <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Local</Text><Text style={styles.reviewValue}>{selectedLocation?.name || 'Sem local selecionado'}</Text></View>
      <View style={styles.reviewRow}><Text style={styles.reviewLabel}>Recipiente</Text><Text style={styles.reviewValue}>{selectedContainer?.name || 'Nenhum'}</Text></View>
      {!photoDataURL ? <Text style={styles.helper}>Sem foto</Text> : null}
    </View>}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {reviewing ? <>
      <Action label="Editar informações" secondary disabled={saving} onPress={() => { setError(''); setReviewing(false); }} />
      <Action label={saving ? 'Salvando…' : 'Confirmar cadastro'} disabled={saving} onPress={() => void save()} />
    </> : <Action label="Revisar cadastro" onPress={review} />}
  </Page>;
}
const styles = StyleSheet.create({ block: { gap: 9 }, label: { color: theme.ink, fontSize: 13, fontWeight: '700' }, preview: { width: '100%', height: 220, borderRadius: 14, backgroundColor: theme.pale }, reviewCard: { gap: 14, padding: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 17 }, reviewRow: { gap: 4 }, reviewLabel: { color: theme.muted, fontSize: 12 }, reviewValue: { color: theme.ink, fontSize: 15, fontWeight: '700' }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, option: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 }, selected: { backgroundColor: theme.ink, borderColor: theme.ink }, optionText: { color: theme.ink, fontSize: 13 }, selectedText: { color: '#FFF', fontWeight: '700' }, helper: { color: theme.muted, fontSize: 12, lineHeight: 17 }, error: { color: '#A32F21' } });
