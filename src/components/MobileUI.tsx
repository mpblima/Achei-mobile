import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/lib/theme';

export function Page({ title, subtitle, children, action }: PropsWithChildren<{ title: string; subtitle?: string; action?: ReactNode }>) {
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 360 ? 16 : width < 600 ? 20 : 28;
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={[styles.page, { maxWidth: Math.min(width, 760), paddingHorizontal: horizontalPadding }]} keyboardShouldPersistTaps="handled">
    <View style={styles.top}><Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><Text style={styles.back}>‹</Text></Pressable><View style={styles.heading}><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>{action}</View>
    {children}
  </ScrollView></SafeAreaView>;
}

export function Field({ label, value, onChangeText, placeholder, keyboardType, multiline }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: 'default' | 'numeric' | 'phone-pad'; multiline?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#A69083" keyboardType={keyboardType} multiline={multiline} style={[styles.input, multiline && styles.multiline]} /></View>;
}

export function Action({ label, onPress, secondary, disabled }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.button, secondary && styles.secondary, disabled && styles.disabled]}><Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text></Pressable>;
}

export function Notice({ children }: PropsWithChildren) {
  return <View style={styles.notice}><Text style={styles.noticeText}>{children}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.background }, page: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 22, paddingBottom: 40, gap: 16 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }, back: { color: theme.ink, fontSize: 38, lineHeight: 42, width: 34 }, heading: { flex: 1 }, title: { color: theme.ink, fontSize: 25, fontWeight: '800', letterSpacing: -0.5 }, subtitle: { color: theme.muted, fontSize: 13, marginTop: 4 },
  field: { gap: 7 }, label: { color: theme.ink, fontSize: 13, fontWeight: '700' }, input: { minHeight: 50, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 13, paddingHorizontal: 14, color: theme.ink, fontSize: 15 }, multiline: { minHeight: 94, paddingTop: 12, textAlignVertical: 'top' },
  button: { minHeight: 50, borderRadius: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accent }, buttonText: { color: '#FFF', fontWeight: '800', fontSize: 15 }, secondary: { backgroundColor: theme.pale, borderWidth: 1, borderColor: theme.border }, secondaryText: { color: theme.ink }, disabled: { opacity: 0.45 },
  notice: { borderRadius: 13, padding: 14, backgroundColor: theme.pale }, noticeText: { color: theme.ink, lineHeight: 20, fontSize: 13 },
});
