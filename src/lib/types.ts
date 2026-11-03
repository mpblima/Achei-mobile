export type Tenant = {
  id: string;
  name: string;
  type: 'personal' | 'business';
  role: 'admin' | 'member';
  brand_name?: string;
  brand_logo_url?: string;
  brand_primary_color?: string;
  brand_accent_color?: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  location: string;
  container: string;
  code: string;
  quantity: number;
  available_quantity: number;
  loaned_quantity: number;
  pending_loan_quantity: number;
  status: string;
};

export type InventoryLocation = {
  id: string;
  name: string;
  kind: string;
  parent: string;
  parent_id: string;
  code: string;
};

export type LoanRequest = {
  id: string;
  item: string;
  item_code: string;
  quantity: number;
  due: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
};

export type MemberProfile = {
  full_name: string;
  phone: string;
  avatar_url: string;
};
