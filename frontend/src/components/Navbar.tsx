// src/components/Navbar.js
import React from "react";

const Navbar = () => {
  const navItems = ["Vendors", "Subscriptions", "Live", "Denial", "Wait"];

  return (
    <nav className="w-screen bg-black text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center p-4">
        <div className="text-xl font-bold">FlexLM DashBoard </div>
        <ul className="flex space-x-8">
          {navItems.map((item) => (
            <li
              key={item}
              className="hover:text-gray-300 cursor-pointer transition-colors duration-200"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
