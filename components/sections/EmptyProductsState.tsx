import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyProductsState({ lang = "en" }: { lang?: string }) {
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
          {/* Gift Box */}
          <g opacity="0.6">
            {/* Box Body */}
            <rect
              x="50"
              y="70"
              width="100"
              height="80"
              rx="4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-400"
            />

            {/* Box Top */}
            <path
              d="M 50 70 L 70 50 L 130 50 L 150 70"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-400"
            />

            {/* Ribbon Horizontal */}
            <line
              x1="50"
              y1="105"
              x2="150"
              y2="105"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blue-400"
            />

            {/* Ribbon Vertical */}
            <line
              x1="100"
              y1="50"
              x2="100"
              y2="150"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blue-400"
            />

            {/* Bow */}
            <circle
              cx="100"
              cy="50"
              r="6"
              fill="currentColor"
              className="text-blue-400"
            />
            <ellipse
              cx="88"
              cy="44"
              rx="5"
              ry="4"
              fill="currentColor"
              className="text-blue-400"
            />
            <ellipse
              cx="112"
              cy="44"
              rx="5"
              ry="4"
              fill="currentColor"
              className="text-blue-400"
            />
          </g>

          {/* Stars for decoration */}
          <g className="text-amber-300">
            <circle cx="30" cy="40" r="2" fill="currentColor" />
            <circle cx="170" cy="60" r="2" fill="currentColor" />
            <circle cx="35" cy="140" r="2" fill="currentColor" />
            <circle cx="165" cy="150" r="2" fill="currentColor" />
          </g>

          {/* Sparkles */}
          <g className="text-blue-300" opacity="0.7">
            <g transform="translate(75, 35)">
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
            <g transform="translate(130, 120)">
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
        Henüz ürün yok
      </h3>
      <p className="mb-8 text-gray-600">
        Menüde görüntülenecek ilk ürünü oluşturun ve müşterilerinizi etkilemeye
        başlayın.
      </p>

      {/* Button */}
      <Link href={`/admin/${lang}/products/new`}>
        <Button size="lg" className="gap-2">
          + Ürün Oluştur
        </Button>
      </Link>
    </div>
  );
}
