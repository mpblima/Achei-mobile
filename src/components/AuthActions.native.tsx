import { useState } from 'react';
import { Text, View } from 'react-native';
import { useHostedAuth } from '@clerk/expo/hosted-auth';
import { Action } from '@/components/MobileUI';
import { theme } from '@/lib/theme';

export function AuthActions() {
  const { startHostedAuth } = useHostedAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function start(mode: 'sign-in' | 'sign-up') {
    setBusy(true);
    setError('');
    try {
      await startHostedAuth({ mode });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível abrir a autenticação.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 10 }}>
      <Action label={busy ? 'Abrindo…' : 'Entrar'} onPress={() => void start('sign-in')} disabled={busy} />
      <Action label="Criar conta" onPress={() => void start('sign-up')} secondary disabled={busy} />
      {error ? <Text accessibilityRole="alert" style={{ color: theme.accent, fontSize: 12 }}>{error}</Text> : null}
    </View>
  );
}
