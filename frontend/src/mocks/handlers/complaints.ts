
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

type ComplaintStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type ComplaintType = {
  id: number;
  name: string;
};

type Complaint = {
  id: number;
  number: string;
  name: string;
  contact: string;
  email?: string;
  block: string;
  type: ComplaintType;
  preferred_time?: string;
  description: string;
  status: ComplaintStatus;
  staff: { id: number; name: string; contact?: string } | null;
  started_at: string | null;
  completed_at: string | null;
  rating: { stars: number; comment?: string; created_at: string } | null;
  created_at: string;
  history: { status: string; created_at: string; note?: string }[];
};

const complaintTypes: ComplaintType[] = [
  { id: 4, name: "Plumbing" },
  { id: 5, name: "Electrical" },
];

const complaints: Complaint[] = [
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

let nextComplaintId = 43;
let nextComplaintNumber = 1002;
let nextTypeId = 6;

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

const notFound = () =>
  HttpResponse.json({ detail: "Complaint not found" }, { status: 404 });

const addHistory = (complaint: Complaint, note?: string) => {
  complaint.history.push({
    status: complaint.status,
    created_at: new Date().toISOString(),
    ...(note ? { note } : {}),
  });
};

const createComplaint = (body: Record<string, unknown>): Complaint => {
  const type = complaintTypes.find(
    (item) => item.id === Number(body.type_id),
  );

  const complaint: Complaint = {
    id: nextComplaintId++,
    number: String(nextComplaintNumber++),
    name: String(body.name ?? resident.name),
    contact: String(body.contact ?? resident.mobile),
    email: String(body.email ?? resident.email),
    block: String(body.block ?? resident.block),
    type: type ?? complaintTypes[0],
    preferred_time: String(body.preferred_time ?? ""),
    description: String(body.description ?? ""),
    status: "PENDING",
    staff: null,
    started_at: null,
    completed_at: null,
    rating: null,
    created_at: new Date().toISOString(),
    history: [
      {
        status: "PENDING",
        created_at: new Date().toISOString(),
      },
    ],
  };

  complaints.push(complaint);
  return complaint;
};

export const complaintsHandlers = [
  // Public complaint types
  http.get(`${BASE}/public/complaint-types`, () =>
    HttpResponse.json(complaintTypes),
  ),

  // Public complaint creation
  http.post(`${BASE}/public/complaints`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const complaint = createComplaint(body);

    return HttpResponse.json(
      { number: complaint.number },
      { status: 201 },
    );
  }),

  // Public complaint tracking
  http.get(`${BASE}/public/complaints/track`, ({ request }) => {
    const url = new URL(request.url);
    const number = url.searchParams.get("number");
    const mobile = url.searchParams.get("mobile");

    const complaint = complaints.find(
      (item) => item.number === number && item.contact === mobile,
    );

    return complaint
      ? HttpResponse.json({
          number: complaint.number,
          status: complaint.status,
          history: complaint.history,
        })
      : notFound();
  }),

  // Admin complaint types
  http.get(`${BASE}/admin/complaint-types`, () =>
    HttpResponse.json(complaintTypes),
  ),

  http.post(`${BASE}/admin/complaint-types`, async ({ request }) => {
    const body = (await request.json()) as { name: string };
    const item = { id: nextTypeId++, name: body.name };

    complaintTypes.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),

  http.patch(`${BASE}/admin/complaint-types/:id`, async ({ params, request }) => {
    const body = (await request.json()) as { name: string };
    const item = complaintTypes.find(
      (type) => type.id === Number(params.id),
    );

    if (!item) {
      return HttpResponse.json(
        { detail: "Complaint type not found" },
        { status: 404 },
      );
    }

    item.name = body.name;
    return HttpResponse.json(item);
  }),

  http.delete(`${BASE}/admin/complaint-types/:id`, ({ params }) => {
    const id = Number(params.id);
    const inUse = complaints.some((item) => item.type.id === id);

    if (inUse) {
      return HttpResponse.json(
        { detail: "Complaint type is in use" },
        { status: 409 },
      );
    }

    const index = complaintTypes.findIndex((item) => item.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { detail: "Complaint type not found" },
        { status: 404 },
      );
    }

    complaintTypes.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Admin complaint list
  http.get(`${BASE}/admin/complaints`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const status = url.searchParams.get("status");
    const typeId = url.searchParams.get("type_id");
    const staffId = url.searchParams.get("staff_id");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const filtered = complaints.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search) ||
        item.number.includes(search) ||
        item.description.toLowerCase().includes(search);

      return (
        matchesSearch &&
        (!status || item.status === status) &&
        (!typeId || item.type.id === Number(typeId)) &&
        (!staffId || item.staff?.id === Number(staffId)) &&
        (!from || item.created_at >= from) &&
        (!to || item.created_at.slice(0, 10) <= to)
      );
    });

    return HttpResponse.json(pageResponse(filtered, request));
  }),

  // Admin complaint counts
  http.get(`${BASE}/admin/complaints/counts`, () => {
    const counts = {
      PENDING: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      today: 0,
    };

    complaints.forEach((item) => {
      counts[item.status]++;
      if (item.created_at.slice(0, 10) === new Date().toISOString().slice(0, 10)) {
        counts.today++;
      }
    });

    return HttpResponse.json(counts);
  }),

  // Admin complaint details
  http.get(`${BASE}/admin/complaints/:id`, ({ params }) => {
    const complaint = complaints.find(
      (item) => item.id === Number(params.id),
    );

    return complaint ? HttpResponse.json(complaint) : notFound();
  }),

  // Admin complaint update
  http.patch(`${BASE}/admin/complaints/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const complaint = complaints.find(
      (item) => item.id === Number(params.id),
    );

    if (!complaint) return notFound();

    if (body.type_id !== undefined) {
      const type = complaintTypes.find(
        (item) => item.id === Number(body.type_id),
      );

      if (!type) {
        return HttpResponse.json(
          { detail: "Complaint type not found" },
          { status: 404 },
        );
      }

      complaint.type = type;
    }

    if (body.block !== undefined) complaint.block = String(body.block);
    if (body.description !== undefined) {
      complaint.description = String(body.description);
    }
    if (body.preferred_time !== undefined) {
      complaint.preferred_time = String(body.preferred_time);
    }

    return HttpResponse.json(complaint);
  }),

  // Admin assign complaint
  http.post(`${BASE}/admin/complaints/:id/assign`, async ({ params, request }) => {
    const body = (await request.json()) as { staff_id: number };
    const complaint = complaints.find(
      (item) => item.id === Number(params.id),
    );

    if (!complaint) return notFound();

    if (
      complaint.status === "IN_PROGRESS" ||
      complaint.status === "COMPLETED"
    ) {
      return HttpResponse.json(
        { detail: "Complaint cannot be assigned now" },
        { status: 409 },
      );
    }

    complaint.staff = {
      id: body.staff_id,
      name: "Suresh Kumar",
    };
    complaint.status = "ASSIGNED";
    addHistory(complaint, "Complaint assigned");

    return HttpResponse.json(complaint);
  }),

  // Admin close complaint
  http.post(`${BASE}/admin/complaints/:id/close`, async ({ params, request }) => {
    const body = (await request.json()) as {
      status: "COMPLETED" | "CANCELLED";
      reason: string;
    };
    const complaint = complaints.find(
      (item) => item.id === Number(params.id),
    );

    if (!complaint) return notFound();

    complaint.status = body.status;
    if (body.status === "COMPLETED") {
      complaint.completed_at = new Date().toISOString();
    }
    addHistory(complaint, body.reason);

    return HttpResponse.json(complaint);
  }),

  // Staff complaint list
  http.get(`${BASE}/staff/complaints`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const filtered = complaints.filter(
      (item) => !status || item.status === status,
    );

    return HttpResponse.json(pageResponse(filtered, request));
  }),

  // Staff complaint details
  http.get(`${BASE}/staff/complaints/:id`, ({ params }) => {
    const complaint = complaints.find(
      (item) => item.id === Number(params.id),
    );

    return complaint ? HttpResponse.json(complaint) : notFound();
  }),

  // Staff start complaint
  http.post(`${BASE}/staff/complaints/:id/start`, ({ params }) => {
    const complaint = complaints.find(
      (item) => item.id === Number(params.id),
    );

    if (!complaint) return notFound();

    complaint.status = "IN_PROGRESS";
    complaint.started_at = new Date().toISOString();
    addHistory(complaint, "Work started");

    return HttpResponse.json(complaint);
  }),

  // Staff complete complaint
  http.post(`${BASE}/staff/complaints/:id/complete`, async ({ params, request }) => {
    const body = (await request.json()) as { otp: string };
    const complaint = complaints.find(
      (item) => item.id === Number(params.id),
    );

    if (!complaint) return notFound();

    if (body.otp !== "482913") {
      return HttpResponse.json(
        { detail: "Invalid OTP" },
        { status: 422 },
      );
    }

    complaint.status = "COMPLETED";
    complaint.completed_at = new Date().toISOString();
    addHistory(complaint, "Work completed");

    return HttpResponse.json(complaint);
  }),

  // Resident profile
  http.get(`${BASE}/resident/me`, () =>
    HttpResponse.json(resident),
  ),

  http.patch(`${BASE}/resident/me`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    if (body.name !== undefined) resident.name = String(body.name);
    if (body.email !== undefined) resident.email = String(body.email);
    if (body.block !== undefined) resident.block = String(body.block);

    return HttpResponse.json(resident);
  }),

  // Resident create complaint
  http.post(`${BASE}/resident/complaints`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const complaint = createComplaint(body);

    return HttpResponse.json(
      { number: complaint.number },
      { status: 201 },
    );
  }),

  // Resident complaint list
  http.get(`${BASE}/resident/complaints`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const filtered = complaints.filter(
      (item) =>
        item.contact === resident.mobile &&
        (!status || item.status === status),
    );

    return HttpResponse.json(pageResponse(filtered, request));
  }),

  // Resident complaint details
  http.get(`${BASE}/resident/complaints/:id`, ({ params }) => {
    const complaint = complaints.find(
      (item) =>
        item.id === Number(params.id) &&
        item.contact === resident.mobile,
    );

    return complaint
      ? HttpResponse.json({
          ...complaint,
          completion_otp:
            complaint.status === "IN_PROGRESS" ? "482913" : null,
        })
      : notFound();
  }),

  // Resident complaint rating
  http.post(`${BASE}/resident/complaints/:id/rating`, async ({ params, request }) => {
    const body = (await request.json()) as {
      stars: number;
      comment?: string;
    };

    const complaint = complaints.find(
      (item) =>
        item.id === Number(params.id) &&
        item.contact === resident.mobile,
    );

    if (!complaint) return notFound();

    if (complaint.status !== "COMPLETED" || complaint.rating) {
      return HttpResponse.json(
        { detail: "Complaint cannot be rated" },
        { status: 409 },
      );
    }

    complaint.rating = {
      stars: body.stars,
      comment: body.comment,
      created_at: new Date().toISOString(),
    };

    return HttpResponse.json(complaint.rating, { status: 201 });
  }),
];
