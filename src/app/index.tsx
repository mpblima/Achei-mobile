import { ActivityIndicator, Alert, Image, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { Action, Notice } from '@/components/MobileUI';
import { AuthActions } from '../components/AuthActions';
import { useMobileSession } from '@/lib/session';
import { theme, useBrandColors } from '@/lib/theme';

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const { isSignedIn, signOut } = useAuth();
  const { email, imageUrl, tenant, tenantError, workspaces, workspacesLoaded, setTenant } = useMobileSession();
  const brand = useBrandColors();
  const horizontalPadding = width < 360 ? 16 : width < 600 ? 22 : 32;

  async function logOut() {
    try {
      await signOut();
    } catch {
      Alert.alert('Não foi possível sair', 'Tente novamente em instantes.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.container, { maxWidth: Math.min(width, 720), paddingHorizontal: horizontalPadding, paddingTop: height < 680 ? 14 : 22 }]}>
        <View style={styles.brandRow}>
          {tenant?.brand_logo_url ? <Image source={{ uri: tenant.brand_logo_url }} style={styles.brandLogo} /> : <View style={[styles.mark, { backgroundColor: brand.primary }]}><Text style={styles.markText}>A</Text></View>}
          <Text style={[styles.brand, { color: brand.primary }]}>{tenant?.brand_name || 'Achei'}<Text style={[styles.period, { color: brand.accent }]}>.</Text></Text>
          {isSignedIn ? <Pressable onPress={() => router.push('/profile')} style={styles.avatar}>
            {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarFallback}>{email.slice(0, 1).toUpperCase() || 'A'}</Text>}
          </Pressable> : null}
        </View>

        {isSignedIn ? (
          <View style={[styles.signedIn, { paddingTop: height < 680 ? 24 : 46 }]}>
            {tenant ? <>
            <Text style={[styles.eyebrow, { color: brand.accent }]}>SEU INVENTÁRIO</Text>
            <Text style={[styles.title, { color: brand.primary }]}>Olá, {tenant.brand_name || tenant.name || email.split('@')[0] || 'tudo bem'}.</Text>
            <Text style={styles.description}>Encontre seus itens e acompanhe o que sai e volta.</Text>

            <View style={styles.actions}>
              <Action label="Pesquisar itens" onPress={() => router.push('/items')} />
              <Action label="Cadastrar item" secondary onPress={() => router.push('/items/new')} />
              <Action label="Ler QR para empréstimo" secondary onPress={() => router.push('/scan')} />
              <Action label="Meus pedidos" secondary onPress={() => router.push('/requests')} />
              <Action label="Notificações" secondary onPress={() => router.push('/notifications' as never)} />
              {workspaces.length > 1 ? <Action label="Trocar espaço" secondary onPress={() => setTenant(null)} /> : null}
            </View>
            </> : <View style={styles.workspacePicker}>
              {tenantError ? <Notice>{tenantError} Confira sua conexão e tente entrar novamente.</Notice> : !workspacesLoaded ? <View style={styles.loading}><ActivityIndicator color={brand.accent} /><Text style={styles.muted}>Localizando seus espaços…</Text></View> : workspaces.length === 0 ? <>
                <Text style={[styles.title, { color: brand.primary }]}>Conclua seu primeiro acesso no Achei Web</Text>
                <Text style={styles.description}>No celular você entra em uma conta já existente. Para criar seu espaço pessoal ou aceitar um convite, entre primeiro pelo Achei Web.</Text>
                <Action label="Abrir Achei Web" onPress={() => void Linking.openURL('https://achei.praesens.tech')} />
              </> : <>
                <Text style={[styles.title, { color: brand.primary }]}>Escolha seu espaço</Text>
                <Text style={styles.description}>Selecione o inventário que deseja abrir.</Text>
                {workspaces.map((workspace) => <Action key={workspace.id} label={workspace.brand_name || workspace.name} onPress={() => setTenant(workspace)} secondary />)}
              </>}
            </View>}
            <Pressable onPress={() => void logOut()} style={styles.signOut}><Text style={styles.signOutText}>Sair da conta</Text></Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.hero, { paddingTop: height < 680 ? 24 : 54, paddingBottom: height < 680 ? 16 : 32 }]}>
              <Text style={styles.eyebrow}>SUA CASA, NO SEU CONTROLE</Text>
              <Text style={styles.title}>Você sabe onde está.</Text>
              <Text style={styles.titleAccent}>Agora no celular.</Text>
              <Text style={styles.description}>Um inventário simples para lembrar onde guardou cada coisa e acompanhar o que sai e volta.</Text>
            </View>

            <View style={styles.previewCard}>
              <View style={styles.cardHeader}>
                <View><Text style={styles.cardEyebrow}>SEU ESPAÇO</Text><Text style={styles.cardTitle}>Tudo em ordem</Text></View>
                <View style={styles.statusDot} />
              </View>
              <View style={styles.divider} />
              <View style={styles.previewRow}><View style={[styles.iconTile, { backgroundColor: theme.pale }]}><Text style={styles.tileGlyph}>⌂</Text></View><View style={styles.previewCopy}><Text style={styles.previewTitle}>Cada coisa no seu lugar</Text><Text style={styles.previewSubtitle}>Itens, locais e movimentações</Text></View><Text style={styles.chevron}>›</Text></View>
              <View style={styles.previewRow}><View style={[styles.iconTile, { backgroundColor: '#F4EBD8' }]}><Text style={styles.tileGlyph}>✓</Text></View><View style={styles.previewCopy}><Text style={styles.previewTitle}>Compartilhe com quem mora</Text><Text style={styles.previewSubtitle}>Seu espaço continua privado</Text></View><Text style={styles.chevron}>›</Text></View>
            </View>

            <View style={styles.auth}>
              <Text style={styles.authTitle}>Acesse seu espaço</Text>
              <Text style={styles.authDescription}>Entre com a conta que você já criou no Achei Web.</Text>
              <AuthActions />
              <Text style={styles.helper}>Se você recebeu um convite, entre primeiro pelo Achei Web para aceitá-lo. Depois, use a mesma conta aqui.</Text>
            </View>
          </>
        )}

        <View style={styles.footer}><View style={styles.footerLine} /><Text style={styles.footerText}>ORGANIZE. ACHE. COMPARTILHE.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  container: { flexGrow: 1, width: '100%', alignSelf: 'center', paddingBottom: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 42, height: 42, borderRadius: 14, backgroundColor: theme.ink, alignItems: 'center', justifyContent: 'center' },
  brandLogo: { width: 42, height: 42, resizeMode: 'contain' },
  markText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  brand: { color: theme.ink, fontSize: 24, fontWeight: '800', letterSpacing: -0.8, flex: 1 },
  period: { color: theme.accent },
  avatar: { width: 38, height: 38, borderRadius: 19, overflow: 'hidden', backgroundColor: theme.pale, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  avatarFallback: { color: theme.ink, fontSize: 15, fontWeight: '800' },
  hero: { flex: 1, justifyContent: 'center' },
  eyebrow: { color: theme.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.6, marginBottom: 16 },
  title: { color: theme.ink, fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -1.4 },
  titleAccent: { color: theme.accent, fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -1.2, marginTop: 1 },
  description: { color: theme.muted, fontSize: 15, lineHeight: 23, marginTop: 16 },
  previewCard: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 22, padding: 18, shadowColor: theme.ink, shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15 },
  cardEyebrow: { color: theme.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  cardTitle: { color: theme.ink, fontSize: 18, fontWeight: '800', marginTop: 5 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#77A27A' },
  divider: { height: 1, backgroundColor: theme.border },
  previewRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 14, gap: 12 },
  iconTile: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tileGlyph: { color: theme.accent, fontSize: 21, fontWeight: '700' },
  previewCopy: { flex: 1 },
  previewTitle: { color: theme.ink, fontSize: 13, fontWeight: '700' },
  previewSubtitle: { color: theme.muted, fontSize: 11, marginTop: 4 },
  chevron: { color: theme.accent, fontSize: 26, lineHeight: 30 },
  auth: { marginTop: 28, gap: 11, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 20, padding: 18 },
  authTitle: { color: theme.ink, fontSize: 18, fontWeight: '800' },
  authDescription: { color: theme.muted, fontSize: 13, lineHeight: 19, marginBottom: 3 },
  helper: { color: theme.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  error: { color: '#A32F21', fontSize: 12, lineHeight: 18 },
  signedIn: { flex: 1, gap: 14 },
  actions: { gap: 10, marginTop: 10 },
  workspacePicker: { gap: 12, paddingTop: 32 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  muted: { color: theme.muted, fontSize: 13 },
  signOut: { alignSelf: 'center', padding: 12 },
  signOutText: { color: theme.muted, fontSize: 13, fontWeight: '700' },
  footer: { alignItems: 'center', gap: 12, paddingTop: 24 },
  footerLine: { height: 1, alignSelf: 'stretch', backgroundColor: theme.border },
  footerText: { color: theme.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.7 },
});
