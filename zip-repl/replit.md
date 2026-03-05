# HelpChain

## Overview
HelpChain is a community-driven platform that connects people who need help with those who can provide it. Users can post help requests, offer assistance, and build their reputation through reviews.

## Project Structure
- `/client` - React frontend (Vite + TypeScript + Tailwind CSS)
  - `/src/pages` - Page components
  - `/src/components` - Reusable UI components
  - `/src/hooks` - Custom React hooks (auth, wallet, etc.)
- `/server` - Express.js backend
  - `routes.ts` - API endpoints
  - `storage.ts` - Database operations
- `/shared` - Shared types and Drizzle ORM schema

## Tech Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Wouter (routing), TanStack Query
- **Backend**: Express.js, TypeScript, Passport.js (authentication)
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: Zustand for auth, React Query for server state

## Database Schema
- `users` - User accounts (id, username, email, password)
- `profiles` - User profiles (fullName, bio, avatarUrl, location, helpsGiven, rating)
- `helpRequests` - Help requests posted by users
- `offers` - Offers from helpers on requests
- `conversations` - Message threads between users
- `messages` - Individual messages
- `reviews` - User reviews after completed help

## Key Features
- User authentication (register/login)
- Browse and search help requests
- Create help requests with categories and rewards
- Offer to help on requests
- Real-time messaging between users
- User profiles with ratings and reviews
- Wallet system for payments

## Running the App
The app runs on port 5000 with the workflow "Start application" (`npm run dev`)

## Recent Changes
- December 2025: Major improvements to Profile and Dashboard pages
  - Profile page: Replaced all placeholder emojis with Lucide icons, made stats dynamic (rating, helps, success rate), dynamic join date, removed hardcoded response time
  - Dashboard page: Integrated API queries for user profile/requests/offers, added History tab with wallet transactions and offer history, added loading states
- December 2024: Fixed dashboard.tsx and profile.tsx to use real authentication instead of mock auth
- Profile page now displays dynamic user data from API with proper fallbacks

## API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/profile` - Get authenticated user's profile
- `PUT /api/profile` - Update profile
- `GET /api/requests` - Get all help requests
- `POST /api/requests` - Create help request
- `POST /api/offers` - Create offer on request
- `GET /api/conversations` - Get user's conversations
- `POST /api/messages` - Send message
