
export type TaskTemplate = {
  id: number;
  name: string;
  area_type: string;
  is_active: boolean;
};

export type TaskAssignmentStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED";

export type TaskAssignment = {
  id: number;
  template: TaskTemplate;
  staff: {
    id: number;
    name: string;
  };
  location: {
    id: number;
    name: string;
  };
  sub_location: {
    id: number;
    name: string;
  };
  time_slot: {
    id: number;
    label: string;
  };
  date: string;
  status: TaskAssignmentStatus;
};
