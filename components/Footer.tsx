"use client";

import { Mail, Phone, MapPin } from "lucide-react";

// Social Media SVG Icons
const FacebookIcon = () => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 512 512"
    className="h-6 w-6"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path>
  </svg>
);

const InstagramIcon = () => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 448 512"
    className="h-6 w-6"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
  </svg>
);

const TikTokIcon = () => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 448 512"
    className="h-6 w-6"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"></path>
  </svg>
);

interface ContactInfo {
  address?: string;
  phone?: string;
  email?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  whatsapp?: string;
}

interface FooterProps {
  contactInfo?: ContactInfo;
  restaurantName: string;
  primaryColor: string;
}

export function Footer({
  contactInfo,
  restaurantName,
  primaryColor,
}: FooterProps) {
  if (
    !contactInfo ||
    (!contactInfo.address &&
      !contactInfo.phone &&
      !contactInfo.email &&
      !contactInfo.facebook &&
      !contactInfo.instagram &&
      !contactInfo.tiktok &&
      !contactInfo.whatsapp)
  ) {
    return null;
  }

  const hasAnyInfo = Object.values(contactInfo).some((value) => value);

  if (!hasAnyInfo) {
    return null;
  }

  return (
    <footer className="border-t border-slate-200 bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 mt-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Contact Info */}
          <div className="space-y-4">
            <h3
              className="text-lg font-bold tracking-tight"
              style={{ color: primaryColor }}
            >
              Get in Touch
            </h3>

            {contactInfo.address && (
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-slate-400" />
                <p className="text-slate-600">{contactInfo.address}</p>
              </div>
            )}

            {contactInfo.phone && (
              <div className="flex gap-3">
                <Phone className="h-5 w-5 shrink-0 text-slate-400" />
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="text-slate-600 hover:underline"
                >
                  {contactInfo.phone}
                </a>
              </div>
            )}

            {contactInfo.email && (
              <div className="flex gap-3">
                <Mail className="h-5 w-5 shrink-0 text-slate-400" />
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="text-slate-600 hover:underline"
                >
                  {contactInfo.email}
                </a>
              </div>
            )}

            {contactInfo.whatsapp && (
              <div className="flex gap-3">
                <Phone className="h-5 w-5 shrink-0 text-slate-400" />
                <a
                  href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:underline"
                >
                  {contactInfo.whatsapp}
                </a>
              </div>
            )}
          </div>

          {/* Social Media */}
          {(contactInfo.facebook ||
            contactInfo.instagram ||
            contactInfo.tiktok) && (
            <div className="space-y-4">
              <h3
                className="text-lg font-bold tracking-tight"
                style={{ color: primaryColor }}
              >
                Follow Us
              </h3>

              <div className="flex gap-4">
                {contactInfo.facebook && (
                  <a
                    href={contactInfo.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-blue-600 transition-colors"
                    title="Facebook"
                  >
                    <FacebookIcon />
                  </a>
                )}

                {contactInfo.instagram && (
                  <a
                    href={`https://instagram.com/${contactInfo.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-pink-600 transition-colors"
                    title="Instagram"
                  >
                    <InstagramIcon />
                  </a>
                )}

                {contactInfo.tiktok && (
                  <a
                    href={`https://tiktok.com/${contactInfo.tiktok.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-black transition-colors"
                    title="TikTok"
                  >
                    <TikTokIcon />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom */}
        <div className="mt-8 border-t border-slate-200 pt-8 text-center">
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} {restaurantName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
