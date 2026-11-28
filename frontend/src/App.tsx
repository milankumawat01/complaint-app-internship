
import { Routes, Route } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";

function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">
        Complaint Management System
      </h1>

      <p className="text-gray-500">
        Frontend setup completed successfully!
      </p>

      <Button>
        Get Started
        <ArrowRight />
      </Button>
    </div>
  );
}

function Admin() {
  return <h1 className="text-3xl font-bold">Admin Dashboard</h1>;
}

function SuperAdmin() {
  return <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>;
}

function Resident() {
  return <h1 className="text-3xl font-bold">Resident Dashboard</h1>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Admin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <SuperAdmin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resident"
        element={
          <ProtectedRoute allowedRoles={["resident"]}>
            <Resident />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
