
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

type FormField = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[] | null;
};

type Form = {
  id: number;
  name: string;
  description?: string;
  fields: FormField[];
  response_count: number;
  created_at: string;
};

type FormResponse = {
  id: number;
  form_id: number;
  data: Record<string, unknown>;
  created_at: string;
};

type ContactMessage = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
};

const forms: Form[] = [
  {
    id: 1,
    name: "Resident Feedback",
    description: "Feedback form for residents",
    fields: [
      {
        key: "rating",
        label: "Rating",
        type: "number",
        required: true,
        options: null,
      },
      {
        key: "comment",
        label: "Comment",
        type: "textarea",
        required: false,
        options: null,
      },
    ],
    response_count: 1,
    created_at: "2026-11-27T09:00:00Z",
  },
];

const formResponses: FormResponse[] = [
  {
    id: 1,
    form_id: 1,
    data: {
      rating: 5,
      comment: "Good service",
    },
    created_at: "2026-11-27T10:00:00Z",
  },
];

const contactMessages: ContactMessage[] = [
  {
    id: 1,
    name: "Rahul",
    email: "rahul@example.com",
    subject: "Feedback",
    message: "Thank you for the service.",
    created_at: "2026-11-27T11:00:00Z",
  },
];

let nextFormId = 2;
let nextResponseId = 2;
let nextContactId = 2;

const pageResponse = <T,>(data: T[], request: Request) => {
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

export const formsHandlers = [
  // 143. Get admin forms
  http.get(`${BASE}/admin/forms`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase();

    const result = search
      ? forms.filter((form) => form.name.toLowerCase().includes(search))
      : forms;

    return HttpResponse.json(pageResponse(result, request));
  }),

  // 144. Create form
  http.post(`${BASE}/admin/forms`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      description?: string;
      fields: FormField[];
    };

    if (!body.name || !Array.isArray(body.fields)) {
      return HttpResponse.json(
        { detail: "Form name and fields are required" },
        { status: 422 },
      );
    }

    const form: Form = {
      id: nextFormId++,
      name: body.name,
      description: body.description,
      fields: body.fields,
      response_count: 0,
      created_at: new Date().toISOString(),
    };

    forms.push(form);

    return HttpResponse.json(form, { status: 201 });
  }),

  // 145. Get form details
  http.get(`${BASE}/admin/forms/:id`, ({ params }) => {
    const form = forms.find((item) => item.id === Number(params.id));

    return form
      ? HttpResponse.json(form)
      : HttpResponse.json({ detail: "Form not found" }, { status: 404 });
  }),

  // 146. Update form
  http.patch(`${BASE}/admin/forms/:id`, async ({ params, request }) => {
    const form = forms.find((item) => item.id === Number(params.id));

    if (!form) {
      return HttpResponse.json(
        { detail: "Form not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      fields?: FormField[];
    };

    Object.assign(form, body);

    return HttpResponse.json(form);
  }),

  // 147. Delete form
  http.delete(`${BASE}/admin/forms/:id`, ({ params }) => {
    const index = forms.findIndex((item) => item.id === Number(params.id));

    if (index === -1) {
      return HttpResponse.json(
        { detail: "Form not found" },
        { status: 404 },
      );
    }

    forms.splice(index, 1);

    return new HttpResponse(null, { status: 204 });
  }),

  // 148. Get form responses
  http.get(`${BASE}/admin/forms/:id/responses`, ({ params, request }) => {
    const form = forms.find((item) => item.id === Number(params.id));

    if (!form) {
      return HttpResponse.json(
        { detail: "Form not found" },
        { status: 404 },
      );
    }

    const result = formResponses.filter(
      (response) => response.form_id === Number(params.id),
    );

    return HttpResponse.json(pageResponse(result, request));
  }),

  // 149. Get public form
  http.get(`${BASE}/public/forms/:id`, ({ params }) => {
    const form = forms.find((item) => item.id === Number(params.id));

    if (!form) {
      return HttpResponse.json(
        { detail: "Form not found" },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      id: form.id,
      name: form.name,
      description: form.description,
      fields: form.fields,
    });
  }),

  // 150. Submit public form response
  http.post(
    `${BASE}/public/forms/:id/responses`,
    async ({ params, request }) => {
      const form = forms.find((item) => item.id === Number(params.id));

      if (!form) {
        return HttpResponse.json(
          { detail: "Form not found" },
          { status: 404 },
        );
      }

      const body = (await request.json()) as {
        data: Record<string, unknown>;
      };

      if (!body.data || typeof body.data !== "object") {
        return HttpResponse.json(
          { detail: "Response data is required" },
          { status: 422 },
        );
      }

      for (const field of form.fields) {
        if (
          field.required &&
          (body.data[field.key] === undefined ||
            body.data[field.key] === null ||
            body.data[field.key] === "")
        ) {
          return HttpResponse.json(
            { detail: `${field.label} is required` },
            { status: 422 },
          );
        }
      }

      const response: FormResponse = {
        id: nextResponseId++,
        form_id: form.id,
        data: body.data,
        created_at: new Date().toISOString(),
      };

      formResponses.push(response);
      form.response_count += 1;

      return HttpResponse.json(response, { status: 201 });
    },
  ),

  // 151. Public contact form
  http.post(`${BASE}/public/contact`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      email: string;
      subject: string;
      message: string;
    };

    if (!body.name || !body.email || !body.message) {
      return HttpResponse.json(
        { detail: "Name, email and message are required" },
        { status: 422 },
      );
    }

    contactMessages.push({
      id: nextContactId++,
      ...body,
      created_at: new Date().toISOString(),
    });

    return HttpResponse.json({ ok: true }, { status: 201 });
  }),

  // 152. Get admin contact messages
  http.get(`${BASE}/admin/contact-messages`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase();

    const result = search
      ? contactMessages.filter(
          (item) =>
            item.name.toLowerCase().includes(search) ||
            item.email.toLowerCase().includes(search) ||
            item.subject.toLowerCase().includes(search),
        )
      : contactMessages;

    return HttpResponse.json(pageResponse(result, request));
  }),

  // 153. Get file
  http.get(`${BASE}/files/:key`, ({ params }) => {
    return HttpResponse.json({
      key: params.key,
      message: "Mock file response",
    });
  }),

  // 154. Health check
  http.get(`${BASE}/health`, () =>
    HttpResponse.json({ status: "ok" }),
  ),
];
