# Swaad Sadan Veg Hotel

Premium customer website + hotel operations dashboard.

## Live
https://manoj-s-d.github.io/swaad-sadan-veg-hotel/

## Included
- Customer-facing responsive website
- Online cart and test orders
- Catering enquiry form
- Staff operations dashboard
- Order lifecycle: NEW -> ACCEPTED -> PREPARING -> READY -> COMPLETED
- Inventory alerts
- Catering lead list
- GitHub Pages deployment workflow
- Supabase production schema and migration plan

## Demo vs production
The current dashboard uses browser localStorage so it can be tested immediately on GitHub Pages. It is not a secure multi-device production backend.

For production real-time operations, follow docs/REALTIME_SETUP.md and connect Supabase with proper authentication and RLS policies.