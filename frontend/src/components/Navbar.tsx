// src/components/Navbar.js
import React from "react";
import { Link } from "react-router-dom";
const Navbar = () => {
  const navItems = ["Vendors", "Subscriptions", "Live", "Denial", "Wait"];

  return (
    <nav className="w-screen bg-black text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center p-4">
        <div className="text-xl font-bold">FlexLM DashBoard </div>
        <ul className="flex space-x-8">
          <li className="hover:text-gray-300 cursor-pointer transition-colors duration-200 flex flex-row gap-5">
            <Link to="/">Home</Link>
            <div className="border border-white/50"></div>
            <Link to="/subscriptions">Subscriptions</Link>
            <div className="border border-white/50"></div>
            <Link to="/live">Live</Link>
            <div className="border border-white/50"></div>
            <Link to="/wait">Wait</Link>
            <div className="border border-white/50"></div>
            <Link to="/denial">Denial</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
