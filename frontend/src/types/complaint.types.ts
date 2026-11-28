
export type ComplaintStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type ComplaintType = {
  id: number;
  name: string;
};

export type ComplaintStaff = {
  id: number;
  name: string;
  contact: string;
};

export type Complaint = {
  id: number;
  number: string;
  resident_name: string;
  resident_contact: string;
  resident_email: string;
  block: string;
  type: ComplaintType;
  preferred_time: string;
  description: string;
  status: ComplaintStatus;
  staff: ComplaintStaff | null;
  started_at: string | null;
  completed_at: string | null;
  rating: number | null;
  created_at: string;
};

export type ComplaintHistory = {
  from_status: ComplaintStatus;
  to_status: ComplaintStatus;
  actor: {
    id: number;
    name: string;
    role: string;
  };
  note: string;
  created_at: string;
};

export type ComplaintDetail = Complaint & {
  history: ComplaintHistory[];
};

export type ResidentComplaintDetail = ComplaintDetail & {
  completion_otp: string | null;
};

export type Rating = {
  stars: number;
  comment: string;
  created_at: string;
};
