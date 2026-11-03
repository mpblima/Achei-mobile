import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Page } from '@/components/MobileUI';
import { apiRequest } from '@/lib/api';
import { useMobileSession } from '@/lib/session';
import { theme } from '@/lib/theme';
import type { LoanRequest } from '@/lib/types';

export default function RequestsScreen() {
  const { token, tenant } = useMobileSession();
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const workspaceId = tenant?.id;
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setRequests(await apiRequest<LoanRequest[]>('/loan-requests', token, workspaceId)); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível carregar seus pedidos.'); }
    finally { setLoading(false); }
  }, [token, workspaceId]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  return <Page title="Meus pedidos" subtitle="O administrador autoriza a retirada pelo Achei Web.">
    {loading ? <ActivityIndicator color={theme.accent} /> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {!loading && requests.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Nenhum pedido ainda</Text><Text style={styles.detail}>Leia a etiqueta QR de um item disponível para pedir um empréstimo.</Text></View> : null}
    {requests.map(request => <View key={request.id} style={styles.card}><View style={styles.row}><Text style={styles.name}>{request.item}</Text><Text style={[styles.status, request.status === 'approved' ? styles.approved : request.status === 'rejected' ? styles.rejected : styles.pending]}>{request.status === 'approved' ? 'Autorizado' : request.status === 'rejected' ? 'Rejeitado' : 'Aguardando'}</Text></View><Text style={styles.detail}>{request.quantity} {request.quantity === 1 ? 'unidade' : 'unidades'} · QR {request.item_code}</Text>{request.due ? <Text style={styles.detail}>Devolução prevista: {request.due}</Text> : null}{request.rejection_reason ? <Text style={styles.reason}>Motivo: {request.rejection_reason}</Text> : null}</View>)}
  </Page>;
}
const styles = StyleSheet.create({ card: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 17, padding: 15, gap: 7 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, name: { color: theme.ink, fontWeight: '800', fontSize: 15, flex: 1 }, status: { fontSize: 11, fontWeight: '800', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, overflow: 'hidden' }, pending: { color: theme.warning, backgroundColor: '#F7EDD9' }, approved: { color: theme.success, backgroundColor: '#E6F0E5' }, rejected: { color: '#A32F21', backgroundColor: '#FBE4DF' }, detail: { color: theme.muted, fontSize: 12 }, reason: { color: '#A32F21', fontSize: 12 }, empty: { padding: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 17, gap: 8 }, emptyTitle: { color: theme.ink, fontSize: 17, fontWeight: '800' }, error: { color: '#A32F21' } });
