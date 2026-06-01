# 夜道見守りアプリ プロトタイプ

Expo のスマホアプリと Next.js 管理画面で構成したプロトタイプです。

## 構成

- `mobile`: React Native / Expo / TypeScript
- `admin`: Next.js / TypeScript / Tailwind CSS / Supabase

## Supabase

`admin/supabase/schema.sql` を Supabase SQL Editor で実行してください。

`admin/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`mobile/.env`:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

実機から Next.js に接続する場合は、PC の LAN IP を指定してください。

## 起動

```bash
npm install --prefix admin
npm install --prefix mobile
npm run dev:admin
npm run dev:mobile
```

管理画面: `http://localhost:3000`

