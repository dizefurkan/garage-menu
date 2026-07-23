"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check } from "lucide-react";

interface NetworkStatus {
  tenant_name: string;
  registered_network_ip: string | null;
  current_ip: string;
  ip_matches: boolean;
  has_pin_set: boolean;
  pin_code: string | null;
  pin_date: string | null;
}

export default function OrdersSettingsPage() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [generatingPin, setGeneratingPin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);

  useEffect(() => {
    fetchNetworkStatus();
  }, []);

  async function fetchNetworkStatus() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/network/verify-ip");
      if (!res.ok) throw new Error("Failed to fetch network status");
      const data = await res.json();
      setNetworkStatus(data);
    } catch (error) {
      console.error("Error fetching network status:", error);
    } finally {
      setLoading(false);
    }
  }

  async function registerNetworkIP() {
    try {
      setRegistering(true);
      const res = await fetch("/api/admin/network/verify-ip", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to register network IP");
      const data = await res.json();

      if (data.success) {
        setNetworkStatus((prev) =>
          prev
            ? {
                ...prev,
                registered_network_ip: data.verified_network_ip,
                ip_matches: true,
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error registering network IP:", error);
    } finally {
      setRegistering(false);
    }
  }

  async function generatePin() {
    try {
      setGeneratingPin(true);
      const res = await fetch("/api/admin/network/generate-pin", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to generate PIN");
      const data = await res.json();

      if (data.success) {
        setNetworkStatus((prev) =>
          prev
            ? {
                ...prev,
                has_pin_set: true,
                pin_code: data.pin_code,
                pin_date: data.pin_date,
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error generating PIN:", error);
    } finally {
      setGeneratingPin(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPinToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setPinCopied(true);
    setTimeout(() => setPinCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Sipariş Ayarları</h1>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : !networkStatus ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          Ayarlar yüklenemedi
        </div>
      ) : (
        <div className="space-y-6">
          {/* WiFi IP Registration */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="text-xl font-semibold">WiFi Ağ Kaydı</h2>
            <p className="text-sm text-muted-foreground">
              Kafenizin WiFi ağının IP adresini kaydederek, müşteriler aynı ağ üzerindeyse PIN
              sorulmadan sipariş verebilirler.
            </p>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Sizin Geçerli IP:</p>
                <div className="flex items-center gap-2 bg-muted p-3 rounded">
                  <code className="flex-1">{networkStatus.current_ip}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(networkStatus.current_ip)}
                  >
                    {copied ? (
                      <Check className="size-4 text-green-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              {networkStatus.registered_network_ip && (
                <div>
                  <p className="text-sm font-medium mb-2">Kayıtlı IP Adresi:</p>
                  <div className="bg-muted p-3 rounded">
                    <code>{networkStatus.registered_network_ip}</code>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 p-3 rounded bg-blue-50 text-blue-700 text-sm">
                {networkStatus.ip_matches ? (
                  <>
                    <Check className="size-4" />
                    <span>✓ Geçerli IP, kayıtlı IP ile eşleşiyor</span>
                  </>
                ) : networkStatus.registered_network_ip ? (
                  <span>Geçerli IP, kayıtlı IP ile eşleşmiyor (başka ağdasınız)</span>
                ) : (
                  <span>Henüz IP kaydı yapılmamış</span>
                )}
              </div>

              <Button
                onClick={registerNetworkIP}
                disabled={registering || networkStatus.ip_matches}
                className="gap-2"
              >
                {registering && <Loader2 className="size-4 animate-spin" />}
                {networkStatus.registered_network_ip
                  ? "IP Adresini Güncelle"
                  : "Geçerli IP'yi Kaydet"}
              </Button>
            </div>
          </div>

          {/* PIN Info */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="text-xl font-semibold">Sipariş PIN Kodu</h2>
            <p className="text-sm text-muted-foreground">
              WiFi ağında olmayan müşteriler siparişlerini doğrulamak için bu 4
              haneli kodu girer. Kod, siz "Yeni Kod Üret" diyene kadar geçerli
              kalır — günlük otomatik değişmez.
            </p>

            {networkStatus.has_pin_set && networkStatus.pin_code ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted p-3 text-center text-3xl font-bold tracking-[0.5em]">
                    {networkStatus.pin_code}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyPinToClipboard(networkStatus.pin_code!)}
                  >
                    {pinCopied ? (
                      <Check className="size-4 text-green-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
                {networkStatus.pin_date && (
                  <p className="text-xs text-muted-foreground">
                    Son üretim: {new Date(networkStatus.pin_date).toLocaleDateString("tr-TR")}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">PIN kodu henüz üretilmemiş</p>
            )}

            <Button onClick={generatePin} disabled={generatingPin} className="gap-2">
              {generatingPin && <Loader2 className="size-4 animate-spin" />}
              {networkStatus.has_pin_set ? "Yeni Kod Üret" : "Kod Üret"}
            </Button>
          </div>

          {/* How It Works */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="text-xl font-semibold">Nasıl Çalışır?</h2>
            <div className="space-y-3 text-sm">
              <p>
                <strong>1. WiFi IP Kaydı:</strong> Kafenizin WiFi ağının IP adresini kaydettikten
                sonra, müşteriler bu ağdan sipariş verirse otomatik olarak doğrulanır.
              </p>
              <p>
                <strong>2. PIN Doğrulaması:</strong> WiFi ağında olmayan müşteriler (mobil veri
                kullananlar gibi) günlük PIN kodunu girer.
              </p>
              <p>
                <strong>3. Fallback:</strong> WiFi ağında olsa da PIN'e girebilir, isterlerse.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
