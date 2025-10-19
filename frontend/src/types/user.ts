export type Permission =
  | '*'
  | 'rfx.create'
  | 'rfx.view_own'
  | 'rfx.view_all'
  | 'estimate.create'
  | 'estimate.view'
  | 'estimate.view_cost'
  | 'estimate.view_margin'
  | 'estimate_item.view_vendor_cost'
  | 'commission.view'
  | 'commission.manage'
  | 'deal.view_all'
  | 'vendor.manage'
  | 'vendor_resource.manage';

export type Role = 'Admin' | 'Sales' | 'Ops' | 'Finance' | 'Vendor_Manager';

export type User = {
  id: number;
  email: string;
  name: string;
  role: Role;
  permissions: Permission[];
  organizationId?: number;
};
