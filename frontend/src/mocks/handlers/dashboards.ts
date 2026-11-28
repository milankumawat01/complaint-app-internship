
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

const exportFiles = {
  complaints: "complaints.xlsx",
  "task-executions": "task-executions.xlsx",
  "issued-history": "issued-history.xlsx",
};

function exportResponse(filename: string) {
  return new HttpResponse("Mock export data", {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export const dashboardsHandlers = [
  // 137. Admin dashboard
  http.get(`${BASE}/admin/dashboard`, () =>
    HttpResponse.json({
      complaints: {
        PENDING: 20,
        ASSIGNED: 15,
        IN_PROGRESS: 10,
        COMPLETED: 100,
        CANCELLED: 5,
      },
      tasks_today: {
        total: 50,
        done: 35,
        percent: 70,
      },
      avg_ai_score: 85,
      low_stock_count: 3,
      top_staff: [
        {
          id: 5,
          name: "Suresh Kumar",
          done: 18,
        },
      ],
    }),
  ),

  // 138. Task executions dashboard
  http.get(`${BASE}/admin/task-executions/dashboard`, () =>
    HttpResponse.json({
      days: [
        {
          date: "2026-11-23",
          total: 20,
          completed: 15,
          rejected: 2,
          avg_score: 85,
        },
        {
          date: "2026-11-24",
          total: 25,
          completed: 20,
          rejected: 1,
          avg_score: 88,
        },
        {
          date: "2026-11-25",
          total: 30,
          completed: 24,
          rejected: 2,
          avg_score: 90,
        },
      ],
    }),
  ),

  // 139. Inventory dashboard
  http.get(`${BASE}/admin/inventory/dashboard`, () =>
    HttpResponse.json({
      products: 25,
      low_stock: 3,
      requests: {
        PENDING: 5,
        ACCEPTED: 4,
        ISSUED: 10,
        REJECTED: 2,
      },
    }),
  ),

  // 140. Complaints export
  http.get(`${BASE}/admin/exports/complaints`, () =>
    exportResponse(exportFiles.complaints),
  ),

  // 141. Task executions export
  http.get(`${BASE}/admin/exports/task-executions`, () =>
    exportResponse(exportFiles["task-executions"]),
  ),

  // 142. Issued history export
  http.get(`${BASE}/admin/exports/issued-history`, () =>
    exportResponse(exportFiles["issued-history"]),
  ),
];
