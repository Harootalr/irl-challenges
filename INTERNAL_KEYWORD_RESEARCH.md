# IRL Challenges - Internal Keyword Research & Code Reference

## Purpose
This document serves as an internal reference guide for understanding every component, feature, and architectural decision in the IRL Challenges codebase. Use this to quickly understand what exists, why it exists, and how it functions.

---

## 🗄️ DATABASE SCHEMA (`shared/schema.ts`)

### Core Tables & Their Purpose

**`users`** - User account management
- **Purpose**: Store user credentials, profiles, ratings, and role permissions
- **Key Fields**: email/password authentication, role-based access (user/venue_admin/super_admin), rating system
- **Why**: Central identity management for all platform features

**`venues`** - Physical gaming locations
- **Purpose**: Database of real-world locations where challenges occur
- **Key Fields**: geolocation (lat/lng), operating hours, contact info, ratings
- **Why**: GPS verification requires accurate venue data; users need to find nearby gaming spots

**`challenges`** - Core gaming events
- **Purpose**: Individual gaming sessions/competitions between users
- **Key Fields**: host/venue relationship, game presets, skill levels, status tracking, result reporting
- **Why**: This is the primary business object - everything revolves around creating and completing challenges

**`challengeParticipants`** - Who's playing what
- **Purpose**: Many-to-many relationship between users and challenges
- **Key Fields**: userId, challengeId, joinedAt timestamp
- **Why**: Tracks participation, enables participant-only features like messaging

**`messages`** - Real-time communication
- **Purpose**: Challenge-specific chat system
- **Key Fields**: challengeId, senderId, message body, timestamps
- **Why**: Players need to coordinate before/during challenges; builds community

**`results`** - Unused legacy table
- **Purpose**: Originally for result tracking (superseded by challenge fields)
- **Status**: Deprecated in favor of direct challenge result fields
- **Why**: Simplified architecture by moving results into challenges table

### Recent Schema Enhancements

**Result Reporting Fields** (Added Sept 2025)
- **`hostReport`**: Host's version of challenge outcome
- **`opponentReport`**: Opponent's version of challenge outcome  
- **`finalOutcome`**: Confirmed result when both reports match
- **Purpose**: Mutual confirmation system prevents disputes, ensures fair results
- **Why**: Trust and fairness are critical for competitive gaming platform

**Status Progression System**
- **Values**: open → full → in_progress → completed/disputed/cancelled
- **Purpose**: Clear challenge lifecycle management
- **Why**: Users need to understand challenge states; prevents confusion

---

## 🛠️ SERVER ARCHITECTURE (`server/`)

### `server/index.ts` - Application Entry Point
**Purpose**: Bootstrap the entire application
**Contains**: Express server setup, middleware configuration, error handling
**Why**: Single entry point simplifies deployment and configuration management

### `server/db.ts` - Database Connection
**Purpose**: Centralized database connection and configuration
**Contains**: Neon PostgreSQL setup, Drizzle ORM initialization, connection pooling
**Why**: Separates database concerns; enables easy environment switching

### `server/storage.ts` - Data Access Layer
**Purpose**: Abstract database operations behind clean interfaces
**Key Methods**:
- **User Management**: `createUser()`, `getUserByEmail()`, `updateUser()`
- **Venue Operations**: `getVenues()`, `getNearbyVenues()`, `createVenue()`
- **Challenge Lifecycle**: `createChallenge()`, `getChallenges()`, `updateChallenge()`, `reportResult()`
- **Messaging**: `createMessage()`, `getChallengeMessages()`

**Why We Built This**:
- **Interface Segregation**: IStorage interface enables easy testing/mocking
- **Business Logic Separation**: Database queries separated from HTTP routing
- **Type Safety**: Full TypeScript integration with Drizzle schemas
- **Transaction Support**: Critical for result reporting race condition prevention

### `server/routes.ts` - API Endpoints
**Purpose**: HTTP API that frontend consumes
**Key Route Categories**:

**Authentication Routes** (`/api/auth/*`)
- **`POST /register`**: User account creation with validation
- **`POST /login`**: Session-based authentication with "remember me"
- **`POST /logout`**: Session cleanup
- **`GET /me`**: Current user profile retrieval
- **Why**: Secure session management is foundation for all protected features

**Challenge Routes** (`/api/challenges/*`)
- **`GET /challenges`**: Challenge discovery with filtering
- **`POST /challenges`**: Challenge creation with host assignment
- **`GET /challenges/:id`**: Individual challenge details
- **`POST /challenges/:id/join`**: Challenge participation
- **`GET /challenges/:id/participants`**: Participant listing
- **Why**: Core business functionality - challenges are the main product

**Venue Routes** (`/api/venues/*`)
- **`GET /venues`**: Venue discovery with geolocation filtering
- **`POST /venues`**: Admin venue creation
- **Why**: Users need to find gaming locations; GPS verification requires venue data

**Check-in Routes** (`/api/check-in`)
- **`POST /check-in`**: GPS-verified venue check-in
- **Why**: Prevents gaming from fake locations; ensures real-world meetups

**Result Reporting** (`/api/report-result`)
- **`POST /report-result`**: Secure result submission with validation
- **Features**: Authorization checks, outcome validation, transaction safety, conflict detection
- **Why**: Fair competition requires trusted result tracking

**Admin Routes** (`/api/admin/*`)
- **User Management**: User role modification, account management
- **Analytics**: Platform usage statistics and metrics
- **Export**: Data export for reporting and analysis
- **Why**: Platform management and business intelligence needs

**WebSocket Integration**
- **Purpose**: Real-time messaging for challenge participants
- **Features**: Challenge-specific rooms, message broadcasting, connection management
- **Why**: Gaming coordination requires instant communication

---

## 🎨 FRONTEND ARCHITECTURE (`client/src/`)

### Core Application Structure

**`App.tsx`** - Main Application Component
**Purpose**: Root component with routing and global state
**Contains**: Route definitions, authentication context, theme provider
**Why**: Centralized routing and global state management

**`main.tsx`** - Application Entry Point  
**Purpose**: React DOM mounting and global providers
**Contains**: React Query setup, theme provider, global CSS imports
**Why**: Clean separation of mounting logic from application logic

### State Management Strategy

**TanStack Query** (`lib/queryClient.ts`)
**Purpose**: Server state management and caching
**Features**: API request abstraction, optimistic updates, cache invalidation
**Why**: Eliminates manual state synchronization; handles loading/error states automatically

**React Context** (Authentication)
**Purpose**: Global authentication state
**Location**: `hooks/use-auth.tsx`
**Why**: Authentication status needed throughout app; avoids prop drilling

### Component Architecture

**Layout Components** (`components/layout/`)
- **`app-header.tsx`**: Navigation and user menu
- **`bottom-nav.tsx`**: Mobile-first navigation
- **`floating-action-button.tsx`**: Quick actions (challenge creation)
- **Why**: Consistent navigation experience across all pages

**UI Components** (`components/ui/`)
**Purpose**: Reusable design system components
**Based On**: shadcn/ui + Radix UI primitives
**Why**: Consistent design, accessibility, reduced code duplication

**Feature Components** (`components/`)
- **`challenge-card.tsx`**: Challenge display and interaction
- **`venue-card.tsx`**: Venue information display
- **`map-view.tsx`**: Geolocation and venue mapping
- **`real-map.tsx`**: Interactive mapping with markers
- **Why**: Encapsulated feature logic; reusable across multiple pages

### Page Components (`pages/`)

**Authentication Flow**
- **`auth.tsx`**: Login/register with "remember me" functionality
- **Why**: Single page handles both flows; reduces complexity

**Core User Journey**
- **`home.tsx`**: Challenge discovery and venue exploration
- **`create-challenge.tsx`**: Challenge creation wizard
- **`challenge-detail.tsx`**: Challenge viewing and participation
- **`check-in.tsx`**: GPS verification for venue arrival
- **Why**: Follows user journey from discovery → creation → participation → completion

**Profile Management**
- **`edit-profile.tsx`**: User profile updates
- **`change-password.tsx`**: Secure password changes
- **`account-management.tsx`**: Account settings and preferences
- **Why**: User control over personal information and security

**Admin Interface**
- **`admin.tsx`**: Main admin dashboard
- **`admin-analytics.tsx`**: Platform metrics and insights
- **`admin-users.tsx`**: User management interface
- **`admin-challenges.tsx`**: Challenge moderation
- **`admin-export.tsx`**: Data export functionality
- **Why**: Platform management and business intelligence

### Custom Hooks (`hooks/`)

**`use-auth.tsx`** - Authentication State
**Purpose**: Centralized auth state and operations
**Features**: Login/logout, session persistence, role checking
**Why**: Separates auth logic from UI components

**`use-geolocation.tsx`** - Location Services
**Purpose**: Browser geolocation with permission handling
**Features**: Position tracking, error handling, permission states
**Why**: GPS verification and venue discovery require location access

**`use-websocket.tsx`** - Real-time Communication
**Purpose**: WebSocket connection management
**Features**: Connection state, message sending/receiving, reconnection
**Why**: Real-time messaging requires connection state management

**`use-mobile.tsx`** - Responsive Design
**Purpose**: Detect mobile devices and screen sizes
**Why**: Mobile-first platform requires responsive behavior

### Styling Strategy (`index.css`)

**CSS Variables** - Theme System
**Purpose**: Consistent colors and spacing throughout app
**Features**: Light/dark mode support, semantic color naming
**Why**: Maintainable theming and easy customization

**Tailwind CSS** - Utility-First Styling
**Purpose**: Rapid UI development with consistent design
**Why**: Faster development, smaller CSS bundle, design consistency

---

## 🔒 SECURITY ARCHITECTURE

### Authentication & Authorization

**Session-Based Authentication**
**Purpose**: Secure user identification without tokens
**Features**: HttpOnly cookies, session expiration, "remember me" extension
**Why**: More secure than JWT for web apps; automatic CSRF protection

**Role-Based Access Control**
**Roles**: user (default), venue_admin (venue management), super_admin (platform management)
**Purpose**: Granular permission control
**Why**: Different users need different access levels

**Password Security**
**Method**: bcrypt hashing with salt
**Purpose**: Protect user credentials
**Why**: Industry standard for password storage

### Input Validation

**Zod Schemas** (`shared/schema.ts`)
**Purpose**: Runtime type checking and validation
**Coverage**: All API inputs, database inserts, form submissions
**Why**: Prevents injection attacks and data corruption

**Authorization Middleware**
**Purpose**: Protect sensitive endpoints
**Implementation**: `requireAuth` middleware on all protected routes
**Why**: Ensures only authenticated users access protected features

---

## 🚀 REAL-TIME FEATURES

### WebSocket Implementation

**Purpose**: Live communication during challenges
**Architecture**: Challenge-specific rooms with participant filtering
**Features**: Message broadcasting, connection management, automatic cleanup
**Why**: Gaming coordination requires instant communication

### GPS Verification System

**Purpose**: Ensure users are physically at claimed venues
**Implementation**: 100-meter radius verification using haversine formula
**Security**: Server-side validation prevents spoofing
**Why**: Platform credibility depends on real-world meetups

---

## 📊 ADMIN & ANALYTICS SYSTEM

### Admin Dashboard Architecture

**Purpose**: Platform management and business intelligence
**Features**: User management, content moderation, analytics, data export
**Access Control**: super_admin role required
**Why**: Platform management needs separate from user features

### Analytics Implementation

**Metrics Tracked**: User registration, challenge creation, completion rates, venue popularity
**Purpose**: Business intelligence and platform optimization
**Storage**: Aggregated queries on existing data (no separate analytics database)
**Why**: Understanding user behavior drives product decisions

### Data Export System

**Purpose**: Business reporting and compliance
**Formats**: CSV export for challenges, users, and administrative reports
**Security**: Admin-only access with audit logging
**Why**: Business needs and potential regulatory requirements

---

## 🎯 BUSINESS LOGIC DECISIONS

### Challenge Lifecycle Management

**Status Flow**: open → full → in_progress → completed/disputed/cancelled
**Purpose**: Clear state management for user understanding
**Why**: Prevents confusion and enables proper feature gating

### Result Reporting System

**Mutual Confirmation**: Both players must report matching results
**Conflict Resolution**: Disputed status when reports don't match
**Transaction Safety**: Database-level race condition prevention
**Why**: Trust and fairness are critical for competitive platform

### Rating & Skill System

**Skill Levels**: beginner, intermediate, advanced
**Purpose**: Fair matchmaking and user confidence
**Future Enhancement**: Dynamic rating calculation based on results
**Why**: Skill-appropriate challenges improve user experience

### Venue Management

**Geolocation Storage**: Latitude/longitude with precision validation
**Operating Hours**: Structured schedule data
**Purpose**: Accurate venue discovery and availability
**Why**: Users need reliable venue information for planning

---

## 🛡️ ERROR HANDLING & VALIDATION

### Frontend Error Strategy

**React Query**: Automatic error handling for API requests
**Form Validation**: Real-time validation with Zod schemas
**User Feedback**: Toast notifications for all user actions
**Why**: Clear error communication improves user experience

### Backend Error Strategy

**HTTP Status Codes**: Semantic status codes (400, 401, 403, 409, 500)
**Error Messages**: User-friendly messages with technical logging
**Transaction Rollback**: Database consistency on error conditions
**Why**: Proper error handling prevents data corruption and user confusion

---

## 📱 MOBILE-FIRST DESIGN

### Responsive Strategy

**Breakpoints**: Mobile-first with tablet and desktop enhancements
**Navigation**: Bottom navigation for mobile, header for desktop
**Touch Targets**: Appropriate sizing for finger navigation
**Why**: Gaming meetups primarily happen via mobile devices

### Progressive Web App Features

**Service Worker Ready**: Foundation for offline functionality
**App Manifest**: Installable web app experience
**Why**: Mobile app experience without app store complexity

---

## 🔮 ARCHITECTURE DECISIONS & RATIONALE

### Why Full-Stack TypeScript
**Decision**: Shared types between frontend and backend
**Benefit**: Compile-time error detection, better developer experience
**Trade-off**: Slightly more complex build process

### Why Drizzle ORM
**Decision**: Type-safe database queries with minimal overhead
**Benefit**: Full TypeScript integration, excellent performance
**Alternative Considered**: Prisma (too heavy), raw SQL (type unsafe)

### Why Session-Based Auth
**Decision**: Server-side session storage vs JWT tokens
**Benefit**: More secure, automatic CSRF protection, easy revocation
**Trade-off**: Server state requirement (acceptable for our scale)

### Why React Query
**Decision**: Server state management vs manual fetch
**Benefit**: Automatic caching, loading states, optimistic updates
**Alternative Considered**: Redux (too complex), SWR (fewer features)

### Why WebSockets
**Decision**: Real-time messaging vs polling
**Benefit**: True real-time communication, better user experience
**Trade-off**: Connection management complexity

### Why PostgreSQL
**Decision**: Relational database vs NoSQL
**Benefit**: ACID transactions, complex queries, geolocation support
**Use Case**: Gaming data is highly relational with consistency requirements

---

## 🔍 QUICK REFERENCE LOOKUP

### Find Code By Purpose

**User Authentication**: `server/routes.ts` (auth routes), `hooks/use-auth.tsx`
**Challenge Creation**: `pages/create-challenge.tsx`, `server/storage.ts` (createChallenge)
**GPS Verification**: `pages/check-in.tsx`, `server/routes.ts` (check-in endpoint)
**Real-time Chat**: `use-websocket.tsx`, `server/routes.ts` (WebSocket server)
**Admin Features**: `pages/admin-*.tsx`, `server/routes.ts` (admin routes)
**Database Schema**: `shared/schema.ts`
**API Endpoints**: `server/routes.ts`
**UI Components**: `components/ui/`
**Business Logic**: `server/storage.ts`

### Find Features By User Story

**"I want to find nearby gaming venues"**: `pages/home.tsx`, `components/map-view.tsx`
**"I want to create a challenge"**: `pages/create-challenge.tsx`, `components/challenge-card.tsx`
**"I want to join a challenge"**: `pages/challenge-detail.tsx`, challenge join functionality
**"I want to chat with opponents"**: `use-websocket.tsx`, message components
**"I want to report results"**: Result reporting system in `server/routes.ts`
**"I want to manage the platform"**: Admin pages and API endpoints

---

## 📋 MAINTENANCE KEYWORDS

### Database Migrations
**Tool**: Drizzle Kit with `npm run db:push`
**Schema Changes**: Always update `shared/schema.ts` first
**Production Safety**: Use transactions for data migrations

### Environment Variables
**Required**: `DATABASE_URL` for PostgreSQL connection
**Optional**: Port configuration, session secrets
**Security**: Never commit secrets to repository

### Deployment Checklist
**Database**: Ensure schema is up to date
**Environment**: Verify all required variables
**Build**: Run production build and test
**Monitoring**: Check logs for errors

### Performance Monitoring
**Database**: Query performance via Drizzle logging
**Frontend**: React Query devtools for cache inspection
**WebSocket**: Connection monitoring in browser network tab

---

*This internal reference document should be updated whenever new features are added or architectural decisions are made. Use it to understand existing code and maintain consistency in future development.*