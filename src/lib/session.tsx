import { createContext, useContext } from 'react';
import type { Tenant } from './types';

export type MobileSession = {
  token: string | null;
  userId: string | null;
  email: string;
  imageUrl: string;
  tenant: Tenant | null;
  setTenant: (tenant: Tenant | null) => void;
  setProfileImage: (uri: string) => Promise<string>;
};

export const MobileSessionContext = createContext<MobileSession>({
  token: null,
  userId: null,
  email: '',
  imageUrl: '',
  tenant: null,
  setTenant: () => undefined,
  setProfileImage: async () => { throw new Error('A configuração do Clerk ainda não está pronta.'); },
});

export function useMobileSession() {
  return useContext(MobileSessionContext);
}
