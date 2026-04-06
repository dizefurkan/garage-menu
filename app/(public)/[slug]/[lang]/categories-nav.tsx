"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

interface Category {
  id: number;
  name: string;
  productCount?: number;
}

interface CategoriesNavProps {
  categories: Category[];
  primaryColor: string;
}

export function CategoriesNav({
  categories,
  primaryColor,
}: CategoriesNavProps) {
  const [activeCategory, setActiveCategory] = useState<number | null>(
    categories.length > 0 ? categories[0].id : null
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerHeight] = useState(0);

  // useEffect(() => {
  //   // Calculate header height dynamically
  //   const header = document.querySelector("header");
  //   if (header) {
  //     setHeaderHeight(header.offsetHeight);
  //   }

  //   // Recalculate on window resize
  //   const handleResize = () => {
  //     const header = document.querySelector("header");
  //     if (header) {
  //       setHeaderHeight(header.offsetHeight);
  //     }
  //   };

  //   window.addEventListener("resize", handleResize);
  //   return () => window.removeEventListener("resize", handleResize);
  // }, []);

  const activeCategoryName = categories.find(
    (c) => c.id === activeCategory
  )?.name;

  const handleCategoryChange = (id: number) => {
    setActiveCategory(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(`category-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Desktop: Tabs
  return (
    <>
      {/* Desktop Tabs - Hidden on mobile */}
      <div
        className="hidden md:block mb-8 border-b border-slate-200 sticky bg-white z-30"
        style={{ top: `${headerHeight}px` }}
      >
        <div className="flex gap-1 overflow-x-auto pb-0">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className="px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors"
              style={{
                borderBottomColor:
                  activeCategory === category.id ? primaryColor : "transparent",
                color:
                  activeCategory === category.id ? primaryColor : "inherit",
              }}
            >
              {category.name}
              {category.productCount !== undefined && (
                <span className="ml-2 text-xs opacity-75">
                  ({category.productCount})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Fixed Button - Visible on mobile only */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-full p-4 text-white shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: primaryColor }}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div
            className="absolute bottom-20 right-0 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden"
            style={{ minWidth: "200px" }}
          >
            <div className="p-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`w-full text-left px-4 py-3 rounded text-sm font-medium transition-colors ${
                    activeCategory === category.id
                      ? "text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                  style={
                    activeCategory === category.id
                      ? { backgroundColor: primaryColor }
                      : undefined
                  }
                >
                  {category.name}
                  {category.productCount !== undefined && (
                    <span className="ml-2 text-xs opacity-75">
                      ({category.productCount})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
