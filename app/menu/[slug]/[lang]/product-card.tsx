"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Box, X } from "lucide-react";

// "Allergens" in all supported menu languages
const ALLERGENS_LABELS: Record<string, string> = {
  en: "Allergens",
  tr: "Alerjenler",
  de: "Allergene",
  fr: "Allergènes",
  es: "Alérgenos",
  it: "Allergeni",
  pt: "Alergénios",
  ja: "アレルゲン",
  zh: "过敏原",
  ru: "Аллергены",
  ar: "مسببات الحساسية",
};

const VIEW_3D_LABELS: Record<string, string> = {
  en: "View in 3D",
  tr: "3B Görüntüle",
  de: "In 3D ansehen",
  fr: "Voir en 3D",
  es: "Ver en 3D",
  it: "Vedi in 3D",
  pt: "Ver em 3D",
  ja: "3Dで見る",
  zh: "查看3D",
  ru: "Смотреть в 3D",
  ar: "عرض ثلاثي الأبعاد",
};

const VIEW_PHOTO_LABELS: Record<string, string> = {
  en: "Photo",
  tr: "Fotoğraf",
  de: "Foto",
  fr: "Photo",
  es: "Foto",
  it: "Foto",
  pt: "Foto",
  ja: "写真",
  zh: "照片",
  ru: "Фото",
  ar: "صورة",
};

const CLOSE_LABELS: Record<string, string> = {
  en: "Close",
  tr: "Kapat",
  de: "Schließen",
  fr: "Fermer",
  es: "Cerrar",
  it: "Chiudi",
  pt: "Fechar",
  ja: "閉じる",
  zh: "关闭",
  ru: "Закрыть",
  ar: "إغلاق",
};

const MAX_VISIBLE_ALLERGEN_ICONS = 6;

interface ProductAllergen {
  code: string;
  emoji: string;
  name: string;
}

interface ProductCardProps {
  product: any;
  categoryId: string;
  primaryColor: string;
  lang: string;
}

export function ProductCard({
  product,
  categoryId,
  primaryColor,
  lang,
}: ProductCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const allergens: ProductAllergen[] = product.allergens || [];
  const allergensLabel = ALLERGENS_LABELS[lang] || ALLERGENS_LABELS.en;

  return (
    <>
      <div
        className="group rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
        data-product-id={product.id}
        data-category-id={categoryId}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        onClick={() => setIsDetailOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsDetailOpen(true);
          }
        }}
      >
        {/* Image */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-3xl mb-2">🍽️</div>
                <p className="text-xs text-gray-400">No image</p>
              </div>
            </div>
          )}

          {/* Allergen icons overlaid on the image - no impact on card height */}
          {allergens.length > 0 && (
            <div
              className="absolute bottom-2 left-2 flex items-center gap-0.5 rounded-full bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm"
              aria-hidden="true"
              title={`${allergensLabel}: ${allergens
                .map((a) => a.name)
                .join(", ")}`}
            >
              {allergens
                .slice(0, MAX_VISIBLE_ALLERGEN_ICONS)
                .map((allergen) => (
                  <span key={allergen.code} className="text-sm leading-none">
                    {allergen.emoji}
                  </span>
                ))}
              {allergens.length > MAX_VISIBLE_ALLERGEN_ICONS && (
                <span className="text-xs font-medium text-gray-500">
                  +{allergens.length - MAX_VISIBLE_ALLERGEN_ICONS}
                </span>
              )}
            </div>
          )}

          {/* 3D availability badge */}
          {product.model_glb && (
            <div
              className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm"
              aria-hidden="true"
            >
              <Box className="h-3.5 w-3.5" />
              3D
            </div>
          )}

          {/* Price pill overlaid on the image */}
          <div
            className="absolute bottom-2 right-2 rounded-full px-2.5 py-1 text-sm font-bold text-white shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            {product.price}
            {product.currency && (
              <span className="ml-1 text-xs font-medium">
                {product.currency}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="font-bold text-lg line-clamp-2 text-gray-900">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>
      </div>

      {isDetailOpen && (
        <ProductDetailModal
          product={product}
          allergens={allergens}
          primaryColor={primaryColor}
          lang={lang}
          onClose={() => setIsDetailOpen(false)}
        />
      )}
    </>
  );
}

// Bottom sheet on mobile, centered modal on desktop.
// Rendered via portal so clicks inside it don't hit the card's
// [data-product-id] analytics click delegation.
const MODAL_ANIMATION_MS = 250;

function ProductDetailModal({
  product,
  allergens,
  primaryColor,
  lang,
  onClose,
}: {
  product: any;
  allergens: ProductAllergen[];
  primaryColor: string;
  lang: string;
  onClose: () => void;
}) {
  // Mounted closed, then flipped to visible so the enter transition plays;
  // close animates out first, then unmounts.
  const [isVisible, setIsVisible] = useState(false);

  const hasModel = Boolean(product.model_glb);
  // USDZ without GLB can't render inline, but iOS Safari can still open it
  // directly in AR Quick Look via a plain link
  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);
  const usdzOnlyAR = !hasModel && Boolean(product.model_usdz) && isIOS;
  const [show3D, setShow3D] = useState(hasModel && !product.image);
  const [viewerReady, setViewerReady] = useState(false);

  // model-viewer (~big chunk) is only fetched when a modal opens for a
  // product that actually has a 3D model
  useEffect(() => {
    if (!hasModel) return;
    let cancelled = false;
    import("@google/model-viewer").then(() => {
      if (!cancelled) setViewerReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [hasModel]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, MODAL_ANIMATION_MS);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/60 transition-opacity duration-250 sm:items-center sm:p-4 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div
        className={`relative flex max-h-[85vh] w-full transform flex-col overflow-hidden rounded-t-2xl bg-white transition-all duration-250 ease-out sm:max-w-md sm:rounded-2xl ${
          isVisible
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-full opacity-0 sm:translate-y-4 sm:scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label={CLOSE_LABELS[lang] || CLOSE_LABELS.en}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:bg-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="overflow-y-auto">
          {/* Image / 3D viewer */}
          <div className="relative">
            {show3D && viewerReady ? (
              <model-viewer
                src={product.model_glb}
                ios-src={product.model_usdz || undefined}
                poster={product.image || undefined}
                alt={product.name}
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                touch-action="pan-y"
                shadow-intensity="1"
                style={{
                  width: "100%",
                  aspectRatio: "16/9",
                  minHeight: "20rem",
                  backgroundColor: "#f3f4f6",
                }}
              />
            ) : product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="aspect-video w-full object-cover"
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50">
                <span className="text-5xl">🍽️</span>
              </div>
            )}

            {hasModel && (
              <button
                type="button"
                onClick={() => setShow3D((v) => !v)}
                className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm hover:bg-white"
              >
                <Box className="h-3.5 w-3.5" aria-hidden="true" />
                {show3D
                  ? VIEW_PHOTO_LABELS[lang] || VIEW_PHOTO_LABELS.en
                  : VIEW_3D_LABELS[lang] || VIEW_3D_LABELS.en}
              </button>
            )}

            {usdzOnlyAR && (
              <a
                rel="ar"
                href={product.model_usdz}
                className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur-sm hover:bg-white"
              >
                <Box className="h-3.5 w-3.5" aria-hidden="true" />
                AR
              </a>
            )}
          </div>

          <div className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-bold text-gray-900">
                {product.name}
              </h3>
              <span
                className="shrink-0 text-xl font-bold"
                style={{ color: primaryColor }}
              >
                {product.price}
                {product.currency && (
                  <span className="ml-1 text-sm">{product.currency}</span>
                )}
              </span>
            </div>

            {product.description && (
              <p className="text-sm leading-relaxed text-gray-600">
                {product.description}
              </p>
            )}

            {allergens.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {ALLERGENS_LABELS[lang] || ALLERGENS_LABELS.en}
                </h4>
                <ul className="flex flex-wrap gap-1.5">
                  {allergens.map((allergen) => (
                    <li
                      key={allergen.code}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800"
                    >
                      <span aria-hidden="true">{allergen.emoji}</span>
                      {allergen.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
