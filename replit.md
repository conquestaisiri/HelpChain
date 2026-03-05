# HelpChain - Task Marketplace Platform

## Overview
HelpChain is a task marketplace platform for Nigeria connecting everyday people who need help with everyday tasks/errands with local helpers. Unlike Fiverr/Upwork (for professionals), HelpChain targets regular people needing help with delivery, cleaning, moving, errands, etc. Features flexible pricing where users post tasks with any budget and helpers can accept or counter-offer.

## Recent Changes (January 2026)
- **MAJOR: Firebase Migration**: Complete migration from PostgreSQL/Replit Auth to Firebase (Firestore + Firebase Auth)
- **Firebase Authentication**: Email/password login, Google Sign-In, password reset, email verification
- **Firestore Database**: 16+ collections including users, wallets, escrow_records, transactions, help_requests, offers, messages, reviews, disputes, KYC, notifications
- **Paystack Integration**: Full payment gateway integration for deposits, withdrawals, and transfers
- **Wallet System with Escrow**: available_balance + escrow_balance structure with atomic transactions
- **Escrow Flow**: Lock funds on job assignment, release on completion (minus 6% fee), refund on cancellation, freeze on dispute
- **Webhook System**: Paystack webhooks for deposit verification and transfer confirmation

### Completed Migration
- **All Pages Use Firebase Auth**: profile, dashboard, messages, request-details, create-request, discover pages all use useFirebaseAuth
- **Escrow Flow Wired**: Accept offer → locks funds in escrow, Complete task → releases payment to helper
- **Legacy Auth Removed**: Removed use-auth.ts hook and auth-modal.tsx component
- **Protected Routes**: ProtectedRoute component wraps authenticated pages

### Mobile-First Optimization (January 2026)
- **Systematic Mobile Rewrite**: dashboard, messages, public-profile, request-details all rewritten for mobile-first UX
- **Design Pattern**: max-w-lg containers, single-column layouts, consistent spacing
- **Motion Animations**: Framer Motion entrance animations on all pages
- **Skeleton Loading States**: Consistent loading placeholders across all pages
- **Defensive Programming**: Null/undefined checks with optional chaining throughout
- **Navigation**: window.history.back() for back buttons (not navigate(-1))
- **Fixed public-profile.tsx**: Migrated from useMockAuth to useFirebaseAuth with real API calls

### Design System
- **Design Updates**: Figtree font (thin/light weights), subtle rounded corners (rounded-md)
- **HelpBot Chatbot**: Intent-based chatbot for FAQs, platform help, task posting guidance
- **Nigerian Context**: All imagery features Nigerian people, currency in Naira

## Design System

### Colors
- Primary: `hsl(142 71% 35%)` - Forest Green (#228B22)
- Accent: `hsl(158 64% 42%)` - Teal Green (#2E8B57)
- Background: White with subtle gradients
- Dark mode supported

### Typography
- Font: Figtree (Google Fonts) - thin/light weights for modern, elegant look
- Headings: Bold weights with letter-spacing
- Hero text: White on gradient backgrounds

### Hero Sections
- Gradient: `bg-gradient-to-br from-primary via-primary to-accent`
- Dot pattern overlay for texture
- White text and transparent badges
- Generous top padding for proper spacing

### Components
- Rounded corners: rounded-md (subtle, edgy look)
- Gradient CTAs with shadows
- Pill-style badges and buttons
- Floating card animations with Framer Motion
- Hover lift effects

## Project Architecture

### Frontend (React + TypeScript)
- `client/src/pages/` - Page components
- `client/src/pages/auth.tsx` - Firebase authentication page (login/signup/reset)
- `client/src/components/` - Reusable UI components
- `client/src/components/chatbot/` - HelpBot chatbot component
- `client/src/components/wallet/` - Wallet UI components
- `client/src/components/payment/` - Payment modals (deposit, withdraw)
- `client/src/hooks/use-firebase-auth.ts` - Firebase auth hook
- `client/src/contexts/FirebaseAuthContext.tsx` - Firebase Auth context provider
- `client/src/lib/firebase.ts` - Firebase client SDK initialization
- Styling: Tailwind CSS + shadcn/ui

### Backend (Express + TypeScript)
- `server/routes.ts` - Main API routes (legacy PostgreSQL)
- `server/firebase-routes.ts` - NEW Firebase-based API routes (900+ lines)
- `server/firebase-admin.ts` - Firebase Admin SDK initialization
- `server/paystack.ts` - Paystack API client (transactions, transfers, webhooks)
- `server/firestore/` - Firestore service layer:
  - `index.ts` - Collection exports and types
  - `users.ts` - User CRUD operations
  - `wallets.ts` - Wallet operations with atomic balance updates
  - `escrow.ts` - Escrow lifecycle management
  - `requests.ts` - Help request operations
  - `offers.ts` - Offer operations
  - `messages.ts` - Messaging system
  - `reviews.ts` - Review operations
  - `transactions.ts` - Transaction logging

### Database (Firestore Collections)
- `users` - User accounts with Firebase UID
- `profiles` - Extended profile data
- `wallets` - User wallets with available_balance and escrow_balance
- `wallet_transactions` - Full transaction ledger (deposit, withdrawal, escrow_lock, escrow_release, escrow_refund, fee)
- `help_requests` - Task postings
- `offers` - Helper offers on tasks
- `escrow_records` - Escrow tracking (status: pending, locked, released, refunded, disputed, frozen)
- `disputes` - Dispute records for admin resolution
- `conversations` - Conversation metadata
- `messages` - Individual messages
- `reviews` - User reviews
- `bank_accounts` - User bank accounts for withdrawals
- `kyc_submissions` - KYC verification documents
- `notifications` - User notifications
- `platform_revenue` - Fee tracking
- `pending_transactions` - Webhook confirmation tracking

### Key API Endpoints (Firebase Routes - /api/firebase/)
- `POST /auth/signup` - Create user with Firebase Auth
- `POST /auth/login` - Sign in user
- `GET /wallet` - Get wallet balance
- `POST /wallet/deposit/initialize` - Start Paystack deposit
- `POST /wallet/withdraw/request` - Request withdrawal
- `GET /wallet/transactions` - Transaction history
- `POST /requests` - Create help request
- `GET /requests` - List requests
- `POST /offers` - Create offer
- `PUT /offers/:id/accept` - Accept offer (triggers escrow lock)
- `PUT /requests/:id/complete` - Complete task (triggers escrow release)
- `POST /disputes` - Open dispute (freezes escrow)
- `POST /paystack/webhook` - Paystack webhook handler

### Key Pages
- `/` - Home page with hero (typing animation, search bar), categories, testimonials
- `/auth` - Firebase authentication (login/signup/password reset)
- `/discover` - Task browsing with filters
- `/create-request` - Multi-step task creation with funding source selection
- `/profile` - User dashboard with wallet, animations, profile picture upload
- `/public-profile/:userId` - Public profile view
- `/request/:id` - Task details
- `/about` - Company mission and team
- `/pricing` - Free and Pro pricing tiers
- `/how-it-works` - Platform tutorial
- `/help` - FAQ and support

### Authentication Flow (Firebase)
1. User signs up with email/password or Google
2. Firebase Auth creates user, sends verification email
3. Backend creates Firestore user document and wallet
4. Auth state managed via FirebaseAuthContext
5. Protected routes check user.uid

### Payment Flow (Paystack)
1. User initiates deposit via /wallet/deposit/initialize
2. Redirect to Paystack checkout
3. Paystack sends webhook on successful charge
4. Backend verifies webhook signature and credits wallet
5. Transaction logged with full audit trail

### Escrow Flow
1. Task requester creates request with budget
2. Helper submits offer (can counter-offer)
3. Requester accepts offer - funds locked in escrow
4. Task completed - funds released to helper (minus 6% fee)
5. OR: Dispute opened - funds frozen pending admin resolution
6. OR: Task cancelled - funds refunded to requester

## Business Model
- **Platform Fee**: 6% on each completed task
- **Escrow System**: Money held in escrow_balance until task completed
- **Flexible Pricing**: Users set budget, helpers can accept or counter-offer
- **Funding Sources**: Users can pay from wallet balance or pay directly at checkout

## User Preferences
- Green color theme (Forest Green #228B22)
- Figtree font with thin/light weights
- Subtle rounded corners (rounded-md)
- Everyday tasks focus (not high-skill professional work)
- Dark-skinned Nigerian people in all imagery
- Smooth Framer Motion animations and transitions
- Mobile-responsive layouts
- Clean, minimal interface
- Nigerian currency and context

## Environment Variables
### Firebase (Client - VITE_ prefixed)
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

### Firebase (Server)
- FIREBASE_API_KEY (secret)
- FIREBASE_PROJECT_ID
- FIREBASE_SERVICE_ACCOUNT_KEY (JSON string, required for Admin SDK)

### Paystack (TODO)
- PAYSTACK_SECRET_KEY (server-side)
- PAYSTACK_PUBLIC_KEY (client-side)

## Dependencies
- React 18 with TypeScript
- Firebase (firebase, firebase-admin)
- Framer Motion for animations
- Tailwind CSS + shadcn/ui
- TanStack Query for data fetching
- Wouter for routing
- Express.js backend

## Running the Project
```bash
npm run dev
```
Server runs on port 5000.
