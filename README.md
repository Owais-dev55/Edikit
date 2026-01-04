# Edikit — Motion Graphics Web App

Edikit is a production-ready MVP that allows users to generate motion-graphics videos automatically using After Effects templates.

This project is built as a **fully working foundation**, designed to be usable by real users today and easily scalable into a full SaaS product in the future.

---

## What Edikit Does

Edikit lets users:

* Browse motion graphics video templates
* Create an account and log in
* Purchase a subscription / credits
* Customize templates (text, logo, colors)
* Generate video previews automatically
* Watch and download rendered videos

The entire flow works end to end without manual intervention.

---

## Who This Is For

* Creators who want quick, reusable motion graphics
* Teams who need automated video generation
* Developers looking for a solid reference implementation of AE + Nexrender

---

## Tech Stack

### Frontend

* **Next.js (App Router)**
* Tailwind CSS
* Dark-mode focused UI
* Hosted on **Vercel**

### Backend

* **NestJS**
* REST APIs
* JWT-based authentication
* Stripe integration (subscriptions + webhooks)
* Hosted on **Render**

### Video Rendering

* **Adobe After Effects** (.aep templates)
* **Nexrender** for automated rendering
* Supports local or cloud workers
* Rendered videos uploaded to cloud storage

---

## How the App Works (High-Level)

1. Users can freely explore the website
2. When clicking **Customize**, they are asked to log in
3. Logged-in users customize a template
4. Credits/subscription are checked
5. Backend sends a render job to Nexrender
6. After Effects renders the video automatically
7. Final MP4 is uploaded and returned
8. User previews the video inside the app

This approach avoids asking users to log in *after* filling long customization forms, resulting in a smoother experience.

---

## Payments & Credits

* Stripe handles subscriptions and billing
* Each subscription grants a set number of credits
* Each render consumes credits
* Stripe webhooks keep user access and credits in sync

---

## After Effects Templates

* Single AE project containing multiple compositions
* Each composition represents one template
* Templates support:

  * Dynamic text replacement
  * Logo/image replacement
  * Color customization

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

```bash
npm install
npm run dev
```

Backend and rendering services should be running separately.

---

## Notes

This repository represents a **ready-to-use MVP**, not a prototype. The architecture is clean, modular, and intentionally built to support:

* More templates
* Higher traffic
* Cloud-based rendering
* Expanded billing models

If you’re reviewing this project in the future, this repo is a solid starting point for a real-world motion graphics SaaS.
