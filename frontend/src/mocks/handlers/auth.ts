import { http, HttpResponse } from "msw";

const BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

const createTokenPair = (role: string) => ({
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  token_type: "bearer",
  expires_in: 1800,
  user: {
    id: 1,
    name: "Ravi Admin",
    role,
  },
});

export const authHandlers = [
  // Admin Login
  http.post(`${BASE}/auth/admin/login`, () =>
    HttpResponse.json(createTokenPair("admin")),
  ),

  // Admin Change Password
  http.post(`${BASE}/auth/admin/change-password`, () =>
    HttpResponse.json({ ok: true }),
  ),

  // Staff Send OTP
  http.post(`${BASE}/auth/staff/send-otp`, () =>
    HttpResponse.json({ sent: true }),
  ),

  // Staff Verify OTP
  http.post(`${BASE}/auth/staff/verify-otp`, () =>
    HttpResponse.json(createTokenPair("staff")),
  ),

  // Resident Send OTP
  http.post(`${BASE}/auth/resident/send-otp`, () =>
    HttpResponse.json({ sent: true }),
  ),

  // Resident Verify OTP
  http.post(`${BASE}/auth/resident/verify-otp`, () =>
    HttpResponse.json(createTokenPair("resident")),
  ),

  // Refresh Token
  http.post(`${BASE}/auth/refresh`, () =>
    HttpResponse.json(createTokenPair("admin")),
  ),

  // Logout
  http.post(
    `${BASE}/auth/logout`,
    () => new HttpResponse(null, { status: 204 }),
  ),
];