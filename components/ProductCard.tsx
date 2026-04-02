import Image from "next/image";
import { extractGoogleDriveFileId } from "@/lib/google-drive";
import { type MenuProduct, type SupportedLocale } from "@/lib/menu";

function getProductImageSrc(product: MenuProduct): string {
  if (product.imageId) {
    return `/api/image?id=${encodeURIComponent(product.imageId)}`;
  }

  const driveFileId = extractGoogleDriveFileId(
    product.imageUrl ?? product.imagePath ?? ""
  );

  if (driveFileId) {
    return `/api/image?id=${encodeURIComponent(driveFileId)}`;
  }

  return product.imagePath || "/placeholder.jpg";
}

export default function ProductCard({
  currency,
  product,
  lang,
}: {
  currency: string;
  product: MenuProduct;
  lang: SupportedLocale;
}) {
  const imageSrc = getProductImageSrc(product);

  return (
    <div className="reveal bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="relative w-full h-48 bg-gray-200">
        <Image
          fill
          src={imageSrc}
          alt={product.name[lang]}
          className="object-cover scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          unoptimized={imageSrc.startsWith("/api/image?")}
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
