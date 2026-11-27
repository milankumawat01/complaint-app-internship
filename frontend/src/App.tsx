
import { Routes, Route } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

export default App;

