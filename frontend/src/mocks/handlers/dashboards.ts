
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

export const dashboardsHandlers = [
  http.get(`${BASE}/admin/dashboard/summary`, () =>
    HttpResponse.json({
      total_complaints: 150,
      pending: 20,
      assigned: 15,
      in_progress: 10,
      completed: 100,
      cancelled: 5,
    }),
  ),

  http.get(`${BASE}/admin/dashboard/complaints-trend`, () =>
    HttpResponse.json([
      { date: "2026-11-21", count: 12 },
      { date: "2026-11-22", count: 15 },
      { date: "2026-11-23", count: 10 },
      { date: "2026-11-24", count: 18 },
      { date: "2026-11-25", count: 14 },
    ]),
  ),

  http.get(`${BASE}/admin/dashboard/staff-performance`, () =>
    HttpResponse.json([
      {
        staff_id: 5,
        name: "Suresh Kumar",
        assigned: 20,
        completed: 18,
        pending: 2,
      },
    ]),
  ),

  http.get(`${BASE}/admin/exports/:type`, () =>
    HttpResponse.json({
      message: "Mock export generated",
      url: "/mock-export.csv",
    }),
  ),
];
