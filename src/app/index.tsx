import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

const colors = {
  background: '#F9F6F1',
  surface: '#FFFFFF',
  ink: '#4A1B0C',
  muted: '#876B5E',
  accent: '#B9482D',
  border: '#EADFD6',
  pale: '#FCE9E1',
};

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.brandRow}>
          <View style={styles.mark}>
            <Text style={styles.markText}>A</Text>
          </View>
          <Text style={styles.brand}>Achei<Text style={styles.period}>.</Text></Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>SUA CASA, NO SEU CONTROLE</Text>
          <Text style={styles.title}>Você sabe onde está.</Text>
          <Text style={styles.titleAccent}>Agora no celular.</Text>
          <Text style={styles.description}>
            Um inventário simples para lembrar onde guardou cada coisa e acompanhar o que sai e volta.
          </Text>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardEyebrow}>SEU ESPAÇO</Text>
              <Text style={styles.cardTitle}>Tudo em ordem</Text>
            </View>
            <View style={styles.statusDot} />
          </View>
          <View style={styles.divider} />
          <View style={styles.previewRow}>
            <View style={[styles.iconTile, { backgroundColor: colors.pale }]}>
              <Text style={styles.tileGlyph}>⌂</Text>
            </View>
            <View style={styles.previewCopy}>
              <Text style={styles.previewTitle}>Cada coisa no seu lugar</Text>
              <Text style={styles.previewSubtitle}>Itens, locais e movimentações</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
          <View style={styles.previewRow}>
            <View style={[styles.iconTile, { backgroundColor: '#F4EBD8' }]}>
              <Text style={styles.tileGlyph}>✓</Text>
            </View>
            <View style={styles.previewCopy}>
              <Text style={styles.previewTitle}>Compartilhe com quem mora</Text>
              <Text style={styles.previewSubtitle}>Seu espaço continua privado</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>ORGANIZE. ACHE. COMPARTILHE.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 26, paddingTop: 22, paddingBottom: 20 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  brand: { color: colors.ink, fontSize: 22, fontWeight: '800', letterSpacing: -0.8 },
  period: { color: colors.accent },
  hero: { flex: 1, justifyContent: 'center', paddingTop: 20, paddingBottom: 28 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.6, marginBottom: 18 },
  title: { color: colors.ink, fontSize: 40, lineHeight: 45, fontWeight: '800', letterSpacing: -1.8 },
  titleAccent: { color: colors.accent, fontSize: 36, lineHeight: 42, fontWeight: '800', letterSpacing: -1.6, marginTop: 1 },
  description: { color: colors.muted, fontSize: 16, lineHeight: 25, marginTop: 20, maxWidth: 430 },
  previewCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 22, padding: 20, shadowColor: '#4A1B0C', shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 17 },
  cardEyebrow: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: 5 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#77A27A' },
  divider: { height: 1, backgroundColor: colors.border },
  previewRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 16, gap: 12 },
  iconTile: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tileGlyph: { color: colors.accent, fontSize: 21, fontWeight: '700' },
  previewCopy: { flex: 1 },
  previewTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  previewSubtitle: { color: colors.muted, fontSize: 11, marginTop: 4 },
  chevron: { color: colors.accent, fontSize: 26, lineHeight: 30 },
  footer: { alignItems: 'center', gap: 12, paddingTop: 24 },
  footerLine: { height: 1, alignSelf: 'stretch', backgroundColor: colors.border },
  footerText: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.7 },
});
