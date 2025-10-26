import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Package,
  Activity,
  XCircle,
  Clock,
  BarChart3,
  Zap,
} from "lucide-react";

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/subscriptions", label: "Subscriptions", icon: Package },
    { path: "/live", label: "Live", icon: Activity },
    { path: "/wait", label: "Wait", icon: Clock },
    { path: "/denial", label: "Denial", icon: XCircle },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="w-full bg-black border-b border-gray-800/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center px-8 py-3">
        {/* Logo/Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          {/* <div className="relative"> */}
          {/*   <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full group-hover:bg-blue-500/30 transition-all duration-500"></div> */}
          {/*   <div className="relative p-2.5 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 group-hover:border-blue-500/50 transition-all duration-300"> */}
          {/*     <BarChart3 className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" /> */}
          {/*   </div> */}
          {/* </div> */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tracking-tight">
                FlexLM
              </span>
              <span className="text-lg font-light text-gray-400">|</span>
              <span className="text-lg font-light text-gray-300">
                Dashboard
              </span>
            </div>
            <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">
              Enterprise License Monitoring
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <ul className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    relative flex items-center gap-2.5 px-5 py-2.5 rounded-lg font-medium text-[13px]
                    transition-all duration-300 group overflow-hidden
                    ${active ? "text-white" : "text-gray-400 hover:text-white"}
                  `}
                >
                  {/* Background glow effect for active state */}
                  {active && (
                    <>
                      {/*  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent"></div> */}
                      {/* <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600"></div> */}
                    </>
                  )}

                  {/* Hover background */}
                  <div
                    className={`
                    absolute inset-0 bg-gray-800/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                    ${active ? "opacity-0 group-hover:opacity-0" : ""}
                  `}
                  ></div>

                  {/* Content */}
                  <div className="relative flex items-center gap-2.5">
                    <Icon
                      className={`
                      w-4 h-4 transition-all duration-300
                      ${active
                          ? "text-gray-50-400"
                          : "text-gray-500 group-hover:text-gray-300"
                        }
                    `}
                    />
                    <span className="font-semibold tracking-wide">
                      {item.label}
                    </span>
                  </div>

                  {/* Active indicator - bottom line */}
                  {active && (
                    <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
