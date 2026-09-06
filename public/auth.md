# TopSAAS Authentication & Security Architecture

## Public Data vs Authenticated Endpoints

- **Public Directory Data**: Read access to public products, categories, rankings, and discussions does not require API keys or authentication.
- **Submissions & Moderation**: Requires Supabase OAuth (Google / Magic Link) with Row Level Security (RLS) enforcement.
- **Admin Moderation**: Enforced by server-side claims and Supabase security roles.

For API access questions or automated agent crawling, refer to `https://topsaas.com/ai.txt`.
