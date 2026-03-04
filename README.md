# Test Server

## Description

This is the Test Server built with NestJS framework. It serves as a skeleton project setup for building scalable server-side applications.

## Technology

- **NestJS** - Progressive Node.js framework
- **Prisma** - Next-generation ORM
- **Docker** - Containerization platform
- **PostgreSQL** - Relational database

## Project Setup

```bash
# Clone the repository and create .env from .env.example
cp .env.example .env

# Create Docker network
docker network create test-network

# Set up infrastructure and database
docker compose -f compose.infra.yaml up -d
```

## Compile and Run the Project

### Using Docker Compose

```bash
# Build and start the project with Docker
docker compose up -d

# View logs
docker compose logs -f

# Stop the project
docker compose down
```

### Local Development

```bash
# Install dependencies and generate Prisma client
npm install
npm run prisma:generate

# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

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

- Author - [Tran Tuan Phong]
- Email - [phongtt@runsystem.net](phongtt@runsystem.net)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
