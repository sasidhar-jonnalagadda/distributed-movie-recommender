"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { FiSearch, FiLogOut } from "react-icons/fi";

/**
 * Global Navigation Bar.
 * Features dynamic active state detection and accessibility enhancements.
 */
export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <nav 
      className={`navbar ${scrolled ? "scrolled" : ""}`} 
      id="main-nav"
      aria-label="Primary Navigation"
    >
      <Link href="/" className="navbar-brand" aria-label="Cineverse Home">
        CINEVERSE
      </Link>

      <ul className="navbar-links" role="list">
        <li>
          <Link 
            href="/" 
            className={isActive("/") ? "active" : ""}
            aria-current={isActive("/") ? "page" : undefined}
          >
            Home
          </Link>
        </li>
        <li>
          <Link 
            href="/browse" 
            className={isActive("/browse") ? "active" : ""}
            aria-current={isActive("/browse") ? "page" : undefined}
          >
            Browse
          </Link>
        </li>
        {isLoggedIn && (
          <li>
            <Link 
              href="/watchlist" 
              className={isActive("/watchlist") ? "active" : ""}
              aria-current={isActive("/watchlist") ? "page" : undefined}
            >
              My List
            </Link>
          </li>
        )}
      </ul>

      <div className="navbar-actions">
        <Link href="/browse" className="btn btn-ghost" aria-label="Search Movies">
          <FiSearch size={18} />
        </Link>

        {isLoggedIn ? (
          <>
            <span className="text-sm text-muted">
              {user?.displayName}
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={logout}
              aria-label="Logout"
              id="logout-btn"
            >
              <FiLogOut size={18} />
            </button>
          </>
        ) : (
          <Link href="/login" className="btn btn-primary" id="login-nav-btn">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
