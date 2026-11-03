import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { Action, Field, Notice, Page } from '@/components/MobileUI';
import { apiRequest, ApiError } from '@/lib/api';
import { useMobileSession } from '@/lib/session';
import { theme } from '@/lib/theme';
import type { InventoryItem } from '@/lib/types';

export default function ScanScreen() {
  const { width, height } = useWindowDimensions();
  const cameraSize = Math.min(340, width - 40, Math.max(180, height * 0.48));
  const scanFrameSize = Math.min(230, cameraSize * 0.72);
  const { token, tenant } = useMobileSession();
  const params = useLocalSearchParams<{ code?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [scannedCode, setScannedCode] = useState(params.code || '');
  const [quantity, setQuantity] = useState('1');
  const [due, setDue] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (token) void apiRequest<InventoryItem[]>('/items', token, tenant?.id).then(setItems).catch(e => setError(e.message)); }, [token, tenant?.id]);
  const item = useMemo(() => items.find(entry => entry.code === scannedCode), [items, scannedCode]);
  async function submit() {
    if (!token || !item) return;
    const amount = Number(quantity);
    if (!Number.isInteger(amount) || amount < 1 || amount > item.available_quantity) { setError(`Informe uma quantidade entre 1 e ${item.available_quantity}.`); return; }
    setSending(true); setError('');
    try {
      await apiRequest('/loan-requests', token, tenant?.id, { method: 'POST', body: JSON.stringify({ item_code: item.code, quantity: amount, due: due.trim() }) });
      Alert.alert('Pedido enviado', 'Um administrador precisa autorizar o empréstimo.');
      router.replace('/requests');
    } catch (e) {
      if (e instanceof ApiError && e.status === 428) router.push('/profile');
      setError(e instanceof Error ? e.message : 'Não foi possível enviar o pedido.');
    } finally { setSending(false); }
  }
  return <Page title="Retirar para empréstimo" subtitle="Leia o QR Code do item. A retirada só é concluída após aprovação do administrador.">
    {!scannedCode ? permission?.granted ? <View style={[styles.camera, { height: cameraSize }]}><CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => setScannedCode(data)} /><View style={[styles.scanFrame, { width: scanFrameSize, height: scanFrameSize }]} /></View> : <View style={styles.permission}><Text style={styles.permissionText}>Precisamos da câmera para ler a etiqueta do item.</Text><Action label="Permitir câmera" onPress={() => void requestPermission()} /></View> : null}
    {scannedCode ? <><Notice>Etiqueta lida: {scannedCode}</Notice>{item ? <View style={styles.card}><Text style={styles.name}>{item.name}</Text><Text style={styles.meta}>{item.category || 'Sem categoria'} · {item.location}{item.container ? ` · ${item.container}` : ''}</Text><Text style={styles.stock}>{item.available_quantity} unidades disponíveis</Text></View> : <Notice>Não encontrei este código nos itens que você pode acessar. Confira a etiqueta e tente novamente.</Notice>}
      {item ? <><Field label="Quantidade para empréstimo" value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="1" /><Field label="Data de devolução (opcional)" value={due} onChangeText={setDue} placeholder="AAAA-MM-DD" /><Action label={sending ? 'Enviando…' : 'Solicitar autorização'} disabled={sending || item.available_quantity < 1} onPress={() => void submit()} /></> : null}
      <Action label="Ler outro QR Code" secondary onPress={() => { setScannedCode(''); setError(''); }} />
    </> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </Page>;
}
const styles = StyleSheet.create({ camera: { overflow: 'hidden', borderRadius: 22, backgroundColor: '#21150F', alignItems: 'center', justifyContent: 'center' }, scanFrame: { borderWidth: 3, borderColor: '#FFF', borderRadius: 26, backgroundColor: 'transparent' }, permission: { gap: 14, padding: 20, backgroundColor: theme.surface, borderRadius: 18 }, permissionText: { color: theme.ink, fontSize: 15, lineHeight: 21 }, card: { padding: 17, borderRadius: 17, backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, gap: 6 }, name: { color: theme.ink, fontSize: 17, fontWeight: '800' }, meta: { color: theme.muted, fontSize: 13 }, stock: { color: theme.success, fontSize: 13, fontWeight: '700' }, error: { color: '#A32F21' } });
