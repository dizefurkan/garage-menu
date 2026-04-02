# Roadmap - Multi-Tenant SaaS Menu System

## Phase 1: Foundation (Next.js + Supabase Setup) ✅

- [x] Multi-tenant database schema (tenants, users, products, categories, translations)
- [x] Supabase Row-Level Security (RLS) policies
- [x] Database type definitions (TypeScript)
- [x] Auth utilities (server-side helpers)
- [x] Invite system (token-based)
- [x] SEO metadata generation
- [x] Theme system (with presets)
- [x] Folder structure scaffolds
- [x] Setup guide documentation

## Phase 2: Core Features (Current - Week 1-2)

- [ ] **Authentication**
  - [ ] Login page with Supabase
  - [ ] Sign up page
  - [ ] Invite acceptance flow
  - [ ] Session management
  - [ ] Logout functionality

- [ ] **Public Menu Pages**
  - [ ] Dynamic routes: `/[slug]/[lang]/page.tsx`
  - [ ] SSR for SEO
  - [ ] Language switcher
  - [ ] Product grid/cards
  - [ ] Category navigation
  - [ ] Responsive design

- [ ] **Admin Dashboard**
  - [ ] Protected routes (auth guard)
  - [ ] Dashboard overview
  - [ ] Navigation sidebar
  - [ ] User session management

- [ ] **Product Management**
  - [ ] Product list view (Table component)
  - [ ] Create product page
  - [ ] Edit product page
  - [ ] Delete product
  - [ ] Multi-language editor (tabs)
  - [ ] Image upload to Supabase Storage
  - [ ] Draft/publish toggle

- [ ] **Category Management**
  - [ ] Category CRUD
  - [ ] Display order management
  - [ ] Multi-language names

- [ ] **Image Uploads**
  - [ ] Supabase Storage integration
  - [ ] Upload API endpoint
  - [ ] Image preview
  - [ ] Delete old images

## Phase 3: Admin Features (Week 2-3)

- [ ] **Theme Management**
  - [ ] Theme selector UI (shadcn presets)
  - [ ] Color picker for custom themes
  - [ ] Font selector
  - [ ] Live preview of changes
  - [ ] Theme persistence in database

- [ ] **Team Management**
  - [ ] View team members
  - [ ] Edit member roles
  - [ ] Remove members
  - [ ] Invite new team members
  - [ ] Invite acceptance flow
  - [ ] Pending invites view

- [ ] **Publish System**
  - [ ] Draft product editor
  - [ ] Publish button (draft → live)
  - [ ] View draft/published status
  - [ ] Scheduled publishing (optional)
  - [ ] Publish history

- [ ] **Settings Page**
  - [ ] Tenant branding (name, email, phone)
  - [ ] Logo upload
  - [ ] Default language selection
  - [ ] Supported languages toggle
  - [ ] API key management (future)

## Phase 4: Analytics & SEO (Week 3-4)

- [ ] **SEO Optimization**
  - [ ] Dynamic sitemap generation
  - [ ] robots.txt configuration
  - [ ] hreflang tags for multi-language
  - [ ] OpenGraph metadata
  - [ ] Structured data (JSON-LD)
  - [ ] Meta tags optimization
  - [ ] Canonical URLs

- [ ] **Analytics (Optional)**
  - [ ] View counts
  - [ ] Popular products
  - [ ] Last updated timestamps
  - [ ] User activity logs

## Phase 5: Advanced Features (Week 4+)

- [ ] **Content Management**
  - [ ] Rich text editor for descriptions (TipTap/Editor.js)
  - [ ] Bulk import/export (CSV)
  - [ ] Product templates

- [ ] **Customization**
  - [ ] Custom domain support (per tenant)
  - [ ] Custom CSS injection
  - [ ] Multiple menu layouts

- [ ] **Integrations**
  - [ ] QR code generation
  - [ ] Print-friendly menu PDF
  - [ ] Social media integrations
  - [ ] Analytics integrations (GA4, Hotjar)

- [ ] **Mobile App (Future)**
  - [ ] React Native mobile client
  - [ ] QR scanner checkout

---

## Tech Stack Summary

| Category          | Technology            | Purpose                      |
| ----------------- | --------------------- | ---------------------------- |
| **Frontend**      | Next.js 14 App Router | SSR, server actions, routing |
| **UI Components** | shadcn/ui             | Admin dashboard components   |
| **Styling**       | Tailwind CSS          | Utility-first styling        |
| **Database**      | Supabase PostgreSQL   | Multi-tenant data storage    |
| **Auth**          | Supabase Auth         | User authentication & JWT    |
| **File Storage**  | Supabase Storage      | Product images, files        |
| **Form Handling** | react-hook-form + zod | Validated forms              |
| **Type Safety**   | TypeScript            | Complete type coverage       |
| **Deployment**    | Vercel                | Hosting + edge functions     |

---

## Architecture Decision Records (ADR)

### ADR-1: Separate Translation Tables

**Decision**: Use normalized `*_translations` tables instead of JSONB columns  
**Rationale**:

- Supports unlimited languages without schema changes
- Works perfectly with RLS policies
- Easier to query specific languages
- Better for content management workflows

### ADR-2: Multi-Tenant at URL Level

**Decision**: Routes like `/[slug]/[lang]` instead of subdomain  
**Rationale**:

- Simpler to set up (no wildcard DNS)
- Better for SEO
- Works great on subdomains (Vercel)
- Each tenant gets their own sitemap

### ADR-3: Server Actions for Mutations

**Decision**: Use Next.js server actions instead of REST/GraphQL APIs  
**Rationale**:

- TypeScript-first (no API contract issues)
- Automatic CSRF protection
- Direct RLS policy enforcement
- Simpler development experience

### ADR-4: shadcn/ui Components Only

**Decision**: Build admin UI exclusively with shadcn/ui  
**Rationale**:

- Unstyled, composable components
- 100% customizable with Tailwind
- No vendor lock-in
- Perfect for SaaS products

---

## Known Limitations & Future Improvements

### Current Limitations

- [ ] No real-time updates (would add Supabase realtime)
- [ ] No offline support
- [ ] No batch operations UI
- [ ] No permissions audit log
- [ ] No product variants (sizes, options)

### Performance Optimizations (TODO)

- [ ] Add caching layer (Redis) for frequently accessed menus
- [ ] Implement ISR (Incremental Static Regeneration)
- [ ] Optimize image loading (WebP conversion)
- [ ] Lazy load translation data
- [ ] Database query optimization with indexes

### Security Enhancements (TODO)

- [ ] Rate limiting on auth endpoints
- [ ] API key management & rate limiting
- [ ] Audit logs for all admin actions
- [ ] Two-factor authentication
- [ ] Session timeout policies
- [ ] IP whitelist for admin (optional)

---

## Deployment Checklist

- [ ] Create Supabase project
- [ ] Import and run database schema
- [ ] Enable RLS policies
- [ ] Create storage bucket
- [ ] Configure OAuth providers
- [ ] Create `.env.local` with secrets
- [ ] Deploy to Vercel
- [ ] Set up custom domain (optional)
- [ ] Test invite flow end-to-end
- [ ] Test public menu pages
- [ ] Test admin dashboard
- [ ] Set up email service for invites
- [ ] Configure backup strategy
- [ ] Set up monitoring & error tracking

---

## Contributing

When adding new features:

1. Create feature branch: `feature/your-feature-name`
2. Follow TypeScript strict mode
3. Add JSDoc comments for public functions
4. Use shadcn/ui components for UI
5. Write server actions in `lib/db/queries.ts`
6. Test locally before pushing
7. Create pull request with description

---

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com
- **TypeScript**: https://www.typescriptlang.org
