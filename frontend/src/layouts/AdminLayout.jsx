import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";

function AdminLayout() {
  // Open on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  // Dummy user for now. It will come from the login later.
  const user = { name: "Admin User", email: "admin@mubychem.in" };

  const handleLogout = () => {
    alert("Logout clicked. Real logout comes with the login task.");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Dark overlay on mobile: click to close the sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onLogout={handleLogout} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          user={user}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>

        <Footer />
      </div>
    </div>
  );
}

export default AdminLayout;