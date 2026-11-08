import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as QRCode from 'qrcode';
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
  const [memberQR, setMemberQR] = useState('');
  const [customData, setCustomData] = useState<Record<string,string>>({});
  const [profileFields, setProfileFields] = useState<{key:string;label:string;required:boolean}[]>([]);
  const [contactEmail, setContactEmail] = useState(email);
  useEffect(() => { if (token) void apiRequest<{ member_qr_code:string; profile: MemberProfile; member_profile_fields?: {key:string;label:string;required:boolean}[] }>('/me', token, tenant?.id).then(async result => { setFullName(result.profile.full_name); setPhone(result.profile.phone); setPhoto(result.profile.avatar_url || imageUrl); setContactEmail(result.profile.email || email); setCustomData(result.profile.custom_data || {}); setProfileFields(result.member_profile_fields || []); setMemberQR(await QRCode.toDataURL(result.member_qr_code,{width:240,margin:2})); }).catch(e => setError(e.message)); }, [token, tenant?.id, imageUrl, email]);
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
    setSaving(true); setError('');
    try { await apiRequest('/profile', token, tenant?.id, { method: 'PUT', body: JSON.stringify({ full_name: fullName, phone, email: contactEmail, avatar_url: photo, contact_data: { email: contactEmail }, custom_data: customData }) }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar o perfil.'); }
    finally { setSaving(false); }
  }
  return <Page title="Seu perfil" subtitle="Cada tenant mantém seus próprios dados de membro.">
    <View style={styles.identity}><Pressable onPress={() => void choosePhoto()} style={styles.avatar}>{photo ? <Image source={{ uri: photo }} style={styles.image} /> : <Text style={styles.avatarText}>＋</Text>}</Pressable><View style={styles.identityCopy}><Text style={styles.email}>{email}</Text><Text style={styles.helper}>Toque na foto para alterá-la</Text></View></View>
    <Notice>Nome, telefone e e-mail são necessários para concluir seu cadastro. Os campos adicionais são definidos pelo administrador da empresa.</Notice>
    {memberQR ? <View style={styles.qrCard}><Text style={styles.qrTitle}>Seu QR Code Achei</Text><Text style={styles.helper}>Em espaços empresariais, mostre este código para confirmar uma saída de item.</Text><Image source={{uri:memberQR}} style={styles.qrImage}/></View> : null}
    <Field label="Nome completo" value={fullName} onChangeText={setFullName} placeholder="Como você deve aparecer para o administrador" />
    <Field label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="(11) 99999-9999" />
    <Field label="E-mail de contato" value={contactEmail} onChangeText={setContactEmail} placeholder="seu@email.com" />
    {profileFields.map(field => <Field key={field.key} label={`${field.label}${field.required ? ' *' : ''}`} value={customData[field.key] || ''} onChangeText={value => setCustomData(previous=>({...previous,[field.key]:value}))} placeholder={field.label} />)}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Action label={saving ? 'Salvando…' : 'Salvar perfil'} disabled={saving} onPress={() => void save()} />
  </Page>;
}
const styles = StyleSheet.create({ identity: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 8 }, avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: theme.pale, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, image: { width: '100%', height: '100%' }, avatarText: { color: theme.accent, fontSize: 32 }, identityCopy: { flex: 1, gap: 6 }, email: { color: theme.ink, fontSize: 14, fontWeight: '700' }, helper: { color: theme.muted, fontSize: 12 }, qrCard:{alignItems:'center',gap:8,padding:16,borderRadius:16,backgroundColor:theme.surface,borderWidth:1,borderColor:theme.border},qrTitle:{color:theme.ink,fontSize:15,fontWeight:'800'},qrImage:{width:190,height:190},error: { color: '#A32F21' } });
