
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

type Admin = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "super_admin";
  is_active: boolean;
  created_at: string;
};

type Settings = {
  gps_mandatory: boolean;
  complaint_number_start: number;
  morning_shift_start: string;
  morning_shift_end: string;
  night_shift_start: string;
  night_shift_end: string;
  auto_accept_material_requests: boolean;
};

type AuditEvent = {
  id: number;
  actor: {
    id: number;
    name: string;
    role: string;
  };
  action: string;
  entity: string;
  entity_id: number;
  data: Record<string, unknown>;
  created_at: string;
};

const admins: Admin[] = [
  {
    id: 1,
    name: "Ravi Admin",
    email: "admin@example.com",
    role: "admin",
    is_active: true,
    created_at: "2026-11-26T09:00:00Z",
  },
  {
    id: 2,
    name: "Super Admin",
    email: "superadmin@example.com",
    role: "super_admin",
    is_active: true,
    created_at: "2026-11-26T09:00:00Z",
  },
];

let settings: Settings = {
  gps_mandatory: true,
  complaint_number_start: 1000,
  morning_shift_start: "06:00",
  morning_shift_end: "14:00",
  night_shift_start: "22:00",
  night_shift_end: "06:00",
  auto_accept_material_requests: false,
};

const auditLogs: AuditEvent[] = [
  {
    id: 10,
    actor: {
      id: 1,
      name: "Ravi Admin",
      role: "admin",
    },
    action: "complaint.assigned",
    entity: "complaint",
    entity_id: 42,
    data: {
      staff_id: 5,
    },
    created_at: "2026-11-27T10:30:00Z",
  },
];

const getPageResponse = <T,>(data: T[], request: Request) => {
  const url = new URL(request.url);

  const page = Math.max(
    1,
    Number(url.searchParams.get("page") ?? 1),
  );

  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("page_size") ?? 20)),
  );

  return {
    items: data.slice((page - 1) * pageSize, page * pageSize),
    total: data.length,
    page,
    page_size: pageSize,
  };
};

export const adminsHandlers = [
  // 9. Get Current Admin
  http.get(`${BASE}/admin/me`, () =>
    HttpResponse.json(admins[0]),
  ),

  // 10. Get Admin List
  http.get(`${BASE}/admin/admins`, ({ request }) => {
    const token = request.headers.get("Authorization");

    if (token === "Bearer expired-token") {
      return HttpResponse.json(
        { detail: "Token expired" },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";

    const filteredAdmins = admins.filter(
      (admin) =>
        admin.name.toLowerCase().includes(search) ||
        admin.email.toLowerCase().includes(search),
    );

    return HttpResponse.json(
      getPageResponse(filteredAdmins, request),
    );
  }),

  // 11. Create Admin
  http.post(`${BASE}/admin/admins`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      email: string;
      password: string;
      role: "admin" | "super_admin";
    };

    const existingAdmin = admins.find(
      (admin) => admin.email === body.email,
    );

    if (existingAdmin) {
      return HttpResponse.json(
        { detail: "Admin email already exists" },
        { status: 409 },
      );
    }

    const newAdmin: Admin = {
      id: Math.max(0, ...admins.map((admin) => admin.id)) + 1,
      name: body.name,
      email: body.email,
      role: body.role,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    admins.push(newAdmin);

    return HttpResponse.json(newAdmin, { status: 201 });
  }),

  // 12. Update Admin
  http.patch(`${BASE}/admin/admins/:id`, async ({ params, request }) => {
    const admin = admins.find(
      (item) => item.id === Number(params.id),
    );

    if (!admin) {
      return HttpResponse.json(
        { detail: "Admin not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as Partial<
      Pick<Admin, "name" | "role" | "is_active">
    >;

    Object.assign(admin, body);

    return HttpResponse.json(admin);
  }),

  // 13. Reset Admin Password
  http.post(
    `${BASE}/admin/admins/:id/reset-password`,
    async ({ params, request }) => {
      const admin = admins.find(
        (item) => item.id === Number(params.id),
      );

      if (!admin) {
        return HttpResponse.json(
          { detail: "Admin not found" },
          { status: 404 },
        );
      }

      const body = (await request.json()) as {
        new_password: string;
      };

      return HttpResponse.json({
        ok: Boolean(body.new_password),
      });
    },
  ),

  // 14. Get Admin Settings
  http.get(`${BASE}/admin/settings`, () =>
    HttpResponse.json(settings),
  ),

  // 15. Update Admin Settings
  http.patch(`${BASE}/admin/settings`, async ({ request }) => {
    const body = (await request.json()) as Partial<Settings>;

    settings = {
      ...settings,
      ...body,
    };

    return HttpResponse.json(settings);
  }),

  // 16. Get Audit Log
  http.get(`${BASE}/admin/audit-log`, ({ request }) => {
    const url = new URL(request.url);

    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const actorId = url.searchParams.get("actor_id");
    const entity = url.searchParams.get("entity");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const filteredLogs = auditLogs.filter((log) => {
      const matchesSearch =
        !search ||
        log.action.toLowerCase().includes(search) ||
        log.entity.toLowerCase().includes(search) ||
        log.actor.name.toLowerCase().includes(search);

      const matchesActor =
        !actorId || log.actor.id === Number(actorId);

      const matchesEntity =
        !entity || log.entity === entity;

      const matchesFrom =
        !from || log.created_at >= from;

      const matchesTo =
        !to || log.created_at <= to;

      return (
        matchesSearch &&
        matchesActor &&
        matchesEntity &&
        matchesFrom &&
        matchesTo
      );
    });

    return HttpResponse.json(
      getPageResponse(filteredLogs, request),
    );
  }),
];
