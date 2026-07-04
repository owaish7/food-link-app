import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiSun, FiMoon, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useDarkMode } from "../../context/DarkModeContext";
import Avatar from "../ui/Avatar";
import { cn } from "../../lib/cn";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const type = user?.userType === "Restaurant" ? "restaurant" : "ngo";

  const links = user
    ? [
        { to: `/${type}/listings`, label: "Listings" },
        { to: `/${type}/transactions`, label: "Transactions" },
        { to: `/${type}/profile`, label: "Profile" },
        { to: "/about", label: "About" },
      ]
    : [{ to: "/about", label: "About" }];

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + "/");

  const handleSignOut = () => {
    logout();
    navigate("/sign-in");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-stone-200/70 dark:border-stone-800/80 bg-gradient-to-b from-white to-stone-50/95 dark:from-stone-900 dark:to-stone-950/95 backdrop-blur-lg shadow-[0_6px_24px_-18px_rgba(16,24,40,0.35)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg shadow-glow">
              🍽️
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight text-stone-900 dark:text-white">
              Food<span className="text-brand-600 dark:text-brand-400">Link</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors",
                  isActive(l.to)
                    ? "text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30"
                    : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800"
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {isDarkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            {user ? (
              <div className="hidden sm:flex items-center gap-2 pl-1">
                <Avatar name={user.username || "User"} size={32} />
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 dark:text-stone-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                >
                  <FiLogOut size={16} /> Sign out
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 pl-1">
                <Link
                  to="/sign-in"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/sign-up"
                  className="rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 px-3.5 py-2 text-sm font-semibold text-white shadow-glow hover:from-brand-600 hover:to-brand-800 transition-colors"
                >
                  Get started
                </Link>
              </div>
            )}

            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              {open ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-stone-200/70 dark:border-stone-800 bg-white dark:bg-stone-950 px-4 py-3 animate-fade-in">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "px-3 py-2.5 rounded-lg text-sm font-semibold",
                  isActive(l.to)
                    ? "text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30"
                    : "text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                )}
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={handleSignOut}
                className="mt-1 flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <FiLogOut size={16} /> Sign out
              </button>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Sign in
                </Link>
                <Link
                  to="/sign-up"
                  onClick={() => setOpen(false)}
                  className="mt-1 px-3 py-2.5 rounded-lg text-sm font-semibold text-center text-white bg-gradient-to-br from-brand-500 to-brand-700"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
