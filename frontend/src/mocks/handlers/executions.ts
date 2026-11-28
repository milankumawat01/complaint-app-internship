
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

type Execution = {
  id: number;
  assignment: Record<string, unknown>;
  staff?: { id: number; name: string };
  status: string;
  started_at: string;
  completed_at: string | null;
  images: {
    id: number;
    type: string;
    url: string;
    latitude: number;
    longitude: number;
    distance_m: number;
    created_at?: string;
  }[];
  ai: Record<string, unknown> | null;
};

type AiRule = {
  id: number;
  name: string;
  min_score: number;
  max_score: number;
  action: string;
};

const executions: Execution[] = [
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

const aiRules: AiRule[] = [
  {
    id: 2,
    name: "Needs review",
    min_score: 50,
    max_score: 79,
    action: "REVIEW",
  },
];

let nextExecutionId = 501;
let nextImageId = 902;
let nextRuleId = 3;

const pageResponse = <T,>(items: T[], request: Request) => {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("page_size") ?? 20)),
  );

  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    page_size: pageSize,
  };
};

const executionNotFound = () =>
  HttpResponse.json(
    { detail: "Execution not found" },
    { status: 404 },
  );

export const executionsHandlers = [
  // Staff start task execution
  http.post(`${BASE}/staff/task-executions/start`, async ({ request }) => {
    const body = (await request.json()) as {
      assignment_id: number;
    };

    const existing = executions.find(
      (item) =>
        Number(item.assignment.id) === body.assignment_id &&
        item.status === "IN_PROGRESS",
    );

    if (existing) {
      return HttpResponse.json(
        { detail: "Execution already started" },
        { status: 409 },
      );
    }

    const item: Execution = {
      id: nextExecutionId++,
      assignment: { id: body.assignment_id },
      status: "IN_PROGRESS",
      started_at: new Date().toISOString(),
      completed_at: null,
      images: [],
      ai: null,
    };

    executions.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),

  // Staff upload execution image
  http.post(`${BASE}/staff/task-executions/:id/images`, async ({ params, request }) => {
    const execution = executions.find(
      (item) => item.id === Number(params.id),
    );

    if (!execution) return executionNotFound();

    if (execution.status !== "IN_PROGRESS") {
      return HttpResponse.json(
        { detail: "Execution is not in progress" },
        { status: 409 },
      );
    }

    const formData = await request.formData();
    const type = String(formData.get("type") ?? "BEFORE");

    const image = {
      id: nextImageId++,
      type,
      url: `/api/v1/files/mock-image-${nextImageId}.jpg`,
      latitude: Number(formData.get("latitude") ?? 26.9125),
      longitude: Number(formData.get("longitude") ?? 75.7871),
      distance_m: 18,
      created_at: new Date().toISOString(),
    };

    execution.images.push(image);
    return HttpResponse.json(image, { status: 201 });
  }),

  // Staff complete execution
  http.post(`${BASE}/staff/task-executions/:id/complete`, ({ params }) => {
    const execution = executions.find(
      (item) => item.id === Number(params.id),
    );

    if (!execution) return executionNotFound();

    if (execution.status !== "IN_PROGRESS") {
      return HttpResponse.json(
        { detail: "Execution is not in progress" },
        { status: 409 },
      );
    }

    execution.status = "PENDING";
    execution.completed_at = new Date().toISOString();
    execution.ai = { status: "PENDING" };

    return HttpResponse.json(execution);
  }),

  // Staff execution details
  http.get(`${BASE}/staff/task-executions/:id`, ({ params }) => {
    const item = executions.find(
      (execution) => execution.id === Number(params.id),
    );

    return item ? HttpResponse.json(item) : executionNotFound();
  }),

  // AI score rules list
  http.get(`${BASE}/admin/ai-score-rules`, () =>
    HttpResponse.json(aiRules),
  ),

  // Create AI score rule
  http.post(`${BASE}/admin/ai-score-rules`, async ({ request }) => {
    const body = (await request.json()) as Omit<AiRule, "id">;

    const item: AiRule = {
      id: nextRuleId++,
      ...body,
    };

    aiRules.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),

  // Update AI score rule
  http.patch(`${BASE}/admin/ai-score-rules/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<AiRule>;
    const item = aiRules.find(
      (rule) => rule.id === Number(params.id),
    );

    if (!item) {
      return HttpResponse.json(
        { detail: "AI rule not found" },
        { status: 404 },
      );
    }

    Object.assign(item, body);
    return HttpResponse.json(item);
  }),

  // Delete AI score rule
  http.delete(`${BASE}/admin/ai-score-rules/:id`, ({ params }) => {
    const index = aiRules.findIndex(
      (rule) => rule.id === Number(params.id),
    );

    if (index === -1) {
      return HttpResponse.json(
        { detail: "AI rule not found" },
        { status: 404 },
      );
    }

    aiRules.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Admin execution list
  http.get(`${BASE}/admin/task-executions`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const staffId = url.searchParams.get("staff_id");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const filtered = executions.filter((item) => {
      const date = String(item.assignment.date ?? "");

      return (
        (!status || item.status === status) &&
        (!staffId || item.staff?.id === Number(staffId)) &&
        (!from || date >= from) &&
        (!to || date <= to)
      );
    });

    return HttpResponse.json(pageResponse(filtered, request));
  }),

  // Admin execution details
  http.get(`${BASE}/admin/task-executions/:id`, ({ params }) => {
    const item = executions.find(
      (execution) => execution.id === Number(params.id),
    );

    return item ? HttpResponse.json(item) : executionNotFound();
  }),

  // Admin approve execution
  http.post(`${BASE}/admin/task-executions/:id/approve`, ({ params }) => {
    const item = executions.find(
      (execution) => execution.id === Number(params.id),
    );

    if (!item) return executionNotFound();

    item.status = "COMPLETED";
    return HttpResponse.json(item);
  }),

  // Admin reopen execution
  http.post(`${BASE}/admin/task-executions/:id/reopen`, async ({ params, request }) => {
    const body = (await request.json()) as { reason: string };
    const item = executions.find(
      (execution) => execution.id === Number(params.id),
    );

    if (!item) return executionNotFound();

    item.status = "REJECTED";
    item.ai = {
      ...(item.ai ?? {}),
      reopen_reason: body.reason,
    };

    return HttpResponse.json(item);
  }),

  // Admin rescore execution
  http.post(`${BASE}/admin/task-executions/:id/rescore`, ({ params }) => {
    const item = executions.find(
      (execution) => execution.id === Number(params.id),
    );

    if (!item) return executionNotFound();

    item.ai = { status: "PENDING" };
    return HttpResponse.json(item);
  }),
];
