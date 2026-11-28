export type Admin = {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "admin";
  is_active: boolean;
  created_at: string;
};

export type Settings = {
  gps_mandatory: boolean;
  complaint_number_start: number;
  morning_shift_start: string;
  morning_shift_end: string;
  night_shift_start: string;
  night_shift_end: string;
  auto_accept_material_requests: boolean;
};

export type AuditEvent = {
  id: number;
  actor: {
    id: number;
    name: string;
    role: "super_admin" | "admin";
  };
  action: string;
  entity: string;
  entity_id: number;
  data: Record<string, unknown>;
  created_at: string;
};