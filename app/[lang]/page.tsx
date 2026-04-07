"use client";

import Link from "next/link";
import {
  ArrowRight,
  QrCode,
  Zap,
  Smartphone,
  Users,
  Globe,
  BarChart3,
  Clock,
  Shield,
  Settings,
  Smartphone as MobileIcon,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function LandingPage() {
  const locale = "en";
  const year = new Date().getFullYear();

  const features = [
    {
      icon: QrCode,
      title: "Beautiful Menu Display",
      description:
        "Professional digital menu with customizable colors and themes",
    },
    {
      icon: Zap,
      title: "Easy to Update",
      description: "Instantly update prices, items, and descriptions anytime",
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "Perfect experience on phones, tablets, and desktops",
    },
    {
      icon: Users,
      title: "Multi-Language",
      description:
        "Display your menu in English and Turkish (and more coming soon)",
    },
    {
      icon: Globe,
      title: "Shareable URLs",
      description: "Get unique links for each restaurant and language variant",
    },
    {
      icon: Settings,
      title: "Full Control",
      description: "Manage categories, products, pricing, and branding",
    },
  ];

  const benefits = [
    { number: "10K+", label: "Restaurants Worldwide" },
    { number: "99.9%", label: "Uptime Guarantee" },
    { number: "24/7", label: "Customer Support" },
    { number: "30s", label: "Setup Time" },
  ];

  const steps = [
    {
      number: "1",
      title: "Create Account",
      description: "Sign up with your email to get started",
    },
    {
      number: "2",
      title: "Add Your Products",
      description: "Create categories and add menu items with prices",
    },
    {
      number: "3",
      title: "Customize & Translate",
      description: "Set theme colors and customize menu in multiple languages",
    },
    {
      number: "4",
      title: "Share Your Menu",
      description: "Get your unique menu URL and share with customers",
    },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$0",
      description: "Perfect for small restaurants",
      features: [
        "Up to 50 products",
        "1 restaurant location",
        "2 languages (EN, TR)",
        "Basic customization",
        "Mobile responsive",
        "Email support",
      ],
      cta: "Start Free",
      highlighted: false,
    },
    {
      name: "Professional",
      price: "$19",
      description: "Most popular for growing restaurants",
      features: [
        "Unlimited products",
        "Up to 5 locations",
        "Multi-language support",
        "Advanced customization",
        "Custom branding",
        "Team management",
        "Priority support",
        "Monthly updates",
      ],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For restaurant chains & groups",
      features: [
        "Unlimited everything",
        "Unlimited locations",
        "Custom domain support",
        "Dedicated account manager",
        "Custom features",
        "API access",
        "24/7 phone support",
        "Training & onboarding",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DM</span>
            </div>
            <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Digital Menu
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <LanguageSwitcher currentLang={locale as "en" | "tr"} compact />
            <Link
              href="/auth/login"
              className="hidden sm:block px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/login"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6">
            <span className="text-blue-600 font-semibold text-sm">
              🎉 Now with multi-language support
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            Transform Your Restaurant
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              with Digital Menus
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Create beautiful, professional digital menus in minutes. Manage
            products, customize themes, and share with customers in multiple
            languages—no coding required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/auth/login"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-xl transition-all font-semibold flex items-center gap-2 text-lg"
            >
              Get Started Free
              <ArrowRight size={22} />
            </Link>
            <button className="px-8 py-4 border-2 border-gray-300 text-gray-900 rounded-lg hover:border-gray-400 font-semibold transition-all text-lg">
              Watch Demo
            </button>
          </div>

          <div className="grid grid-cols-3 gap-8 text-center">
            {benefits.map((benefit, idx) => (
              <div key={idx}>
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {benefit.number}
                </div>
                <p className="text-sm sm:text-base text-gray-600 mt-2">
                  {benefit.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to create and manage your professional digital
              menu
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="p-8 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center mb-4 group-hover:from-blue-100 group-hover:to-indigo-100 transition-all">
                    <Icon size={28} className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get your digital menu up and running in just 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free, upgrade when you're ready. No credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-8 transition-all ${
                  plan.highlighted
                    ? "border-2 border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl scale-105"
                    : "border border-gray-200 bg-white"
                }`}
              >
                {plan.highlighted && (
                  <div className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                <div className="mb-8">
                  <span className="text-5xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.price !== "Custom" && (
                    <span className="text-gray-600 ml-2">/month</span>
                  )}
                </div>

                <button
                  className={`w-full py-3 rounded-lg font-semibold mb-8 transition-all ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg"
                      : "border-2 border-gray-300 text-gray-900 hover:border-gray-400"
                  }`}
                >
                  {plan.cta}
                </button>

                <div className="space-y-4">
                  {plan.features.map((feature, featureIdx) => (
                    <div key={featureIdx} className="flex items-center gap-3">
                      <CheckCircle2
                        size={20}
                        className="text-green-500 flex-shrink-0"
                      />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to Launch Your Digital Menu?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Join thousands of restaurants already using Digital Menu to showcase
            their offerings professionally.
          </p>
          <Link
            href="/auth/login"
            className="inline-block px-10 py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-bold text-lg transition-all hover:shadow-xl"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DM</span>
                </div>
                <span className="font-bold text-lg">Digital Menu</span>
              </div>
              <p className="text-gray-400">
                Empowering restaurants with digital menus and contactless
                ordering.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>
              &copy; {year} Digital Menu. All rights reserved. Built with ❤️ for
              restaurants worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
