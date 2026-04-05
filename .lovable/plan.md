

# FlashFeed Lead Hunter CRM — Implementation Plan

## Overview
A full-stack CRM for FlashFeed digital agency to track and manage potential business leads. Built with React + Tailwind + Supabase (auth, database, edge functions).

## Design
- **Dark navy sidebar** with electric blue accents (#0F172A background, #3B82F6 accent)
- Sidebar navigation: Dashboard, Search, Done, Cancelled, History, Team, Settings
- Responsive: 3-column card grid on desktop, 1-column on mobile
- Toast notifications for all actions, loading skeletons, empty states

## Database (Supabase)
- **users/profiles** — name, email, role (admin/member)
- **user_roles** — role-based access (admin/member) with security definer function
- **leads** — business_name, phone, email, whatsapp, address, platform, category, has_website, website_url, followers_count, rating, score, status (new/done/cancelled), response_status, handled_by, handled_at
- **lead_updates** — lead_id, updated_by, old_status, new_status, note, updated_at
- **search_logs** — searched_by, keyword, location, platform, result_count, searched_at
- RLS policies for role-based access

## Auth
- Supabase Auth with email/password login
- Role-based access: Admin sees everything, Member sees own data
- Protected routes with auth guards

## Pages & Features

### Login (/login)
- Email + password form, branded with FlashFeed logo

### Dashboard (/dashboard)
- Stats cards: Total leads, Done, Cancelled, Conversion rate
- Charts: leads per day (bar), Done vs Cancelled (donut), conversion funnel
- Recent activity feed, top performer widget

### Search (/search)
- Search form: keyword, location, platform filter (Google Maps / Facebook / All)
- For now: manual lead entry + CSV import (scraper integration point for later)
- Results as scored lead cards (top 30), auto-filtering done/cancelled leads
- Lead scoring logic applied on display

### Lead Cards
- Business name, platform icon, phone, email, WhatsApp, address
- Website badge (red "NO WEBSITE" / grey "HAS WEBSITE")
- Follower count / rating, lead score (0-100)
- Done ✅ and Cancel ❌ buttons

### Done Section (/done)
- Table/card view of done leads with response status tracking
- Response statuses: Not Contacted Yet → Reached — No Response → Replied → Interested → Follow Up → Proposal Sent → Converted 🏆
- Notes/comments per lead, full status history
- Filters: date range, platform, team member, response status
- Search by business name, export to CSV

### Cancelled Section (/cancelled)
- Same layout as Done, admin can restore leads

### Search History (/history)
- Log of searches with keyword, location, platform, results count
- Admin sees all, member sees own

### Team Management (/team) — Admin only
- View/add/deactivate team members
- Per-member stats

### Settings (/settings)
- Profile editing, change password

## Lead Scoring (0-100)
- +30 no website, +20 has phone, +15 has email, +10 has WhatsApp
- +10 high followers (>1000), +10 local business match, +5 low Google rating (<3.5)

## Export
- CSV export from Done and Cancelled sections with all relevant fields

