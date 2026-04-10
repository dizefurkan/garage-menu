"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, X, Loader, RefreshCw, Trash2, Images } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  tenantId?: string;
}

export function ImageUpload({
  value,
  onChange,
  disabled,
  tenantId,
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Lütfen bir görsel dosyası seçiniz");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Dosya boyutu 10MB'den küçük olmalıdır");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      if (tenantId) {
        formData.append("tenantId", tenantId);
      }

      // Upload to API
      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Görsel yüklemesi başarısız");
      }

      const data = await response.json();
      onChange(data.url);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const fetchGalleryPage = async (page: number) => {
    setGalleryLoading(true);
    try {
      const response = await fetch(`/api/admin/gallery?page=${page}`);
      if (response.ok) {
        const data = await response.json();
        setGalleryImages(data.images || []);
        setCurrentPage(page);
        setTotalPages(data.pagination?.totalPages || 0);
        setTotalImages(data.pagination?.total || 0);
      }
    } catch (err) {
      setError("Galeri yüklenemedi");
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleOpenGallery = async () => {
    setShowGallery(true);
    setCurrentPage(1);
    await fetchGalleryPage(1);
  };

  const handleSelectFromGallery = (imageUrl: string) => {
    onChange(imageUrl);
    setShowGallery(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || loading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    if (disabled || loading) return;
    fileInputRef.current?.click();
  };

  const handleReplace = () => {
    if (disabled || loading) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area - Hide when preview exists */}
      {!value && (
        <>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={handleClick}
            className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
              disabled || loading
                ? "cursor-not-allowed bg-gray-50"
                : "cursor-pointer border-gray-300 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files && handleFileSelect(e.target.files[0])
              }
              disabled={disabled || loading}
              className="hidden"
            />

            {loading ? (
              <Loader className="h-8 w-8 animate-spin text-gray-400" />
            ) : (
              <Upload className="h-8 w-8 text-gray-400" />
            )}

            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {loading ? "Yükleniyor..." : "Görsel seçmek için tıklayın"}
              </p>
              <p className="text-xs text-gray-500">
                veya dosyayı buraya sürükleyin
              </p>
            </div>
          </div>

          {/* Select from Gallery Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleOpenGallery}
            disabled={disabled || loading}
            className="w-full"
          >
            <Images className="mr-2 h-4 w-4" />
            Yüklü Görsellerden Seç
          </Button>
        </>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-sm text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Image Preview */}
      {value && (
        <div className="relative space-y-2">
          <div className="relative aspect-video overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
            <Image
              src={value}
              alt="Ürün görseli"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReplace}
              disabled={disabled || loading}
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Değiştir
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange(null)}
              disabled={disabled || loading}
              className="flex-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Sil
            </Button>
          </div>
        </div>
      )}

      {/* Gallery Dialog */}
      <Dialog open={showGallery} onOpenChange={setShowGallery}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Yüklü Görsellerden Seç</DialogTitle>
            <DialogDescription>
              Toplam {totalImages} görsel - Sayfa {currentPage} / {totalPages}
            </DialogDescription>
          </DialogHeader>

          {galleryLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : galleryImages.length === 0 && totalImages === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">Henüz yüklü görsel yok</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 pr-2">
                  {galleryImages.map((imageUrl) => (
                    <button
                      key={imageUrl}
                      onClick={() => handleSelectFromGallery(imageUrl)}
                      className="group relative aspect-square overflow-hidden rounded-lg border-2 border-gray-200 transition-all hover:border-blue-500"
                      type="button"
                    >
                      <Image
                        src={imageUrl}
                        alt="Galeri görseli"
                        fill
                        sizes="200px"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
                        <span className="text-white opacity-0 transition-all group-hover:opacity-100">
                          Seç
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchGalleryPage(currentPage - 1)}
                    disabled={currentPage === 1 || galleryLoading}
                  >
                    Önceki
                  </Button>
                  <span className="text-sm text-gray-600">
                    Sayfa {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => fetchGalleryPage(currentPage + 1)}
                    disabled={currentPage === totalPages || galleryLoading}
                  >
                    Sonraki
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
