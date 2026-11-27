
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

const templates = [
  {
    id: 1,
    name: "Daily Cleaning",
    area_type: "COMMON_AREA",
    is_active: true,
  },
];

const assignments = [
  {
    id: 1,
    template_id: 1,
    staff_id: 5,
    location_id: 1,
    sub_location_id: null,
    time_slot_id: 1,
    date: "2026-11-27",
    status: "PENDING",
  },
];

const pageResponse = (items: unknown[], request: Request) => {
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

export const tasksHandlers = [
  http.get(`${BASE}/admin/task-templates`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";

    const filtered = templates.filter((item) =>
      item.name.toLowerCase().includes(search),
    );

    return HttpResponse.json(pageResponse(filtered, request));
  }),

  http.post(`${BASE}/admin/task-templates`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { id: 2, ...body, is_active: true },
      { status: 201 },
    );
  }),

  http.patch(`${BASE}/admin/task-templates/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ id: Number(params.id), ...body });
  }),

  http.delete(`${BASE}/admin/task-templates/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.patch(`${BASE}/admin/task-templates/:id/status`, async ({ params, request }) => {
    const body = (await request.json()) as { is_active: boolean };
    return HttpResponse.json({ id: Number(params.id), ...body });
  }),

  http.get(`${BASE}/admin/task-assignments`, ({ request }) =>
    HttpResponse.json(pageResponse(assignments, request)),
  ),

  http.post(`${BASE}/admin/task-assignments`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { id: 2, ...body, status: "PENDING" },
      { status: 201 },
    );
  }),

  http.post(`${BASE}/admin/task-assignments/bulk`, () =>
    HttpResponse.json({ created: 70, skipped_duplicates: 0 }),
  ),

  http.get(`${BASE}/admin/task-assignments/:id`, ({ params }) => {
    const item = assignments.find((task) => task.id === Number(params.id));
    return item
      ? HttpResponse.json({ ...item, executions: [] })
      : HttpResponse.json({ detail: "Assignment not found" }, { status: 404 });
  }),

  http.patch(`${BASE}/admin/task-assignments/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ id: Number(params.id), ...body });
  }),

  http.delete(`${BASE}/admin/task-assignments/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${BASE}/staff/tasks`, ({ request }) =>
    HttpResponse.json([
      {
        time_slot: { id: 1, name: "Morning" },
        tasks: pageResponse(assignments, request).items,
      },
    ]),
  ),

  http.get(`${BASE}/staff/tasks/:id`, ({ params }) => {
    const item = assignments.find((task) => task.id === Number(params.id));
    return item
      ? HttpResponse.json(item)
      : HttpResponse.json({ detail: "Task not found" }, { status: 404 });
  }),

  http.get(`${BASE}/staff/dashboard/summary`, () =>
    HttpResponse.json({
      total: 6,
      pending: 2,
      in_progress: 1,
      done: 3,
    }),
  ),
];
