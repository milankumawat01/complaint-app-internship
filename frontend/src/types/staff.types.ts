export type Profession = {
  id: number;
  name: string;
};

export type Staff = {
  id: number;
  name: string;
  age: number;
  contact: string;
  email: string;
  profession: Profession;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
};