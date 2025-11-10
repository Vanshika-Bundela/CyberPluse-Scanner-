import React from "react";
import { Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#0d0d0d] border-t border-cyan-500/20 text-gray-400 py-6 px-8">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <Shield className="text-cyan-400 w-5 h-5" />
          <span className="text-cyan-300 font-semibold text-sm">
            CyberPulse Scanner
          </span>
        </div>

        {/* Copyright */}
        <div className="text-xs sm:text-sm text-gray-500">
          © {new Date().getFullYear()} CyberPulse — Safe · Ethical · Secure
        </div>

        {/* Placeholder Links */}
        <div className="flex gap-4 text-sm">
          <button className="hover:text-cyan-400 transition-colors">
            Privacy
          </button>
          <button className="hover:text-cyan-400 transition-colors">
            Terms
          </button>
          <button className="hover:text-cyan-400 transition-colors">
            Contact
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
