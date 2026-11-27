
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

const forms = [
  {
    id: 1,
    title: "Resident Feedback",
    description: "Feedback form for residents",
    is_active: true,
    fields: [
      { name: "rating", label: "Rating", type: "number", required: true },
      { name: "comment", label: "Comment", type: "text", required: false },
    ],
  },
];

export const formsHandlers = [
  http.get(`${BASE}/public/forms/:slug`, ({ params }) =>
    HttpResponse.json({
      ...forms[0],
      slug: params.slug,
    }),
  ),

  http.post(`${BASE}/public/forms/:slug/submit`, async ({ request, params }) => {
    const body = await request.json();

    return HttpResponse.json(
      {
        id: 1,
        slug: params.slug,
        answers: body,
        submitted: true,
        created_at: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.post(`${BASE}/public/contact`, async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json(
      {
        id: 1,
        ...((body ?? {}) as Record<string, unknown>),
        submitted: true,
      },
      { status: 201 },
    );
  }),

  http.get(`${BASE}/admin/forms`, () =>
    HttpResponse.json(forms),
  ),

  http.post(`${BASE}/admin/forms`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json(
      { id: 2, ...body, is_active: true },
      { status: 201 },
    );
  }),

  http.patch(`${BASE}/admin/forms/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json({
      id: Number(params.id),
      ...body,
    });
  }),

  http.delete(`${BASE}/admin/forms/:id`, () =>
    new HttpResponse(null, { status: 204 }),
  ),
];
