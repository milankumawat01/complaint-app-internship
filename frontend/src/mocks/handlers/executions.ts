
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

const executions = [
  {
    id: 500,
    assignment: {
      id: 300,
      template: { id: 2, name: "Washroom cleaning" },
      sub_location: { id: 11, name: "Floor 2 washroom" },
      date: "2026-12-05",
    },
    staff: { id: 5, name: "Suresh Kumar" },
    status: "REVIEW",
    started_at: "2026-12-05T06:04:00Z",
    completed_at: "2026-12-05T06:40:00Z",
    images: [
      {
        id: 900,
        type: "BEFORE",
        url: "/api/v1/files/before.jpg",
        latitude: 26.9125,
        longitude: 75.7871,
        distance_m: 18,
      },
      {
        id: 901,
        type: "AFTER",
        url: "/api/v1/files/after.jpg",
        latitude: 26.9125,
        longitude: 75.7871,
        distance_m: 18,
      },
    ],
    ai: {
      status: "COMPLETED",
      score: 72,
      summary: "Floor cleaned, sink still has stains.",
      rule: { id: 2, name: "Needs review", action: "REVIEW" },
    },
  },
];

const aiRules = [
  {
    id: 2,
    name: "Needs review",
    min_score: 50,
    max_score: 79,
    action: "REVIEW",
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

export const executionsHandlers = [
  http.post(`${BASE}/staff/task-executions/start`, async ({ request }) => {
    const body = (await request.json()) as { assignment_id: number };

    return HttpResponse.json(
      {
        id: 501,
        assignment: { id: body.assignment_id },
        status: "IN_PROGRESS",
        started_at: new Date().toISOString(),
        images: [],
        ai: null,
      },
      { status: 201 },
    );
  }),

  http.post(`${BASE}/staff/task-executions/:id/images`, () =>
    HttpResponse.json(
      {
        id: 902,
        type: "BEFORE",
        url: "/api/v1/files/mock-image.jpg",
        latitude: 26.9125,
        longitude: 75.7871,
        distance_m: 18,
        created_at: new Date().toISOString(),
      },
      { status: 201 },
    ),
  ),

  http.post(`${BASE}/staff/task-executions/:id/complete`, ({ params }) => {
    const item = executions.find(
      (execution) => execution.id === Number(params.id),
    );

    return item
      ? HttpResponse.json({
          ...item,
          status: "PENDING",
          ai: { status: "PENDING" },
        })
      : HttpResponse.json(
          { detail: "Execution not found" },
          { status: 404 },
        );
  }),

  http.get(`${BASE}/staff/task-executions/:id`, ({ params }) => {
    const item = executions.find(
      (execution) => execution.id === Number(params.id),
    );

    return item
      ? HttpResponse.json(item)
      : HttpResponse.json(
          { detail: "Execution not found" },
          { status: 404 },
        );
  }),

  http.get(`${BASE}/admin/ai-score-rules`, () =>
    HttpResponse.json(aiRules),
  ),

  http.post(`${BASE}/admin/ai-score-rules`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ id: 3, ...body }, { status: 201 });
  }),

  http.patch(`${BASE}/admin/ai-score-rules/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ id: Number(params.id), ...body });
  }),

  http.delete(`${BASE}/admin/ai-score-rules/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${BASE}/admin/task-executions`, ({ request }) =>
    HttpResponse.json(pageResponse(executions, request)),
  ),

  http.get(`${BASE}/admin/task-executions/:id`, ({ params }) => {
    const item = executions.find(
      (execution) => execution.id === Number(params.id),
    );

    return item
      ? HttpResponse.json(item)
      : HttpResponse.json(
          { detail: "Execution not found" },
          { status: 404 },
        );
  }),

  http.post(`${BASE}/admin/task-executions/:id/approve`, ({ params }) => {
    const item = executions.find(
      (execution) => execution.id === Number(params.id),
    );

    return item
      ? HttpResponse.json({ ...item, status: "COMPLETED" })
      : HttpResponse.json(
          { detail: "Execution not found" },
          { status: 404 },
        );
  }),

  http.post(`${BASE}/admin/task-executions/:id/reopen`, async ({ params, request }) => {
    const body = (await request.json()) as { reason: string };
    const item = executions.find(
      (execution) => execution.id === Number(params.id),
    );

    return item
      ? HttpResponse.json({ ...item, status: "REJECTED", ...body })
      : HttpResponse.json(
          { detail: "Execution not found" },
          { status: 404 },
        );
  }),

  http.post(`${BASE}/admin/task-executions/:id/rescore`, ({ params }) => {
    const item = executions.find(
      (execution) => execution.id === Number(params.id),
    );

    return item
      ? HttpResponse.json({
          ...item,
          ai: { status: "PENDING" },
        })
      : HttpResponse.json(
          { detail: "Execution not found" },
          { status: 404 },
        );
  }),
];
