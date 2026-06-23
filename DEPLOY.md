# Global Launch Guide (Self-Hosted Supabase)

Yo project Lovable Cloud bata bahek aafno Supabase instance ma launch garna ko lagi step-by-step guide ho.

---

## 1. Supabase Project Setup

- [Supabase Dashboard](https://supabase.com) ma gayera **New Project** create gara.
- Region: aafno users ko najik ko region chijnuhos (e.g. Asia users lai Singapore / Mumbai).
- Database password save garna nabirsinu.
- Project banaisake pachi **Settings → API** bata yo 3 kura copy garnu:
  - `Project URL`
  - `anon public` key
  - `service_role` key (yeslai secret jasto rakhnus)

---

## 2. Run Migrations (Database Schema)

1. Supabase SQL Editor khola.
2. `supabase/migrations/` folder bhitra bhayeka sabai `.sql` files lai **filename order** ma run gara.
   - Sabai tables, RLS policies, functions, triggers ra seed data (categories/products) yesle banaucha.
3. Kunai error aayo bhane tyahi rokera fix garnus — baki migration run nagarnus.

---

## 3. Auth Configuration

**Authentication → Providers** ma gayera:

### Email/Password
- [ ] **Email** provider ON gara.
- [ ] **Confirm email** ON rakhnuhos (auto-confirm na garnus unless explicitly required).
- [ ] **HIBP Leaked Password Protection** ON gara.

### Google OAuth
- [ ] Google Cloud Console ma OAuth 2.0 credentials banaune.
- [ ] Client ID ra Client Secret Supabase ko Google provider ma halaune.
- [ ] **Site URL**: `https://yourdomain.com`
- [ ] **Redirect URLs** ma add garne:
  ```
  https://yourdomain.com/**
  http://localhost:3000/**
  ```

---

## 4. Auth Trigger Verify

Migration le `handle_new_user()` trigger already create garcha. Verify garna SQL Editor ma:

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Yesle `auth.users` ma trigger exist gareko confirm garcha. Nabhaye signup pachi profile/user_role create hudaina.

---

## 5. Admin Bootstrap

1. App ma gayera aafno admin email le **sign up** gara.
2. SQL Editor ma gayera yesle admin banaune:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'timro-admin-email@gmail.com'
ON CONFLICT DO NOTHING;
```

`timro-admin-email@gmail.com` lai aafno actual admin email le replace garnus.

---

## 6. Storage Buckets (Optional)

Yo project le `products` ra `avatars` storage buckets use gardaina (code ma storage calls chaina). Tara future ma image upload thapne ho bhane:

- [ ] `products` bucket banaune
- [ ] `avatars` bucket banaune
- [ ] Authenticated users lai upload permission dene

---

## 7. Environment Variables

Deploy garnu parne hosting platform (Vercel/Netlify/Cloudflare/etc.) ma yo variables set gara:

```env
# Client-visible (browser ma use hune)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=yo-anon-key-ho
VITE_SUPABASE_PROJECT_ID=yo-project-id-ho

# Server-only
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=yo-anon-key-ho
SUPABASE_SERVICE_ROLE_KEY=yo-service-role-key-ho
```

**Important**: `SUPABASE_SERVICE_ROLE_KEY` kunai pani browser code ma rakhnu hundaina.

---

## 8. Build & Deploy

### Cloudflare Pages/Workers (recommended for global)
```bash
bun install
bun run build
# dist/ output deploy garnu
```

### Vercel
```bash
bun install
bun run build
# Node 20+ select garnu
```

### Netlify
```bash
bun install
bun run build
# Publish directory: dist
```

---

## 9. Custom Domain

1. Hosting platform ma custom domain jodnuhos.
2. Supabase Auth → URL Configuration ma **Site URL** ra **Redirect URLs** update garnuhos:
   - `https://yourdomain.com`
   - `https://yourdomain.com/**`

---

## 10. Post-Launch Test Checklist

- [ ] Sign up garna sakincha
- [ ] Login/logout kaam garcha
- [ ] Products page load huncha (anon user le pani)
- [ ] Cart ma product thapna ra checkout garna sakincha
- [ ] Admin dashboard ma orders/products/users dekhincha
- [ ] Profile update huncha
- [ ] Google login kaam garcha

---

## Security Notes

- `public.has_role()` function lai authenticated users le execute garna milcha kina ki RLS policies le use garchan. Yo intentional ho.
- Admin actions sabai `user_roles` table bata control hunchan.
- Passwords, API keys, service role key kahile pani client code ma rakhnos.

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| `permission denied for table` | Migration ma GRANT statements missing cha ki check garnus |
| `Unauthorized` on protected routes | `src/start.ts` ma `attachSupabaseAuth` add cha ki check garnus |
| Realtime chat/notifications kaam gardaina | `messages` ra `notifications` table lai `supabase_realtime` publication ma add bhayo ki check garnus |
| Signup pachi profile create hudaina | `handle_new_user()` trigger exist garcha ki check garnus |
