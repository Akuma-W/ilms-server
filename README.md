# Interactive LMS Backend

![Interactive LMS Logo](./assets/logo.svg)

Interactive LMS Backend is the core API service for the Interactive Learning Management System, built with NestJS 11 and PostgreSQL 16. It delivers secure, scalable backend services for academic management, real-time collaboration, object storage, and AI-powered educational tools.

## Tech Stack

- **Core & Language**: TypeScript `^5.9.3`, NestJS `^11.1.15` (Modular architecture), Node.js `24-alpine`
- **Database & ORM**: PostgreSQL 16 (10 multi-schemas), Prisma ORM `^7.5.0`, pgvector (`vector(1536)` for AI embeddings)
- **Caching & Storage**: Redis 8.6 (`ioredis: ^5.10.0`), MinIO `^8.0.7` (S3-compatible object storage)
- **Authentication & Security**: Passport.js (JWT, Google OAuth2), Bcrypt `^6.0.0`, Helmet `^8.1.0`, Cookie-Parser
- **Documentation**: Swagger / OpenAPI (`@nestjs/swagger: ^11.2.6` at `/api/v1/docs`)
- **Notifications**: Nodemailer `^7.0.12` (Email SMTP), Twilio `^5.11.1` (SMS)
- **Logging & Monitoring**: Winston `^3.19.0`, Loki 3.4, Grafana 11.5
- **DevOps**: Docker Multi-stage, Docker Compose (Modular infra/app/monitoring), Traefik v3.6.7 (SSL reverse proxy)

## Features

- **Authentication & RBAC**: JWT with HttpOnly cookies, Google OAuth2, and role control (Admin, Teacher, Student).
- **Classroom & Enrollment**: Class lifecycle management, secure 6-character join codes, and approval workflows.
- **Curriculum & Materials**: Topic tree navigation, document attachments, and multi-source video streaming.
- **Assignments & Grading**: Homework creation, deadline tracking, S3 file submissions, and grading records.
- **Quiz Engine**: Timed quiz attempts, automated scoring, and detailed performance analytics.
- **Collaboration**: Automated Google Meet spaces, discussion forums with anonymous posting, and messaging.
- **AI Services**: pgvector semantic search (RAG), automated question generation, and 24h task detection.
- **Notifications**: Multi-channel notification pipeline (In-app, Email SMTP, and SMS).

## Installation & Run

### Prerequisites

- Node.js `>= 20.x`
- npm `>= 10.x`
- Docker & Docker Compose (for PostgreSQL, Redis, MinIO)

### 1. Clone Project

```bash
git clone https://github.com/Akuma-W/ilms-server.git
cd ilms-server
```

### 2. Setup Environment

Create local `.env` file:

```bash
cp .env.example .env
```

Configure `.env`:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
APP_DOMAIN=localhost
MINIO_DOMAIN=files.localhost

DATABASE_URL=postgresql://your_user:your_password@localhost:5432/ilms_db
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=ilms_db
POSTGRES_PORT=5432

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

MINIO_INTERNAL_ENDPOINT=localhost
MINIO_PORT=9090
MINIO_CONSOLE_PORT=9001
MINIO_USERNAME=your_user
MINIO_PASSWORD=your_password
MINIO_BUCKET=ilms-bucket
MINIO_PUBLIC_ENDPOINT=localhost:9090
STORAGE_DRIVER=minio
```

### 3. Running with Docker

Start infrastructure services (PostgreSQL, Redis, MinIO):

```bash
docker compose --env-file .env -f docker/docker-compose.infra.yaml up -d
```

Start backend server in Docker:

```bash
docker compose --env-file .env -f docker/docker-compose.yaml up -d --build
```

### 4. Running for Local Development

1. Start infrastructure services (Step 3).
2. Install dependencies, generate Prisma client, and run migrations:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
```

3. Start development server:

```bash
npm run start:dev
```

Service endpoints:

- API Root: `<http://localhost:5000/api/v1>`
- Swagger Docs: `<http://localhost:5000/docs>`
- MinIO Console: `<http://localhost:9001>`

## Folder Structure

```text
ilms-server/
├── assets/                 # Brand assets and logo
├── docker/                 # Modular Docker Compose and Traefik configs
│   ├── configs/            # Loki and Grafana configs
│   ├── traefik/            # Traefik proxy and certificate configs
│   ├── docker-compose.infra.yaml       # PostgreSQL, Redis, MinIO
│   ├── docker-compose.monitoring.yaml  # Grafana and Loki stack
│   ├── docker-compose.traefik.yaml     # Reverse proxy and SSL
│   └── docker-compose.yaml             # Backend application service
├── prisma/                 # Prisma schema and migration files
├── src/
│   ├── common/             # Global filters, guards, interceptors, DTOs
│   ├── config/             # Environment configuration module
│   ├── generated/          # Generated Prisma Client runtime
│   ├── health/             # Health check endpoints
│   ├── infrastructures/    # External services (Redis, MinIO, Notification)
│   ├── logger/             # Centralized Winston and Loki logger
│   ├── modules/            # Business modules (auth, classes, topics, etc.)
│   ├── app.module.ts       # Root NestJS module
│   └── main.ts             # Application entrypoint
├── test/                   # End-to-end tests
├── .dockerignore           # Docker build ignore rules
├── .env.example            # Environment template
├── Dockerfile              # Multi-stage production container
├── package.json            # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## Contribution

- Contact and contributions:
  - Author: Tran Tuan Phong
  - Email: <tuanphongbrvt1@gmail.com>
  - GitHub: [Akuma-W](https://github.com/Akuma-W)

## Lisence

This project is open-source and licensed under the [MIT License](https://opensource.org/licenses/MIT). You are free to use, modify, and distribute this software for educational, academic, and study purposes.
