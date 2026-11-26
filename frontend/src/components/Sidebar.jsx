import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Tags,
  Package,
  MessageSquare,
  Settings,
  Pill,
  LogOut,
} from "lucide-react";

// path calling step1. 
const menuItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },   
  { name: "Categories", path: "/categories", icon: Tags },  //step2 App.jsx ->categories calling / 
  { name: "Dosage Forms", path: "/dosage-forms", icon: Pill },
  { name: "Products", path: "/products", icon: Package },
  { name: "Enquiries", path: "/enquiries", icon: MessageSquare },
  { name: "Settings", path: "/settings", icon: Settings },
];

function Sidebar({ open, onLogout }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 overflow-hidden bg-brand text-white transition-all duration-300 lg:static ${
        open
          ? "w-48 translate-x-0"
          : "w-48 -translate-x-full lg:w-0 lg:translate-x-0"
      }`}
    >
      <div className="flex h-full w-48 flex-col">
        <div className="flex h-16 shrink-0 items-center border-b border-white/20 px-4 text-xl font-bold">
          Muby Admin
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded px-3 py-2 text-sm hover:bg-brand-dark ${
                    isActive ? "bg-brand-dark" : ""
                  }`
                }
              >
                <Icon size={18} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-white/20 p-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm hover:bg-brand-dark"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;