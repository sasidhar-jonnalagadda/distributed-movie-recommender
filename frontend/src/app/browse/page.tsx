"use client";

import { useState, useRef, useCallback } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import InfiniteGrid from "@/components/InfiniteGrid";

/**
 * Search and Discovery Page.
 * Implements debounced searching and infinite results grid.
 */
export default function BrowsePage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      debounceRef.current = null;
    }, 400);
  }, []);

  const clearSearch = () => {
    setSearch("");
    setDebouncedSearch("");
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  };

  return (
    <div className="page-content" id="browse-page">
      <header style={{ padding: "var(--space-xl)", maxWidth: "var(--max-width)", margin: "0 auto" }}>
        <h1 className="section-title" style={{ padding: 0, marginBottom: "var(--space-lg)" }}>
          Browse Movies
        </h1>

        <div className="search-bar" id="search-bar">
          <FiSearch size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search movies by title…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            id="search-input"
            autoComplete="off"
          />
          {search && (
            <button 
              type="button"
              className="btn btn-ghost" 
              onClick={clearSearch} 
              style={{ padding: "4px" }}
              aria-label="Clear search"
            >
              <FiX size={18} />
            </button>
          )}
        </div>
      </header>

      <InfiniteGrid search={debouncedSearch || undefined} />
    </div>
  );
}
