export type AuthUser = {
  id: number;
  name: string;
  role: "admin" | "super_admin" | "staff" | "resident";
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
};