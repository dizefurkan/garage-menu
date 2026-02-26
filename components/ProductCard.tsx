import Image from "next/image";

export default function ProductCard({
  currency,
  product,
  lang,
}: {
  currency: string;
  product: (typeof import("@/data/menu.json"))["products"][number];
  lang: "tr" | "en";
}) {
  return (
    <div className="reveal bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="relative w-full h-48 bg-gray-200">
        <Image
          fill
          src={product.imagePath || "/placeholder.jpg"}
          alt={product.name[lang]}
          className="object-cover scale-105"
        />
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-lg text-[#890333]">
          {product.name[lang]}
        </h3>

        {product.description[lang] && (
          <p className="text-sm text-gray-500 mt-2">
            {product.description[lang]}
          </p>
        )}

        <div className="mt-4 text-right">
          <span className="bg-[#890333] text-white px-4 py-1 rounded-full text-sm">
            {Intl.NumberFormat(lang, {
              currencyDisplay: "symbol",
              signDisplay: "auto",

              style: "currency",
              currency,
            }).format(product.price)}
          </span>
        </div>
      </div>
    </div>
  );
}
