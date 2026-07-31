import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Contact,
  Languages,
  Palette,
  Type,
  type LucideIcon,
} from "lucide-react";
import { loadSettingsPage } from "./settings-shell";

interface Props {
  params: Promise<{
    lang: string;
  }>;
}

export default async function SettingsPage({ params }: Props) {
  const { lang } = await params;
  const { t } = await loadSettingsPage(lang);

  const sections: Array<{
    href: string;
    icon: LucideIcon;
    title: string;
    description: string;
  }> = [
    {
      href: "general",
      icon: Building2,
      title: t("basicInformation"),
      description: t("basicInformationDescription"),
    },
    {
      href: "languages",
      icon: Languages,
      title: t("languages"),
      description: t("languagesDescription"),
    },
    {
      href: "translations",
      icon: Type,
      title: t("translations"),
      description: t("translationsDescription"),
    },
    {
      href: "appearance",
      icon: Palette,
      title: t("appearance"),
      description: t("appearanceDescription"),
    },
    {
      href: "contact",
      icon: Contact,
      title: t("contactInformation"),
      description: t("contactInformationDescription"),
    },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </div>

      <div className="divide-y overflow-hidden rounded-lg border">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={`/admin/${lang}/settings/${section.href}`}
              className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start gap-3">
                <Icon
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <div>
                  <p className="font-medium">{section.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </div>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
