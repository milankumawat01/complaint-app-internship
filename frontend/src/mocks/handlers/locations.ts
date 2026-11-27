import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

const locations = [
  {
    id: 1,
    name: "Tower A",
    latitude: 28.6139,
    longitude: 77.209,
    is_active: true,
    sub_locations: [],
  },
];

export const locationsHandlers = [
  http.get(`${BASE}/admin/locations`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const size = Number(url.searchParams.get("page_size") ?? 20);

    return HttpResponse.json({
      items: locations.slice((page - 1) * size, page * size),
      total: locations.length,
      page,
      page_size: size,
    });
  }),

  http.post(`${BASE}/admin/locations`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json(
      { id: 2, ...body, is_active: true, sub_locations: [] },
      { status: 201 },
    );
  }),

  http.get(`${BASE}/admin/locations/:id`, ({ params }) => {
    const location = locations.find((item) => item.id === Number(params.id));
    return location
      ? HttpResponse.json(location)
      : HttpResponse.json({ detail: "Location not found" }, { status: 404 });
  }),
];