import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Action, Field, Notice, Page } from '@/components/MobileUI';
import { apiRequest } from '@/lib/api';
import { useMobileSession } from '@/lib/session';
import { theme } from '@/lib/theme';
import type { MemberProfile } from '@/lib/types';

export default function ProfileScreen() {
  const { token, tenant, email, imageUrl, setProfileImage } = useMobileSession();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState(imageUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (token) void apiRequest<{ profile: MemberProfile }>('/me', token, tenant?.id).then(result => { setFullName(result.profile.full_name); setPhone(result.profile.phone); setPhoto(result.profile.avatar_url || imageUrl); }).catch(e => setError(e.message)); }, [token, tenant?.id, imageUrl]);
  async function choosePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError('Permita acesso às fotos para escolher sua imagem.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) {
      try { setPhoto(await setProfileImage(result.assets[0].uri)); }
      catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível atualizar sua foto.'); }
    }
  }
  async function save() {
    if (!token) return;
    if (!photo || !photo.startsWith('https://')) { setError('Escolha uma foto de perfil antes de salvar.'); return; }
    setSaving(true); setError('');
    try { await apiRequest('/profile', token, tenant?.id, { method: 'PUT', body: JSON.stringify({ full_name: fullName, phone, avatar_url: photo }) }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar o perfil.'); }
    finally { setSaving(false); }
  }
  return <Page title="Seu perfil" subtitle="Cada tenant mantém seus próprios dados de membro.">
    <View style={styles.identity}><Pressable onPress={() => void choosePhoto()} style={styles.avatar}>{photo ? <Image source={{ uri: photo }} style={styles.image} /> : <Text style={styles.avatarText}>＋</Text>}</Pressable><View style={styles.identityCopy}><Text style={styles.email}>{email}</Text><Text style={styles.helper}>Toque na foto para alterá-la</Text></View></View>
    <Notice>Nome, telefone e foto serão exibidos para os administradores do tenant quando você pedir um empréstimo.</Notice>
    <Field label="Nome completo" value={fullName} onChangeText={setFullName} placeholder="Como você deve aparecer para o administrador" />
    <Field label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="(11) 99999-9999" />
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Action label={saving ? 'Salvando…' : 'Salvar perfil'} disabled={saving} onPress={() => void save()} />
  </Page>;
}
const styles = StyleSheet.create({ identity: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 8 }, avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: theme.pale, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, image: { width: '100%', height: '100%' }, avatarText: { color: theme.accent, fontSize: 32 }, identityCopy: { flex: 1, gap: 6 }, email: { color: theme.ink, fontSize: 14, fontWeight: '700' }, helper: { color: theme.muted, fontSize: 12 }, error: { color: '#A32F21' } });
