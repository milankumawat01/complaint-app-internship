
export type TaskImageType = "BEFORE" | "AFTER";

export type TaskImage = {
  id: number;
  type: TaskImageType;
  url: string;
  latitude: number;
  longitude: number;
  distance_m: number;
  created_at: string;
};

export type AiResultStatus = "PENDING" | "COMPLETED" | "FAILED";

export type AiResult = {
  status: AiResultStatus;
  score: number;
  summary: string;
  rule: {
    id: number;
    name: string;
    action: "AUTO_COMPLETE" | "REVIEW" | "REJECT";
  };
};

export type TaskExecutionStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REVIEW"
  | "REJECTED";

export type TaskExecution = {
  id: number;
  assignment: {
    id: number;
    date: string;
    template: {
      id: number;
      name: string;
    };
  };
  staff: {
    id: number;
    name: string;
  };
  status: TaskExecutionStatus;
  started_at: string | null;
  completed_at: string | null;
  images: TaskImage[];
  ai: AiResult | null;
};

export type AiRule = {
  id: number;
  name: string;
  min_score: number;
  max_score: number;
  action: "AUTO_COMPLETE" | "REVIEW" | "REJECT";
};
