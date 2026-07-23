"use client";

import { useState } from "react";
import { Loader2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import { useCart } from "./cart-context";

interface CartSidebarProps {
  slug: string;
  tableId: string;
  primaryColor: string;
}

export function CartSidebar({ slug, tableId, primaryColor }: CartSidebarProps) {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isOpen,
    closeCart,
    toggleCart,
  } = useCart();
  const [orderNote, setOrderNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  async function submitOrder() {
    if (cart.length === 0) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_slug: slug,
          table_id: tableId,
          items: cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
          note: orderNote,
          verification_method: "wifi",
        }),
      });

      const data = await res.json();

      if (!res.ok && data.requires_verification) {
        setShowPinVerification(true);
        return;
      }

      if (!res.ok) {
        alert("Hata: " + (data.error || "Sipariş oluşturulamadı"));
        return;
      }

      setOrderNote("");
      clearCart();
      setOrderPlaced(true);
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Sipariş oluşturulurken bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitWithPin() {
    if (!pinCode) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_slug: slug,
          table_id: tableId,
          items: cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
          note: orderNote,
          verification_method: "pin",
          pin_code: pinCode,
        }),
      });

      if (!res.ok) {
        alert("PIN yanlış, lütfen tekrar deneyin");
        return;
      }

      setOrderNote("");
      setShowPinVerification(false);
      setPinCode("");
      clearCart();
      setOrderPlaced(true);
    } catch (error) {
      console.error("Error submitting order:", error);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCloseCart() {
    closeCart();
    if (orderPlaced) {
      // Reset the success screen once the sheet has closed so the next
      // open shows an empty-cart state rather than the old confirmation.
      setTimeout(() => setOrderPlaced(false), 300);
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={toggleCart}
        aria-label="Sepeti aç"
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-5 py-3.5 text-white shadow-lg transition-all duration-200 hover:scale-105 ${
          isOpen ? "pointer-events-none scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
        style={{ backgroundColor: primaryColor }}
      >
        <ShoppingBag className="size-5" />
        <span className="text-sm font-semibold">Sepetim</span>
        {itemCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-white text-xs font-bold" style={{ color: primaryColor }}>
            {itemCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={showPinVerification ? undefined : handleCloseCart}
        />
      )}

      {/* Panel: bottom sheet on mobile, right sidebar on desktop */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:max-h-none sm:w-full sm:max-w-sm sm:rounded-none sm:border-l sm:border-gray-100 ${
          isOpen
            ? "translate-y-0 sm:translate-x-0"
            : "translate-y-full sm:translate-x-full sm:translate-y-0"
        }`}
      >
        {showPinVerification ? (
          <div className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">PIN Doğrulaması</h2>
              <button
                onClick={() => setShowPinVerification(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Kapat"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Sipariş vermek için kafede bulunan 4 haneli PIN kodunu girin.
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowPinVerification(false)}
                className="flex-1 rounded-lg border border-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={submitWithPin}
                disabled={submitting || pinCode.length !== 4}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Onayla
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Drag handle (mobile only) */}
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="h-1.5 w-10 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <ShoppingBag className="size-5" style={{ color: primaryColor }} />
              <h2 className="text-lg font-bold text-gray-900">Sepetim</h2>
              {itemCount > 0 && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {itemCount}
                </span>
              )}
              <button
                onClick={handleCloseCart}
                className="ml-auto text-gray-400 hover:text-gray-600"
                aria-label="Kapat"
              >
                <X className="size-5" />
              </button>
            </div>

            {orderPlaced ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <div
                  className="flex size-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${primaryColor}1A` }}
                >
                  <ShoppingBag className="size-7" style={{ color: primaryColor }} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Siparişiniz Alındı!
                </h3>
                <p className="text-sm text-gray-600">
                  Siparişiniz hazırlanıyor, kısa süre içinde masanıza gelecektir.
                </p>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {cart.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                      <ShoppingBag className="size-10 text-gray-300" />
                      <p className="text-sm text-gray-500">Sepetiniz boş</p>
                      <p className="text-xs text-gray-400">
                        Menüden ürün seçip sepete ekleyebilirsiniz
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div
                          key={item.product_id}
                          className="flex gap-3 rounded-2xl border border-gray-100 p-3"
                        >
                          <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-linear-to-br from-gray-100 to-gray-50">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.product_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xl">
                                🍽️
                              </div>
                            )}
                          </div>

                          <div className="flex flex-1 flex-col justify-between gap-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {item.product_name}
                              </p>
                              <button
                                onClick={() => removeFromCart(item.product_id)}
                                className="shrink-0 text-gray-300 hover:text-red-500"
                                aria-label="Kaldır"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 rounded-full border border-gray-200 p-0.5">
                                <button
                                  onClick={() =>
                                    updateQuantity(item.product_id, item.quantity - 1)
                                  }
                                  className="flex size-6 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
                                >
                                  <Minus className="size-3" />
                                </button>
                                <span className="w-5 text-center text-sm font-medium">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(item.product_id, item.quantity + 1)
                                  }
                                  className="flex size-6 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
                                >
                                  <Plus className="size-3" />
                                </button>
                              </div>
                              <span
                                className="text-sm font-bold"
                                style={{ color: primaryColor }}
                              >
                                {(item.unit_price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                  <div className="space-y-3 border-t border-gray-100 p-5">
                    <textarea
                      placeholder="Özel istekler / notlar (isteğe bağlı)"
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
                      rows={2}
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Toplam</span>
                      <span className="text-xl font-bold text-gray-900">
                        {cartTotal.toFixed(2)} TRY
                      </span>
                    </div>

                    <button
                      onClick={submitOrder}
                      disabled={submitting}
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {submitting && <Loader2 className="size-4 animate-spin" />}
                      Siparişi Gönder
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
