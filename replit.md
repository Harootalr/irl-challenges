# IRL Challenges

## Overview

IRL Challenges is a location-based gaming platform that connects players for in-person challenges at real venues. The application enables users to discover, create, and participate in gaming challenges anchored to verified venues like bars, pool halls, and gaming centers. Key features include GPS-verified check-ins, real-time messaging, results tracking with mutual confirmation, and a comprehensive rating system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state, React hooks for local state
- **Navigation**: Custom client-side routing with history management
- **Real-time Features**: WebSocket integration for live messaging

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Session-based auth with bcrypt password hashing
- **API Design**: RESTful endpoints with WebSocket support for real-time features
- **File Structure**: Modular separation with shared schemas between client and server

### Database Design
- **Primary Models**: Users, Venues, Challenges, Participants, Messages, Results, Reviews, Reports, Promotions
- **Key Relationships**: Many-to-many challenge participation, hierarchical venue-challenge structure
- **Geospatial Support**: Latitude/longitude storage for venue positioning and proximity queries
- **Data Validation**: Zod schemas for runtime type checking and validation

### Authentication & Authorization
- **Authentication Method**: Email/password with session management
- **Session Storage**: Memory store with configurable expiration
- **Role-based Access**: Three-tier system (user, venue_admin, super_admin)
- **Security Features**: CSRF protection, input validation, password hashing

### Real-time Communication
- **WebSocket Implementation**: Native WebSocket server with room-based message routing
- **Message Broadcasting**: Challenge-specific chat rooms with participant filtering
- **Connection Management**: Automatic reconnection and connection state tracking

### Mobile-First Design
- **Responsive Layout**: Tailwind breakpoints optimized for mobile devices
- **Touch Interactions**: Gesture-friendly UI components and navigation
- **Performance**: Lazy loading and optimized bundle splitting
- **PWA Ready**: Service worker capabilities and offline-first considerations

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL via Neon serverless platform
- **Build Tools**: Vite for frontend bundling, esbuild for server compilation
- **Development Platform**: Replit integration with live reload capabilities

### UI Component Libraries
- **Radix UI**: Accessible component primitives for complex interactions
- **Tailwind CSS**: Utility-first styling with custom design system
- **Lucide Icons**: Consistent iconography throughout the application

### Data Management
- **TanStack Query**: Server state caching and synchronization
- **React Hook Form**: Form validation and submission handling
- **Zod**: Runtime schema validation and type safety

### Authentication & Security
- **bcrypt**: Password hashing and verification
- **express-session**: Session management middleware
- **CORS**: Cross-origin request handling

### Geolocation Services
- **Browser Geolocation API**: User position tracking for venue proximity
- **GPS Verification**: Location-based check-in validation within 100-meter radius

### Development Tools
- **TypeScript**: Static type checking across full stack
- **ESLint/Prettier**: Code formatting and quality enforcement
- **Drizzle Kit**: Database migration and schema management