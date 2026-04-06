# Installing shadcn/ui Components

The scaffold code imports shadcn/ui components. You need to install them before building.

## Install shadcn/ui CLI

```bash
npx shadcn-ui@latest init
# When prompted:
# - Use TypeScript: Yes
# - Which style would you like to use? › Default
# - Which color would you like as primary color? › Slate
# - Where is your global CSS file? › app/globals.css
```

## Install Required Components

```bash
# Install components used in the scaffold
npx shadcn-ui@latest add card
npx shadcn-ui@latest add button
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add loader
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add alert
```

## Verify Installation

```bash
npm run build
# Should now build successfully
```

## What This Does

- Adds `components/ui/` folder with unstyled components
- Updates `lib/utils.ts` with the `cn()` helper
- Components are fully customizable with Tailwind CSS
- No vendor lock-in (source code is in your repository)

## Next: Create More shadcn/ui Components

For future admin pages, install as needed:

```bash
npx shadcn-ui@latest add table         # For product/category lists
npx shadcn-ui@latest add dialog         # For modals
npx shadcn-ui@latest add toast          # For notifications
npx shadcn-ui@latest add checkbox       # For bulk actions
npx shadcn-ui@latest add radio-group    # For options
```

## Resources

- shadcn/ui docs: https://ui.shadcn.com
- Component examples: https://ui.shadcn.com/docs/components

## Build Errors Until Installation

Until shadcn/ui components are installed, you'll see "module not found" errors:

```
Error: Cannot find module '@/components/ui/card'
Error: Cannot find module '@/components/ui/button'
// ... etc
```

This is **expected**. Run the install commands above to fix.

After installation, your build will succeed:

```bash
npm run build
# ✓ Finished TypeScript
# ✓ Generating static pages
# ...
```
