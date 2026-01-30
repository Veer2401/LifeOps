# LifeOps

## Overview

LifeOps is a **Cognitive Load Management System** built as a cross-platform mobile application using React Native with Expo. Unlike traditional to-do or productivity apps, LifeOps takes a mental-health-first approach by recommending single best actions based on the user's current mental state, available time, and energy levels. The app actively works to reduce mental load rather than add pressure.

**Core Philosophy**: Users should feel guided (not managed), supported (not monitored), and relieved (not pressured).

**Key Differentiator**: The home screen shows only ONE suggested action at a time, sometimes recommending recovery over action when mental capacity is saturated.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React Native with Expo SDK 54
- Uses Expo Router patterns with React Navigation (native-stack and bottom-tabs)
- Implements a mental-state-first interaction model
- Three-tab navigation: Focus (Home), Commitments, Profile

**State Management**: 
- TanStack React Query for server state
- Local storage via AsyncStorage for offline-first experience
- No complex global state management needed

**UI/UX Approach**:
- Calm, minimalist aesthetic following healthcare-oriented design
- Muted color palette (teal primary, sage success, warm gold warnings)
- System fonts (SF Pro/Roboto) with generous spacing
- Animated interactions using Reanimated for micro-feedback
- Dark mode support with automatic theme detection

**Key Screens**:
- Welcome/Auth flow with Google and Apple Sign-In
- Mental state onboarding (mental load, available time, energy mode)
- Single-card focus view showing suggested action
- Commitments list with cognitive weight indicators
- Focus session timer with completion tracking

### Backend Architecture

**Server**: Express.js running on Node.js
- Simple REST API structure with `/api` prefix
- CORS configured for Replit deployment domains
- Serves static landing page for web visitors

**Database**: PostgreSQL with Drizzle ORM
- Schema defined in `shared/schema.ts`
- User management with username/password authentication
- Drizzle-zod integration for validation

**Data Storage Strategy**:
- Currently uses MemStorage for development (in-memory)
- PostgreSQL schema ready for production data persistence
- Client-side AsyncStorage for offline capability

### Core Domain Concepts

**Commitments** (not "tasks"): Mental obligations with cognitive weight
- Categories: Mind, Work, Life
- Cognitive weights: Light (10 units), Moderate (25 units), Heavy (45 units)
- Optional pressure points (soft deadlines)

**Mental State**: Daily cognitive capacity assessment
- Mental load levels: Very Light to Very Heavy
- Available time slots: 5, 15, 30, 60+ minutes
- Energy modes: Push (take on more) or Protect (conserve)

**Cognitive Engine** (`client/lib/cognitiveEngine.ts`):
- Selects next best action based on remaining capacity
- Matches commitment weight to current energy level
- Recommends recovery when capacity is saturated

### Build and Deployment

**Development**:
- `npm run expo:dev` - Start Expo development server
- `npm run server:dev` - Start Express backend

**Production**:
- `npm run expo:static:build` - Build static web bundle
- `npm run server:build` - Bundle server with esbuild
- `npm run server:prod` - Run production server

## External Dependencies

### Authentication Services
- **Google Sign-In**: OAuth via expo-auth-session (requires GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID)
- **Apple Sign-In**: Native via expo-apple-authentication

### Database
- **PostgreSQL**: Primary database (connection via DATABASE_URL environment variable)
- **Drizzle ORM**: Schema management and query building

### Expo Services
- expo-haptics for tactile feedback
- expo-blur for iOS glass effects
- expo-splash-screen for launch experience
- expo-updates for OTA updates

### Development Tools
- TypeScript for type safety
- ESLint with Expo and Prettier configs
- Drizzle Kit for database migrations