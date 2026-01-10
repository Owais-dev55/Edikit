# 🎬 Edikit - AI-Powered Video Template Platform

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

Edikit is a production-ready SaaS platform that enables users to create professional video content from customizable After Effects templates. Upload your images, customize text, colors, and branding - then let Edikit render stunning videos in minutes.

## ✨ Features

### 🎨 Core Features

- **Template-Based Video Rendering** - Professional After Effects templates rendered in the cloud
- **Smart Layer Mapping** - Automatic detection and mapping of template layers
- **Custom Asset Upload** - Support for images, logos, and custom branding
- **Real-time Rendering** - Track render progress with webhook-based status updates
- **Cloud Storage** - Seamless integration with Cloudinary for asset management

### 🔐 Authentication & Authorization

- **Multiple Auth Providers**:
  - Email/Password (Local)
  - Google OAuth 2.0
- **JWT-based Authentication** with secure cookie management
- **Role-based Access Control** (USER/ADMIN)

### 💳 Subscription & Credits System

- **Stripe Integration** for payment processing
- **Flexible Pricing Plans**:
  - FREE - 5 credits
  - BASIC - Pay-as-you-go
  - PRO - Subscription model
- **Credit Transactions** - Complete audit trail of credit usage
- **Automated Credit Management** - Refunds on failed renders

### 🎬 Video Rendering Pipeline

- **Nexrender Cloud Integration** - Professional-grade rendering
- **Multiple Template Support** - Upload and manage multiple AE templates
- **Dynamic Customization**:
  - Text overlays (headlines, subtitles, descriptions)
  - Image replacements (logos, photos, icons)
  - Color customization (primary, secondary, accent colors)
  - Background replacement
- **Automatic Asset Optimization** - Images optimized for web delivery
- **Webhook Processing** - Real-time render completion notifications

## 🏗️ Architecture

```
Edikit/
├── client/              # Next.js 16 Frontend (React 19)
│   ├── src/
│   │   ├── app/        # App Router pages
│   │   ├── components/ # Reusable React components
│   │   ├── redux/      # State management (Redux Toolkit)
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utility libraries
│   │   └── utils/      # Helper functions
│   └── public/         # Static assets
│
└── server/             # NestJS Backend API
    ├── src/
    │   ├── modules/
    │   │   ├── auth/         # Authentication module
    │   │   ├── user/         # User management
    │   │   ├── render/       # Video rendering engine
    │   │   ├── credits/      # Credit system
    │   │   └── cloudinary/   # Asset storage
    │   ├── stripe/           # Payment processing
    │   ├── common/           # Shared utilities
    │   └── config/           # Configuration
    ├── prisma/               # Database schema & migrations
    └── animations/           # After Effects templates (.zip)
```

## 🚀 Tech Stack

### Frontend

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, TailwindCSS 4
- **State Management**: Redux Toolkit
- **HTTP Client**: Axios
- **Validation**: Zod
- **Icons**: Lucide React

### Backend

- **Framework**: NestJS 11
- **Database**: PostgreSQL 16
- **ORM**: Prisma 7
- **Authentication**: Passport.js (JWT, Google, Apple)
- **File Upload**: Multer
- **Video Rendering**: Nexrender Cloud API
- **Cloud Storage**: Cloudinary
- **Payment**: Stripe
- **API Documentation**: Swagger/OpenAPI

## 📋 Prerequisites

- **Node.js** >= 18.x
- **pnpm** >= 8.x (recommended) or npm
- **PostgreSQL** >= 14.x
- **Cloudinary Account** (for asset storage)
- **Nexrender Cloud API Key** (for video rendering)
- **Stripe Account** (for payments)
- **Google OAuth Credentials** (optional)
- **Apple Developer Account** (optional)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Owais-dev55/Edikit.git
cd Edikit
```

### 2. Backend Setup

```bash
cd server
pnpm install

# Copy environment variables
cp .env.example .env

# Configure your .env file (see Configuration section)

# Generate Prisma Client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate

# (Optional) Open Prisma Studio to view database
pnpm prisma:studio
```

### 3. Frontend Setup

```bash
cd ../client
pnpm install

# Copy environment variables
cp .env.example .env

# Configure your .env file
```

## ⚙️ Configuration

### Backend Environment Variables (`.env`)

```env
# Server Configuration
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/edikit?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN=7d
JWT_TOKEN_NAME=user_token

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL=http://localhost:8000/auth/google/callback

# Apple OAuth (Optional)
APPLE_CLIENT_ID="your-apple-client-id"
APPLE_TEAM_ID="your-apple-team-id"
APPLE_KEY_ID="your-apple-key-id"
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
APPLE_CALLBACK_URL=http://localhost:8000/auth/apple/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Nexrender Cloud
NEXRENDER_CLOUD_API_KEY="your-nexrender-api-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_BASIC="price_..."
STRIPE_PRICE_ID_PRO="price_..."
```

### Frontend Environment Variables (`.env`)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## 🎯 Running the Application

### Development Mode

**Terminal 1 - Backend:**

```bash
cd server
pnpm dev
```

Backend runs on `http://localhost:8000`

**Terminal 2 - Frontend:**

```bash
cd client
pnpm dev
```

Frontend runs on `http://localhost:3000`

### Production Mode

**Backend:**

```bash
cd server
pnpm build
pnpm start
```

**Frontend:**

```bash
cd client
pnpm build
pnpm start
```

## 📚 API Documentation

Once the backend is running, access interactive API documentation at:

- **Swagger UI**: `http://localhost:8000/api`

### Key API Endpoints

#### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `GET /auth/google` - Google OAuth
- `POST /auth/apple` - Apple Sign In
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout user

#### Templates

- `GET /render/templates` - Get all available templates
- `GET /render/templates/:id` - Get template details
- `POST /render/templates/upload-all` - Upload all templates (admin)
- `GET /render/templates/:id/layers` - Get template layer information

#### Rendering

- `POST /render/upload-asset` - Upload custom assets
- `POST /render/create-job/:templateId` - Create render job
- `GET /render/job/:id` - Get job status
- `GET /render/job/:id/video` - Get optimized video URL
- `POST /render/webhook` - Nexrender webhook handler (internal)

#### Credits

- `GET /credits/balance` - Get user credit balance
- `GET /credits/transactions` - Get credit transaction history
- `POST /credits/purchase` - Purchase credits

#### Stripe

- `POST /stripe/create-checkout-session` - Create payment session
- `POST /stripe/create-subscription` - Create subscription
- `POST /stripe/webhook` - Stripe webhook handler

## 🎨 Template Management

### Adding New Templates

1. **Export from After Effects** as a zipped project:

   ```
   Animation_1.zip
   Animation_2.zip
   ...
   ```

2. **Place in animations folder**:

   ```bash
   server/animations/Animation_X.zip
   ```

3. **Upload to Nexrender Cloud**:

   ```bash
   # Upload all templates
   curl -X POST http://localhost:8000/render/templates/upload-all \
     -H "Cookie: user_token=your_jwt_token"

   # Or upload a single template
   curl -X POST http://localhost:8000/render/templates/upload/1 \
     -H "Cookie: user_token=your_jwt_token"
   ```

4. **View layer mapping**:
   ```bash
   curl http://localhost:8000/render/templates/1/layers \
     -H "Cookie: user_token=your_jwt_token"
   ```

### Layer Naming Conventions

For automatic layer detection, name your layers:

- **Text Layers**: `Text 1`, `Text 2`, `Text 3`, `txt_1`, `Headline`, `Subtitle`
- **Image Layers**: `Image 1`, `Image 2`, `img_1`, `Logo`
- **Background**: `Background`, `bg.png`
- **Icons**: `Icon 1`, `Icon 2`, etc.

## 🗄️ Database Schema

### Core Models

- **User** - User accounts with authentication & subscription info
- **RenderJob** - Video render jobs with status tracking
- **NexrenderTemplate** - Template metadata and layer mappings
- **CreditTransaction** - Audit trail of credit operations

### Migrations

```bash
# Create new migration
pnpm prisma:migrate

# Deploy migrations (production)
pnpm prisma:migrate:deploy

# Reset database (development only)
pnpm prisma migrate reset
```

## 🔒 Security Features

- **Argon2** password hashing
- **HTTP-only cookies** for JWT storage
- **CORS** configured for frontend origin
- **Helmet** security headers
- **Rate limiting** on sensitive endpoints
- **Input validation** with class-validator
- **SQL injection protection** via Prisma ORM

## 🧪 Testing

```bash
# Backend
cd server
pnpm test              # Run unit tests
pnpm test:e2e          # Run e2e tests
pnpm test:cov          # Test coverage

# Frontend
cd client
pnpm test              # Run tests
```

## 📦 Deployment

### Backend (Render.com / Railway / Fly.io)

1. Set environment variables in hosting platform
2. Configure DATABASE_URL to production database
3. Run migrations: `pnpm prisma:migrate:deploy`
4. Deploy with: `pnpm build && pnpm start`

### Frontend (Vercel / Netlify)

1. Connect GitHub repository
2. Set NEXT_PUBLIC_BACKEND_URL to production API
3. Deploy with default Next.js settings

### Database (Neon / Supabase / Railway)

- PostgreSQL 14+ with connection pooling
- Enable SSL connections
- Configure backup retention

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the UNLICENSED license - see the LICENSE file for details.

## 👥 Authors

- **Abdul Rehman** - [@abdulrehmanwaseem](https://github.com/abdulrehmanwaseem)
- **Owais** - [@Owais-dev55](https://github.com/Owais-dev55)

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
- [Nexrender](https://github.com/inlife/nexrender) - Video rendering
- [Cloudinary](https://cloudinary.com/) - Media management
- [Stripe](https://stripe.com/) - Payment processing
- [Prisma](https://www.prisma.io/) - Database ORM

## 📞 Support

For support, email support@edikit.com or join our Discord channel.

---

Made with ❤️ by the Edikit Team
