import { useNavigate, useLocation } from "react-router-dom";
import { FileText, CreditCard, User } from "lucide-react";

const tabs = [
  { path: "/application", label: "Application", shortLabel: "App", icon: FileText },
  { path: "/payments", label: "Payments", shortLabel: "Pay", icon: CreditCard },
  { path: "/profile", label: "Profile", shortLabel: "Me", icon: User },
];

const FooterTabs = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex justify-around px-2 py-1.5 sm:py-2 z-50">
      {tabs.map(({ path, label, shortLabel, icon: Icon }) => {
        const active = pathname.startsWith(path);
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`
              relative flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-lg transition-all
              ${active
                ? "text-orange-600 bg-orange-50"
                : "text-gray-400 hover:text-gray-600"
              }
            `}
          >
            <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
            <span className={`text-[10px] sm:text-xs ${active ? "font-bold" : "font-medium"}`}>
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{shortLabel}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default FooterTabs;
