# T3 Stack Project

## Overview
This is a T3 Stack application with:
- Next.js (React framework)
- TypeScript
- tRPC (type-safe API)
- Prisma (database ORM)
- NextAuth.js (authentication)
- Tailwind CSS (styling)
- Swagger UI (API documentation)

## Database Schema
- **User**: Authentication and user data
- **Post**: User-created posts (linked to User)

## Getting Started
1. Install dependencies: `npm install`
2. Set up environment variables in `.env`
3. Run database migrations: `npx prisma db push`
4. Start development server: `npm run dev`

## API Documentation
Access Swagger UI at `/api/swagger` when the server is running.

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npx prisma studio` - Open Prisma database GUI
- `npx prisma db push` - Push schema changes to database
