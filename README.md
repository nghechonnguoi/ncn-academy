# NCN Academy — Full-Stack Platform

> Hệ thống định vị sự nghiệp với AI — Next.js 14 + NestJS + PostgreSQL

## Cấu Trúc Dự Án

```
ncn-academy/
├── apps/
│   ├── web/                    ← Next.js 14 (Frontend)
│   │   └── src/
│   │       ├── app/            ← App Router pages
│   │       │   ├── page.tsx            → Trang chủ
│   │       │   ├── landing/page.tsx    → Landing Page
│   │       │   ├── sales/page.tsx      → Sales Page (Pricing)
│   │       │   ├── dashboard/page.tsx  → Dashboard
│   │       │   ├── ai-tools/page.tsx   → AI Advisor Chat
│   │       │   ├── affiliate/page.tsx  → Affiliate Dashboard
│   │       │   ├── auth/login/page.tsx → Đăng nhập
│   │       │   ├── checkout/page.tsx   → Thanh toán Stripe
│   │       │   └── admin/page.tsx      → Admin Panel
│   │       └── components/
│   │           ├── layout/     ← Navbar, Footer, Sidebar
│   │           ├── home/       ← Hero, Features, Stats sections
│   │           └── dashboard/  ← Stats, Career results, Sidebar
│   └── api/                    ← NestJS (Backend)
│       ├── prisma/
│       │   └── schema.prisma   ← Database schema
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           ├── prisma/
│           └── modules/
│               ├── auth/       ← JWT + Google OAuth
│               ├── users/      ← Profile management
│               ├── assessment/ ← RIASEC scoring algorithm
│               ├── payments/   ← Stripe integration
│               ├── affiliate/  ← Commission tracking
│               └── ai/         ← GPT-4o integration
├── packages/
│   └── shared/                 ← Shared types
├── docker-compose.yml
└── .env.example
```

## Cài Đặt & Chạy

### Yêu Cầu
- Node.js >= 20
- PostgreSQL 16 (hoặc dùng Docker)
- npm >= 10

### 1. Clone & Cài Dependencies

```bash
# Frontend
cd apps/web
npm install

# Backend
cd apps/api
npm install
```

### 2. Cấu Hình Môi Trường

```bash
cp .env.example .env
# Điền đầy đủ các biến môi trường
```

### 3. Khởi Tạo Database

```bash
cd apps/api
npx prisma generate
npx prisma db push
```

### 4. Chạy Development

```bash
# Terminal 1 — API
cd apps/api && npm run dev

# Terminal 2 — Web
cd apps/web && npm run dev
```

### 5. Chạy với Docker (đơn giản hơn)

```bash
docker-compose up -d
```

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | Next.js 14 + TypeScript |
| Styling | Tailwind CSS + Shadcn UI |
| State | Zustand + TanStack Query |
| Backend | NestJS + Prisma |
| Database | PostgreSQL 16 |
| Auth | NextAuth.js v5 + JWT |
| Payment | Stripe |
| AI | OpenAI GPT-4o |
| Deploy | Vercel (web) + Railway (api) |

## Deploy Production

### Frontend → Vercel
```bash
vercel deploy --prod
```

### Backend → Railway
```bash
railway up
```

## API Documentation

Khi API đang chạy, truy cập: `http://localhost:3001/api/docs`

---

© 2026 NCN Academy · Bảo quyền bảo lưu
