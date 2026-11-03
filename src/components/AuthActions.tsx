import type { CSSProperties } from 'react';
import { SignInButton, SignUpButton } from '@clerk/expo/web';
import { theme } from '@/lib/theme';

const primary: CSSProperties = {
  alignItems: 'center',
  backgroundColor: theme.accent,
  border: 0,
  borderRadius: 14,
  color: '#FFFFFF',
  cursor: 'pointer',
  display: 'flex',
  fontFamily: 'inherit',
  fontSize: 15,
  fontWeight: 800,
  justifyContent: 'center',
  minHeight: 50,
  width: '100%',
};

const secondary: CSSProperties = {
  ...primary,
  backgroundColor: theme.pale,
  border: `1px solid ${theme.border}`,
  color: theme.ink,
};

export function AuthActions() {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <SignInButton mode="modal">
        <button type="button" style={primary}>Entrar</button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button type="button" style={secondary}>Criar conta</button>
      </SignUpButton>
    </div>
  );
}
