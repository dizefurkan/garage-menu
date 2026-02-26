"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { SetStateAction, useEffect, useRef, useState } from "react";
import menu from "@/data/menu.json";
import ProductCard from "@/components/ProductCard";
import useReveal from "@/hooks/useReveal";

export default function Page({ params }: { params: { restaurant: string } }) {
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<number>(1);
  const urlLang = searchParams.get("lang") as "tr" | "en";
  const [lang, setLang] = useState<"tr" | "en">(urlLang || "tr");
  // layout: 1 or 2 columns
  const [columns, setColumns] = useState<1 | 2>(2);
  const sectionRefs = useRef<Record<number, HTMLElement | null>>({});

  // navigation refs for horizontal auto-scroll
  const navRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  useReveal();

  // Scroll Spy
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;

      menu.categories.forEach((cat) => {
        const section = sectionRefs.current[cat.id];
        if (section) {
          if (
            scrollPosition >= section.offsetTop &&
            scrollPosition < section.offsetTop + section.offsetHeight
          ) {
            setActiveCategory(cat.id);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ensure active category button is visible in nav
  useEffect(() => {
    const btn = buttonRefs.current[activeCategory];
    const nav = navRef.current;

    if (btn && nav) {
      const btnRect = btn.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      if (btnRect.left < navRect.left || btnRect.right > navRect.right) {
        btn.scrollIntoView({ inline: "center", behavior: "smooth" });
      }
    }
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-[#f2f0e9] text-gray-800 scroll-smooth">
      <Header
        columns={columns}
        setColumns={setColumns}
        lang={lang}
        setLang={setLang}
        buttonRefs={buttonRefs}
        navRef={navRef}
        sectionRefs={sectionRefs}
        activeCategory={activeCategory}
      />

      {menu.categories.map((cat: any) => {
        const products = menu.products.filter((p) => p.categoryId === cat.id);

        return (
          <section
            key={cat.id}
            className="max-w-6xl mx-auto px-4 py-12"
            ref={(el) => {
              if (el) {
                sectionRefs.current[cat.id] = el;
              }
            }}
          >
            <h2 className="text-2xl font-bold text-[#890333] mb-2 flex items-center">
              {cat.name[lang]}
              <span className="ml-2 text-sm bg-[#890333] text-white px-2 py-1 rounded-full shrink-0">
                {products.length}
              </span>
            </h2>

            <div
              className={`grid gap-6 mt-6 ${
                columns === 1 ? "grid-cols-1" : "grid-cols-2"
              } lg:grid-cols-3`}
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={menu.restaurant.currency}
                  lang={lang}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

type HeaderProps = {
  columns: number;
  setColumns: React.Dispatch<SetStateAction<1 | 2>>;
  lang: "tr" | "en";
  setLang: React.Dispatch<SetStateAction<"tr" | "en">>;

  sectionRefs: React.RefObject<Record<number, HTMLElement | null>>;
  buttonRefs: React.RefObject<Record<number, HTMLButtonElement | null>>;
  navRef: React.RefObject<HTMLDivElement | null>;
  activeCategory: number;
};

const Header = (props: HeaderProps) => {
  const {
    columns,
    setColumns,
    lang,
    setLang,
    buttonRefs,
    sectionRefs,
    navRef,
    activeCategory,
  } = props;

  const scrollToCategory = (id: number) => {
    const section = sectionRefs.current[id];
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 100,
        behavior: "smooth",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md border-b shadow-sm">
      <div
        className="flex justify-between items-center p-4 max-w-6xl mx-auto "
        style={{
          backgroundColor: "var(--primary)",
        }}
      >
        <div className="relative w-full ">
          <Image
            // fill
            width={200}
            height={100}
            src="/garagelogo.png"
            alt={menu.restaurant.name + " logo"}
            className="object-cover"
          />
        </div>
        {/* <h1 className="font-bold text-xl text-[#890333] tracking-wide">
            {menu.restaurant.name}
          </h1> */}

        {/* layout toggle */}
        <button
          onClick={() => setColumns(columns === 1 ? 2 : 1)}
          className="w-8 h-8 mr-2 rounded-full text-white text-sm transition-all duration-300 hover:scale-105"
        >
          {columns === 2 ? <RowSVG /> : <ColumnSVG />}
        </button>

        <button
          onClick={() => setLang(lang === "tr" ? "en" : "tr")}
          className="px-4 py-1 rounded-full  text-white text-sm transition-all duration-300 hover:scale-105"
        >
          {lang.toUpperCase()}
        </button>
      </div>

      {/* CATEGORY NAV */}
      <div className="overflow-x-auto no-scrollbar border-t" ref={navRef}>
        <div className="flex gap-6 px-4 py-3 max-w-6xl mx-auto">
          {menu.categories.map((cat) => (
            <button
              key={cat.id}
              ref={(el) => {
                if (el) {
                  buttonRefs.current[cat.id] = el;
                }
              }}
              onClick={() => scrollToCategory(cat.id)}
              className={`whitespace-nowrap pb-1 transition-all duration-300 ${
                activeCategory === cat.id
                  ? "text-[#890333] border-b-2 border-[#890333] font-semibold"
                  : "text-gray-500 hover:text-[#890333]"
              }`}
            >
              {cat.name[lang]}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

const ColumnSVG = () => {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3.75 2h5.5c.966 0 1.75.784 1.75 1.75v16.5A1.75 1.75 0 0 1 9.25 22h-5.5A1.75 1.75 0 0 1 2 20.25V3.75C2 2.784 2.784 2 3.75 2Zm11 0h5.5c.966 0 1.75.784 1.75 1.75v16.5A1.75 1.75 0 0 1 20.25 22h-5.5A1.75 1.75 0 0 1 13 20.25V3.75c0-.966.784-1.75 1.75-1.75ZM3.5 3.75v16.5c0 .138.112.25.25.25h5.5a.25.25 0 0 0 .25-.25V3.75a.25.25 0 0 0-.25-.25h-5.5a.25.25 0 0 0-.25.25Zm11 0v16.5c0 .138.112.25.25.25h5.5a.25.25 0 0 0 .25-.25V3.75a.25.25 0 0 0-.25-.25h-5.5a.25.25 0 0 0-.25.25Z"></path>
    </svg>
  );
};

const RowSVG = () => {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M22 3.75v5.5A1.75 1.75 0 0 1 20.25 11H3.75A1.75 1.75 0 0 1 2 9.25v-5.5C2 2.784 2.784 2 3.75 2h16.5c.966 0 1.75.784 1.75 1.75Zm0 11v5.5A1.75 1.75 0 0 1 20.25 22H3.75A1.75 1.75 0 0 1 2 20.25v-5.5c0-.966.784-1.75 1.75-1.75h16.5c.966 0 1.75.784 1.75 1.75ZM20.25 3.5H3.75a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h16.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25Zm0 11H3.75a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h16.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25Z"></path>
    </svg>
  );
};
