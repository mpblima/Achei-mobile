import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Action, Page } from '@/components/MobileUI';
import { apiRequest } from '@/lib/api';
import { useMobileSession } from '@/lib/session';
import { theme } from '@/lib/theme';
import { printInventoryLabel } from '@/lib/printLabel';
import type { InventoryItem, InventoryLocation } from '@/lib/types';

export default function ItemsScreen() {
  const { token, tenant } = useMobileSession();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showContainers, setShowContainers] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<InventoryLocation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const workspaceId = tenant?.id;
  const load = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    try {
      const [nextItems, nextLocations] = await Promise.all([
        apiRequest<InventoryItem[]>('/items?include_archived=true', token, workspaceId),
        apiRequest<InventoryLocation[]>('/locations', token, workspaceId),
      ]);
      setItems(nextItems); setLocations(nextLocations); setError('');
    }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível carregar os itens.'); }
    finally { setBusy(false); }
  }, [token, workspaceId]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const inArchive = (item: InventoryItem) => item.status === 'Arquivado' || item.status === 'archived';
  const visibleItems = items.filter(item => !showContainers && inArchive(item) === showArchived);
  const filtered = visibleItems.filter(item => `${item.name} ${item.category} ${item.location} ${item.container} ${item.code}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  const visibleContainers = locations.filter(location => location.kind === 'Recipiente' && `${location.name} ${location.parent} ${location.code}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  return <Page title={showContainers ? 'Recipientes' : showArchived ? 'Arquivo morto' : 'Itens'} subtitle={showContainers ? `${visibleContainers.length} recipientes no espaço` : `${visibleItems.length} ${showArchived ? 'itens arquivados' : 'itens no espaço'}`} action={!showArchived && !showContainers ? <Pressable onPress={() => router.push('/items/new')}><Text style={styles.add}>＋</Text></Pressable> : null}>
    <View style={styles.tabs}>
      <View style={styles.tab}><Action label="Itens" onPress={() => { setShowArchived(false); setShowContainers(false); }} secondary={showArchived || showContainers} /></View>
      <View style={styles.tab}><Action label="Recipientes" onPress={() => { setShowArchived(false); setShowContainers(true); setSelectedContainer(null); }} secondary={!showContainers} /></View>
      <View style={styles.tab}><Action label="Arquivo morto" onPress={() => { setShowArchived(true); setShowContainers(false); }} secondary={!showArchived} /></View>
    </View>
    <TextInput value={search} onChangeText={value => { setSearch(value); setSelectedContainer(null); }} placeholder={showContainers ? 'Pesquisar recipiente ou etiqueta' : 'Pesquisar nome, local ou etiqueta'} placeholderTextColor="#A69083" style={styles.search} />
    {busy && items.length === 0 ? <ActivityIndicator color={theme.accent} /> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {!showContainers && filtered.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Ver detalhes de ${item.name}`} onPress={() => router.push({ pathname: '/items/[id]' as never, params: { id: item.id } })} style={styles.card}>
      <View style={styles.icon}><Text style={styles.iconText}>▦</Text></View><View style={styles.copy}><Text style={styles.name}>{item.name}</Text><Text style={styles.detail}>{item.category || 'Sem categoria'} · {item.location}{item.container ? ` · ${item.container}` : ''}</Text><Text style={styles.quantity}>{showArchived ? 'No arquivo morto' : `${item.available_quantity} disponíveis de ${item.quantity}`}</Text></View><Text style={styles.chevron}>›</Text>
    </Pressable>)}
    {showContainers && visibleContainers.map(location => <Pressable key={location.id} accessibilityRole="button" accessibilityLabel={`Selecionar recipiente ${location.name}`} onPress={() => setSelectedContainer(location)} style={[styles.card, selectedContainer?.id === location.id && styles.selectedCard]}>
      <View style={styles.icon}><Text style={styles.iconText}>▣</Text></View><View style={styles.copy}><Text style={styles.name}>{location.name}</Text><Text style={styles.detail}>{location.parent} · Recipiente</Text><Text style={styles.quantity}>{location.code}</Text></View><Text style={styles.chevron}>›</Text>
    </Pressable>)}
    {showContainers && selectedContainer ? <View style={styles.selectedBox}><Text style={styles.selectedTitle}>Etiqueta selecionada: {selectedContainer.name}</Text><Action label="Imprimir etiqueta" onPress={() => void printInventoryLabel({ name: selectedContainer.name, code: selectedContainer.code, kind: 'RECIPIENTE', location: selectedContainer.parent, container: selectedContainer.name }).catch(e => Alert.alert('Não foi possível imprimir', e instanceof Error ? e.message : 'Tente novamente.'))} /></View> : null}
    {!busy && (showContainers ? visibleContainers.length === 0 : filtered.length === 0) ? <View style={styles.empty}><Text style={styles.emptyTitle}>{search ? 'Nenhum resultado' : showContainers ? 'Nenhum recipiente no espaço' : showArchived ? 'Arquivo morto vazio' : 'Seu inventário está vazio'}</Text><Text style={styles.emptyText}>{search ? 'Tente outro nome, local ou etiqueta.' : showContainers ? 'Recipientes cadastrados no espaço aparecerão aqui.' : showArchived ? 'Itens arquivados no Achei Web aparecerão aqui e também poderão ser pesquisados.' : 'Cadastre o primeiro item para encontrá-lo pelo celular.'}</Text>{!search && !showArchived && !showContainers ? <Action label="Cadastrar item" onPress={() => router.push('/items/new')} /> : null}</View> : null}
    {!showContainers ? <><Action label="Ler QR para empréstimo" secondary onPress={() => router.push('/scan')} /><Action label="Meus pedidos de empréstimo" secondary onPress={() => router.push('/requests')} /></> : null}
  </Page>;
}
const styles = StyleSheet.create({ tabs: { flexDirection: 'row', gap: 8 }, tab: { flex: 1 }, search: { height: 50, borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, paddingHorizontal: 15, color: theme.ink }, add: { color: theme.accent, fontSize: 30, fontWeight: '700' }, card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 17 }, selectedCard: { borderColor: theme.accent, backgroundColor: theme.pale }, icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: theme.pale, alignItems: 'center', justifyContent: 'center' }, iconText: { color: theme.accent, fontSize: 21 }, copy: { flex: 1, gap: 4 }, name: { color: theme.ink, fontSize: 15, fontWeight: '800' }, detail: { color: theme.muted, fontSize: 12 }, quantity: { color: theme.accent, fontSize: 12, fontWeight: '700' }, chevron: { color: theme.accent, fontSize: 25 }, selectedBox: { gap: 10, padding: 14, backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border }, selectedTitle: { color: theme.ink, fontWeight: '700' }, error: { color: '#A32F21' }, empty: { padding: 20, gap: 12, backgroundColor: theme.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.border }, emptyTitle: { color: theme.ink, fontSize: 17, fontWeight: '800' }, emptyText: { color: theme.muted, lineHeight: 20 } });
