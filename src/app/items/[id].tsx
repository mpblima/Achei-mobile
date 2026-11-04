import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Action, Page } from '@/components/MobileUI';
import { apiRequest } from '@/lib/api';
import { useMobileSession } from '@/lib/session';
import { theme } from '@/lib/theme';
import { printInventoryLabel } from '@/lib/printLabel';
import type { InventoryItem, ItemPhoto } from '@/lib/types';

export default function ItemDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, tenant } = useMobileSession();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [photos, setPhotos] = useState<ItemPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    let active = true;
    if (!token || !id) return () => { active = false; };
    setLoading(true);
    void apiRequest<InventoryItem[]>('/items?include_archived=true', token, tenant?.id)
      .then(async items => { if (active) { const found=items.find(entry => entry.id === id) || null; setItem(found); if(found){setName(found.name);setCategory(found.category);setQuantity(String(found.quantity)); const loaded=await apiRequest<ItemPhoto[]>(`/items/${found.id}/photos`,token,tenant?.id); if(active)setPhotos(Array.isArray(loaded)?loaded:[]);} setError(''); } })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Não foi possível carregar o item.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, token, tenant?.id]));
  const archived = item?.status === 'Arquivado' || item?.status === 'archived';
  const saveItem = async () => { if(!token||!item)return; const amount=Number(quantity); if(!name.trim()||!Number.isInteger(amount)||amount<1){Alert.alert('Confira os dados','Informe nome e quantidade válida.');return;} setSaving(true); try { const result=await apiRequest<{status:string}>(`/items/${item.id}`,token,tenant?.id,{method:'PUT',body:JSON.stringify({name:name.trim(),category,quantity:amount,location_id:item.location_id||'',container_id:item.container_id||''})}); setEditing(false); Alert.alert(result.status==='pending'?'Solicitação enviada':'Item atualizado',result.status==='pending'?'Um administrador precisa aprovar a alteração.':'As informações foram salvas.'); } catch(e){Alert.alert('Não foi possível salvar',e instanceof Error?e.message:'Tente novamente.');} finally{setSaving(false);} };
  const archiveItem = () => { if(!token||!item)return; Alert.alert('Arquivar item?', 'O histórico de movimentações, empréstimos e vendas será preservado.', [{text:'Cancelar',style:'cancel'},{text:'Arquivar',style:'destructive',onPress:async()=>{try{const result=await apiRequest<{status:string}>('/items/'+item.id,token,tenant?.id,{method:'DELETE'});Alert.alert(result.status==='pending'?'Solicitação enviada':'Item arquivado',result.status==='pending'?'Um administrador precisa aprovar.':'O item foi movido para o arquivo morto.');router.back();}catch(e){Alert.alert('Não foi possível arquivar',e instanceof Error?e.message:'Tente novamente.');}}}]); };

  return <Page title="Detalhes do item" subtitle="Confira as informações do item no seu inventário.">
    {loading ? <ActivityIndicator color={theme.accent} /> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {!loading && !error && !item ? <Text style={styles.empty}>Este item não está disponível no espaço atual.</Text> : null}
    {item ? <View style={styles.card}>
      {editing ? <><TextInput style={styles.input} accessibilityLabel="Nome do item" value={name} onChangeText={setName} placeholder="Nome do item"/><TextInput style={styles.input} accessibilityLabel="Categoria" value={category} onChangeText={setCategory} placeholder="Categoria"/><TextInput style={styles.input} accessibilityLabel="Quantidade" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="Quantidade"/><Action label={saving?'Salvando…':'Salvar alteração'} onPress={()=>void saveItem()}/><Action label="Cancelar edição" secondary onPress={()=>setEditing(false)}/></> : <Text style={styles.name}>{item.name}</Text>}
      {photos.length ? <View style={styles.photos}>{photos.map(photo => <Image key={photo.id} source={{uri:photo.data_url}} style={styles.photo} resizeMode="cover" accessibilityLabel={`Foto do item ${item.name}`} />)}</View> : <Text style={styles.photoEmpty}>Nenhuma foto cadastrada para este item.</Text>}
      <View style={styles.row}><Text style={styles.label}>Categoria</Text><Text style={styles.value}>{item.category || 'Sem categoria'}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Local</Text><Text style={styles.value}>{item.location || 'Sem local'}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Recipiente</Text><Text style={styles.value}>{item.container || 'Nenhum'}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Quantidade disponível</Text><Text style={styles.value}>{item.available_quantity} de {item.quantity}</Text></View>
      {archived ? <Text style={styles.archived}>Item arquivado</Text> : null}
    </View> : null}
    {item && !editing ? <Action label="Editar item" secondary onPress={()=>setEditing(true)} /> : null}
    {item && !editing && !archived ? <Action label="Arquivar item" secondary onPress={archiveItem} /> : null}
    {item && !editing ? <Action label={item.label_issued ? 'Reimprimir etiqueta · já emitida' : 'Imprimir etiqueta'} secondary onPress={() => void (async()=>{try{await printInventoryLabel({ name: item.name, code: item.code, kind: 'ITEM', location: item.location, container: item.container });await apiRequest(`/items/${item.id}/label-issued`,token!,tenant?.id,{method:'POST'});setItem({...item,label_issued:true});}catch(e){Alert.alert('Não foi possível imprimir',e instanceof Error?e.message:'Tente novamente.');}})()} /> : null}
    {item && !archived && !editing ? <Action label="Ler QR para solicitar empréstimo" secondary onPress={() => router.push('/scan')} /> : null}
  </Page>;
}

const styles = StyleSheet.create({
  card: { gap: 15, padding: 17, borderRadius: 17, backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 },
  name: { color: theme.ink, fontSize: 19, fontWeight: '800' },
  photos: { gap: 10 },
  photo: { width: '100%', height: 230, borderRadius: 14, backgroundColor: theme.pale },
  photoEmpty: { color: theme.muted, fontSize: 12 },
  input: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: theme.ink, backgroundColor: theme.background },
  row: { gap: 4 },
  label: { color: theme.muted, fontSize: 12 },
  value: { color: theme.ink, fontSize: 15, fontWeight: '600' },
  archived: { color: theme.muted, fontSize: 13, fontWeight: '700' },
  empty: { color: theme.muted, fontSize: 14 },
  error: { color: '#A32F21' },
});
