# IRL Challenges

A location-based gaming platform that connects players for in-person challenges at real venues across Sweden. Features GPS-verified check-ins, real-time messaging, results tracking, and a comprehensive rating system.

## Features

### Core Functionality
- **Location-Based Gaming**: Discover and participate in gaming challenges at verified venues
- **GPS Check-In**: Secure location verification within 100-meter radius of venues
- **Real-Time Chat**: Live messaging system for challenge participants
- **Results Tracking**: Mutual confirmation system for game outcomes
- **Rating & Reviews**: Comprehensive player and venue rating system

### User Experience
- **Mobile-First Design**: Optimized for mobile devices with responsive layout
- **Glass-Morphism UI**: Modern purple/violet theme with sophisticated visual effects
- **Dark/Light Mode**: Automatic theme switching support
- **Progressive Web App**: Fast, app-like experience in the browser

### Admin Features
- **Venue Management**: Admin dashboard for venue approval and management
- **User Moderation**: Comprehensive user management and reporting system
- **Analytics**: Real-time analytics and export capabilities
- **Challenge Oversight**: Monitor and manage ongoing challenges

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling with custom design system
- **Shadcn/UI** components built on Radix UI primitives
- **TanStack Query** for server state management
- **Framer Motion** for animations (optimized for performance)
- **Vite** for fast development and building

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** database with Neon serverless
- **Drizzle ORM** for database operations
- **WebSocket** integration for real-time features
- **bcrypt** for password hashing
- **Session-based authentication**

### Infrastructure
- **Replit** development environment
- **Git** version control with GitHub integration
- **Environment-based configuration**
- **Request logging and monitoring**

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Replit account (recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Harootalr/irl-challenges.git
cd irl-challenges
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Database
DATABASE_URL=your_postgresql_connection_string

# Session Secret
JWT_SECRET=your_jwt_secret_key

# Optional: Google Maps API for enhanced location features
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and configurations
│   │   └── index.css       # Global styles and theme
├── server/                 # Express backend
│   ├── routes/             # API route handlers
│   ├── middleware/         # Express middleware
│   ├── storage.ts          # Database operations
│   └── websocket.ts        # WebSocket server
├── shared/                 # Shared TypeScript definitions
│   └── schema.ts           # Database schema and types
└── package.json
```

## Key Features Explained

### Authentication System
- Secure session-based authentication
- Password hashing with bcrypt
- Role-based access control (user, venue_admin, super_admin)

### Location Services
- Browser Geolocation API integration
- GPS verification for venue check-ins
- Proximity-based venue discovery

### Real-Time Communication
- WebSocket server for live messaging
- Challenge-specific chat rooms
- Automatic reconnection handling

### Database Design
- PostgreSQL with Drizzle ORM
- Comprehensive schema covering users, venues, challenges, messages, results
- Optimized queries for location-based searches

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Project created by Harootalr

Repository: https://github.com/Harootalr/irl-challenges
