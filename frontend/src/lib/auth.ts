import api from "./api";

type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    name: string;
    role: string;
  };
};

export async function loginAdmin(email: string, password: string) {
  const { data } = await api.post<TokenPair>("/auth/admin/login", {
    email,
    password,
  });

  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data;
}

export function clearSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

export async function logout() {
  const refreshToken = localStorage.getItem("refresh_token");

  try {
    if (refreshToken) {
      await api.post("/auth/logout", {
        refresh_token: refreshToken,
      });
    }
  } finally {
    clearSession();
  }
}