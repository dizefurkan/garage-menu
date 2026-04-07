'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function LandingPage() {
  const t = useTranslations();
  const locale = useLocale() as 'en' | 'tr';
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-900">
            Digital Menu
          </div>
          <div className="flex gap-4 items-center">
            <LanguageSwitcher currentLang={locale} compact />
            <Link
              href="/auth/login"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              {t('auth.login')}
            </Link>
            <Link
              href="/auth/login"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              {t('auth.signup')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            {t('landing.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('landing.subtitle')}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/login"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              {t('landing.cta_primary')}
              <ArrowRight size={20} />
            </Link>
            <button className="px-8 py-4 border-2 border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-medium">
              {t('landing.cta_secondary')}
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('landing.features_title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('landing.features_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Check className="text-blue-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {t(`landing.feature_${i}_title`)}
                </h3>
                <p className="text-gray-600">
                  {t(`landing.feature_${i}_desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('landing.pricing_title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('landing.pricing_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['starter', 'professional', 'enterprise'].map((plan) => (
              <div key={plan} className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {t(`landing.pricing_${plan}`)}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t(`landing.pricing_${plan}_desc`)}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan === 'starter' ? '₺99' : plan === 'professional' ? '₺299' : 'Custom'}
                  </span>
                  <span className="text-gray-600 ml-2">
                    {t('landing.pricing_per_month')}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check size={20} className="text-green-600" />
                    {plan === 'starter' ? '5' : plan === 'professional' ? '50' : '∞'} {t('landing.pricing_menus')}
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check size={20} className="text-green-600" />
                    3+ {t('landing.pricing_languages')}
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check size={20} className="text-green-600" />
                    {t('landing.pricing_support')}
                  </li>
                </ul>
                <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  {t('landing.pricing_cta')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">
              {t('landing.faq_title')}
            </h2>
          </div>

          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-2">
                  {t(`landing.faq_q${i}`)}
                </h3>
                <p className="text-gray-600">
                  {t(`landing.faq_a${i}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-gray-400">
              {t('landing.footer_copyright', { year })}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
