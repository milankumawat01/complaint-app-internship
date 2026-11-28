
export type DashboardSummary = {
  total: number;
  pending: number;
  assigned: number;
  in_progress: number;
  completed: number;
  cancelled: number;
};

export type DashboardChartItem = {
  label: string;
  value: number;
};

export type DashboardData = {
  summary: DashboardSummary;
  chart: DashboardChartItem[];
};
