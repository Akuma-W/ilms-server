# KEIVerse - Interactive Learning Management System (ILMS) Server

<p align="center">
  <img src="assets/logo.svg" width=180 alt="KEIVerse Logo" />
</p>

## Description

**KEIVerse** is an AI-powered Interactive Learning Management System (ILMS) designed to transform how universities manage and deliver learning experiences.

It provides a unified platform for managing educational resources while fostering meaningful interactions between lecturers and students through modern collaboration tools and AI assistance.

## Key Features

- 🔐 Authentication with Google OAuth
- 🏫 Classroom management (join lecturer-created classes)
- 📚 Topic-based content organization
- 📝 Create and manage:
  - Lessons
  - Learning materials
  - Quiz assignments
- 💬 Forum for Q&A between students and lecturers
- 🧠 AI Assistant for:
  - Content generation
  - Learning support Q&A
  - Quiz generation
- 🎯 Online & offline interaction support
- 📊 Quiz-based revision system

## Technology

- **Core**:
  - **NestJS** - Scalable Node.js backend framework
  - **TypeScript** - Strongly typed JavaScript
  - **Prisma** - ORM for database management
  - **PostgreSQL** - Relational database
- **Infrastructure & Tools**:
  - **Docker & Docker Compose** – Containerized development & deployment
  - **Redis** – Caching & performance optimization
  - **MinIO** – Object storage (S3-compatible)
  - **Swagger (OpenAPI)** – API documentation
- **Monitoring & Logging**:
  - **Grafana** – Visualization & monitoring
  - **Loki** – Log aggregation

## Project Setup

### 1. Clone repository

```bash
git clone https://github.com/phongtt-gmo/interactive-lms-server.git
cd interactive-lms-server
```

### 2. Setup environment variables

Create `.env` file from example:

```bash
cp .env.example .env
```

Update the required values:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `REDIS_HOST`
- `MINIO_*`
- Other configs if needed

### 3. Install dependencies

```bash
npm install
```

### 4. Setup database

Before running the project, generate Prisma client and run migrations:

```bash
npm run prisma:migrate
npm run prisma:generate
```

(Optional) Seed initial data:

```bash
npm run prisma:seed
```

Seed data may include:

- Default school
- Sample users

## Compile and Run the Project

### Using Docker (Recommended)

Navigate to the docker folder:

```bash
cd docker
```

#### 1. Start infrastructure services

```bash
docker compose -f compose.infra.yaml up -d
```

Includes:

- PostgreSQL
- Redis
- MinIO

#### 2. Start backend server

```bash
docker compose -f compose.yaml up -d
```

#### 3. (Optional) Start monitoring stack

```bash
docker compose -f compose.monitoring.yaml up -d
```

Includes:

- Grafana
- Loki

### Local Development

Make sure you already have:

- PostgreSQL
- Redis
- MinIO (optional but recommended)

Run the server:

```bash
npm run start:dev
```

Server will run at `PORT=5000`:
`http://localhost:5000`

### API Information

- Base URL:
`http://localhost:5000/api/v1`

- Swagger Documentation:
`http://localhost:5000/docs`

## Run Tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Stay in Touch

- **Author**: [Tran Tuan Phong]
- **Email**: [phongtt@runsystem.net](phongtt@runsystem.net)
- **Github**: [phongtt-gmo](https://github.com/phongtt-gmo)

## License

This project is licensed under the company's internal license.

Please contact the author or organization for more details.
