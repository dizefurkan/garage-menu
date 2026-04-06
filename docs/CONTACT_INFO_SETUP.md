# Contact Information Setup Guide

This guide explains how to set up contact information storage in your restaurant menu system.

## What's New

- ✅ Admin Settings page now has a "Contact Information" section
- ✅ Users can add address, email, phone, and social media links (Facebook, Instagram, TikTok, WhatsApp)
- ✅ Contact information automatically displays in the public menu footer
- ✅ Social media links open in new tabs
- ✅ WhatsApp link opens WhatsApp Web with pre-filled number

## Database Setup (Required)

Before using the contact information feature, you need to add the `contact_info` column to your `tenants` table:

### Step 1: Open Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**

### Step 2: Run Migration

Click "New Query" and paste this SQL command:

```sql
-- Migration: Add contact_info field to tenants table
ALTER TABLE public.tenants
ADD COLUMN contact_info JSONB DEFAULT '{"address": "", "facebook": "", "instagram": "", "tiktok": "", "email": "", "whatsapp": ""}';
```

Then click **Run**.

### Step 3: Verify

After running, you should see the `contact_info` column in the `tenants` table.

## How to Use

### For Restaurant Owners

1. Go to http://localhost:3000/admin/settings (or your production URL)
2. Scroll to "Contact Information" section
3. Fill in your restaurant details:
   - **Address**: Your physical location
   - **Email**: Contact email address
   - **WhatsApp**: WhatsApp number (with country code, e.g., +90 555 123 4567)
   - **Facebook**: Facebook page URL (e.g., https://facebook.com/yourpage)
   - **Instagram**: Instagram username (with or without @)
   - **TikTok**: TikTok username (with or without @)
4. Click "Save Contact Information"

### On Public Menu

The footer will automatically display:

- Address with location icon
- Email with mail icon (clickable mailto link)
- WhatsApp number with phone icon (opens WhatsApp Web)
- Social media icons with links to profiles

## Field Details

| Field     | Format          | Example                             |
| --------- | --------------- | ----------------------------------- |
| Address   | Plain text      | "123 Main Street, Istanbul, Turkey" |
| Email     | Email address   | "contact@restaurant.com"            |
| WhatsApp  | Phone number    | "+90 555 123 4567"                  |
| Facebook  | Full URL        | "https://facebook.com/yourpage"     |
| Instagram | Username with @ | "@yourusername" or "yourusername"   |
| TikTok    | Username with @ | "@yourusername" or "yourusername"   |

## Conditional Display

The footer only shows if:

- At least one contact field is filled
- The public menu has the contact_info data from database

Empty fields are automatically hidden, so you only need to fill in the ones you want to display.

## Technical Details

- Contact info is stored as JSONB in the database
- All fields are optional
- Changes are saved immediately
- Works on both mobile and desktop
- Responsive design adapts to screen size
- Social media links open in new tabs
