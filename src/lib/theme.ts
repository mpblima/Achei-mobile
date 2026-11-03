import { useMobileSession } from './session';

export const theme = {
  background: '#F9F6F1',
  surface: '#FFFFFF',
  ink: '#4A1B0C',
  muted: '#876B5E',
  accent: '#B9482D',
  border: '#EADFD6',
  pale: '#FCE9E1',
  success: '#527F58',
  warning: '#A86B25',
};

export function useBrandColors() {
  const { tenant } = useMobileSession();
  return {
    primary: tenant?.brand_primary_color || theme.ink,
    accent: tenant?.brand_accent_color || theme.accent,
  };
}
