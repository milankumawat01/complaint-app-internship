
import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

type UserRole = "admin" | "staff" | "resident";

const createTokenPair = (role: UserRole) => ({
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  token_type: "bearer",
  expires_in: 1800,
  user: {
    id: 1,
    name:
      role === "admin"
        ? "Ravi Admin"
        : role === "staff"
          ? "Suresh Staff"
          : "Resident User",
    role,
  },
});

export const authHandlers = [
  // 1. Admin Login
  http.post(`${BASE}/auth/admin/login`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
    };

    return HttpResponse.json({
      ...createTokenPair("admin"),
      user: {
        ...createTokenPair("admin").user,
        name: body.email,
      },
    });
  }),

  // 2. Admin Change Password
  http.post(`${BASE}/auth/admin/change-password`, async ({ request }) => {
    const body = (await request.json()) as {
      old_password: string;
      new_password: string;
    };

    return HttpResponse.json({ ok: Boolean(body.new_password) });
  }),

  // 3. Staff Send OTP
  http.post(`${BASE}/auth/staff/send-otp`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
    };

    return HttpResponse.json({ sent: Boolean(body.email) });
  }),

  // 4. Staff Verify OTP
  http.post(`${BASE}/auth/staff/verify-otp`, async ({ request }) => {
    await request.json();

    return HttpResponse.json(createTokenPair("staff"));
  }),

  // 5. Resident Send OTP
  http.post(`${BASE}/auth/resident/send-otp`, async ({ request }) => {
    const body = (await request.json()) as {
      mobile: string;
    };

    return HttpResponse.json({ sent: Boolean(body.mobile) });
  }),

  // 6. Resident Verify OTP
  http.post(`${BASE}/auth/resident/verify-otp`, async ({ request }) => {
    await request.json();

    return HttpResponse.json(createTokenPair("resident"));
  }),

  // 7. Refresh Token
  http.post(`${BASE}/auth/refresh`, async ({ request }) => {
    await request.json();

    return HttpResponse.json(createTokenPair("admin"));
  }),

  // 8. Logout
  http.post(`${BASE}/auth/logout`, async ({ request }) => {
    await request.json();

    return new HttpResponse(null, { status: 204 });
  }),
];
