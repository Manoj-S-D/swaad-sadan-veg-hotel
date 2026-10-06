# Swaad Sadan — real-time production setup

The current GitHub Pages build is a functional browser demo: customer orders and staff changes persist in localStorage on that browser. It is intentionally not presented as a production multi-device database.

## Production architecture

Use GitHub Pages for the public static frontend and Supabase for:
- PostgreSQL data
- Authentication
- Realtime order status
- Inventory
- Catering requests
- Staff roles

## Setup

1. Create a Supabase project.
2. Open SQL Editor and run supabase/schema.sql.
3. Create staff authentication users.
4. Add secure RLS policies for staff and customers.
5. Enable Realtime for orders, order_items, inventory_items, and catering_requests.
6. Create a frontend config containing the Supabase project URL and anon/publishable key only. Never expose a service-role key.
7. Replace the localStorage repository in assets/app.js and assets/admin.js with Supabase queries/subscriptions.
8. For payments, use a server-side payment provider integration; do not put payment secrets in GitHub Pages.

## Recommended production roles

- Owner: everything
- Manager: orders, inventory, catering, reports
- Cashier: orders and billing
- Kitchen: KOT and order status
- Inventory: stock and purchase orders

## Next production modules

- KOT / kitchen display
- GST-ready billing/invoice
- supplier purchase orders
- expense ledger
- staff attendance/shifts
- daily closing report
- customer loyalty
- WhatsApp notifications
- payment gateway
- analytics dashboard

## Important

Do not use the demo dashboard for real financial records until authentication, RLS, server-side validation, backups and payment handling are implemented.