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
  const [scanningPerson, setScanningPerson] = useState(false);
  const [scanningItemFor, setScanningItemFor] = useState('');
  const [requesterId, setRequesterId] = useState('');
  const [verifiedItems, setVerifiedItems] = useState<Record<string, string>>({});
  const workspaceId = tenant?.id;
  const isAdmin = tenant?.role === 'admin';
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setRequests(await apiRequest<LoanRequest[]>('/loan-requests', token, workspaceId)); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível carregar os pedidos.'); }
    finally { setLoading(false); }
  }, [token, workspaceId]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const matched = requests.filter(row => row.requester_user_id === requesterId && row.status === 'pending');
  async function handleScan(data: string) {
    if (scanningPerson) {
      const parts = data.split(':');
      if (parts.length !== 3 || parts[0] !== 'ACHEI-PESSOA' || parts[1] !== workspaceId) { setError('Este QR Code não pertence a uma pessoa deste espaço.'); return; }
      setRequesterId(parts[2]); setScanningPerson(false); setError(''); return;
    }
    if (scanningItemFor) {
      setVerifiedItems(previous => ({...previous, [scanningItemFor]: data}));
      setScanningItemFor(''); setError('');
    }
  }
  async function approve(row: LoanRequest) {
    if (!token || !isAdmin) return;
    try { await apiRequest(`/loan-requests/${row.id}/approve`, token, workspaceId, {method:'POST',body:'{}'}); Alert.alert('Saída registrada', `Empréstimo de ${row.item} autorizado para ${row.requester_name}.`); setRequesterId(''); setVerifiedItems({}); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível autorizar o empréstimo.'); }
  }
  const cameraActive = scanningPerson || Boolean(scanningItemFor);
  return <Page title={isAdmin ? 'Pedidos de empréstimo' : 'Meus pedidos'} subtitle={isAdmin ? 'Confira o QR da pessoa e, quando emitida, a etiqueta do item antes de registrar a saída.' : 'O administrador autoriza a retirada pelo Achei.'}>
    {loading ? <ActivityIndicator color={theme.accent} /> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {!loading && requests.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Nenhum pedido ainda</Text><Text style={styles.detail}>Leia o QR Code de um item disponível para pedir um empréstimo.</Text></View> : null}
    {isAdmin ? <>
      {!requesterId && !cameraActive ? <Action label="Ler QR Code da pessoa" secondary onPress={() => { if(permission?.granted) setScanningPerson(true); else void requestPermission(); }} /> : null}
      {cameraActive && permission?.granted ? <View style={styles.camera}><CameraView style={StyleSheet.absoluteFill} barcodeScannerSettings={{barcodeTypes:['qr']}} onBarcodeScanned={({data})=>void handleScan(data)} /><Text style={styles.cameraHint}>{scanningPerson ? 'Leia o QR Code da pessoa' : 'Leia a etiqueta QR do item'}</Text><Action label="Cancelar leitura" secondary onPress={()=>{setScanningPerson(false);setScanningItemFor('');}} /></View> : null}
      {requesterId ? <><Text style={styles.sectionTitle}>Pedidos pendentes desta pessoa</Text>{matched.length===0?<Text style={styles.detail}>Não há pedidos pendentes para esta pessoa.</Text>:matched.map(row=><View key={row.id} style={styles.card}><Text style={styles.name}>{row.requester_name} · {row.item}</Text><Text style={styles.detail}>{row.quantity} {row.quantity===1?'unidade':'unidades'}{row.due?` · Devolução: ${row.due}`:''}</Text><Text style={styles.detail}>{row.label_issued?'Etiqueta emitida: confirme o item':'Item sem etiqueta emitida: basta conferir a pessoa'}</Text>{row.label_issued && verifiedItems[row.id]!==row.item_code ? <Action label="Ler QR da etiqueta do item" secondary onPress={()=>{if(permission?.granted)setScanningItemFor(row.id);else void requestPermission();}} /> : null}<Action label="Autorizar e registrar saída" disabled={row.label_issued && verifiedItems[row.id]!==row.item_code} onPress={()=>void approve(row)} /></View>)}<Action label="Concluir conferência" secondary onPress={()=>{setRequesterId('');setVerifiedItems({});}} /></> : null}
      {requests.filter(row=>row.status==='pending').map(row=><View key={row.id} style={styles.card}><View style={styles.row}><Text style={styles.name}>{row.item}</Text><Text style={styles.status}>{row.status==='pending'?'Aguardando':'Autorizado'}</Text></View><Text style={styles.detail}>{row.requester_name} · {row.quantity} {row.quantity===1?'unidade':'unidades'} · {row.label_issued?'etiqueta emitida':'sem etiqueta emitida'}</Text></View>)}
    </> : requests.map(row=><View key={row.id} style={styles.card}><View style={styles.row}><Text style={styles.name}>{row.item}</Text><Text style={[styles.status, row.status==='approved'?styles.approved:row.status==='rejected'?styles.rejected:styles.pending]}>{row.status==='approved'?'Autorizado':row.status==='rejected'?'Rejeitado':'Aguardando'}</Text></View><Text style={styles.detail}>{row.quantity} {row.quantity===1?'unidade':'unidades'} · QR {row.item_code}</Text>{row.due?<Text style={styles.detail}>Devolução prevista: {row.due}</Text>:null}{row.rejection_reason?<Text style={styles.reason}>Motivo: {row.rejection_reason}</Text>:null}</View>)}
  </Page>;
}
const styles=StyleSheet.create({card:{backgroundColor:theme.surface,borderWidth:1,borderColor:theme.border,borderRadius:17,padding:15,gap:8},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10},name:{color:theme.ink,fontWeight:'800',fontSize:15,flex:1},status:{fontSize:11,fontWeight:'800',color:theme.warning},pending:{color:theme.warning},approved:{color:theme.success},rejected:{color:'#A32F21'},detail:{color:theme.muted,fontSize:12},reason:{color:'#A32F21',fontSize:12},empty:{padding:20,backgroundColor:theme.surface,borderWidth:1,borderColor:theme.border,borderRadius:17,gap:8},emptyTitle:{color:theme.ink,fontSize:17,fontWeight:'800'},error:{color:'#A32F21'},sectionTitle:{fontSize:16,fontWeight:'800',color:theme.ink},camera:{height:310,overflow:'hidden',borderRadius:18,backgroundColor:'#21150F',justifyContent:'flex-end',padding:12,gap:8},cameraHint:{color:'#FFF',fontWeight:'800',textAlign:'center',padding:6}});
