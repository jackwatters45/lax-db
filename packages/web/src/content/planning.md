# Lax DB - Project Planning

- I kind of want to add livestore with cloudflare???

- // TODO: root players page
- // TODO: individual player page
- // TODO: add fields - if no field set for team some specific stuff ie position

## Overview

Lax DB aims to better equip lacrosse players with modern tools and features to enhance their game performance and overall experience. The platform will provide a comprehensive suite of tools for players, coaches, and teams to optimize their gameplay, improve communication, and streamline administrative tasks.

## Current Status

### 🚧 In Progress

- **Team Management**: Team creation, roster management, coaching staff organization
- **Organization Management**: Multi-team organization structure and administration
- **Player Management**: Individual player profiles, development tracking, goal setting

### 📋 Planned Features

#### Features with Mock UI (Ready for Development)

- **Game Management System**: Game scheduling, roster management, and game tracking
- **Playbook Management**: Digital playbook with play creation, categorization, and assignments
- **Scouting System**: Opponent team analysis, scouting reports, and strategic insights
- **Practice Planning**: Drill bank, practice templates, session management, and scheduling
- **Game Film Integration**: Upload/link game footage with timestamped events
- **Advanced Statistics**: Shot charts, possession analytics, player performance metrics
- **Game Reports**: Automated post-game analysis and player evaluations
- **Overall Calendar System**: Unified calendar for club access to view practices, games, and team events

#### Future Features (Not Started)

- **Whiteboard**: Digital whiteboard for play drawing and strategy sessions
- **AI Film Analysis**: Automated game film evaluation and insights
- **Learning Management**: Rules & strategy library, video tutorials, quizzes
- **Recruitment Tools**: Player highlight reels, college recruiting profiles, showcase tracking
- **Mobile App**: Offline capability, GPS integration, camera integration, fitness tracker sync

#### Small Features

- **Export Table Contents**: Export table contents to CSV or Excel format. Export entire table contents or use bulk edit to control exported rows.

### ✅ Completed Features

#### Core Platform

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

_Last updated: September 20, 2025_

_This document is living and will be updated regularly as the project evolves._
