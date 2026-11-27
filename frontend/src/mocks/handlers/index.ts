import { staffHandlers } from "./staff";
import { authHandlers } from "./auth";
import { adminsHandlers } from "./admins";
import { locationsHandlers } from "./locations";
import { complaintsHandlers } from "./complaints";
import { executionsHandlers } from "./executions";
import { inventoryHandlers } from "./inventory";
import { notificationsHandlers } from "./notifications";
import { dashboardsHandlers } from "./dashboards";
import { tasksHandlers } from "./tasks";


export const handlers = [
  ...staffHandlers,
  ...authHandlers,
  ...adminsHandlers,
  ...locationsHandlers,
  ...complaintsHandlers,
  ...tasksHandlers,
  ...executionsHandlers,
  ...inventoryHandlers,
  ...notificationsHandlers,
  ...dashboardsHandlers,
];