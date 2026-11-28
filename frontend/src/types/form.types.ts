
export type FormFieldType =
  | "text"
  | "number"
  | "select"
  | "date"
  | "file"
  | "textarea";

export type FormField = {
  type: FormFieldType;
  name: string;
  label: string;
  required?: boolean;
  options?: string[];
};

export type Form = {
  id: number;
  name: string;
  description: string;
  fields: FormField[];
  response_count: number;
  created_at: string;
};

export type FormResponse = {
  id: number;
  form_id: number;
  data: Record<string, unknown>;
  created_at: string;
};

export type ContactMessage = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
};
