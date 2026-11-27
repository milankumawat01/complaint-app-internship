import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

const admins = [
  {
    id: 1,
    name: "Ravi Admin",
    email: "admin@example.com",
    role: "admin",
    is_active: true,
  },
  {
    id: 2,
    name: "Super Admin",
    email: "superadmin@example.com",
    role: "super_admin",
    is_active: true,
  },
];

export const adminsHandlers = [
  // Get Admin List
  http.get(`${BASE}/admin/admins`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const size = Number(url.searchParams.get("page_size") ?? 20);
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";

    const filteredAdmins = admins.filter(
      (admin) =>
        admin.name.toLowerCase().includes(search) ||
        admin.email.toLowerCase().includes(search),
    );

    return HttpResponse.json({
      items: filteredAdmins.slice((page - 1) * size, page * size),
      total: filteredAdmins.length,
      page,
      page_size: size,
    });
  }),

  // Create Admin
  http.post(`${BASE}/admin/admins`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json(
      {
        id: 3,
        ...body,
        is_active: true,
      },
      { status: 201 },
    );
  }),

  // Update Admin
  http.patch(`${BASE}/admin/admins/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json({
      id: Number(params.id),
      ...body,
    });
  }),

  // Reset Admin Password
  http.post(`${BASE}/admin/admins/:id/reset-password`, () =>
    HttpResponse.json({ ok: true }),
  ),

 http.get(`${BASE}/admin/me`, () =>
  HttpResponse.json({
    id: 1,
    name: "Ravi Admin",
    email: "ravi@example.com",
    role: "admin",
    is_active: true,
    created_at: "2026-11-26T09:00:00Z",
  }),
),

http.get(`${BASE}/admin/settings`, () =>
  HttpResponse.json({
    gps_mandatory: true,
    complaint_number_start: 1000,
    morning_shift_start: "06:00",
    morning_shift_end: "14:00",
    night_shift_start: "22:00",
    night_shift_end: "06:00",
    auto_accept_material_requests: false,
  }),
),

http.patch(`${BASE}/admin/settings`, async ({ request }) =>
  HttpResponse.json(await request.json()),
),

http.get(`${BASE}/admin/audit-log`, ({ request }) => {
  const url = new URL(request.url);
  return HttpResponse.json({
    items: [],
    total: 0,
    page: Number(url.searchParams.get("page") ?? 1),
    page_size: Number(url.searchParams.get("page_size") ?? 20),
  });
}),
];