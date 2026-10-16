# Sahifa — MVP

Instagram/Telegram do'konlari uchun onlayn do'kon konstruktori. Sotuvchi Telegram orqali kiradi, do'kon va mahsulotlarni kiritadi va `sahifa.uz/<slug>` sahifasini oladi. Buyurtmalar sotuvchining Telegramiga keladi.

**Stek:** Next.js 16 (App Router, server actions) · Supabase (Postgres + Storage) · Telegram Login Widget + Bot API · Anthropic SDK · Vitest · Vercel.

```
app/
  page.tsx                 landing + Telegram Login
  [slug]/                  do'kon, /p/<id>, /checkout, /order/<public_id>
  dashboard/               sotuvchi paneli (actions.ts: barcha yozish amallari)
  admin/                   obunalarni boshqarish
  api/auth/telegram        Login Widget callback
  api/telegram/webhook     inline tugmalar (callback_query)
  api/cron/reminders       obuna eslatmalari (Vercel Cron)
lib/                       sof mantiq: order, telegram, validate, import, session, ai
supabase/migrations/       SQL migratsiyalar
tests/                     Vitest
```

## Lokal ishga tushirish

```bash
npm install
cp .env.example .env.local   # qiymatlarni to'ldiring
npm run dev
npm test
```

Telegram Login Widget faqat BotFather'da ko'rsatilgan domenda ishlaydi. Lokal sinov uchun `ngrok http 3000` kabi tunnel oching va uning domenini `/setdomain` orqali bering (`NEXT_PUBLIC_SITE_URL` ham shu domen bo'lsin).

## 1. Supabase

1. [supabase.com](https://supabase.com) → **New project**. Region: Frankfurt (eu-central-1) O'zbekistonga eng yaqini.
2. **Project Settings → API** sahifasidan:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` kaliti → `SUPABASE_SERVICE_ROLE_KEY`. Bu kalit **faqat serverda** ishlatiladi, brauzerga hech qachon chiqmasin.
3. Migratsiyani ishga tushiring. Ikki usuldan birini tanlang:
   - **SQL Editor:** `supabase/migrations/0001_init.sql` faylini to'liq nusxalab, **Run** bosing.
   - **CLI:**
     ```bash
     npx supabase login
     npx supabase link --project-ref <project-ref>
     npx supabase db push
     ```
4. Natijani tekshiring: **Table Editor**'da 6 ta jadval (RLS yoqilgan), **Storage**'da ommaviy `images` bucket bo'lishi kerak.

Barcha yozish amallari server orqali `service_role` bilan bajariladi. RLS faqat faol do'konlar va ularning mahsulotlarini ommaviy o'qishga ochadi. Buyurtmalar, sotuvchilar va statistika ommaviy kalit bilan o'qilmaydi.

## 2. Telegram bot

1. [@BotFather](https://t.me/BotFather) → `/newbot` → nom va username bering.
   - Token → `BOT_TOKEN`
   - Username (`@` belgisiz) → `BOT_USERNAME`
2. Login Widget domeni: `/setdomain` → botni tanlang → `sahifa.uz` (ya'ni `NEXT_PUBLIC_SITE_URL` domeni, `https://` belgisiz).
3. `TELEGRAM_WEBHOOK_SECRET` uchun tasodifiy qiymat yarating: `openssl rand -hex 32`.
4. O'zingizning Telegram ID'ingizni [@userinfobot](https://t.me/userinfobot) orqali bilib oling va `ADMIN_TELEGRAM_IDS` ga yozing (bir nechta bo'lsa vergul bilan).

Kirish paytida widget `request_access=write` so'raydi. Sotuvchi ruxsat bergach, bot unga buyurtmalarni yubora oladi.

## 3. Vercel'ga deploy

1. Kodni GitHub'ga yuklang → [vercel.com](https://vercel.com) → **Add New → Project** → repozitoriyni tanlang.
2. **Environment Variables** bo'limiga `.env.example`dagi barcha o'zgaruvchilarni kiriting:
   - `NEXT_PUBLIC_SITE_URL`: `https://sahifa.uz` (oxirida `/` yo'q)
   - `ANTHROPIC_MODEL`: bo'sh qoldirilsa `claude-haiku-5-5` ishlatiladi
   - `CRON_SECRET`: tasodifiy qiymat. Vercel cron so'rovlariga `Authorization: Bearer <CRON_SECRET>` sarlavhasini o'zi qo'shadi.
3. **Deploy** bosing. Keyin **Settings → Domains** orqali `sahifa.uz` domenini ulang.
4. Cron `vercel.json`da sozlangan: har kuni 04:00 UTC (Toshkent vaqti bilan 09:00).

## 4. Webhook'ni o'rnatish

Deploy tugagach, bir marta ishga tushiring:

```bash
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -H "content-type: application/json" \
  -d '{
    "url": "https://sahifa.uz/api/telegram/webhook",
    "secret_token": "'"$TELEGRAM_WEBHOOK_SECRET"'",
    "allowed_updates": ["callback_query"]
  }'

# tekshirish
curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
```

Webhook har bir so'rovdagi `X-Telegram-Bot-Api-Secret-Token` sarlavhasini tekshiradi. Sarlavha mos kelmasa, 403 qaytaradi.

## Obuna mantig'i

| Holat | `plan` | `paid_until` | Do'kon sahifasi |
|---|---|---|---|
| Sinov (ro'yxatdan o'tgach 14 kun) | `pro` | +14 kun | ochiq, cheklovsiz |
| Pullik | `pro` | kelajakda | ochiq, cheklovsiz |
| Muddati tugagan | `pro` | o'tmishda | "Do'kon vaqtincha yopiq" (panel ishlayveradi) |
| Bepul | `free` | — | ochiq, 10 ta mahsulot, "Sahifa'da yaratilgan" yozuvi |

Admin panelda **"+ kun"** obunani `max(bugun, paid_until) + N kun`ga uzaytiradi. **"O'chirish"** do'konni bepul tarifga o'tkazadi.

## Testlar

```bash
npm test        # 27 ta test
npm run typecheck
```

Testlar quyidagilarni qamraydi: buyurtma summasini serverda hisoblash (brauzer o'zgartirgan narx bilan ham), Telegram Login hash'ini tekshirish (to'g'ri, soxta, eskirgan), sessiya cookie'si, slug va zaxiralangan so'zlar, telefon, ijtimoiy tarmoq havolalari, CSV/XLSX import va sotuvchilar orasidagi egalik tekshiruvi.

## Deploy'dan keyin qo'lda tekshiruv (10 qadam)

1. **Landing.** `https://sahifa.uz` ochiladi. "Bepul boshlash" tugmasi bosilganda Telegram Login tugmasi ko'rinadi.
2. **Ro'yxatdan o'tish.** Telegram orqali kiring, botga xabar yuborish ruxsatini bering. Sizni `/dashboard/shop` sahifasiga olib o'tishi kerak.
3. **Do'kon yaratish.** Nom kiriting, slug avtomatik taklif qilinadi. `admin` deb yozib ko'ring: "band qilingan" xatosi chiqishi kerak. Logo yuklang (5 MB dan katta rasm rad etiladi), telefon, Instagram, yetkazib berish va to'lov ma'lumotlarini kiriting. **Panel**da "Pro · 14 kun qoldi" yozuvi ko'rinadi.
4. **Mahsulot qo'shish.** Nom, narx, kategoriya, `S, M, L` variantlari va 2 ta rasm kiriting. "AI bilan yozish" tugmasini bosing: o'zbek va rus tilidagi tavsif maydonga tushishi kerak, uni tahrirlang va saqlang.
5. **CSV import.** `nomi,narxi` sarlavhali, bitta qatorida narx `abc` bo'lgan fayl yuklang. Xato qator ko'rsatilishi va hech narsa qo'shilmasligi kerak. Faylni tuzatib qayta yuklang, mahsulotlar qo'shiladi.
6. **Ommaviy sahifa.** Inkognito oynada `sahifa.uz/<slug>` ni oching: logo, kategoriyalar, mahsulotlar va aloqa ma'lumotlari ko'rinadi. UZ/RU almashtirgichi interfeys matnlarini o'zgartiradi, mahsulot matnlari esa o'zgarmaydi. Havolani Telegram'da yuboring: preview'da nom, tavsif va logo chiqishi kerak.
7. **Mijoz sifatida buyurtma.** Mahsulotga kiring, `M` variantini tanlab, 2 dona savatga qo'shing. Checkout'da `901234567` (+998'siz) raqamni kiriting: xato chiqadi. `+998 90 123 45 67` bilan buyurtma bering, "Buyurtmangiz qabul qilindi" sahifasi va "Yangi" holati ko'rinadi.
8. **Telegram xabari.** Botdan buyurtma tarkibi, jami summa va mijoz ma'lumotlari bilan xabar keladi, ostida "✅ Tasdiqlash" va "❌ Bekor qilish" tugmalari bor.
9. **Telegramda tasdiqlash.** "✅ Tasdiqlash" ni bosing: "Holat: Tasdiqlangan" bildirishnomasi chiqadi. Mijozning buyurtma sahifasini yangilang, holat "Tasdiqlangan" bo'lishi kerak. Tugmani qayta bossangiz "Holat allaqachon…" deb javob beradi. Panelda "Yetkazildi" tugmasini bosing.
10. **Statistika, rate limit, admin.** Panelda ko'rishlar va buyurtmalar soni oshgan bo'lishi kerak. Bitta IP'dan 10 daqiqa ichida 6-buyurtmani bersangiz rad etiladi. `/admin` sahifasida do'konga +30 kun qo'shing va sana o'zgarganini tekshiring. Supabase'da `paid_until`ni o'tgan sanaga o'zgartiring: do'kon sahifasi "Do'kon vaqtincha yopiq" ko'rsatadi, panel esa ishlayveradi.

## MVP'ga kirmaydi

Click/Payme onlayn to'lov, shaxsiy domen, mavzular, Instagram'dan import, mijoz akkauntlari, bir nechta xodim, mobil ilova.
