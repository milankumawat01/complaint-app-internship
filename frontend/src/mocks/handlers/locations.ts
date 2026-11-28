
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

type Location = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  sub_locations: SubLocation[];
};

type SubLocation = {
  id: number;
  location_id: number;
  name: string;
  floor?: string;
  block?: string;
  area_type: string;
  is_active: boolean;
};

type TimeSlot = {
  id: number;
  label: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

const locations: Location[] = [
  {
    id: 1,
    name: "Tower A",
    latitude: 28.6139,
    longitude: 77.209,
    is_active: true,
    sub_locations: [],
  },
];

const subLocations: SubLocation[] = [
  {
    id: 1,
    name: "Floor 1",
    location_id: 1,
    floor: "1",
    area_type: "common",
    is_active: true,
  },
];

const timeSlots: TimeSlot[] = [
  {
    id: 1,
    label: "Morning",
    start_time: "09:00",
    end_time: "12:00",
    is_active: true,
  },
];

const paginated = <T,>(items: T[], request: Request) => {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const size = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("page_size") ?? 20)),
  );

  return {
    items: items.slice((page - 1) * size, page * size),
    total: items.length,
    page,
    page_size: size,
  };
};

export const locationsHandlers = [
  // 30. Get Locations
  http.get(`${BASE}/admin/locations`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const active = url.searchParams.get("is_active");

    const filtered = locations.filter(
      (item) =>
        item.name.toLowerCase().includes(search) &&
        (active === null || String(item.is_active) === active),
    );

    return HttpResponse.json(paginated(filtered, request));
  }),

  // 31. Create Location
  http.post(`${BASE}/admin/locations`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      latitude: number;
      longitude: number;
    };

    const item: Location = {
      id: Math.max(0, ...locations.map((x) => x.id)) + 1,
      ...body,
      is_active: true,
      sub_locations: [],
    };

    locations.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),

  // 32. Get Location Details
  http.get(`${BASE}/admin/locations/:id`, ({ params }) => {
    const item = locations.find((x) => x.id === Number(params.id));

    return item
      ? HttpResponse.json(item)
      : HttpResponse.json({ detail: "Location not found" }, { status: 404 });
  }),

  // 33. Update Location
  http.patch(`${BASE}/admin/locations/:id`, async ({ params, request }) => {
    const item = locations.find((x) => x.id === Number(params.id));

    if (!item) {
      return HttpResponse.json(
        { detail: "Location not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as Partial<Location>;
    Object.assign(item, body);

    return HttpResponse.json(item);
  }),

  // 34. Delete Location
  http.delete(`${BASE}/admin/locations/:id`, ({ params }) => {
    const item = locations.find((x) => x.id === Number(params.id));

    if (!item) {
      return HttpResponse.json(
        { detail: "Location not found" },
        { status: 404 },
      );
    }

    if (subLocations.some((x) => x.location_id === item.id)) {
      return HttpResponse.json(
        { detail: "Location has sub-locations" },
        { status: 409 },
      );
    }

    locations.splice(locations.indexOf(item), 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // 35. Update Location Status
  http.patch(`${BASE}/admin/locations/:id/status`, async ({ params, request }) => {
    const body = (await request.json()) as { is_active: boolean };
    const item = locations.find((x) => x.id === Number(params.id));

    if (!item) {
      return HttpResponse.json(
        { detail: "Location not found" },
        { status: 404 },
      );
    }

    item.is_active = body.is_active;
    return HttpResponse.json(item);
  }),

  // 36. Get Sub-locations
  http.get(`${BASE}/admin/sub-locations`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const locationId = url.searchParams.get("location_id");
    const areaType = url.searchParams.get("area_type");

    const filtered = subLocations.filter(
      (item) =>
        item.name.toLowerCase().includes(search) &&
        (!locationId || item.location_id === Number(locationId)) &&
        (!areaType || item.area_type === areaType),
    );

    return HttpResponse.json(paginated(filtered, request));
  }),

  // 37. Create Sub-location
  http.post(`${BASE}/admin/sub-locations`, async ({ request }) => {
    const body = (await request.json()) as Omit<
      SubLocation,
      "id" | "is_active"
    >;

    const duplicate = subLocations.some(
      (x) =>
        x.location_id === body.location_id &&
        x.name.toLowerCase() === body.name.toLowerCase(),
    );

    if (duplicate) {
      return HttpResponse.json(
        { detail: "Sub-location name already exists" },
        { status: 409 },
      );
    }

    const item: SubLocation = {
      id: Math.max(0, ...subLocations.map((x) => x.id)) + 1,
      ...body,
      is_active: true,
    };

    subLocations.push(item);

    const location = locations.find((x) => x.id === item.location_id);
    location?.sub_locations.push(item);

    return HttpResponse.json(item, { status: 201 });
  }),

  // 38. Update Sub-location
  http.patch(`${BASE}/admin/sub-locations/:id`, async ({ params, request }) => {
    const item = subLocations.find((x) => x.id === Number(params.id));

    if (!item) {
      return HttpResponse.json(
        { detail: "Sub-location not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as Partial<SubLocation>;
    Object.assign(item, body);

    return HttpResponse.json(item);
  }),

  // 39. Delete Sub-location
  http.delete(`${BASE}/admin/sub-locations/:id`, ({ params }) => {
    const item = subLocations.find((x) => x.id === Number(params.id));

    if (!item) {
      return HttpResponse.json(
        { detail: "Sub-location not found" },
        { status: 404 },
      );
    }

    subLocations.splice(subLocations.indexOf(item), 1);

    const location = locations.find((x) => x.id === item.location_id);
    if (location) {
      location.sub_locations = location.sub_locations.filter(
        (x) => x.id !== item.id,
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // 40. Get Time Slots
  http.get(`${BASE}/admin/time-slots`, () =>
    HttpResponse.json(timeSlots),
  ),

  // 41. Create Time Slot
  http.post(`${BASE}/admin/time-slots`, async ({ request }) => {
    const body = (await request.json()) as Omit<
      TimeSlot,
      "id" | "is_active"
    >;

    const overlaps = timeSlots.some(
      (slot) =>
        body.start_time < slot.end_time &&
        body.end_time > slot.start_time,
    );

    if (overlaps) {
      return HttpResponse.json(
        { detail: "Time slot overlaps with an existing slot" },
        { status: 409 },
      );
    }

    const item: TimeSlot = {
      id: Math.max(0, ...timeSlots.map((x) => x.id)) + 1,
      ...body,
      is_active: true,
    };

    timeSlots.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),

  // 42. Update Time Slot
  http.patch(`${BASE}/admin/time-slots/:id`, async ({ params, request }) => {
    const item = timeSlots.find((x) => x.id === Number(params.id));

    if (!item) {
      return HttpResponse.json(
        { detail: "Time slot not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as Partial<TimeSlot>;
    Object.assign(item, body);

    return HttpResponse.json(item);
  }),

  // 43. Delete Time Slot
  http.delete(`${BASE}/admin/time-slots/:id`, ({ params }) => {
    const item = timeSlots.find((x) => x.id === Number(params.id));

    if (!item) {
      return HttpResponse.json(
        { detail: "Time slot not found" },
        { status: 404 },
      );
    }

    timeSlots.splice(timeSlots.indexOf(item), 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // 44. Get Staff Time Slots
  http.get(`${BASE}/staff/time-slots`, () =>
    HttpResponse.json(timeSlots.filter((x) => x.is_active)),
  ),

  // 45. Get Time Slots By Sub-location
  http.get(`${BASE}/staff/time-slots/by-sub-location`, ({ request }) => {
    const url = new URL(request.url);
    const subLocationId = Number(url.searchParams.get("sub_location_id"));

    const exists = subLocations.some(
      (x) => x.id === subLocationId && x.is_active,
    );

    return HttpResponse.json(
      exists ? timeSlots.filter((x) => x.is_active) : [],
    );
  }),
];
