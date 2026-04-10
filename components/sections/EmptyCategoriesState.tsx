import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyCategoriesState({ lang = "en" }: { lang?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-8 text-center">
      {/* Illustration */}
      <div className="mx-auto mb-8 flex justify-center">
        <svg
          className="h-40 w-40"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stacked folders */}
          <g opacity="0.6">
            {/* Bottom folder */}
            <path
              d="M 40 120 L 40 70 L 90 70 L 100 80 L 160 80 L 160 140 Q 160 150 150 150 L 50 150 Q 40 150 40 140 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-400"
            />

            {/* Middle folder - offset */}
            <path
              d="M 55 100 L 55 55 L 105 55 L 115 65 L 165 65 L 165 120"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blue-400"
              opacity="0.7"
            />

            {/* Top folder - offset more */}
            <path
              d="M 70 80 L 70 45 L 120 45 L 130 55 L 170 55"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blue-500"
              opacity="0.8"
            />
          </g>

          {/* Decorative elements */}
          {/* Stars */}
          <g className="text-amber-300">
            <circle cx="35" cy="50" r="2" fill="currentColor" />
            <circle cx="175" cy="90" r="2" fill="currentColor" />
            <circle cx="40" cy="160" r="2" fill="currentColor" />
          </g>

          {/* Sparkles */}
          <g className="text-blue-300" opacity="0.7">
            <g transform="translate(110, 35)">
              <line
                x1="0"
                y1="-3"
                x2="0"
                y2="3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                x1="-3"
                y1="0"
                x2="3"
                y2="0"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </g>
            <g transform="translate(155, 125)">
              <line
                x1="0"
                y1="-3"
                x2="0"
                y2="3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                x1="-3"
                y1="0"
                x2="3"
                y2="0"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </g>
          </g>
        </svg>
      </div>

      {/* Text */}
      <h3 className="mb-2 text-xl font-semibold text-gray-900">
        Henüz kategori yok
      </h3>
      <p className="mb-8 text-gray-600">
        Menüdeki ürünlerinizi organize etmek için kategoriler oluşturun.
      </p>

      {/* Button */}
      <Link href={`/admin/${lang}/categories/new`}>
        <Button size="lg" className="gap-2">
          + Kategori Oluştur
        </Button>
      </Link>
    </div>
  );
}
