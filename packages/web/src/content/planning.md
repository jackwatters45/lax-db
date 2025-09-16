# Lax DB - Project Planning

## Overview

Lax DB aims to better equip lacrosse players with modern tools and features to enhance their game performance and overall experience. The platform will provide a comprehensive suite of tools for players, coaches, and teams to optimize their gameplay, improve communication, and streamline administrative tasks.

## Current Status

### ✅ Completed Features

- **Core Infrastructure**: SST deployment setup with AWS
- **Database Layer**: Drizzle ORM with PostgreSQL
- **Authentication**: Better Auth with Google OAuth
- **Redis Integration**: Effect-based Redis service for caching
- **Frontend**: TanStack Router with React 19
- **Styling**: Tailwind CSS with custom design system

### 🚧 In Progress

- **Effect Service Migration**: Converting Redis client to Effect service
- **UI Components**: Building reusable component library
- **API Routes**: Setting up backend endpoints

### 📋 Planned Features

#### Team Oriented

#### Coach Oriented

#### Player Oriented

---

## Technical Architecture

### Backend Stack

- **Framework**: SST (Serverless Stack)
- **Database**: PostgreSQL with Drizzle ORM (would eventually like to switch to Planetscale Postgres)
- **Cache**: Redis with Effect service
- **Auth**: Better Auth with Google OAuth
- **Payments**: Polar.sh with Better Auth plugin
- **Language**: TypeScript with Effect library

### Frontend Stack

- **Framework**: React 19 with TanStack Start
- **Styling**: Tailwind CSS with Typography plugin
- **State Management**: Effect for business logic
- **Build Tool**: Vite

### Infrastructure

- **Cloud Provider**: AWS
- **Deployment**: SST

### Planned Additions

- **Zero Sync Engine**: Add Zero DB sync engine for faster data synchronization
- **Logs**: Cloudwatch
- **API**: Honojs Api
- **Mobile**: Expo for Mobile

---

_Last updated: September 16, 2025_

_This document is living and will be updated regularly as the project evolves._
