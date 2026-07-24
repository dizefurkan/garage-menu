import Link from "next/link";
import {
  ArrowRight,
  QrCode,
  Zap,
  Smartphone,
  Users,
  Globe,
  Settings,
  Check,
  Play,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Reveal } from "@/components/landing/Reveal";
import { Squish } from "@/components/landing/Squish";
import { Counter } from "@/components/landing/Counter";
import { GridBackground } from "@/components/landing/GridBackground";
import { HeroVisual } from "@/components/landing/HeroVisual";
import { Marquee } from "@/components/landing/Marquee";
import { ScrollShowcase } from "@/components/landing/ScrollShowcase";

interface Props {
  params: Promise<{ lang: string }>;
}

async function getMessages(lang: string) {
  try {
    return await import(`@/messages/${lang}.json`).then((m) => m.default);
  } catch {
    return await import("@/messages/en.json").then((m) => m.default);
  }
}

export default async function LandingPage({ params }: Props) {
  const { lang } = await params;
  const messages = await getMessages(lang);
  const t = messages.landing;
  const year = new Date().getFullYear();

  const features = [
    { icon: QrCode, title: t.feature_1_title, description: t.feature_1_desc },
    { icon: Zap, title: t.feature_2_title, description: t.feature_2_desc },
    { icon: Smartphone, title: t.feature_3_title, description: t.feature_3_desc },
    { icon: Users, title: t.feature_4_title, description: t.feature_4_desc },
    { icon: Globe, title: t.feature_5_title, description: t.feature_5_desc },
    { icon: Settings, title: t.feature_6_title, description: t.feature_6_desc },
  ];

  const benefits = [
    { number: "10K+", label: t.benefits_restaurants },
    { number: "99.9%", label: t.benefits_uptime },
    { number: "24/7", label: t.benefits_support },
  ];

  const showcaseSteps = [
    { title: t.step_1_title, description: t.step_1_desc },
    { title: t.step_2_title, description: t.step_2_desc },
    { title: t.step_3_title, description: t.step_3_desc },
    { title: t.step_4_title, description: t.step_4_desc },
  ];

  const pricingPlans = [
    {
      name: t.plan_starter_name,
      price: t.plan_starter_price,
      description: t.plan_starter_desc,
      features: t.plan_starter_features as string[],
      cta: t.plan_cta_starter,
      highlighted: false,
      custom: false,
    },
    {
      name: t.plan_professional_name,
      price: t.plan_professional_price,
      description: t.plan_professional_desc,
      features: t.plan_professional_features as string[],
      cta: t.plan_cta_professional,
      highlighted: true,
      custom: false,
    },
    {
      name: t.plan_enterprise_name,
      price: t.plan_enterprise_price,
      description: t.plan_enterprise_desc,
      features: t.plan_enterprise_features as string[],
      cta: t.plan_cta_enterprise,
      highlighted: false,
      custom: true,
    },
  ];

  const footerColumns = [
    { title: t.footer_product, links: [t.footer_features, t.footer_pricing, t.footer_faq] },
    { title: t.footer_company, links: [t.footer_about, t.footer_blog, t.footer_contact] },
    { title: t.footer_legal, links: [t.footer_privacy, t.footer_terms] },
  ];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <GridBackground />

      {/* Navigation */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href={`/${lang}`} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <QrCode className="h-[1.125rem] w-[1.125rem]" />
            </div>
            <span className="text-base font-semibold tracking-tight">
              {t.brand}
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher currentLang={lang as "en" | "tr"} compact />
            <Link
              href="/auth/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              {t.nav_signin}
            </Link>
            <Squish>
              <Link
                href="/auth/login"
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
              >
                {t.nav_getstarted}
              </Link>
            </Squish>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 pt-36 pb-16 sm:px-6 lg:px-8 lg:pt-44">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal className="text-center lg:text-left" stagger>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
              {t.hero_badge}
            </div>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.75rem]">
              {t.heroTitle}
              <span className="mt-1.5 block text-muted-foreground">
                {t.heroSubtitle}
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              {t.heroDescription}
            </p>

            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Squish className="w-full sm:w-auto">
                <Link
                  href="/auth/login"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-base font-semibold text-background transition-colors hover:bg-foreground/90 sm:w-auto"
                >
                  {t.cta_primary}
                  <ArrowRight className="h-[1.125rem] w-[1.125rem] transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Squish>
              <Squish className="w-full sm:w-auto">
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-muted sm:w-auto">
                  <Play className="h-4 w-4 fill-current" />
                  {t.cta_secondary}
                </button>
              </Squish>
            </div>

            <div className="mt-12 flex justify-center gap-8 lg:justify-start">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="text-center lg:text-left">
                  <Counter
                    value={benefit.number}
                    className="block text-2xl font-semibold tracking-tight sm:text-3xl"
                  />
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    {benefit.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>

          <div className="hidden lg:block">
            <HeroVisual
              brand={t.brand}
              langChip={t.hero_chip_langs}
              ratingChip="4.9"
            />
          </div>
        </div>

        {/* GSAP marquee */}
        <div className="mx-auto mt-20 max-w-6xl">
          <Marquee items={features.map((f) => f.title)} />
        </div>
      </section>

      {/* Apple-style scroll showcase */}
      <ScrollShowcase
        eyebrow={t.showcase_eyebrow}
        heading={t.howItWorks_title}
        brand={t.brand}
        steps={showcaseSteps}
      />

      {/* Features */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-14 max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.features_title}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t.features_subtitle}
            </p>
          </Reveal>

          <Reveal className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3" stagger>
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="group bg-card p-7 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-background transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </Reveal>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.pricing_title}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t.pricing_subtitle}
            </p>
          </Reveal>

          <Reveal className="grid items-start gap-6 lg:grid-cols-3" stagger>
            {pricingPlans.map((plan, idx) => {
              const dark = plan.highlighted;
              return (
                <div
                  key={idx}
                  className={`relative rounded-2xl border p-8 transition-all ${
                    dark
                      ? "border-foreground bg-foreground text-background shadow-xl lg:-translate-y-2"
                      : "border-border bg-card"
                  }`}
                >
                  {dark && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground shadow-sm ring-1 ring-border">
                      {t.plan_professional_badge}
                    </div>
                  )}
                  <h3 className="text-lg font-semibold tracking-tight">
                    {plan.name}
                  </h3>
                  <p
                    className={`mt-1.5 text-sm ${
                      dark ? "text-background/70" : "text-muted-foreground"
                    }`}
                  >
                    {plan.description}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight">
                      {plan.price}
                    </span>
                    {!plan.custom && (
                      <span
                        className={
                          dark ? "text-background/60" : "text-muted-foreground"
                        }
                      >
                        {t.per_month}
                      </span>
                    )}
                  </div>

                  <Squish className="mt-7 w-full">
                    <Link
                      href="/auth/login"
                      className={`block w-full rounded-xl py-3 text-center font-semibold transition-colors ${
                        dark
                          ? "bg-background text-foreground hover:bg-background/90"
                          : "bg-foreground text-background hover:bg-foreground/90"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </Squish>

                  <div className="mt-8 space-y-3">
                    {plan.features.map((feature, fi) => (
                      <div key={fi} className="flex items-start gap-3">
                        <Check
                          className={`mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 ${
                            dark ? "text-background" : "text-foreground"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            dark ? "text-background/80" : "text-muted-foreground"
                          }`}
                        >
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-foreground px-6 py-16 text-center text-background sm:px-12">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.08] [background-size:32px_32px] [background-image:linear-gradient(to_right,var(--background)_1px,transparent_1px),linear-gradient(to_bottom,var(--background)_1px,transparent_1px)]"
          />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.cta_section_title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-background/70">
              {t.cta_section_desc}
            </p>
            <Squish className="mt-8">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-xl bg-background px-7 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-background/90"
              >
                {t.cta_section_button}
                <ArrowRight className="h-[1.125rem] w-[1.125rem]" />
              </Link>
            </Squish>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
                  <QrCode className="h-[1.125rem] w-[1.125rem]" />
                </div>
                <span className="text-base font-semibold tracking-tight">
                  {t.brand}
                </span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {t.footer_tagline}
              </p>
            </div>
            {footerColumns.map((col, idx) => (
              <div key={idx}>
                <h4 className="text-sm font-semibold">{col.title}</h4>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link, li) => (
                    <li key={li}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>{t.footer_text.replace("{year}", year.toString())}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
