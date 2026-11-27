
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

const subLocations = [
  { id: 1, name: "Floor 1", location_id: 1, is_active: true },
];

const timeSlots = [
  {
    id: 1,
    name: "Morning",
    start_time: "09:00",
    end_time: "12:00",
    is_active: true,
  },
];

const paginated = (items: unknown[], request: Request) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const size = Number(url.searchParams.get("page_size") ?? 20);

  return {
    items: items.slice((page - 1) * size, page * size),
    total: items.length,
    page,
    page_size: size,
  };
};

export const locationsHandlers = [
  // Locations
  http.get(`${BASE}/admin/locations`, ({ request }) =>
    HttpResponse.json(paginated(locations, request)),
  ),

  http.post(`${BASE}/admin/locations`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json(
      { id: 2, ...body, is_active: true, sub_locations: [] },
      { status: 201 },
    );
  }),

  http.get(`${BASE}/admin/locations/:id`, ({ params }) => {
    const item = locations.find((x) => x.id === Number(params.id));
    return item
      ? HttpResponse.json(item)
      : HttpResponse.json({ detail: "Location not found" }, { status: 404 });
  }),

  http.patch(`${BASE}/admin/locations/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const item = locations.find((x) => x.id === Number(params.id));
    return item
      ? HttpResponse.json({ ...item, ...body })
      : HttpResponse.json({ detail: "Location not found" }, { status: 404 });
  }),

  http.delete(`${BASE}/admin/locations/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.patch(`${BASE}/admin/locations/:id/status`, async ({ params, request }) => {
    const body = await request.json() as { is_active: boolean };
    const item = locations.find((x) => x.id === Number(params.id));
    return item
      ? HttpResponse.json({ ...item, is_active: body.is_active })
      : HttpResponse.json({ detail: "Location not found" }, { status: 404 });
  }),

  // Sub-locations
  http.get(`${BASE}/admin/sub-locations`, ({ request }) =>
    HttpResponse.json(paginated(subLocations, request)),
  ),

  http.post(`${BASE}/admin/sub-locations`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: 2, ...body }, { status: 201 });
  }),

  http.patch(`${BASE}/admin/sub-locations/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const item = subLocations.find((x) => x.id === Number(params.id));
    return item
      ? HttpResponse.json({ ...item, ...body })
      : HttpResponse.json({ detail: "Sub-location not found" }, { status: 404 });
  }),

  http.delete(`${BASE}/admin/sub-locations/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  // Time slots
  http.get(`${BASE}/admin/time-slots`, ({ request }) =>
    HttpResponse.json(paginated(timeSlots, request)),
  ),

  http.post(`${BASE}/admin/time-slots`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: 2, ...body }, { status: 201 });
  }),

  http.patch(`${BASE}/admin/time-slots/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const item = timeSlots.find((x) => x.id === Number(params.id));
    return item
      ? HttpResponse.json({ ...item, ...body })
      : HttpResponse.json({ detail: "Time slot not found" }, { status: 404 });
  }),

  http.delete(`${BASE}/admin/time-slots/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  // Staff time slots
  http.get(`${BASE}/staff/time-slots`, () =>
    HttpResponse.json(timeSlots),
  ),

  http.get(`${BASE}/staff/time-slots/by-sub-location`, ({ request }) => {
    const url = new URL(request.url);
    const id = Number(url.searchParams.get("sub_location_id"));

    return HttpResponse.json(
      timeSlots.filter((slot) => slot.is_active && id === 1),
    );
  }),
];
