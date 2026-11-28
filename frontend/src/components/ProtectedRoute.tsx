
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

type ProtectedRouteProps = {
  allowedRoles: string[];
  children: ReactNode;
};

function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const accessToken = localStorage.getItem("access_token");
  const userData = localStorage.getItem("user");

  if (!accessToken || !userData) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userData);

    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
