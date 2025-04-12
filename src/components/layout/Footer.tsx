
import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="border-t py-4 bg-background">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>© 2025 TimeFlow. All rights reserved.</p>
        <nav className="flex gap-4">
          <Link to="#" className="hover:underline">
            Terms
          </Link>
          <Link to="#" className="hover:underline">
            Privacy
          </Link>
          <Link to="#" className="hover:underline">
            Help
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
