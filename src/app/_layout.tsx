import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ClerkProvider, useAuth, useUser } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MobileSessionContext } from '@/lib/session';
import { apiRequest } from '@/lib/api';
import { theme } from '@/lib/theme';
import type { Tenant } from '@/lib/types';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function SessionBridge() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const { user } = useUser();
  const [tenantEntry, setTenantEntry] = useState<{ userId: string; tenant: Tenant | null; error: string } | null>(null);
  const [workspaceChoices, setWorkspaceChoices] = useState<Tenant[]>([]);
  const [workspacesLoaded, setWorkspacesLoaded] = useState(false);
  const getTokenRef = useRef(getToken);
  const accessToken = useCallback(() => getTokenRef.current(), []);
  const setTenant = useCallback((nextTenant: Tenant | null) => {
    if (userId) setTenantEntry({ userId, tenant: nextTenant, error: '' });
  }, [userId]);
  const tenant = isSignedIn && tenantEntry?.userId === userId ? tenantEntry.tenant : null;
  const tenantError = isSignedIn && tenantEntry?.userId === userId ? tenantEntry.error : '';

  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;

    let cancelled = false;
    void apiRequest<Tenant[]>('/mobile/workspaces', accessToken).then((workspaces) => {
      if (cancelled) return;
      setWorkspaceChoices(workspaces);
      setWorkspacesLoaded(true);
      setTenantEntry({ userId, tenant: workspaces.length === 1 ? workspaces[0] : null, error: '' });
    }).catch((error: unknown) => {
      if (!cancelled) {
        setWorkspaceChoices([]);
        setWorkspacesLoaded(true);
        setTenantEntry({ userId, tenant: null, error: error instanceof Error ? error.message : 'Não foi possível localizar seus espaços.' });
      }
    });
    return () => { cancelled = true; };
  }, [accessToken, isLoaded, isSignedIn, userId]);

  const setProfileImage = useCallback(async (uri: string) => {
    if (!user) throw new Error('Entre na sua conta antes de atualizar a foto.');
    await user.setProfileImage({ file: uri });
    await user.reload();
    return user.imageUrl;
  }, [user]);

  const value = useMemo(() => ({
    token: isLoaded && isSignedIn ? accessToken : null,
    userId: isLoaded && isSignedIn ? userId : null,
    email: user?.primaryEmailAddress?.emailAddress ?? '',
    imageUrl: user?.imageUrl ?? '',
    tenant,
    workspaces: isSignedIn && tenantEntry?.userId === userId ? workspaceChoices : [],
    workspacesLoaded: Boolean(isSignedIn && tenantEntry?.userId === userId && workspacesLoaded),
    tenantError,
    setTenant,
    setProfileImage,
  }), [accessToken, isLoaded, isSignedIn, setProfileImage, setTenant, tenant, tenantError, user, userId, workspaceChoices, workspacesLoaded, tenantEntry]);

  if (!isLoaded) {
    return <View style={styles.loading}><ActivityIndicator color={theme.accent} /><Text style={styles.loadingText}>Preparando seu espaço…</Text></View>;
  }

  return <MobileSessionContext.Provider value={value}><Stack screenOptions={{ headerShown: false }} /></MobileSessionContext.Provider>;
}

export default function RootLayout() {
  if (!publishableKey) {
    return <View style={styles.loading}><Text style={styles.error}>Configure EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY no arquivo .env do app mobile.</Text></View>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <StatusBar style="dark" />
      <SessionBridge />
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: theme.background, padding: 28 },
  loadingText: { color: theme.muted, fontSize: 14 },
  error: { color: theme.ink, fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
