# Supabase Integration — Fuel & Flex

This document explains how the website uses Supabase for authentication and database operations, how to configure your project, and how to keep data secure with Row Level Security (RLS).

## What Supabase Powers in This App
- Authentication (email/password)
- Profiles (optional user profile data)
- Addresses (shipping/billing)
- Orders & order items (persisted at checkout)
- Reading the signed‑in user’s orders/history

The app is a static frontend; all requests are made from the browser using the Supabase JS client with the public anon key.

## Prerequisites
- A Supabase project (Project URL + anon public key)
- Email/password provider enabled (Auth → Providers)

## Client Initialization (config.js)
1) Load the Supabase JS library from a CDN.
2) Initialize the client with your URL and anon key, and attach it to `window.config.supabase`.
3) Ensure `config.js` loads after the CDN script and before any page scripts that use Supabase.

Example pattern:
- <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
- <script src="config.js"></script>
- <script src="script-that-uses-supabase.js"></script>

## Suggested Schema
You can tailor column names, but these are the typical tables/fields the site expects or uses.

profiles
- id (uuid, PK, references auth.users)
- full_name (text)
- phone (text)
- created_at, updated_at (timestamptz)

addresses
- id (uuid, PK)
- user_id (uuid, references auth.users)
- type (text: 'shipping' | 'billing')
- first_name, last_name, address, city, state, postal_code, phone
- is_default (boolean)
- created_at, updated_at

orders
- id (uuid/serial, PK)
- user_id (uuid, references auth.users)
- order_number (text, unique)
- status (text: pending/paid/shipped/delivered/cancelled)
- subtotal, tax_amount, shipping_amount, total_amount (numeric)
- payment_method (text), payment_status (text)
- customer_email, customer_phone (text)
- billing_address (json/text), shipping_address (json/text)
- created_at, updated_at

order_items
- id (uuid/serial, PK)
- order_id (FK to orders.id)
- product_id (int/text)
- product_name (text)
- price_each (numeric)
- quantity (int)
- image (text)
- created_at

## Row Level Security (RLS)
Enable RLS on all user‑owned tables and add policies:

profiles
- SELECT/UPDATE/INSERT: id = auth.uid()

addresses
- SELECT/INSERT/UPDATE/DELETE: user_id = auth.uid()

orders
- SELECT/INSERT/UPDATE: user_id = auth.uid()

order_items
- SELECT/INSERT restricted to rows whose `order_id` belongs to an order with user_id = auth.uid()

Principle: Every operation in the browser must be scoped to the signed‑in user.

## Auth Flows Used
- Sign up: `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
- Sign in: `supabase.auth.signInWithPassword({ email, password })`
- Session/user: `supabase.auth.getUser()`/`getSession()`
- Sign out: `supabase.auth.signOut()`

## Typical DB Operations
Get current user:
- `const { data: { user } } = await supabase.auth.getUser();`

Upsert profile:
- `await supabase.from('profiles').upsert({ id: user.id, full_name, phone });`

Manage addresses:
- Insert/update/delete with `user_id: user.id` in payload and filters

Create order:
- `const { data: order } = await supabase.from('orders').insert([{ user_id: user.id, ...totalsAndContact }]).select().single();`

Add order items:
- `await supabase.from('order_items').insert(items.map(i => ({ order_id: order.id, ...i })));`

List user orders:
- `await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });`

## Security Notes
- Never embed the service key in frontend code
- Use only the anon key on the client
- Validate RLS policies in production (test with a real user)
- Consider restricting CORS if serving via an API proxy (not required for Supabase client)

## Troubleshooting
- Supabase undefined → check CDN script and network
- Config undefined → ensure `config.js` loads after Supabase and sets `window.config.supabase`
- 401/permission denied → verify RLS policy logic and that the user is signed in
- Inserts failing → confirm columns match the schema and policies allow the insert

## Optional Enhancements
- Webhooks or Edge Functions for post‑order processing
- Email notifications after order creation
- Audit tables for updates
- Separate products table and admin UI for product management

If you share your exact column names or need SQL, I can generate precise `CREATE TABLE` and policy statements to paste into the Supabase SQL editor.


