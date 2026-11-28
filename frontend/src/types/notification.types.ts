
export type DevicePlatform = "ANDROID" | "IOS" | "WEB";

export type NotificationTemplate = {
  type: string;
  title: string;
  body: string;
  placeholders: string[];
};

export type NotificationChannel = "PUSH" | "WHATSAPP" | "EMAIL";

export type NotificationLogStatus = "SENT" | "FAILED";

export type NotificationLog = {
  id: number;
  to: {
    id: number;
    name: string;
  };
  channel: NotificationChannel;
  title: string;
  body: string;
  status: NotificationLogStatus;
  error: string | null;
  created_at: string;
};

export type StaffNotification = {
  id: number;
  title: string;
  body: string;
  read: boolean;
  data: Record<string, unknown>;
  created_at: string;
};

export type Banner = {
  id: number;
  title: string;
  image_url: string;
  starts_on: string;
  ends_on: string;
  is_active: boolean;
};
