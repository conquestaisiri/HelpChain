# HelpChain

## Overview

HelpChain is a community-driven social-help coordination platform that connects people who need assistance with those who can provide it. The platform facilitates real-life help requests (not freelancing or gig work) - think neighborhood assistance like carrying groceries, picking up prescriptions, or moving furniture. Users can post help requests with optional rewards, offer to help others, communicate through in-app messaging, and build reputation through reviews and ratings. The platform includes a wallet system for payments with a Protected Transaction Fee (PTF) structure.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom plugins for meta images and Replit integration
- **Routing**: Wouter (lightweight React router)
- **State Management**: 
  - Zustand for local state (auth store, wallet, offers)
  - TanStack Query for server state and data fetching
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration and CSS variables for theming
- **Animations**: Framer Motion for page transitions and micro-interactions

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with Local Strategy, session-based auth using express-session with MemoryStore
- **API Design**: RESTful endpoints under `/api/` prefix
- **Build**: esbuild for server bundling with selective dependency bundling for faster cold starts

### Data Storage
- **Database**: PostgreSQL via Neon serverless driver (@neondatabase/serverless)
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Schema Location**: `/shared/schema.ts` - shared between frontend and backend
- **Key Tables**: users, profiles, helpRequests, offers, conversations, messages, reviews

### Authentication Flow
- Session-based authentication with secure cookies
- Password hashing with bcryptjs
- `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me` endpoints
- Protected routes use `isAuthenticated` middleware

### Fee System (PTF - Protected Transaction Fee)
- Tiered fee structure based on budget amount
- Budget ₦5-999: ₦15 PTF
- Budget ₦1,000-4,999: ₦60 PTF
- Scales up with ₦60 per ₦5,000 chunk above ₦25,000
- Users deposit budget + PTF; only budget shows in wallet

### Key Pages
- Home, Auth, Dashboard, Profile, Public Profile
- Create Request (multi-step form with payment)
- Discover (browse/search help requests)
- Messages (real-time conversations)
- Admin Dashboard (offer approval/rejection)
- Static pages: How It Works, Safety, Stories, Terms, Privacy

## External Dependencies

### Payment Integration
- **Korapay**: Payment processing for deposits with 6% checkout fee
- Modal-based payment flow in `KorapayModal` and `WalletDepositModal` components

### Authentication Providers
- **Google OAuth**: @react-oauth/google package configured for social login

### Database
- **Neon Database**: PostgreSQL serverless database
- Connection via `DATABASE_URL` environment variable

### Third-Party Services
- **Google Fonts**: Poppins (headings) and Open Sans (body text)
- Form validation with Zod and react-hook-form
- Date formatting with date-fns

## Recent Changes (December 2025)

### UI/UX Improvements
- **Auth Page**: Added Google and Apple OAuth sign-in buttons with professional styling
- **Profile Page**: Complete redesign with hero banner, stats cards, achievements section, and enhanced tabs (Wallet, About, Reviews, Saved, Settings)
- **Deposit Modal**: Multiple payment methods including Card, Bank Transfer, USDT, BTC, ETH, and SOL
- **Withdrawal Modal**: Multiple withdrawal methods with Nigerian bank selector and crypto wallet support
- **Dashboard**: Enhanced Active Requests cards, comprehensive History section with transaction timeline, and polished messaging interface with responsive desktop/mobile layouts