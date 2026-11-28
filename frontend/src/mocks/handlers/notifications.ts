
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

type Device = {
  id: number;
  fcm_token: string;
  platform: string;
  device_name: string;
};

type StaffNotification = {
  id: number;
  title: string;
  body: string;
  read: boolean;
  data: Record<string, unknown>;
  created_at: string;
};

type NotificationTemplate = {
  type: string;
  title: string;
  body: string;
  placeholders: string[];
};

type NotificationLog = {
  id: number;
  to: { id: number; name: string };
  channel: string;
  title: string;
  body: string;
  status: string;
  error: string | null;
  created_at: string;
};

type Banner = {
  id: number;
  title: string;
  image_url: string;
  starts_on: string;
  ends_on: string;
  is_active: boolean;
};

const devices: Device[] = [
  {
    id: 1,
    fcm_token: "sample-fcm-token",
    platform: "ANDROID",
    device_name: "Android Device",
  },
];

const notifications: StaffNotification[] = [
  {
    id: 1,
    title: "New complaint assigned",
    body: "A plumbing complaint has been assigned to you.",
    read: false,
    data: {},
    created_at: "2026-11-27T09:00:00Z",
  },
];

const templates: NotificationTemplate[] = [
  {
    type: "COMPLAINT_ASSIGNED",
    title: "New complaint assigned",
    body: "A new complaint has been assigned to you.",
    placeholders: ["complaint_number"],
  },
];

const notificationLogs: NotificationLog[] = [
  {
    id: 1,
    to: { id: 1, name: "Rahul" },
    channel: "PUSH",
    title: "New complaint assigned",
    body: "A new complaint has been assigned to you.",
    status: "SENT",
    error: null,
    created_at: "2026-11-27T09:00:00Z",
  },
];

const banners: Banner[] = [
  {
    id: 1,
    title: "Welcome",
    image_url: "/api/v1/files/banner1.jpg",
    starts_on: "2026-11-27",
    ends_on: "2026-12-27",
    is_active: true,
  },
];

function getPagination(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("page_size") ?? 20)),
  );

  return { page, pageSize };
}

function pageResponse<T>(items: T[], page: number, pageSize: number) {
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    page_size: pageSize,
  };
}

function isBannerActive(banner: Banner) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    banner.is_active &&
    banner.starts_on <= today &&
    banner.ends_on >= today
  );
}

export const notificationsHandlers = [
  // 123. Register device
  http.post(`${BASE}/devices`, async ({ request }) => {
    const body = (await request.json()) as {
      fcm_token: string;
      platform: string;
      device_name?: string;
    };

    const existing = devices.find(
      (item) => item.fcm_token === body.fcm_token,
    );

    if (existing) {
      existing.platform = body.platform;
      existing.device_name = body.device_name ?? "Unknown Device";

      return HttpResponse.json(existing);
    }

    const device: Device = {
      id: Math.max(0, ...devices.map((item) => item.id)) + 1,
      fcm_token: body.fcm_token,
      platform: body.platform,
      device_name: body.device_name ?? "Unknown Device",
    };

    devices.push(device);

    return HttpResponse.json(device, { status: 201 });
  }),

  // 124. Delete device
  http.delete(`${BASE}/devices/:fcm_token`, ({ params }) => {
    const index = devices.findIndex(
      (item) => item.fcm_token === params.fcm_token,
    );

    if (index !== -1) {
      devices.splice(index, 1);
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // 125. Staff notifications
  http.get(`${BASE}/staff/notifications`, ({ request }) => {
    const url = new URL(request.url);
    const { page, pageSize } = getPagination(url);
    const unread = url.searchParams.get("unread");

    let result = [...notifications];

    if (unread === "true") {
      result = result.filter((item) => !item.read);
    }

    return HttpResponse.json(pageResponse(result, page, pageSize));
  }),

  // 126. Mark staff notification as read
  http.post(`${BASE}/staff/notifications/:id/read`, ({ params }) => {
    const notification = notifications.find(
      (item) => item.id === Number(params.id),
    );

    if (!notification) {
      return HttpResponse.json(
        { detail: "Notification not found" },
        { status: 404 },
      );
    }

    notification.read = true;

    return HttpResponse.json(notification);
  }),

  // 127. Get notification templates
  http.get(`${BASE}/admin/notification-templates`, () =>
    HttpResponse.json(templates),
  ),

  // 128. Update notification template
  http.patch(
    `${BASE}/admin/notification-templates/:type`,
    async ({ params, request }) => {
      const body = (await request.json()) as {
        title: string;
        body: string;
      };

      const template = templates.find(
        (item) => item.type === params.type,
      );

      if (!template) {
        return HttpResponse.json(
          { detail: "Template not found" },
          { status: 404 },
        );
      }

      Object.assign(template, body);

      return HttpResponse.json(template);
    },
  ),

  // 129. Send notification
  http.post(`${BASE}/admin/notifications/send`, async ({ request }) => {
    const body = (await request.json()) as {
      staff_id?: number;
      all?: boolean;
      title: string;
      body: string;
      image_url?: string;
    };

    const now = new Date().toISOString();

    notificationLogs.push({
      id: Math.max(0, ...notificationLogs.map((item) => item.id)) + 1,
      to: {
        id: body.staff_id ?? 0,
        name: body.all ? "All Staff" : "Staff",
      },
      channel: "PUSH",
      title: body.title,
      body: body.body,
      status: "SENT",
      error: null,
      created_at: now,
    });

    return HttpResponse.json(
      { queued: body.all ? 25 : 1 },
      { status: 201 },
    );
  }),

  // 130. Admin notification logs
  http.get(`${BASE}/admin/notifications`, ({ request }) => {
    const url = new URL(request.url);
    const { page, pageSize } = getPagination(url);

    const channel = url.searchParams.get("channel");
    const status = url.searchParams.get("status");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    let result = [...notificationLogs];

    if (channel) {
      result = result.filter((item) => item.channel === channel);
    }

    if (status) {
      result = result.filter((item) => item.status === status);
    }

    if (from) {
      result = result.filter(
        (item) => item.created_at.slice(0, 10) >= from,
      );
    }

    if (to) {
      result = result.filter(
        (item) => item.created_at.slice(0, 10) <= to,
      );
    }

    return HttpResponse.json(pageResponse(result, page, pageSize));
  }),

  // 131. Upload notification image
  http.post(`${BASE}/admin/notifications/image`, async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return HttpResponse.json(
        { detail: "Image file is required" },
        { status: 422 },
      );
    }

    return HttpResponse.json(
      { url: "/api/v1/files/notification1.jpg" },
      { status: 201 },
    );
  }),

  // 132. Get admin banners
  http.get(`${BASE}/admin/banners`, () =>
    HttpResponse.json(banners),
  ),

  // 133. Create banner
  http.post(`${BASE}/admin/banners`, async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return HttpResponse.json(
        { detail: "Banner image is required" },
        { status: 422 },
      );
    }

    const id = Math.max(0, ...banners.map((item) => item.id)) + 1;

    const banner: Banner = {
      id,
      title: String(formData.get("title") ?? "New Banner"),
      image_url: `/api/v1/files/banner${id}.jpg`,
      starts_on: String(formData.get("starts_on") ?? ""),
      ends_on: String(formData.get("ends_on") ?? ""),
      is_active: true,
    };

    banners.push(banner);

    return HttpResponse.json(banner, { status: 201 });
  }),

  // 134. Update banner
  http.patch(
    `${BASE}/admin/banners/:id`,
    async ({ params, request }) => {
      const banner = banners.find(
        (item) => item.id === Number(params.id),
      );

      if (!banner) {
        return HttpResponse.json(
          { detail: "Banner not found" },
          { status: 404 },
        );
      }

      const body = (await request.json()) as {
        title?: string;
        starts_on?: string;
        ends_on?: string;
        is_active?: boolean;
      };

      Object.assign(banner, body);

      return HttpResponse.json(banner);
    },
  ),

  // 135. Delete banner
  http.delete(`${BASE}/admin/banners/:id`, ({ params }) => {
    const index = banners.findIndex(
      (item) => item.id === Number(params.id),
    );

    if (index === -1) {
      return HttpResponse.json(
        { detail: "Banner not found" },
        { status: 404 },
      );
    }

    banners.splice(index, 1);

    return new HttpResponse(null, { status: 204 });
  }),

  // 136. Get staff banners
  http.get(`${BASE}/staff/banners`, () =>
    HttpResponse.json(banners.filter(isBannerActive)),
  ),
];
