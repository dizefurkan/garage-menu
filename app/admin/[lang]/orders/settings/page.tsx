"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check } from "lucide-react";
import { QrOrderingCard } from "./qr-ordering-card";

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
  const t = useTranslations("orderSettings");
  const locale = useLocale();
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [qrOrderingEnabled, setQrOrderingEnabled] = useState<boolean | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [generatingPin, setGeneratingPin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      // Independent endpoints — a failure in one should not blank out the
      // other, so they are settled separately rather than Promise.all'd.
      const [networkRes, qrRes] = await Promise.allSettled([
        fetch("/api/admin/network/verify-ip"),
        fetch("/api/admin/settings/qr-ordering"),
      ]);

      if (networkRes.status === "fulfilled" && networkRes.value.ok) {
        setNetworkStatus(await networkRes.value.json());
      } else {
        console.error("Error fetching network status:", networkRes);
      }

      if (qrRes.status === "fulfilled" && qrRes.value.ok) {
        const data = await qrRes.value.json();
        setQrOrderingEnabled(data.qr_ordering_enabled);
      } else {
        console.error("Error fetching QR ordering setting:", qrRes);
      }
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
      <h1 className="text-3xl font-bold">{t("title")}</h1>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : !networkStatus ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          {t("loadError")}
        </div>
      ) : (
        <div className="space-y-6">
          {/* QR Ordering master switch — the venue's own on/off, kept above
              the verification settings because it gates all of them. */}
          {qrOrderingEnabled !== null && (
            <QrOrderingCard initialEnabled={qrOrderingEnabled} />
          )}

          {/* WiFi IP Registration */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="text-xl font-semibold">{t("wifi.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("wifi.description")}
            </p>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">
                  {t("wifi.currentIpLabel")}
                </p>
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
                  <p className="text-sm font-medium mb-2">
                    {t("wifi.registeredIpLabel")}
                  </p>
                  <div className="bg-muted p-3 rounded">
                    <code>{networkStatus.registered_network_ip}</code>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 p-3 rounded bg-muted text-sm text-muted-foreground">
                {networkStatus.ip_matches ? (
                  <>
                    <Check className="size-4 shrink-0" />
                    <span>{t("wifi.statusMatches")}</span>
                  </>
                ) : networkStatus.registered_network_ip ? (
                  <span>{t("wifi.statusMismatch")}</span>
                ) : (
                  <span>{t("wifi.statusUnregistered")}</span>
                )}
              </div>

              <Button
                onClick={registerNetworkIP}
                disabled={registering || networkStatus.ip_matches}
                className="gap-2"
              >
                {registering && <Loader2 className="size-4 animate-spin" />}
                {networkStatus.registered_network_ip
                  ? t("wifi.updateButton")
                  : t("wifi.registerButton")}
              </Button>
            </div>
          </div>

          {/* PIN Info */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="text-xl font-semibold">{t("pin.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("pin.description")}
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
                    {t("pin.lastGenerated", {
                      // Was pinned to "tr-TR", so an English admin still got a
                      // Turkish-formatted date. Follow the active locale.
                      date: new Date(
                        networkStatus.pin_date
                      ).toLocaleDateString(locale),
                    })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("pin.notGenerated")}
              </p>
            )}

            <Button onClick={generatePin} disabled={generatingPin} className="gap-2">
              {generatingPin && <Loader2 className="size-4 animate-spin" />}
              {networkStatus.has_pin_set
                ? t("pin.regenerateButton")
                : t("pin.generateButton")}
            </Button>
          </div>

          {/* How It Works */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="text-xl font-semibold">{t("howItWorks.title")}</h2>
            <ol className="space-y-3 text-sm">
              {(["step1", "step2", "step3"] as const).map((step, index) => (
                <li key={step}>
                  <strong>
                    {index + 1}. {t(`howItWorks.${step}Label`)}:
                  </strong>{" "}
                  {t(`howItWorks.${step}`)}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
