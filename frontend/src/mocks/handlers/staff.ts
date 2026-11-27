
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

const staff = [
  {
    id: 5,
    name: "Suresh Kumar",
    age: 32,
    contact: "9876543210",
    email: "suresh@example.com",
    profession: {
      id: 2,
      name: "Plumber",
    },
    status: "ACTIVE",
    created_at: "2026-11-28T08:00:00Z",
  },
];

export const staffHandlers = [
  http.get(`${BASE}/admin/staff`, ({ request }) => {
    const url = new URL(request.url);

    const page = Number(url.searchParams.get("page") ?? 1);
    const size = Number(url.searchParams.get("page_size") ?? 20);

    return HttpResponse.json({
      items: staff.slice((page - 1) * size, page * size),
      total: staff.length,
      page,
      page_size: size,
    });
  }),

  http.post(`${BASE}/admin/staff`, async ({ request }) =>
    HttpResponse.json(
      {
        id: 6,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
       ...((await request.json()) as Record<string, unknown>),
      },
      { status: 201 },
    ),
  ),
];
