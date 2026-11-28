
export type Unit = {
  id: number;
  name: string;
  short_name: string;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  unit: Unit;
  min_stock: number;
  stock: number;
  is_low: boolean;
  image_url: string | null;
  is_active: boolean;
};

export type LedgerRow = {
  id: number;
  product: {
    id: number;
    name: string;
  };
  quantity: number;
  type: "ADD" | "ISSUE" | "ADJUST";
  staff: {
    id: number;
    name: string;
  } | null;
  admin: {
    id: number;
    name: string;
  } | null;
  note: string;
  balance_after: number;
  created_at: string;
};

export type RejectReason = {
  id: number;
  reason: string;
};

export type MaterialRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "ISSUED"
  | "CANCELLED";

export type MaterialRequest = {
  id: number;
  staff: {
    id: number;
    name: string;
  };
  product: Product;
  requested_qty: number;
  issued_qty: number;
  status: MaterialRequestStatus;
  reject_reason: string | null;
  admin: {
    id: number;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
};
