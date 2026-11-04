export type Tenant = {
  id: string;
  name: string;
  type: 'personal' | 'business';
  role: 'admin' | 'collaborator' | 'reader';
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
  location_id?: string;
  container_id?: string;
  code: string;
  quantity: number;
  available_quantity: number;
  loaned_quantity: number;
  pending_loan_quantity: number;
  status: string;
  label_issued: boolean;
};

export type ItemPhoto = { id: string; data_url: string };

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
  item_id?: string;
  item: string;
  item_code: string;
  requester_user_id: string;
  requester_name: string;
  quantity: number;
  due: string;
  label_issued: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
};

export type MemberProfile = {
  full_name: string;
  phone: string;
  avatar_url: string;
};
