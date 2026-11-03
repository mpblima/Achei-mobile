import { createContext, useContext } from 'react';
import type { Tenant } from './types';

export type MobileSession = {
  token: (() => Promise<string | null>) | null;
  userId: string | null;
  email: string;
  imageUrl: string;
  tenant: Tenant | null;
  workspaces: Tenant[];
  workspacesLoaded: boolean;
  tenantError: string;
  setTenant: (tenant: Tenant | null) => void;
  setProfileImage: (uri: string) => Promise<string>;
};

export const MobileSessionContext = createContext<MobileSession>({
  token: null,
  userId: null,
  email: '',
  imageUrl: '',
  tenant: null,
  workspaces: [],
  workspacesLoaded: false,
  tenantError: '',
  setTenant: () => undefined,
  setProfileImage: async () => { throw new Error('A configuração do Clerk ainda não está pronta.'); },
});

export function useMobileSession() {
  return useContext(MobileSessionContext);
}
