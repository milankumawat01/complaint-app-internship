
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
  http.get(`${BASE}/admin/professions`, () =>
  HttpResponse.json([
    { id: 2, name: "Plumber" },
    { id: 3, name: "Electrician" },
  ]),
),

http.post(`${BASE}/admin/professions`, async ({ request }) =>
  HttpResponse.json(
    { id: 4, ...(await request.json() as object) },
    { status: 201 },
  ),
),

http.patch(`${BASE}/admin/professions/:id`, async ({ params, request }) =>
  HttpResponse.json({
    id: Number(params.id),
    ...(await request.json() as object),
  }),
),

http.delete(`${BASE}/admin/professions/:id`, () =>
  new HttpResponse(null, { status: 204 }),
),

http.get(`${BASE}/admin/staff/:id`, ({ params }) => {
  const item = staff.find((entry) => entry.id === Number(params.id));
  return item
    ? HttpResponse.json(item)
    : HttpResponse.json({ detail: "Staff not found" }, { status: 404 });
}),

http.patch(`${BASE}/admin/staff/:id`, async ({ params, request }) => {
  const body = await request.json() as Record<string, unknown>;
  const item = staff.find((entry) => entry.id === Number(params.id));
  return item
    ? HttpResponse.json({ ...item, ...body })
    : HttpResponse.json({ detail: "Staff not found" }, { status: 404 });
}),

http.delete(`${BASE}/admin/staff/:id`, () =>
  new HttpResponse(null, { status: 204 }),
),

http.patch(`${BASE}/admin/staff/:id/status`, async ({ params, request }) => {
  const body = await request.json() as { status: string };
  const item = staff.find((entry) => entry.id === Number(params.id));
  return item
    ? HttpResponse.json({ ...item, status: body.status })
    : HttpResponse.json({ detail: "Staff not found" }, { status: 404 });
}),

http.get(`${BASE}/admin/staff/:id/complaints`, ({ request }) => {
  const url = new URL(request.url);
  return HttpResponse.json({
    items: [],
    total: 0,
    page: Number(url.searchParams.get("page") ?? 1),
    page_size: Number(url.searchParams.get("page_size") ?? 20),
  });
}),

http.get(`${BASE}/staff/me`, () => HttpResponse.json(staff[0])),

http.patch(`${BASE}/staff/me`, async ({ request }) =>
  HttpResponse.json({
    ...staff[0],
    ...(await request.json() as object),
  }),
),
];
