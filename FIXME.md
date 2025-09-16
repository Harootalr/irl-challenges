# IRL Challenges - FIXME Documentation

**Last Updated**: September 15, 2025  
**Analysis Date**: September 15, 2025

This document contains all critical issues, bugs, and improvements that need to be addressed before deployment and for ongoing maintenance.

---

## 🚨 CRITICAL SECURITY ISSUES (MUST FIX BEFORE DEPLOYMENT)

### 1. JWT Secret Vulnerability - CRITICAL
- **File**: `server/routes.ts` line 24
- **Issue**: Hardcoded fallback `"your-secret-key"` for JWT_SECRET
- **Impact**: Anyone can forge authentication tokens, complete security breach
- **Current Code**: `const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";`
- **Fix**: 
  ```javascript
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  ```
- **Priority**: 🔴 CRITICAL - Fix immediately

### 2. Session Storage Not Production-Ready - CRITICAL
- **File**: `server/routes.ts` lines 65-76
- **Issue**: Using MemoryStoreSession which loses all sessions on restart
- **Impact**: Users logged out on every deployment/restart
- **Current Code**: `store: new MemoryStoreSession({ checkPeriod: 86400000 })`
- **Fix**: Implement persistent session store using Redis or PostgreSQL
- **Options**:
  - Redis: `connect-redis` package
  - PostgreSQL: `connect-pg-simple` (already installed)
- **Priority**: 🔴 CRITICAL - Fix before deployment

### 3. Content Security Policy Disabled - HIGH
- **File**: `server/routes.ts` lines 35-37
- **Issue**: CSP completely disabled in development
- **Impact**: XSS vulnerability in production
- **Current Code**: `contentSecurityPolicy: false`
- **Fix**: Enable and configure proper CSP headers for production
- **Priority**: 🟠 HIGH - Fix before deployment

### 4. WebSocket Security Gaps - HIGH
- **File**: `server/routes.ts` lines 824-832
- **Issue**: No authentication check for WebSocket connections
- **Impact**: Unauthorized users can join challenge rooms and send messages
- **Fix**: Add session validation to WebSocket connections
- **Priority**: 🟠 HIGH - Fix before deployment

---

## ⚠️ HIGH PRIORITY DEPLOYMENT ISSUES

### 5. Missing Environment Variables Documentation - HIGH
- **Issue**: No `.env.example` file exists
- **Impact**: Unclear what environment variables are required
- **Required Variables**:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `NODE_ENV`
  - `VITE_GOOGLE_MAPS_API_KEY` (mentioned in missing secrets)
- **Fix**: Create `.env.example` with all required variables
- **Priority**: 🟠 HIGH - Fix before deployment

### 6. Production Logging System Missing - HIGH
- **File**: `server/middleware/logging.ts` line 38
- **Issue**: Using console.log in production
- **Impact**: No structured logging, difficult debugging, no log rotation
- **Current Code**: `console.log(`[${logData.timestamp}] ...`)`
- **Fix**: Implement proper logging with Winston or Pino
- **Priority**: 🟠 HIGH - Fix before deployment

### 7. Database Performance Issues - MEDIUM
- **File**: `server/storage.ts` lines 139-148
- **Issue**: Basic SQL distance calculation instead of PostGIS
- **Impact**: Poor performance with large venue datasets
- **Current Code**: Uses basic `ABS(CAST(...))` calculations
- **Fix**: Implement PostGIS for geospatial queries
- **Priority**: 🟡 MEDIUM - Can defer but should fix soon

### 8. Error Handling Insufficient - MEDIUM
- **File**: `server/index.ts` lines 46-51
- **Issue**: Basic global error handler just re-throws errors
- **Impact**: Poor error visibility and user experience
- **Fix**: Implement comprehensive error handling with proper status codes
- **Priority**: 🟡 MEDIUM - Fix before deployment

---

## 📊 PERFORMANCE & OPTIMIZATION ISSUES

### 9. Frontend Performance Bottlenecks - ✅ FIXED
- **File**: `client/src/components/real-map.tsx`
- **Issue**: Excessive marker recreation and distance recalculation
- **Status**: ✅ **COMPLETED** - Incremental marker updates implemented
- **Fix Applied**: Added keyed marker tracking, throttled updates, batched DOM operations

### 10. Hardcoded Configuration Values - LOW
- **Files**: Throughout codebase
- **Examples**:
  - Rate limit values: `server/routes.ts` lines 40-48
  - Distance thresholds: `client/src/components/real-map.tsx`
  - Colors and styles: `client/src/index.css`
- **Impact**: Difficult to tune for different environments
- **Fix**: Move to configuration files or environment variables
- **Priority**: 🟢 LOW - Can defer

### 11. Missing Database Indexes - MEDIUM
- **File**: `shared/schema.ts`
- **Issue**: Missing indexes on frequently queried columns
- **Impact**: Slow database queries as data grows
- **Missing Indexes**:
  - `users.email` (unique constraint should have index)
  - `venues.city` 
  - `challengeParticipants.userId`
  - `challenges.hostId`
  - `messages.challengeId`
- **Fix**: Add database indexes
- **Priority**: 🟡 MEDIUM - Add during next database update

---

## 🔧 CODE QUALITY ISSUES

### 12. TODO Comments and Technical Debt - ✅ FIXED
- **File**: `client/src/index.css` lines 346-383
- **Issue**: Accessibility TODO for motion preferences
- **Status**: ✅ **COMPLETED** - Prefers-reduced-motion implemented

### 13. Console Errors in Production - LOW
- **File**: `client/src/hooks/use-websocket.tsx` line 46
- **Issue**: `console.error('WebSocket error:', error);` in production code
- **Fix**: Replace with proper error reporting system
- **Priority**: 🟢 LOW - Clean up when time allows

### 14. Deprecated/Unused Code - LOW
- **File**: `shared/schema.ts` - results table marked as legacy
- **Issue**: Dead code and unused database tables
- **Fix**: Clean up deprecated schemas and migrations
- **Priority**: 🟢 LOW - Clean up when time allows

---

## 🌐 INFRASTRUCTURE & DEPLOYMENT

### 15. CORS Configuration Missing - MEDIUM
- **Issue**: No explicit CORS configuration visible in server setup
- **Impact**: Potential cross-origin security issues
- **Fix**: Configure CORS with specific allowed origins for production
- **Priority**: 🟡 MEDIUM - Fix before deployment

### 16. Cookie Security Settings - MEDIUM
- **File**: `server/routes.ts` line 72
- **Issue**: `secure: false` cookie setting
- **Impact**: Cookies not secure over HTTPS in production
- **Fix**: Set `secure: true` for production with HTTPS
- **Priority**: 🟡 MEDIUM - Fix before deployment

### 17. Build Configuration Issues - LOW
- **File**: `package.json` build script
- **Issue**: No production optimizations specified
- **Fix**: Add production-specific build optimizations
- **Priority**: 🟢 LOW - Optimize later

---

## 🎯 PRIORITY RANKING FOR DEPLOYMENT

### **MUST FIX BEFORE DEPLOYMENT** 🔴
1. **JWT Secret vulnerability** (#1) - Security breach risk
2. **Session storage** (#2) - Users will be logged out constantly
3. **WebSocket security** (#4) - Unauthorized access to challenges
4. **Environment variables** (#5) - Deployment will fail without proper config

### **SHOULD FIX BEFORE DEPLOYMENT** 🟠
5. **CSP headers** (#3) - XSS protection
6. **Production logging** (#6) - Essential for debugging production issues
7. **Error handling** (#8) - Better user experience
8. **Cookie security** (#16) - HTTPS security
9. **CORS configuration** (#15) - Security best practice

### **CAN FIX AFTER DEPLOYMENT** 🟡
10. **Database performance** (#7) - Optimize as needed
11. **Database indexes** (#11) - Add during maintenance window
12. **Hardcoded values** (#10) - Configuration improvement

### **LOW PRIORITY CLEANUP** 🟢
13. **Console statements** (#13) - Code quality
14. **Deprecated code** (#14) - Technical debt
15. **Build optimizations** (#17) - Performance improvements

---

## 📋 DEPLOYMENT CHECKLIST

### Security & Authentication
- [ ] Remove JWT_SECRET fallback, require environment variable
- [ ] Configure persistent session store (PostgreSQL recommended)
- [ ] Enable Content Security Policy headers for production
- [ ] Add WebSocket authentication middleware
- [ ] Set secure cookie settings for HTTPS
- [ ] Configure CORS for production origins

### Configuration & Environment
- [ ] Create comprehensive .env.example file
- [ ] Document all required environment variables
- [ ] Set up production environment variables securely
- [ ] Configure database connection for production

### Logging & Monitoring
- [ ] Implement structured logging system (Pino recommended)
- [ ] Set up proper error handling and monitoring
- [ ] Configure log rotation and storage
- [ ] Set up health check endpoints

### Performance & Database
- [ ] Add database indexes for frequently queried columns
- [ ] Consider PostGIS setup for geospatial queries
- [ ] Optimize database connection pooling
- [ ] Set up database backup strategy

### Code Quality
- [ ] Remove console.log statements from production code
- [ ] Clean up deprecated code and schemas
- [ ] Add production build optimizations
- [ ] Set up automated testing (if not already present)

---

## 📞 EMERGENCY CONTACTS & RESOURCES

### Critical Security Issues
- If JWT_SECRET is compromised: Rotate immediately, all users must re-login
- If database breach suspected: Review all session data, rotate secrets

### Performance Monitoring
- Monitor WebSocket connection counts
- Watch database query performance
- Track memory usage with session storage

### Deployment Resources
- Database migration strategy needed for schema changes
- Session store migration plan required
- Environment variable management system needed

---

## 📝 NOTES FOR DEVELOPERS

### Development vs Production
- Many issues are development-specific (console.log, CSP disabled)
- Ensure production environment has all security measures enabled
- Test deployment process in staging environment first

### Architecture Strengths
- ✅ Solid TypeScript implementation across full stack
- ✅ Good use of Drizzle ORM with proper schemas
- ✅ React Query for efficient state management
- ✅ WebSocket real-time messaging implemented
- ✅ Performance optimizations already applied to map rendering
- ✅ Accessibility considerations (prefers-reduced-motion)

### Recommended Next Steps
1. Fix critical security issues (#1-4)
2. Set up staging environment for testing
3. Implement logging and monitoring
4. Plan database optimization strategy
5. Create automated deployment pipeline

---

**End of FIXME Documentation**

*This document should be updated as issues are resolved and new ones are discovered.*