
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

const complaintTypes = [
  { id: 4, name: "Plumbing" },
  { id: 5, name: "Electrical" },
];

const complaints = [
  {
    id: 42,
    number: "1001",
    name: "Anita Sharma",
    contact: "9812345678",
    email: "anita@example.com",
    block: "B-204",
    type: complaintTypes[0],
    preferred_time: "10:00-12:00",
    description: "Kitchen tap leaking",
    status: "ASSIGNED",
    staff: { id: 5, name: "Suresh Kumar", contact: "9876543210" },
    started_at: null,
    completed_at: null,
    rating: null,
    created_at: "2026-12-01T09:15:00Z",
    history: [],
  },
];

const resident = {
  id: 7,
  mobile: "9812345678",
  name: "Anita Sharma",
  email: "anita@example.com",
  block: "B-204",
};

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

export const complaintsHandlers = [
  http.get(`${BASE}/public/complaint-types`, () =>
    HttpResponse.json(complaintTypes),
  ),

  http.post(`${BASE}/public/complaints`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { number: "1002", ...body },
      { status: 201 },
    );
  }),

  http.get(`${BASE}/public/complaints/track`, ({ request }) => {
    const url = new URL(request.url);
    const number = url.searchParams.get("number");
    const complaint = complaints.find((item) => item.number === number);

    return complaint
      ? HttpResponse.json({
          number: complaint.number,
          status: complaint.status,
          history: complaint.history,
        })
      : HttpResponse.json(
          { detail: "Complaint not found" },
          { status: 404 },
        );
  }),

  http.get(`${BASE}/admin/complaint-types`, () =>
    HttpResponse.json(complaintTypes),
  ),

  http.post(`${BASE}/admin/complaint-types`, async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json(
      { id: 6, ...body },
      { status: 201 },
    );
  }),

  http.patch(`${BASE}/admin/complaint-types/:id`, async ({ params, request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json({ id: Number(params.id), ...body });
  }),

  http.delete(`${BASE}/admin/complaint-types/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${BASE}/admin/complaints`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const status = url.searchParams.get("status");

    const filtered = complaints.filter(
      (item) =>
        (!status || item.status === status) &&
        (item.name.toLowerCase().includes(search) ||
          item.number.includes(search)),
    );

    return HttpResponse.json(pageResponse(filtered, request));
  }),

  http.get(`${BASE}/admin/complaints/counts`, () =>
    HttpResponse.json({
      PENDING: 4,
      ASSIGNED: 7,
      IN_PROGRESS: 3,
      COMPLETED: 120,
      CANCELLED: 2,
      today: 5,
    }),
  ),

  http.get(`${BASE}/admin/complaints/:id`, ({ params }) => {
    const complaint = complaints.find(
      (item) => item.id === Number(params.id),
    );

    return complaint
      ? HttpResponse.json(complaint)
      : HttpResponse.json({ detail: "Complaint not found" }, { status: 404 });
  }),

  http.patch(`${BASE}/admin/complaints/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const complaint = complaints.find(
      (item) => item.id === Number(params.id),
    );

    return complaint
      ? HttpResponse.json({ ...complaint, ...body })
      : HttpResponse.json({ detail: "Complaint not found" }, { status: 404 });
  }),

  http.post(`${BASE}/admin/complaints/:id/assign`, async ({ params, request }) => {
    const body = (await request.json()) as { staff_id: number };
    const complaint = complaints.find(
      (item) => item.id === Number(params.id),
    );

    return complaint
      ? HttpResponse.json({
          ...complaint,
          status: "ASSIGNED",
          staff: { id: body.staff_id, name: "Suresh Kumar" },
        })
      : HttpResponse.json({ detail: "Complaint not found" }, { status: 404 });
  }),

  http.post(`${BASE}/admin/complaints/:id/close`, async ({ params, request }) => {
    const body = (await request.json()) as {
      status: string;
      reason: string;
    };
    const complaint = complaints.find(
      (item) => item.id === Number(params.id),
    );

    return complaint
      ? HttpResponse.json({ ...complaint, ...body })
      : HttpResponse.json({ detail: "Complaint not found" }, { status: 404 });
  }),

  http.get(`${BASE}/staff/complaints`, ({ request }) =>
    HttpResponse.json(pageResponse(complaints, request)),
  ),

  http.get(`${BASE}/staff/complaints/:id`, ({ params }) => {
    const complaint = complaints.find(
      (item) => item.id === Number(params.id),
    );

    return complaint
      ? HttpResponse.json(complaint)
      : HttpResponse.json({ detail: "Complaint not found" }, { status: 404 });
  }),

  http.post(`${BASE}/staff/complaints/:id/start`, ({ params }) => {
    const complaint = complaints.find(
      (item) => item.id === Number(params.id),
    );

    return complaint
      ? HttpResponse.json({ ...complaint, status: "IN_PROGRESS" })
      : HttpResponse.json({ detail: "Complaint not found" }, { status: 404 });
  }),

  http.post(`${BASE}/staff/complaints/:id/complete`, ({ params }) => {
    const complaint = complaints.find(
      (item) => item.id === Number(params.id),
    );

    return complaint
      ? HttpResponse.json({ ...complaint, status: "COMPLETED" })
      : HttpResponse.json({ detail: "Complaint not found" }, { status: 404 });
  }),

  http.get(`${BASE}/resident/me`, () =>
    HttpResponse.json(resident),
  ),

  http.patch(`${BASE}/resident/me`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...resident, ...body });
  }),

  http.post(`${BASE}/resident/complaints`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ number: "1003", ...body }, { status: 201 });
  }),

  http.get(`${BASE}/resident/complaints`, ({ request }) =>
    HttpResponse.json(pageResponse(complaints, request)),
  ),

  http.get(`${BASE}/resident/complaints/:id`, ({ params }) => {
    const complaint = complaints.find(
      (item) => item.id === Number(params.id),
    );

    return complaint
      ? HttpResponse.json({
          ...complaint,
          completion_otp:
            complaint.status === "IN_PROGRESS" ? "482913" : null,
        })
      : HttpResponse.json({ detail: "Complaint not found" }, { status: 404 });
  }),

  http.post(`${BASE}/resident/complaints/:id/rating`, async ({ params, request }) => {
    const body = (await request.json()) as {
      stars: number;
      comment?: string;
    };
    const complaint = complaints.find(
      (item) => item.id === Number(params.id),
    );

    return complaint
      ? HttpResponse.json({
          ...body,
          created_at: new Date().toISOString(),
        })
      : HttpResponse.json({ detail: "Complaint not found" }, { status: 404 });
  }),
];
