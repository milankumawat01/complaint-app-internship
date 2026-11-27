
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

const notifications = [
  {
    id: 1,
    title: "New complaint assigned",
    message: "A plumbing complaint has been assigned to you.",
    type: "COMPLAINT_ASSIGNED",
    is_read: false,
    created_at: "2026-11-27T09:00:00Z",
  },
];

export const notificationsHandlers = [
  http.get(`${BASE}/notifications`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const size = Number(url.searchParams.get("page_size") ?? 20);

    return HttpResponse.json({
      items: notifications.slice((page - 1) * size, page * size),
      total: notifications.length,
      page,
      page_size: size,
    });
  }),

  http.get(`${BASE}/notifications/unread-count`, () =>
    HttpResponse.json({ count: notifications.filter((item) => !item.is_read).length }),
  ),

  http.post(`${BASE}/notifications/:id/read`, ({ params }) => {
    const notification = notifications.find(
      (item) => item.id === Number(params.id),
    );

    return notification
      ? HttpResponse.json({ ...notification, is_read: true })
      : HttpResponse.json(
          { detail: "Notification not found" },
          { status: 404 },
        );
  }),

  http.post(`${BASE}/notifications/read-all`, () =>
    HttpResponse.json({ ok: true }),
  ),
];
