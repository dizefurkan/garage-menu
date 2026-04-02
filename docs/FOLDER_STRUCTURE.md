# Multi-Tenant SaaS Menu System - Folder Structure

```
garage-menu/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx              # Login page (redirect to Supabase)
│   │   ├── accept-invite/
│   │   │   └── page.tsx              # Invite acceptance flow
│   │   └── callback/
│   │       └── route.ts              # OAuth callback handler
│   │
│   ├── (public)/
│   │   └── [slug]/
│   │       └── [lang]/
│   │           ├── page.tsx          # Public menu page (SSR)
│   │           ├── layout.tsx        # Per-tenant layout
│   │           ├── sitemap.ts        # Dynamic sitemap
│   │           └── robots.ts         # Dynamic robots.txt
│   │
│   ├── admin/
│   │   ├── layout.tsx                # Admin layout (protected)
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Admin dashboard
│   │   ├── products/
│   │   │   ├── page.tsx              # Products list
│   │   │   └── [id]/edit/page.tsx    # Product editor
│   │   ├── categories/
│   │   │   ├── page.tsx              # Categories list
│   │   │   └── [id]/edit/page.tsx    # Category editor
│   │   ├── settings/
│   │   │   └── page.tsx              # Tenant settings (theme, name, etc)
│   │   └── invites/
│   │       └── page.tsx              # Manage invites
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/route.ts     # OAuth callback
│   │   ├── admin/
│   │   │   ├── products/route.ts     # CRUD for products
│   │   │   ├── categories/route.ts   # CRUD for categories
│   │   │   ├── publish/route.ts      # Publish drafts
│   │   │   └── invites/route.ts      # Invite management
│   │   └── public/
│   │       └── menu/route.ts         # Public API for menu data
│   │
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Root (redirects to /tenant/lang)
│
├── components/
│   ├── admin/
│   │   ├── ProductEditor.tsx         # Product CRUD component
│   │   ├── CategoryEditor.tsx        # Category CRUD component
│   │   ├── LanguageTabbed.tsx        # Multi-language editor UI
│   │   ├── ThemeSelector.tsx         # Theme switcher
│   │   ├── PublishButton.tsx         # Draft → Live publisher
│   │   └── InviteForm.tsx            # Invite users form
│   │
│   ├── public/
│   │   ├── ProductCard.tsx           # Product display card
│   │   ├── CategorySection.tsx       # Category section
│   │   ├── MenuHeader.tsx            # Tenant branding header
│   │   └── LanguageSwitcher.tsx      # Language toggle
│   │
│   └── auth/
│       └── ProtectedRoute.tsx        # Auth guard component
│
├── lib/
│   ├── db/
│   │   ├── schema.ts                 # Database type definitions
│   │   ├── queries.ts                # Common database queries
│   │   └── mutations.ts              # Database mutations (server actions)
│   │
│   ├── auth/
│   │   ├── supabase.ts               # Supabase client setup
│   │   ├── server.ts                 # Server-side auth utilities
│   │   └── invite.ts                 # Invite logic
│   │
│   ├── seo/
│   │   ├── metadata.ts               # SEO metadata generator
│   │   └── structured-data.ts        # JSON-LD schema
│   │
│   ├── themes/
│   │   ├── types.ts                  # Theme type definitions
│   │   ├── themes.ts                 # Theme definitions (light, dark, custom)
│   │   └── hooks.ts                  # useTheme hook (client)
│   │
│   └── utils/
│       ├── storage.ts                # Supabase Storage utilities
│       ├── validation.ts             # Zod schemas for validation
│       └── constants.ts              # Shared constants
│
├── docs/
│   ├── FOLDER_STRUCTURE.md          # This file
│   ├── SUPABASE_SCHEMA.sql          # Database schema
│   ├── RLS_POLICIES.sql             # Row-level security
│   ├── SETUP_GUIDE.md               # Implementation guide
│   └── API_REFERENCE.md             # API endpoints reference
│
├── public/
│   ├── images/
│   └── icons/
│
├── styles/
│   └── globals.css                   # Tailwind + theme CSS variables
│
├── types/
│   └── index.ts                      # Global type definitions
│
├── .env.local.example               # Environment variables template
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

## Key Architecture Patterns

### 1. **Multi-Tenant Routing**

- Route: `/[slug]/[lang]/page.tsx`
- Each slug = one tenant/restaurant
- Language support: `en`, `tr` (easily extensible)
- SSR on public routes for SEO

### 2. **Admin Protection**

- All `/admin/*` routes require authentication
- Middleware checks: user logged in + belongs to tenant
- Server actions only execute if user has permission

### 3. **Database Isolation**

- RLS policies enforce `tenant_id` isolation
- No user can see other tenants' data
- Service role key used only server-side for admin operations

### 4. **Publish System**

- Products/categories have `is_draft` and `published_at` fields
- Draft versions hidden from public API
- Publish action creates/updates live version

### 5. **Translations**

- Separate `*_translations` tables (not JSONB columns)
- Supports unlimited languages
- Query joins on language_code

### 6. **Themeable UI**

- CSS variables for colors, fonts, spacing
- Theme data stored in `tenants.theme_config` (JSONB)
- Color picker in admin generates CSS

### 7. **Images**

- Supabase Storage bucket: `product-images`
- Public read, authenticated write
- Signed URLs generated server-side if needed
