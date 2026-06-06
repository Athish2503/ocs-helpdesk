# OCS Helpdesk

## Project Type

AI-powered Helpdesk Platform

## Stack

Frontend:
- Next.js 15
- TypeScript
- Tailwind
- ShadCN

Backend:
- Express.js
- TypeScript
- Prisma

Database:
- PostgreSQL

AI:
- Google Gemini

Infrastructure:
- Docker Compose
- VPS
- Nginx

## Architecture

apps/
  web/
  api/

packages/
  ui/
  shared/
  types/
  config/

## Rules

- Use TypeScript everywhere
- Use Prisma only for database access
- Never write raw SQL unless required
- Keep business logic inside modules
- Shared types go to packages/types
- Shared UI goes to packages/ui
- Use Zod validation
- Keep components small
- Avoid premature optimization

## Current Phase

Sprint 1

## Current Goal

Authentication
Ticket creation
Ticket tracking