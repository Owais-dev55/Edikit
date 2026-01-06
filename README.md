# Edikit — Motion Graphics Web App

Edikit is a production-ready MVP that allows users to generate motion-graphics videos automatically using After Effects templates.

This project is built as a **fully working foundation**, designed to be usable by real users today and easily scalable into a full SaaS product in the future.

---

## What Edikit Does

Edikit lets users:

- Browse motion graphics video templates
- Create an account and log in
- Purchase a subscription / credits
- Customize templates (text, logo, colors)
- Generate video previews automatically
- Watch and download rendered videos

The entire flow works end to end without manual intervention.

---

## Who This Is For

- Creators who want quick, reusable motion graphics
- Teams who need automated video generation
- Developers looking for a solid reference implementation of AE + Nexrender

---

## Tech Stack

### Frontend

- **Next.js (App Router)**
- Tailwind CSS
- Dark-mode focused UI
- Hosted on **Vercel**

### Backend

- **NestJS**
- REST APIs
- JWT-based authentication
- Stripe integration (subscriptions + webhooks)
- Hosted on **Render**

### Video Rendering

- **Adobe After Effects** (.aep templates)
- **Nexrender Cloud** for automated cloud-based rendering
- Templates automatically registered and uploaded on first use
- Rendered videos downloaded from Nexrender and uploaded to Cloudinary

---

## How the App Works (High-Level)

1. Users can freely explore the website
2. When clicking **Customize**, they are asked to log in
3. Logged-in users customize a template (text, images, colors)
4. Images are uploaded to Cloudinary immediately
5. User clicks "Render Video"
6. Backend ensures template is registered with Nexrender Cloud (if not already)
7. Backend submits render job to Nexrender Cloud with customizations
8. Frontend polls job status every 3 seconds
9. Nexrender Cloud renders video using After Effects
10. On completion, Nexrender calls webhook
11. Backend downloads video from Nexrender and uploads to Cloudinary
12. User sees completed video and can download it

This approach avoids asking users to log in _after_ filling long customization forms, resulting in a smoother experience.

### Nexrender Cloud Integration Flow

**Template Setup (Automatic, on first use):**

- Template .aep files stored in `server/assets/animations/`
- On first render request, backend:
  1. Registers template with Nexrender Cloud API
  2. Uploads .aep file to presigned URL
  3. Waits for Nexrender to process and extract compositions
  4. Stores nexrenderId and composition names in database

**Render Job Flow:**

- User customizations mapped to Nexrender asset format
- Job submitted to Nexrender Cloud with webhook URL
- Status tracked via polling + webhook callbacks
- Completed videos automatically downloaded and stored in Cloudinary

---

## Payments & Credits

- Stripe handles subscriptions and billing
- Each subscription grants a set number of credits
- Each render consumes credits
- Stripe webhooks keep user access and credits in sync

---

## After Effects Templates

- Single AE project containing multiple compositions
- Each composition represents one template
- Templates support:

  - Dynamic text replacement
  - Logo/image replacement
  - Color customization

Nexrender injects values by targeting AE layer names during rendering.

---

<!-- ## Project Status

✅ Frontend complete and usable
✅ Authentication implemented
✅ Payments and webhooks live
🔄 Nexrender integration in progress -->

The application is already structured for real users and real data.

---

## Local Development

### Prerequisites

1. **Nexrender Cloud Account**

   - Sign up at [Nexrender Cloud](https://app.nexrender.com)
   - Get your API key from dashboard
   - Add to `.env`: `NEXRENDER_CLOUD_API_KEY=your_key_here`

2. **Cloudinary Account**

   - Sign up at [Cloudinary](https://cloudinary.com)
   - Add credentials to `.env`:
     ```
     CLOUDINARY_CLOUD_NAME=your_cloud_name
     CLOUDINARY_API_KEY=your_api_key
     CLOUDINARY_API_SECRET=your_api_secret
     ```

3. **After Effects Templates**
   - Place .aep files in `server/assets/animations/`
   - Name them: `Animation 1.aep`, `Animation 2.aep`, etc.
   - Templates should have editable layers with predictable names

### Environment Variables

**Backend (`server/.env`):**

```env
# Database
DATABASE_URL=postgresql://...

# Nexrender Cloud
NEXRENDER_CLOUD_API_KEY=your_nexrender_api_key

# Backend URL (for webhooks)
BACKEND_URL=http://localhost:3001
# OR for development with ngrok:
NGROK_URL=https://your-ngrok-url.ngrok.io

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# JWT
JWT_SECRET=your_jwt_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Frontend (`client/.env.local`):**

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### Running Locally

**Backend:**

```bash
cd server
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

**Frontend:**

```bash
cd client
npm install
npm run dev
```

### Webhook Setup (Development)

For local development, you need to expose your backend to the internet for Nexrender webhooks:

1. Install ngrok: `npm install -g ngrok`
2. Run: `ngrok http 3001`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Add to `.env`: `NGROK_URL=https://abc123.ngrok.io`

In production, set `BACKEND_URL` to your deployed backend URL.

---

## Notes

This repository represents a **ready-to-use MVP**, not a prototype. The architecture is clean, modular, and intentionally built to support:

- More templates
- Higher traffic
- Cloud-based rendering
- Expanded billing models

If you’re reviewing this project in the future, this repo is a solid starting point for a real-world motion graphics SaaS.
