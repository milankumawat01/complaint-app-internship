
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

type TaskTemplate = {
  id: number;
  name: string;
  area_type: string;
  is_active: boolean;
};

type TaskAssignment = {
  id: number;
  template_id: number;
  staff_id: number;
  location_id: number;
  sub_location_id: number | null;
  time_slot_id: number;
  date: string;
  status: string;
};

const templates: TaskTemplate[] = [
  {
    id: 1,
    name: "Daily Cleaning",
    area_type: "COMMON_AREA",
    is_active: true,
  },
];

const assignments: TaskAssignment[] = [
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

let nextTemplateId = 2;
let nextAssignmentId = 2;

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

const assignmentExists = (
  data: Omit<TaskAssignment, "id" | "status">,
) =>
  assignments.some(
    (item) =>
      item.staff_id === data.staff_id &&
      item.template_id === data.template_id &&
      item.time_slot_id === data.time_slot_id &&
      item.date === data.date &&
      item.sub_location_id === data.sub_location_id,
  );

export const tasksHandlers = [
  // Task templates list
  http.get(`${BASE}/admin/task-templates`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const areaType = url.searchParams.get("area_type");
    const active = url.searchParams.get("is_active");

    const filtered = templates.filter(
      (item) =>
        item.name.toLowerCase().includes(search) &&
        (!areaType || item.area_type === areaType) &&
        (active === null || item.is_active === (active === "true")),
    );

    return HttpResponse.json(pageResponse(filtered, request));
  }),

  // Create task template
  http.post(`${BASE}/admin/task-templates`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      area_type: string;
    };

    const item: TaskTemplate = {
      id: nextTemplateId++,
      ...body,
      is_active: true,
    };

    templates.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),

  // Update task template
  http.patch(`${BASE}/admin/task-templates/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<TaskTemplate>;
    const item = templates.find(
      (template) => template.id === Number(params.id),
    );

    if (!item) {
      return HttpResponse.json(
        { detail: "Task template not found" },
        { status: 404 },
      );
    }

    Object.assign(item, body);
    return HttpResponse.json(item);
  }),

  // Delete task template
  http.delete(`${BASE}/admin/task-templates/:id`, ({ params }) => {
    const id = Number(params.id);

    if (assignments.some((item) => item.template_id === id)) {
      return HttpResponse.json(
        { detail: "Task template is in use" },
        { status: 409 },
      );
    }

    const index = templates.findIndex((item) => item.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { detail: "Task template not found" },
        { status: 404 },
      );
    }

    templates.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Update template status
  http.patch(`${BASE}/admin/task-templates/:id/status`, async ({ params, request }) => {
    const body = (await request.json()) as { is_active: boolean };
    const item = templates.find(
      (template) => template.id === Number(params.id),
    );

    if (!item) {
      return HttpResponse.json(
        { detail: "Task template not found" },
        { status: 404 },
      );
    }

    item.is_active = body.is_active;
    return HttpResponse.json(item);
  }),

  // Task assignments list
  http.get(`${BASE}/admin/task-assignments`, ({ request }) => {
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const staffId = url.searchParams.get("staff_id");
    const locationId = url.searchParams.get("location_id");
    const timeSlotId = url.searchParams.get("time_slot_id");
    const status = url.searchParams.get("status");

    const filtered = assignments.filter(
      (item) =>
        (!date || item.date === date) &&
        (!from || item.date >= from) &&
        (!to || item.date <= to) &&
        (!staffId || item.staff_id === Number(staffId)) &&
        (!locationId || item.location_id === Number(locationId)) &&
        (!timeSlotId || item.time_slot_id === Number(timeSlotId)) &&
        (!status || item.status === status),
    );

    return HttpResponse.json(pageResponse(filtered, request));
  }),

  // Create task assignment
  http.post(`${BASE}/admin/task-assignments`, async ({ request }) => {
    const body = (await request.json()) as Omit<
      TaskAssignment,
      "id" | "status"
    >;

    if (assignmentExists(body)) {
      return HttpResponse.json(
        { detail: "Duplicate task assignment" },
        { status: 409 },
      );
    }

    const item: TaskAssignment = {
      id: nextAssignmentId++,
      ...body,
      status: "PENDING",
    };

    assignments.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),

  // Bulk task assignments
  http.post(`${BASE}/admin/task-assignments/bulk`, async ({ request }) => {
    const body = (await request.json()) as {
      template_id: number;
      staff_id: number;
      time_slot_id: number;
      sub_location_ids: number[];
      from: string;
      to: string;
    };

    let created = 0;
    let skippedDuplicates = 0;

    const startDate = new Date(`${body.from}T00:00:00`);
    const endDate = new Date(`${body.to}T00:00:00`);

    for (
      const current = new Date(startDate);
      current <= endDate;
      current.setDate(current.getDate() + 1)
    ) {
      const date = [
        current.getFullYear(),
        String(current.getMonth() + 1).padStart(2, "0"),
        String(current.getDate()).padStart(2, "0"),
      ].join("-");

      for (const subLocationId of body.sub_location_ids) {
        const assignmentData = {
          template_id: body.template_id,
          staff_id: body.staff_id,
          location_id: 1,
          sub_location_id: subLocationId,
          time_slot_id: body.time_slot_id,
          date,
        };

        if (assignmentExists(assignmentData)) {
          skippedDuplicates++;
          continue;
        }

        assignments.push({
          id: nextAssignmentId++,
          ...assignmentData,
          status: "PENDING",
        });

        created++;
      }
    }

    return HttpResponse.json({
      created,
      skipped_duplicates: skippedDuplicates,
    });
  }),

  // Assignment details
  http.get(`${BASE}/admin/task-assignments/:id`, ({ params }) => {
    const item = assignments.find(
      (task) => task.id === Number(params.id),
    );

    return item
      ? HttpResponse.json({ ...item, executions: [] })
      : HttpResponse.json(
          { detail: "Assignment not found" },
          { status: 404 },
        );
  }),

  // Update assignment
  http.patch(`${BASE}/admin/task-assignments/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<
      Pick<TaskAssignment, "staff_id" | "time_slot_id" | "date">
    >;

    const item = assignments.find(
      (task) => task.id === Number(params.id),
    );

    if (!item) {
      return HttpResponse.json(
        { detail: "Assignment not found" },
        { status: 404 },
      );
    }

    if (item.status !== "PENDING") {
      return HttpResponse.json(
        { detail: "Only pending assignments can be updated" },
        { status: 409 },
      );
    }

    Object.assign(item, body);
    return HttpResponse.json(item);
  }),

  // Delete assignment
  http.delete(`${BASE}/admin/task-assignments/:id`, ({ params }) => {
    const index = assignments.findIndex(
      (task) => task.id === Number(params.id),
    );

    if (index === -1) {
      return HttpResponse.json(
        { detail: "Assignment not found" },
        { status: 404 },
      );
    }

    if (assignments[index].status !== "PENDING") {
      return HttpResponse.json(
        { detail: "Only pending assignments can be deleted" },
        { status: 409 },
      );
    }

    assignments.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Staff tasks grouped by time slot
  http.get(`${BASE}/staff/tasks`, ({ request }) => {
    const url = new URL(request.url);
    const date =
      url.searchParams.get("date") ??
      new Date().toISOString().slice(0, 10);

    const filtered = assignments.filter(
      (item) => item.date === date,
    );

    const groups = new Map<number, TaskAssignment[]>();

    filtered.forEach((item) => {
      const existing = groups.get(item.time_slot_id) ?? [];
      existing.push(item);
      groups.set(item.time_slot_id, existing);
    });

    return HttpResponse.json(
      Array.from(groups.entries()).map(([timeSlotId, tasks]) => ({
        time_slot: {
          id: timeSlotId,
          label: timeSlotId === 1 ? "Morning" : `Time Slot ${timeSlotId}`,
          start_time: "09:00",
          end_time: "12:00",
        },
        tasks,
      })),
    );
  }),

  // Staff task details
  http.get(`${BASE}/staff/tasks/:id`, ({ params }) => {
    const item = assignments.find(
      (task) => task.id === Number(params.id),
    );

    return item
      ? HttpResponse.json(item)
      : HttpResponse.json(
          { detail: "Task not found" },
          { status: 404 },
        );
  }),

  // Staff dashboard summary
  http.get(`${BASE}/staff/dashboard/summary`, () =>
    HttpResponse.json({
      total: 6,
      pending: 2,
      in_progress: 1,
      done: 3,
    }),
  ),
];
