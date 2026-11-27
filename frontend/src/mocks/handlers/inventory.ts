
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

const items = [
  {
    id: 1,
    name: "Floor Cleaner",
    unit: "LITRE",
    current_stock: 25,
    minimum_stock: 10,
    is_active: true,
  },
];

const requests = [
  {
    id: 10,
    item_id: 1,
    quantity: 5,
    status: "PENDING",
    requested_by: { id: 5, name: "Suresh Kumar" },
  },
];

const pageResponse = (data: unknown[], request: Request) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const size = Number(url.searchParams.get("page_size") ?? 20);

  return {
    items: data.slice((page - 1) * size, page * size),
    total: data.length,
    page,
    page_size: size,
  };
};

export const inventoryHandlers = [
  http.get(`${BASE}/admin/inventory/items`, ({ request }) =>
    HttpResponse.json(pageResponse(items, request)),
  ),

  http.post(`${BASE}/admin/inventory/items`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { id: 2, ...body, current_stock: 0, is_active: true },
      { status: 201 },
    );
  }),

  http.get(`${BASE}/admin/inventory/items/:id`, ({ params }) => {
    const item = items.find((entry) => entry.id === Number(params.id));
    return item
      ? HttpResponse.json(item)
      : HttpResponse.json({ detail: "Item not found" }, { status: 404 });
  }),

  http.patch(`${BASE}/admin/inventory/items/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ id: Number(params.id), ...body });
  }),

  http.delete(`${BASE}/admin/inventory/items/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${BASE}/admin/inventory/requests`, ({ request }) =>
    HttpResponse.json(pageResponse(requests, request)),
  ),

  http.post(`${BASE}/staff/inventory/requests`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { id: 11, ...body, status: "PENDING" },
      { status: 201 },
    );
  }),

  http.get(`${BASE}/staff/inventory/requests`, ({ request }) =>
    HttpResponse.json(pageResponse(requests, request)),
  ),

  http.post(`${BASE}/admin/inventory/requests/:id/approve`, () =>
    HttpResponse.json({ ok: true, status: "APPROVED" }),
  ),

  http.post(`${BASE}/admin/inventory/requests/:id/reject`, async ({ request }) => {
    const body = (await request.json()) as { reason: string };
    return HttpResponse.json({ ok: true, status: "REJECTED", ...body });
  }),

  http.get(`${BASE}/admin/inventory/stock`, ({ request }) =>
    HttpResponse.json(pageResponse(items, request)),
  ),

  http.post(`${BASE}/admin/inventory/stock`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { id: 20, ...body, created_at: new Date().toISOString() },
      { status: 201 },
    );
  }),

  http.get(`${BASE}/admin/inventory/transactions`, ({ request }) =>
    HttpResponse.json(pageResponse([], request)),
  ),

  http.get(`${BASE}/admin/inventory/low-stock`, () =>
    HttpResponse.json(items.filter((item) => item.current_stock <= item.minimum_stock)),
  ),
];
