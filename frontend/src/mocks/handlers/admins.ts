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
];