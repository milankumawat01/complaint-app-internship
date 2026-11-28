
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

type Profession = {
  id: number;
  name: string;
  is_active: boolean;
};

type Staff = {
  id: number;
  name: string;
  age: number;
  contact: string;
  email: string;
  profession: {
    id: number;
    name: string;
  };
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
};

const professions: Profession[] = [
  { id: 2, name: "Plumber", is_active: true },
  { id: 3, name: "Electrician", is_active: true },
];

const staff: Staff[] = [
  {
    id: 5,
    name: "Suresh Kumar",
    age: 32,
    contact: "9876543210",
    email: "suresh@example.com",
    profession: { id: 2, name: "Plumber" },
    status: "ACTIVE",
    created_at: "2026-11-28T08:00:00Z",
  },
];

const getPageResponse = <T,>(data: T[], request: Request) => {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
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

export const staffHandlers = [
  // 17. Get Professions
  http.get(`${BASE}/admin/professions`, () =>
    HttpResponse.json(professions),
  ),

  // 18. Create Profession
  http.post(`${BASE}/admin/professions`, async ({ request }) => {
    const body = (await request.json()) as { name: string };

    const newProfession: Profession = {
      id: Math.max(0, ...professions.map((item) => item.id)) + 1,
      name: body.name,
      is_active: true,
    };

    professions.push(newProfession);
    return HttpResponse.json(newProfession, { status: 201 });
  }),

  // 19. Update Profession
  http.patch(`${BASE}/admin/professions/:id`, async ({ params, request }) => {
    const profession = professions.find(
      (item) => item.id === Number(params.id),
    );

    if (!profession) {
      return HttpResponse.json(
        { detail: "Profession not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as Partial<Profession>;
    Object.assign(profession, body);

    return HttpResponse.json(profession);
  }),

  // 20. Delete Profession
  http.delete(`${BASE}/admin/professions/:id`, ({ params }) => {
    const id = Number(params.id);
    const profession = professions.find((item) => item.id === id);

    if (!profession) {
      return HttpResponse.json(
        { detail: "Profession not found" },
        { status: 404 },
      );
    }

    if (staff.some((item) => item.profession.id === id)) {
      return HttpResponse.json(
        { detail: "Profession is in use" },
        { status: 409 },
      );
    }

    professions.splice(professions.indexOf(profession), 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // 21. Get Staff List
  http.get(`${BASE}/admin/staff`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const status = url.searchParams.get("status");
    const professionId = url.searchParams.get("profession_id");

    const filteredStaff = staff.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search) ||
        item.email.toLowerCase().includes(search) ||
        item.contact.includes(search);

      const matchesStatus = !status || item.status === status;
      const matchesProfession =
        !professionId || item.profession.id === Number(professionId);

      return matchesSearch && matchesStatus && matchesProfession;
    });

    return HttpResponse.json(getPageResponse(filteredStaff, request));
  }),

  // 22. Create Staff
  http.post(`${BASE}/admin/staff`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      age: number;
      contact: string;
      email: string;
      profession_id: number;
    };

    if (
      staff.some(
        (item) =>
          item.email === body.email || item.contact === body.contact,
      )
    ) {
      return HttpResponse.json(
        { detail: "Staff contact or email already exists" },
        { status: 409 },
      );
    }

    const profession = professions.find(
      (item) => item.id === body.profession_id,
    );

    if (!profession) {
      return HttpResponse.json(
        { detail: "Profession not found" },
        { status: 404 },
      );
    }

    const newStaff: Staff = {
      id: Math.max(0, ...staff.map((item) => item.id)) + 1,
      name: body.name,
      age: body.age,
      contact: body.contact,
      email: body.email,
      profession: { id: profession.id, name: profession.name },
      status: "ACTIVE",
      created_at: new Date().toISOString(),
    };

    staff.push(newStaff);
    return HttpResponse.json(newStaff, { status: 201 });
  }),

  // 23. Get Staff Details
  http.get(`${BASE}/admin/staff/:id`, ({ params }) => {
    const item = staff.find((entry) => entry.id === Number(params.id));

    return item
      ? HttpResponse.json(item)
      : HttpResponse.json({ detail: "Staff not found" }, { status: 404 });
  }),

  // 24. Update Staff
  http.patch(`${BASE}/admin/staff/:id`, async ({ params, request }) => {
    const item = staff.find((entry) => entry.id === Number(params.id));

    if (!item) {
      return HttpResponse.json(
        { detail: "Staff not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as {
      name?: string;
      age?: number;
      contact?: string;
      email?: string;
      profession_id?: number;
    };

    if (
      staff.some(
        (other) =>
          other.id !== item.id &&
          ((body.email && other.email === body.email) ||
            (body.contact && other.contact === body.contact)),
      )
    ) {
      return HttpResponse.json(
        { detail: "Staff contact or email already exists" },
        { status: 409 },
      );
    }

    const { profession_id, ...updates } = body;
    Object.assign(item, updates);

    if (profession_id !== undefined) {
      const profession = professions.find(
        (entry) => entry.id === profession_id,
      );

      if (!profession) {
        return HttpResponse.json(
          { detail: "Profession not found" },
          { status: 404 },
        );
      }

      item.profession = { id: profession.id, name: profession.name };
    }

    return HttpResponse.json(item);
  }),

  // 25. Delete Staff
  http.delete(`${BASE}/admin/staff/:id`, ({ params }) => {
    const item = staff.find((entry) => entry.id === Number(params.id));

    if (!item) {
      return HttpResponse.json(
        { detail: "Staff not found" },
        { status: 404 },
      );
    }

    staff.splice(staff.indexOf(item), 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // 26. Update Staff Status
  http.patch(`${BASE}/admin/staff/:id/status`, async ({ params, request }) => {
    const body = (await request.json()) as {
      status: "ACTIVE" | "INACTIVE";
    };

    const item = staff.find((entry) => entry.id === Number(params.id));

    if (!item) {
      return HttpResponse.json(
        { detail: "Staff not found" },
        { status: 404 },
      );
    }

    item.status = body.status;
    return HttpResponse.json(item);
  }),

  // 27. Get Staff Complaints
  http.get(`${BASE}/admin/staff/:id/complaints`, ({ params, request }) => {
    const item = staff.find((entry) => entry.id === Number(params.id));

    if (!item) {
      return HttpResponse.json(
        { detail: "Staff not found" },
        { status: 404 },
      );
    }

    return HttpResponse.json(getPageResponse([], request));
  }),

  // 28. Get Current Staff
  http.get(`${BASE}/staff/me`, () => HttpResponse.json(staff[0])),

  // 29. Update Current Staff
  http.patch(`${BASE}/staff/me`, async ({ request }) => {
    const body = (await request.json()) as { name?: string };

    if (staff[0] && body.name) {
      staff[0].name = body.name;
    }

    return HttpResponse.json(staff[0]);
  }),
];
