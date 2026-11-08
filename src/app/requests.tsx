import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from 'expo-router';
import { Action, Page } from '@/components/MobileUI';
import { apiRequest } from '@/lib/api';
import { useMobileSession } from '@/lib/session';
import { theme } from '@/lib/theme';
import type { LoanRequest } from '@/lib/types';

export default function RequestsScreen() {
  const { token, tenant } = useMobileSession();
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanningFor, setScanningFor] = useState('');
  const [personCode, setPersonCode] = useState('');
  const [verifiedItems, setVerifiedItems] = useState<Record<string, string>>({});
  const workspaceId = tenant?.id;
  const isAdmin = tenant?.role === 'admin';
  const isBusiness = tenant?.type === 'business';
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setRequests(await apiRequest<LoanRequest[]>('/loan-requests', token, workspaceId)); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível carregar os pedidos.'); }
    finally { setLoading(false); }
  }, [token, workspaceId]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const pending = requests.filter(row => row.status === 'pending');

  async function handleScan(data: string) {
    if (scanningFor === 'person') {
      const matched = pending.find(row => row.requester_qr_code === data);
      if (!matched) { setError('Este QR não corresponde a um pedido pendente deste espaço.'); return; }
      setPersonCode(data); setScanningFor(''); setError(''); return;
    }
    if (scanningFor) {
      const row = pending.find(entry => entry.id === scanningFor);
      if (row && data === row.item_code) setVerifiedItems(previous => ({ ...previous, [row.id]: data }));
      else setError('A etiqueta lida não corresponde ao item deste pedido.');
      setScanningFor('');
    }
  }

  async function approve(row: LoanRequest) {
    if (!token || !isAdmin) return;
    const body = { person_qr_code: isBusiness ? personCode : '', item_code: row.label_issued ? verifiedItems[row.id] : row.item_code };
    try {
      await apiRequest(`/loan-requests/${row.id}/approve`, token, workspaceId, { method: 'POST', body: JSON.stringify(body) });
      Alert.alert('Saída registrada', `${row.item} autorizado para ${row.borrower_name || row.requester_name}.`);
      setPersonCode(''); setVerifiedItems({}); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível autorizar o empréstimo.'); }
  }
  function startScan(target: string) {
    setError('');
    if (permission?.granted) setScanningFor(target);
    else void requestPermission();
  }

  return <Page title={isAdmin ? 'Pedidos de empréstimo' : 'Meus pedidos'} subtitle={isAdmin ? (isBusiness ? 'Leia o QR da pessoa e a etiqueta do item quando ela estiver emitida.' : 'Confira o responsável, o terceiro recebedor e a etiqueta do item quando emitida.') : 'O administrador autoriza a retirada pelo Achei.'}>
    {loading ? <ActivityIndicator color={theme.accent} /> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {!loading && requests.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Nenhum pedido ainda</Text><Text style={styles.detail}>Leia o QR de um item ou selecione um item disponível para pedir empréstimo.</Text></View> : null}
    {isAdmin && scanningFor ? <View style={styles.camera}><CameraView style={StyleSheet.absoluteFill} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => void handleScan(data)} /><Text style={styles.cameraHint}>{scanningFor === 'person' ? 'Leia o QR Code da pessoa' : 'Leia o QR Code do item'}</Text><Action label="Cancelar leitura" secondary onPress={() => setScanningFor('')} /></View> : null}
    {pending.map(row => {
      const personVerified = !isBusiness || personCode === row.requester_qr_code;
      const itemVerified = !row.label_issued || verifiedItems[row.id] === row.item_code;
      return <View key={row.id} style={styles.card}>
        <View style={styles.row}><Text style={styles.name}>{row.item}</Text><Text style={styles.pending}>Aguardando</Text></View>
        <Text style={styles.detail}>Responsável: {row.responsible_name || row.requester_name}</Text>
        {!isBusiness && row.is_third_party ? <Text style={styles.detail}>Terceiro recebedor: {row.borrower_name} · {row.borrower_contact}</Text> : !isBusiness ? <Text style={styles.detail}>Empréstimo para o próprio responsável</Text> : null}
        <Text style={styles.detail}>{row.quantity} {row.quantity === 1 ? 'unidade' : 'unidades'}{row.due ? ` · Devolução: ${row.due}` : ''}</Text>
        {isBusiness && !personVerified ? <Action label="Ler QR Code da pessoa responsável" secondary onPress={() => startScan('person')} /> : null}
        {row.label_issued && !itemVerified ? <Action label="Ler etiqueta QR do item" secondary onPress={() => startScan(row.id)} /> : null}
        {!row.label_issued && !itemVerified ? <Action label="Confirmar item deste pedido" secondary onPress={() => setVerifiedItems(previous => ({ ...previous, [row.id]: row.item_code }))} /> : null}
        <Action label="Autorizar e registrar saída" disabled={!personVerified || !itemVerified} onPress={() => void approve(row)} />
      </View>;
    })}
    {!isAdmin ? requests.filter(row => row.status !== 'pending').map(row => <View key={row.id} style={styles.card}><View style={styles.row}><Text style={styles.name}>{row.item}</Text><Text style={[styles.pending, row.status === 'approved' ? styles.approved : styles.rejected]}>{row.status === 'approved' ? 'Autorizado' : 'Rejeitado'}</Text></View><Text style={styles.detail}>{row.quantity} {row.quantity === 1 ? 'unidade' : 'unidades'} · QR {row.item_code}</Text>{row.due ? <Text style={styles.detail}>Devolução prevista: {row.due}</Text> : null}{row.rejection_reason ? <Text style={styles.error}>Motivo: {row.rejection_reason}</Text> : null}</View>) : null}
  </Page>;
}
const styles = StyleSheet.create({ card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 17, padding: 15, gap: 8 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, name: { color: theme.ink, fontWeight: '800', fontSize: 15, flex: 1 }, pending: { fontSize: 11, fontWeight: '800', color: theme.warning }, approved: { color: theme.success }, rejected: { color: '#A32F21' }, detail: { color: theme.muted, fontSize: 12 }, empty: { padding: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 17, gap: 8 }, emptyTitle: { color: theme.ink, fontSize: 17, fontWeight: '800' }, error: { color: '#A32F21' }, camera: { height: 310, overflow: 'hidden', borderRadius: 18, backgroundColor: '#21150F', justifyContent: 'flex-end', padding: 12, gap: 8 }, cameraHint: { color: '#FFF', fontWeight: '800', textAlign: 'center', padding: 6 } });
