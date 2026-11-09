import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as QRCode from 'qrcode';
import { Action, Field, Page } from '@/components/MobileUI';
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
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [itemQR, setItemQR] = useState<{code:string;data:string}|null>(null);
  const [photos, setPhotos] = useState<ItemPhoto[]>([]);
  const [history, setHistory] = useState<{id:string;kind:string;title:string;detail:string;occurred_at:string;actor:string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    let active = true;
    if (!token || !id) return () => { active = false; };
    setLoading(true);
    void apiRequest<InventoryItem[]>('/items?include_archived=true', token, tenant?.id)
      .then(async items => { if (active) { const found=items.find(entry => entry.id === id) || null; setItem(found); if(found){setName(found.name);setCategory(found.category);setDescription(found.description || '');setNotes(found.notes || '');setQuantity(String(found.quantity)); const [loaded,events]=await Promise.all([apiRequest<ItemPhoto[]>(`/items/${found.id}/photos`,token,tenant?.id),apiRequest<typeof history>(`/items/${found.id}/history`,token,tenant?.id)]); if(active){setPhotos(Array.isArray(loaded)?loaded:[]);setHistory(Array.isArray(events)?events:[]);}} setError(''); } })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Não foi possível carregar o item.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, token, tenant?.id]));
  useEffect(() => {
    let active = true;
    if (!item?.code) return () => { active = false; };
    void QRCode.toDataURL(item.code, { width: 240, margin: 2, errorCorrectionLevel: 'M' })
      .then(data => { if (active) setItemQR({code:item.code,data}); })
      .catch(() => { if (active) setItemQR(null); });
    return () => { active = false; };
  }, [item?.code]);
  const archived = item?.status === 'Arquivado' || item?.status === 'archived';
  const saveItem = async () => { if(!token||!item)return; const amount=Number(quantity); if(!name.trim()||!Number.isInteger(amount)||amount<1){Alert.alert('Confira os dados','Informe nome e quantidade válida.');return;} setSaving(true); try { const result=await apiRequest<{status:string}>(`/items/${item.id}`,token,tenant?.id,{method:'PUT',body:JSON.stringify({name:name.trim(),category,description:description.trim(),notes:notes.trim(),quantity:amount,location_id:item.location_id||'',container_id:item.container_id||''})}); if(result.status!=='pending')setItem({...item,name:name.trim(),category,description:description.trim(),notes:notes.trim(),quantity:amount}); setEditing(false); Alert.alert(result.status==='pending'?'Solicitação enviada':'Item atualizado',result.status==='pending'?'Um administrador precisa aprovar a alteração.':'As informações foram salvas.'); } catch(e){Alert.alert('Não foi possível salvar',e instanceof Error?e.message:'Tente novamente.');} finally{setSaving(false);} };
  const archiveItem = () => { if(!token||!item)return; Alert.alert('Arquivar item?', 'O histórico de movimentações, empréstimos e vendas será preservado.', [{text:'Cancelar',style:'cancel'},{text:'Arquivar',style:'destructive',onPress:async()=>{try{const result=await apiRequest<{status:string}>('/items/'+item.id,token,tenant?.id,{method:'DELETE'});Alert.alert(result.status==='pending'?'Solicitação enviada':'Item arquivado',result.status==='pending'?'Um administrador precisa aprovar.':'O item foi movido para o arquivo morto.');router.back();}catch(e){Alert.alert('Não foi possível arquivar',e instanceof Error?e.message:'Tente novamente.');}}}]); };
  const deleteLabel = () => { if(!token||!item)return; Alert.alert('Excluir etiqueta atual?', 'O código atual será invalidado e um novo QR será gerado para este item.', [{text:'Cancelar',style:'cancel'},{text:'Excluir e gerar outra',style:'destructive',onPress:async()=>{try{const result=await apiRequest<{code:string;label_issued:boolean}>(`/items/${item.id}/label`,token,tenant?.id,{method:'DELETE'});setItem({...item,code:result.code,label_issued:result.label_issued});const events=await apiRequest<typeof history>(`/items/${item.id}/history`,token,tenant?.id);setHistory(Array.isArray(events)?events:[]);Alert.alert('Nova etiqueta gerada',`O código anterior foi invalidado. Novo código: ${result.code}. Imprima a nova etiqueta.`);}catch(e){Alert.alert('Não foi possível excluir a etiqueta',e instanceof Error?e.message:'Tente novamente.');}}}]); };

  return <Page title="Detalhes do item" subtitle="Confira as informações do item no seu inventário.">
    {loading ? <ActivityIndicator color={theme.accent} /> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {!loading && !error && !item ? <Text style={styles.empty}>Este item não está disponível no espaço atual.</Text> : null}
    {item ? <View style={styles.card}>
      {editing ? <><TextInput style={styles.input} accessibilityLabel="Nome do item" value={name} onChangeText={setName} placeholder="Nome do item"/><TextInput style={styles.input} accessibilityLabel="Categoria" value={category} onChangeText={setCategory} placeholder="Categoria"/><Field label="Descrição (opcional)" value={description} onChangeText={setDescription} placeholder="Detalhes, estado de conservação, medidas…" multiline/><Field label="Anotações (opcional)" value={notes} onChangeText={setNotes} placeholder="Informações para lembrar sobre este item…" multiline/><TextInput style={styles.input} accessibilityLabel="Quantidade" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="Quantidade"/><Action label={saving?'Salvando…':'Salvar alteração'} onPress={()=>void saveItem()}/><Action label="Cancelar edição" secondary onPress={()=>setEditing(false)}/></> : <Text style={styles.name}>{item.name}</Text>}
      {photos.length ? <View style={styles.photos}>{photos.map(photo => <Image key={photo.id} source={{uri:photo.data_url}} style={styles.photo} resizeMode="cover" accessibilityLabel={`Foto do item ${item.name}`} />)}</View> : <Text style={styles.photoEmpty}>Nenhuma foto cadastrada para este item.</Text>}
      <View style={styles.row}><Text style={styles.label}>Categoria</Text><Text style={styles.value}>{item.category || 'Sem categoria'}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Descrição</Text><Text style={styles.value}>{item.description?.trim() || 'Sem descrição cadastrada.'}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Anotações</Text><Text style={styles.value}>{item.notes?.trim() || 'Sem anotações cadastradas.'}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Local</Text><Text style={styles.value}>{item.location || 'Sem local'}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Recipiente</Text><Text style={styles.value}>{item.container || 'Nenhum'}</Text></View>
      <View style={styles.itemLabel} accessibilityLabel="Etiqueta QR do item">
        <View style={styles.itemLabelCopy}><Text style={styles.labelBrand}>a. achei</Text><Text style={styles.labelKind}>ITEM</Text><Text style={styles.itemLabelName}>{item.name}</Text><Text style={styles.itemLabelLocation}>{item.location || 'Sem local'} · {item.container || 'Nenhum'}</Text><Text style={styles.itemLabelCode}>{item.code}</Text></View>
        {itemQR?.code === item.code ? <Image source={{uri:itemQR.data}} style={styles.itemQR} accessibilityLabel={`QR da etiqueta ${item.code}`} /> : <ActivityIndicator color={theme.accent} />}
      </View>
      <View style={styles.row}><Text style={styles.label}>Quantidade disponível</Text><Text style={styles.value}>{item.available_quantity} de {item.quantity}</Text></View>
      {archived ? <Text style={styles.archived}>Item arquivado</Text> : null}
    </View> : null}
    {item && !editing ? <Action label="Editar item" secondary onPress={()=>{setName(item.name);setCategory(item.category);setDescription(item.description||'');setNotes(item.notes||'');setQuantity(String(item.quantity));setEditing(true);}} /> : null}
    {item && !editing && !archived ? <Action label="Arquivar item" secondary onPress={archiveItem} /> : null}
    {item && !editing ? <Action label={item.label_issued ? 'Reimprimir etiqueta · já emitida' : 'Imprimir etiqueta'} secondary onPress={() => void (async()=>{try{await printInventoryLabel({ name: item.name, code: item.code, kind: 'ITEM', location: item.location, container: item.container });await apiRequest(`/items/${item.id}/label-issued`,token!,tenant?.id,{method:'POST'});setItem({...item,label_issued:true});}catch(e){Alert.alert('Não foi possível imprimir',e instanceof Error?e.message:'Tente novamente.');}})()} /> : null}
    {item && !editing && !archived ? <Action label="Excluir etiqueta e gerar outra" secondary onPress={deleteLabel} /> : null}
    {item && !archived && !editing ? <Action label="Ler QR para solicitar empréstimo" secondary onPress={() => router.push('/scan')} /> : null}
    {item && history.length ? <View style={styles.card}><Text style={styles.name}>Histórico</Text>{history.map(event=><View key={event.id} style={styles.row}><Text style={styles.label}>{event.title} · {new Date(event.occurred_at).toLocaleString('pt-BR')}</Text><Text style={styles.value}>{event.detail}{event.actor ? ` · ${event.actor}` : ''}</Text></View>)}</View> : null}
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
  itemLabel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 13, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.border, borderRadius: 12, backgroundColor: '#FFFFFF' },
  itemLabelCopy: { flex: 1, minWidth: 0, gap: 5 },
  labelBrand: { color: theme.ink, fontSize: 12, fontWeight: '800' },
  labelKind: { color: theme.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  itemLabelName: { color: theme.ink, fontSize: 15, fontWeight: '800' },
  itemLabelLocation: { color: theme.muted, fontSize: 11 },
  itemLabelCode: { color: theme.ink, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  itemQR: { width: 96, height: 96, flexShrink: 0 },
  archived: { color: theme.muted, fontSize: 13, fontWeight: '700' },
  empty: { color: theme.muted, fontSize: 14 },
  error: { color: '#A32F21' },
});
