import React from "react";
import { LogOut } from "lucide-react";

interface HeaderProps {
  studentName?: string;
}

const Header: React.FC<HeaderProps> = ({ studentName }) => {
  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.replace("/login");
  };

  const initials = (studentName || "S")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="bg-white px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm border-b border-gray-200">
      {/* LEFT */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <img
          src="/entitylogo.jpg"
          alt="Lingaya's Vidyapeeth"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex-shrink-0"
        />
        <div className="flex flex-col leading-none">
          <h1 className="text-sm sm:text-base font-bold text-gray-900 truncate tracking-tight">
            Lingaya's Vidyapeeth
          </h1>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[9px] uppercase font-semibold text-gray-400">Powered by Okie Dokie</span>
            <img src="/logo.png" alt="OkieDokie" className="h-5 w-auto " />
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {studentName && (
          <div className="hidden md:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <span className="text-gray-700 font-medium text-sm">
              {studentName}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
