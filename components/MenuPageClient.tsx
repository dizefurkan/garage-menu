"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { SetStateAction, useEffect, useRef, useState } from "react";
import ProductCard from "@/components/ProductCard";
import useReveal from "@/hooks/useReveal";
import {
  fallbackMenuData,
  type MenuData,
  type SupportedLocale,
} from "@/lib/menu";

const LIVE_MENU_ERROR_MESSAGE =
  "Canli menu su anda kullanilamiyor. Kayitli menu gosteriliyor.";

export default function MenuPageClient() {
  const searchParams = useSearchParams();
  const [menuData, setMenuData] = useState<MenuData>(fallbackMenuData);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<number>(
    fallbackMenuData.categories[0]?.id ?? 1
  );
  const [lang, setLang] = useState<SupportedLocale>(
    searchParams.get("lang") === "en" ? "en" : "tr"
  );
  const [columns, setColumns] = useState<1 | 2>(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sectionRefs = useRef<Record<number, HTMLElement | null>>({});
  const navRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  useReveal(menuData.products.length);

  useEffect(() => {
    setLang(searchParams.get("lang") === "en" ? "en" : "tr");
  }, [searchParams]);

  useEffect(() => {
    const firstCategoryId = menuData.categories[0]?.id;

    if (
      firstCategoryId !== undefined &&
      !menuData.categories.some((category) => category.id === activeCategory)
    ) {
      setActiveCategory(firstCategoryId);
    }
  }, [activeCategory, menuData.categories]);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadMenu() {
      try {
        const response = await fetch("/api/menu", {
          signal: abortController.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Menu request failed with status ${response.status}`);
        }

        const liveMenu = (await response.json()) as MenuData;
        setMenuData(liveMenu);
        setMenuError(null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setMenuError(LIVE_MENU_ERROR_MESSAGE);
      }
    }

    void loadMenu();

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;

      menuData.categories.forEach((category) => {
        const section = sectionRefs.current[category.id];
        if (!section) {
          return;
        }

        if (
          scrollPosition >= section.offsetTop &&
          scrollPosition < section.offsetTop + section.offsetHeight
        ) {
          setActiveCategory(category.id);
        }
      });
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [menuData.categories]);

  useEffect(() => {
    const button = buttonRefs.current[activeCategory];
    const navContainer = navRef.current;

    if (!button || !navContainer) {
      return;
    }

    const buttonRect = button.getBoundingClientRect();
    const navRect = navContainer.getBoundingClientRect();

    if (buttonRect.left < navRect.left || buttonRect.right > navRect.right) {
      button.scrollIntoView({ inline: "center", behavior: "smooth" });
    }
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-[#f2f0e9] text-gray-800 scroll-smooth">
      <Header
        activeCategory={activeCategory}
        buttonRefs={buttonRefs}
        columns={columns}
        lang={lang}
        menuData={menuData}
        navRef={navRef}
        sectionRefs={sectionRefs}
        setColumns={setColumns}
        setLang={setLang}
        setSidebarOpen={setSidebarOpen}
        sidebarOpen={sidebarOpen}
      />

      <Sidebar
        menuName={menuData.restaurant.name}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-75 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {menuError ? (
        <div className="max-w-6xl mx-auto px-4 pt-6">
          <p className="rounded-2xl border border-[#890333]/20 bg-white/80 px-4 py-3 text-sm text-[#890333]">
            {menuError}
          </p>
        </div>
      ) : null}

      {menuData.categories.map((category) => {
        const products = menuData.products.filter(
          (product) => product.categoryId === category.id
        );

        return (
          <section
            key={category.id}
            className="max-w-6xl mx-auto px-4 py-12"
            ref={(element) => {
              if (element) {
                sectionRefs.current[category.id] = element;
              }
            }}
          >
            <h2 className="text-2xl font-bold text-[#890333] mb-2 flex items-center">
              {category.name[lang]}
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
                  currency={menuData.restaurant.currency}
                  lang={lang}
                  product={product}
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
  activeCategory: number;
  buttonRefs: React.RefObject<Record<number, HTMLButtonElement | null>>;
  columns: number;
  lang: SupportedLocale;
  menuData: MenuData;
  navRef: React.RefObject<HTMLDivElement | null>;
  sectionRefs: React.RefObject<Record<number, HTMLElement | null>>;
  setColumns: React.Dispatch<SetStateAction<1 | 2>>;
  setLang: React.Dispatch<SetStateAction<SupportedLocale>>;
  setSidebarOpen: React.Dispatch<SetStateAction<boolean>>;
  sidebarOpen: boolean;
};

const Header = ({
  activeCategory,
  buttonRefs,
  columns,
  lang,
  menuData,
  navRef,
  sectionRefs,
  setColumns,
  setLang,
  setSidebarOpen,
  sidebarOpen,
}: HeaderProps) => {
  const scrollToCategory = (categoryId: number) => {
    const section = sectionRefs.current[categoryId];

    if (!section) {
      return;
    }

    window.scrollTo({
      top: section.offsetTop - 100,
      behavior: "smooth",
    });
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md">
      <div
        className="relative flex justify-center items-center p-4 max-w-6xl mx-auto"
        style={{
          backgroundColor: "var(--primary)",
        }}
      >
        <button
          aria-label="Open sidebar"
          className="flex items-center absolute top-1/2 left-4 -translate-y-1/2 focus:outline-none"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          type="button"
        >
          <div
            className="flex items-center flex-col text-center"
            style={{ color: "var(--secondary)" }}
          >
            <div className="w-8 h-8 rounded-full text-sm transition-all duration-300 hover:scale-105 flex items-center justify-center">
              <HamburgerSVG />
            </div>
            <span className="text-xs opacity-70">MENU</span>
          </div>
        </button>

        <div className="relative">
          <Image
            width={170}
            height={100}
            src="/garagelogo.png"
            alt={`${menuData.restaurant.name} logo`}
            className="object-cover"
            priority
          />
        </div>

        <div className="flex gap-2 absolute right-4 top-1/2 -translate-y-1/2 items-center">
          <button
            className="w-8 h-8 rounded-full text-white text-sm transition-all duration-300 hover:scale-105"
            onClick={() => setLang(lang === "tr" ? "en" : "tr")}
            type="button"
          >
            {lang.toUpperCase()}
          </button>
          <button
            className="w-8 h-8 rounded-full text-white text-sm transition-all duration-300 hover:scale-105"
            onClick={() => setColumns(columns === 1 ? 2 : 1)}
            type="button"
          >
            {columns === 2 ? <RowSVG /> : <ColumnSVG />}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar" ref={navRef}>
        <div className="flex gap-6 px-4 py-3 max-w-6xl mx-auto">
          {menuData.categories.map((category) => (
            <button
              key={category.id}
              className={`whitespace-nowrap pb-1 transition-all duration-300 ${
                activeCategory === category.id
                  ? "text-[#890333] border-b-2 border-[#890333] font-semibold"
                  : "text-gray-500 hover:text-[#890333]"
              }`}
              onClick={() => scrollToCategory(category.id)}
              ref={(element) => {
                if (element) {
                  buttonRefs.current[category.id] = element;
                }
              }}
              type="button"
            >
              {category.name[lang]}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

type SidebarProps = {
  menuName: string;
  open: boolean;
  setOpen: React.Dispatch<SetStateAction<boolean>>;
};

const Sidebar = ({ menuName, open, setOpen }: SidebarProps) => {
  return (
    <div
      className={`fixed top-0 left-0 h-full shadow-lg z-50 transform transition-transform ${
        open ? "translate-x-0" : "-translate-x-full"
      } w-[70%] max-w-[300px]`}
      style={{
        color: "var(--secondary)",
        backgroundColor: "var(--primary)",
      }}
    >
      <div
        className="p-4 flex justify-between items-center border-b"
        style={{
          height: "91.38px",
        }}
      >
        <div className="relative w-full">
          <Image
            width={200}
            height={100}
            src="/garagelogo.png"
            alt={`${menuName} logo`}
            className="object-cover"
          />
        </div>
        <button
          aria-label="Close sidebar"
          className="text-2xl leading-none"
          onClick={() => setOpen(false)}
          type="button"
        >
          &times;
        </button>
      </div>
      <div className="flex flex-col content-between">
        <div className="p-4 space-y-6">
          <div>
            <strong>Adresimiz</strong>
            <a href="https://maps.app.goo.gl/HUn5sEAAxAvsaavV7" target="_blank">
              <p>
                AHMEDIYE MAHALLESI NECMEDDIN OKYAY SOKAK NO: 44/B ISTANBUL /
                USKUDAR
              </p>
            </a>
          </div>
          <div>
            <a href="tel:+905385730401">
              <strong>Telefon</strong>
              <p>+90 538 573 0401</p>
            </a>
          </div>
          <div>
            <a
              href="https://wa.me/905385730401"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex items-center gap-2 text-green-600">
                <WhatsappSVG />
                <strong>WhatsApp&apos;tan bize ulasin</strong>
              </div>
            </a>
          </div>
        </div>
        <div className="relative w-full h-40">
          <Image
            fill
            src="/garagechoco.jpg"
            className="object-cover"
            alt="Garage Logo"
          />
        </div>
      </div>
    </div>
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

const HamburgerSVG = () => {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M256 99.633c-37.26 0-74.595 11.18-119.844 33.328 1.565 57.322 29.767 114.884 57.942 145.362C211.383 271.182 233.625 268 256 268s44.617 3.18 61.902 10.322c28.175-30.478 56.377-88.04 57.942-145.36C330.594 110.813 293.26 99.63 256 99.63zm-134.422 54.135c-25.185 6.602-40.16 20.58-49.844 40.697-5.602 34.042-.223 57 10.98 74.916 10.892 17.424 27.93 30.347 47.21 42.335 10.962-1.166 21.316-2.24 30.152-5.563 8.206-3.086 15.32-8.034 21.715-17.27-27.815-30.238-53.7-80.825-60.212-135.114zm268.844 0c-6.513 54.29-32.397 104.876-60.213 135.115 6.393 9.235 13.508 14.183 21.714 17.27 8.836 3.322 19.19 4.396 30.152 5.562 19.28-11.988 36.318-24.91 47.21-42.334 11.203-17.915 16.582-40.873 10.98-74.915-9.684-20.118-24.66-34.095-49.844-40.697zM54.33 234.014C36.35 260.292 24 289.6 24 320c0 21.623 1.848 42.626 6.418 58.707 4.57 16.08 11.55 26.322 20.512 29.85 13.776 4.573 33.902-22.085 45.773-41.323 3.23-6.184 6.993-13.896 10.555-21.39 5.296-11.145 8.708-18.703 10.545-22.787-18.77-11.952-36.496-25.745-48.657-45.194-7.68-12.283-12.92-26.732-14.816-43.85zm403.34 0c-1.897 17.117-7.137 31.566-14.816 43.85-12.16 19.448-29.886 33.24-48.657 45.193 1.837 4.084 5.25 11.642 10.545 22.787 3.562 7.494 7.326 15.206 10.555 21.39 7.403 14.066 26.39 45.016 45.773 41.323 8.96-3.528 15.942-13.77 20.512-29.85C486.152 362.627 488 341.623 488 320c0-30.4-12.35-59.708-30.33-85.986z"></path>
    </svg>
  );
};

const WhatsappSVG = () => {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 448 512"
      height="1.5em"
      width="1.5em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path>
    </svg>
  );
};
