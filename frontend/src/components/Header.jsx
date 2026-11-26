import { useState, useRef, useEffect } from "react";
import { Menu, LogOut } from "lucide-react";

function Header({ user, onToggleSidebar, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the dropdown when clicking outside it
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const firstLetter = user.name.charAt(0).toUpperCase();

  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center justify-between bg-white px-4 shadow">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded p-2 text-brand hover:bg-brand-light"
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>
      </div>

      {/* Right: profile circle + dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-semibold text-white"
        >
          {firstLetter}
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-lg bg-white shadow-lg ring-1 ring-black/10">
            <div className="border-b border-gray-200 p-4">
              <p className="font-semibold text-gray-800">{user.name}</p>
              <p className="truncate text-sm text-gray-500">{user.email}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm text-brand hover:bg-brand-light"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;