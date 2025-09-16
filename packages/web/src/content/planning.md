# Lax DB - Project Planning

## Overview

Lax DB aims to better equip lacrosse players with modern tools and features to enhance their game performance and overall experience. The platform will provide a comprehensive suite of tools for players, coaches, and teams to optimize their gameplay, improve communication, and streamline administrative tasks.

## Current Status

### 🚧 In Progress

- begin setting up teams
  - create team (be able to upload with csv or something)
  - add athletes
  - add schedule
  - add stats

### 📋 Planned Features

- whiteboard
- scouting reports for other teams
- add db of sets, plays, etc
- allow tracking/planning of workouts
- film review feature
- add db of moves with drills, examples, players to study, etc for players
- some crazy ai film evals

### ✅ Completed Features

- [x] **Core Infrastructure**: SST deployment setup with AWS
- [x] **Database Layer**: Drizzle ORM with PostgreSQL
- [x] **Authentication**: Better Auth with Google OAuth
- [x] **Redis Integration**: Effect-based Redis service for caching
- [x] **Frontend**: TanStack Router with React 19
- [x] **Styling**: Tailwind CSS with custom design system

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

---

_Last updated: September 16, 2025_
