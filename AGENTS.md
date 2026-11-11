# AGENTS.md — INTERACTIVE LMS SERVER (BACKEND)

> Engineering rules, architecture constraints, code style, and development workflows for AI Agents working within `ilms-server/`.
>
> **Core Principle:** Strict module encapsulation, clean Controller-Service separation, standardized Swagger documentation via dedicated decorators, comprehensive unit test coverage, and English-only code conventions with concise functional comments.

---

## 1. TECHNOLOGY STACK OVERVIEW

| Technology | Version / Configuration | Purpose |
| --- | --- | --- |
| **Framework** | NestJS `^11.1.15` (Express platform) | Enterprise Node.js backend framework |
| **ORM** | Prisma `^7.5.0` with `@prisma/adapter-pg` | Database ORM and query builder |
| **Database** | PostgreSQL 16 (Multi-Schema, 10 schemas) | Primary relational database |
| **Vector DB** | pgvector `vector(1536)` | Extension for storing & querying AI Embeddings |
| **Cache & Session** | Redis 8.6 (`ioredis: ^5.10.0`) | Distributed caching and transient data |
| **Object Storage** | MinIO `^8.0.7` | S3-compatible file, media, and document storage |
| **Documentation** | Swagger / OpenAPI (`@nestjs/swagger: ^11.2.6`) | Interactive API docs at `/api/v1/docs` |
| **Testing** | Jest `^30.0.0`, Supertest `^7.0.0`, ts-jest | Unit, integration, and e2e testing |
| **Logging** | Winston `^3.19.0`, winston-loki `^6.1.4` | Structured logging and observability |

---

## 2. CODE STYLE & CODING STANDARDS

### 2.1. English Language Standard for Code, Comments & Swagger

- **Identifiers:** All class names, method names, variables, constants, DTO properties, and database entities MUST be in English.
- **Comments & Formatting:** All inline comments, code notes, and method descriptions MUST be in English.
  - **Single-line Comments:** Use `//` exclusively for 1-line notes.
  - **Multi-line Comments:** Use `/* ... */` exclusively for notes spanning 2 lines or more. Avoid multi-line comment blocks for single-line notes.
- **Explicit Return Types:** All public Service methods MUST declare explicit TypeScript return types (`Promise<ReturnType>`).
- **Module-Scoped Utilities:** Utility functions specific to a feature module MUST reside in `src/modules/{module}/utils/` and MUST NOT be called or imported from outside that module.
- **Swagger Documentation:** All `@ApiOperation({ summary })`, `@ApiOkResponse({ description })`, parameter descriptions, and schema examples MUST be in clear, professional English.
- **100% English Exception & Response Messages:** All exception messages (`BadRequestException`, `NotFoundException`, `ForbiddenException`...) and controller response messages MUST be written in clear, professional English. Never throw Vietnamese strings from the backend.
- **Definite Assignment in DTOs and Entities:** Non-optional properties in DTOs and Entities MUST use definite assignment assertions (`!:`) or explicit initializers to prevent `TS2564: Property has no initializer and is not definitely assigned in the constructor`.
- **FORBIDDEN: Backend Module Forum Freeze:** The `src/modules/forum/` subsystem (including `forums/`, `comments/`, `interfaces/`, `utils/`) is completely implemented, optimized, and strictly frozen. Do NOT modify any files within `src/modules/forum/` unless explicitly instructed and approved by the user.
- **DTO Swagger Declaration Rule:** Every property declaring `@ApiProperty` or `@ApiPropertyOptional` MUST contain `description`, `example`, and `type`.
- **Targeted Code Comments Policy:** Add simple, concise comments ONLY for `controller`, `service`, `facade`, `provider`, `strategy`, `util`, `helper`. For advanced features, explain each step. For `filter` and `interceptor`, annotate code steps (`// Step 1: ...`). DO NOT add comments to `constant`, `decorator`, `guard`, `config`, `interface`, `type`, `spec`, `module`.
- **File Endings:** Every file MUST end with exactly ONE single trailing newline (`\n`), no extra blank lines.
- **Linter & Formatting:** Always run `npm run fix` and ensure 0 errors before reporting.
- **Git Commit Approval:** Never commit git changes automatically. Always await explicit user approval.

```typescript
// Creates a new class, generates a unique course code, and auto-enrolls the teacher
async create(schoolId: string, teacherId: string, dto: CreateClassDto): Promise<ClassEntity> { ... }
```

### 2.2. Naming Conventions

- **Files:** `kebab-case.type.ts` (e.g., `classes.controller.ts`, `create-class.dto.ts`, `create-class.swagger.ts`, `classes.service.spec.ts`).
- **Classes & Decorators:** `PascalCase` (e.g., `ClassesService`, `ApiCreateClass`, `CurrentUser`).
- **Methods & Variables:** `camelCase` (e.g., `findByCourseCode`, `teacherId`).
- **Enums & Constants:** `UPPER_SNAKE_CASE` or `PascalCase` matching Prisma generated output (e.g., `Role.teacher`, `JWT_SECRET`).

---

## 3. THE COMPLETE MODULE RULE (MANDATORY REQUIREMENT)

When implementing or extending any backend module in `src/modules/{module_name}/`, AI Agents **MUST NOT** deliver partial code (e.g., delivering only Controller and Service). Every module or feature addition is considered complete **ONLY** when all 5 elements are implemented:

- **Entity Response Contracts:** Entities in `entities/` MUST be fully typed with `@ApiProperty` / `@ApiPropertyOptional`, serving as the official response contract. Empty or dummy entity classes are strictly forbidden.
- **Microservices-Ready Subsystems (Bounded Contexts):** Modules are organized into subsystem directories reflecting their respective PostgreSQL schemas (`academic`, `assign`, `learning`, `forum`, `auth`, `users`). Each subsystem provides an aggregator module (`academic.module.ts`, `assign.module.ts`, `learning.module.ts`, `forum.module.ts`):
  ```text
  src/modules/
  ├── academic/                    # Subsystem: Academic (schema: academic)
  │   ├── classes/
  │   ├── enrollments/
  │   ├── schools/
  │   └── academic.module.ts
  ├── assign/                      # Subsystem: Assignment & Grading (schema: assign)
  │   ├── assignments/
  │   ├── submissions/
  │   └── assign.module.ts
  ├── learning/                    # Subsystem: Learning Content (schema: learning)
  │   ├── materials/
  │   ├── references/
  │   ├── topics/
  │   └── learning.module.ts
  ├── forum/                       # Subsystem: Forums & Discussions (schema: forum) - STRICTLY FROZEN
  │   ├── forums/
  │   ├── comments/
  │   ├── interfaces/              # Shared forum/comment interfaces
  │   ├── utils/                   # Shared forum/comment utilities & tree builders
  │   └── forum.module.ts
  ├── auth/                        # Subsystem: Authentication & Sessions (schema: auth)
  └── users/                       # Subsystem: User Management (schema: users)
  ```
- **Subsystem Shared Interfaces & Utils:** When a subsystem manages multiple related entities, place cross-cutting domain interfaces in `src/modules/{subsystem}/interfaces/` and shared mapping/utility functions in `src/modules/{subsystem}/utils/`.
- **Anti-God-Class Decomposition:** When a module exceeds 300 lines or encapsulates more than 6 distinct endpoint actions, proactively decompose it into cohesive sub-controllers and sub-services (exemplified by `src/modules/auth/`).

```text
src/modules/{module_name}/
├── {module}.controller.ts       # HTTP request handling & routing
├── {module}.controller.spec.ts  # Controller unit tests (Passing)
├── {module}.service.ts          # Core business logic & database transactions
├── {module}.service.spec.ts     # Service unit tests (Passing)
├── {module}.module.ts           # NestJS module registration
├── dto/                         # Input validation classes
│   ├── create-{entity}.dto.ts
│   ├── update-{entity}.dto.ts
│   └── query-{entity}.dto.ts
├── entities/                    # Output response entity models
│   └── {entity}.entity.ts
└── swagger/                     # Dedicated OpenAPI decorator definitions
    ├── create-{entity}.swagger.ts
    ├── get-{entity}.swagger.ts
    └── update-{entity}.swagger.ts
```

---

## 4. SWAGGER DECORATOR PATTERN (CLEAN CONTROLLER RULE)

Do NOT clutter Controller files with inline Swagger decorators. Follow the established project pattern:

1. Create a dedicated decorator file under `src/modules/{module}/swagger/{action}.swagger.ts`.
2. Use `applyDecorators(...)` from `@nestjs/common` combining:
   - `ApiOperation({ summary: '...' })`
   - `ApiAuth()` (or `@Public()` if unauthenticated)
   - `ApiBody({ type: DtoClass })` (when applicable)
   - `ApiOkResponse({ description: '...', schema: { example: { ... } } })`
   - `ApiQuery(...)` or `ApiParam(...)` (when applicable)
3. In the Controller, apply only the single composite decorator (e.g., `@ApiCreateClass()`).

```typescript
// src/modules/classes/swagger/create-class.swagger.ts
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { CreateClassDto } from '../dto/create-class.dto';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiCreateClass() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new class (teacher/admin only)' }),
    ApiAuth(),
    ApiBody({ type: CreateClassDto }),
    ApiOkResponse({
      description: 'Class created successfully',
      schema: {
        example: {
          id: 'uuid',
          title: 'Web Application Development',
          courseCode: 'SE347-2026',
        },
      },
    }),
  );
}
```

---

## 5. PRISMA 7 & POSTGRESQL MULTI-SCHEMA RULES

- **Import Rule:** Prisma Client is generated to `src/generated/prisma`.
  - **CORRECT:** `import { PrismaService } from 'src/infrastructures/prisma/prisma.service';`
  - **CORRECT:** `import { Role } from 'src/generated/prisma/enums';`
  - **CORRECT:** `import { Prisma } from 'src/generated/prisma/client';`
  - **STRICTLY FORBIDDEN:** `import { ... } from '@prisma/client';` (This will fail compilation).
- **PostgreSQL Multi-Schema:** Database models are partitioned into 10 schemas (`academic`, `auth`, `learning`, `quiz`, `assign`, `forum`, `chat`, `notification`, `ai`, `public`). Always inspect `@@schema("...")` when querying or modifying models.
- **pgvector Extension:** The `ai` schema uses `Unsupported("vector(1536)")` for embeddings. Never alter vector dimension without explicit user instruction.
- **No Direct Push:** Never run `prisma db push` or destructive migration commands.

---

## 6. RESPONSE & EXCEPTION PIPELINE

### 6.1. Standard Response Format (`ResponseInterceptor`)

The global `ResponseInterceptor` wraps all controller return values into a standard envelope:

```json
{
  "success": true,
  "message": "Create class successful",
  "data": { ... }
}
```

- **Array Preservation Rule:** Controller methods returning lists/arrays must return the array directly. `ResponseInterceptor` MUST explicitly check `if (Array.isArray(res))` first to preserve arrays (including empty arrays `[]`) as `data: [...]`. Spreading an array `{ ...payload }` into an indexed object `{ '0': ..., '1': ... }` or collapsing empty arrays into `null` is STRICTLY FORBIDDEN.
- In Controllers, return an object containing `message` and `data` (or return the raw array/object directly for standard queries):

```typescript
return {
  message: 'Create class successful',
  data: result,
};
```

### 6.2. Exception Handling (`HttpExceptionFilter`)

- Throw built-in NestJS exceptions: `BadRequestException`, `NotFoundException`, `ForbiddenException`, `ConflictException`, `UnauthorizedException`.
- The global `HttpExceptionFilter` automatically catches the exception, logs structured details via Winston/Loki, and outputs:

  ```json
  {
    "success": false,
    "statusCode": 404,
    "errorCode": "CLASS_NOT_FOUND",
    "message": "Class not found",
    "data": null,
    "timestamp": "2026-11-01T12:00:00.000Z",
    "path": "/api/v1/classes/123"
  }
  ```

---

## 7. DTO VALIDATION & AUTHORIZATION

- **Validation:** Every input DTO must use `class-validator` decorators (`@IsString()`, `@IsOptional()`, `@IsUUID()`, `@MaxLength()`, `@IsBoolean()`).
- **Swagger Documentation for DTOs:** Every property MUST have `@ApiProperty()` or `@ApiPropertyOptional()` with explicit `description`, `type`, and `example`.
- **Role-Based Access Control:** Use `@Roles(Role.teacher, Role.admin)` combined with the global/route `RolesGuard`.
- **Authenticated User Extraction:** Use `@CurrentUser()` to get the entire `AuthUser` object, or `@CurrentUser('id')` to extract the user UUID directly.
- **API Prefix:** All endpoints reside under `/api/v1/`.

---

## 8. INFRASTRUCTURE SERVICES

- **PrismaService (`src/infrastructures/prisma/`):** Primary database access. Use `$transaction` for atomic multi-model writes.
- **RedisService (`src/infrastructures/redis/`):** Cache lookups, session checks, and transient tokens with explicit TTL.
- **StorageService (`src/infrastructures/storage/`):** MinIO S3 integration. Store file uploads under standardized folders (`StorageFolders.MATERIALS`, `StorageFolders.AVATARS`). Store only the returned object key or URL in PostgreSQL.

---

## 9. UNIT TESTING STANDARDS (JEST)

AI Agents MUST write and execute unit tests for all new services and controllers:

- Place tests next to the source: `{name}.service.spec.ts` and `{name}.controller.spec.ts`.
- Use `Test.createTestingModule(...)` from `@nestjs/testing`.
- Mock `PrismaService`, `RedisService`, and other dependencies using Jest mock functions (`jest.fn()`).
- Verify both happy path, boundary errors, and exception/edge-case scenarios (e.g. NotFoundException, ConflictException, invalid input formats, inactive user states). Testing only successful responses is strictly insufficient.
- Run tests via `npm test` or `npm run test -- {path}` to verify they pass before declaring completion.

---

## 10. FROZEN MODULES (LỆNH KHÓA ĐÓNG BĂNG)

1. **Module Forum (`src/modules/forum/`):** Khóa cứng toàn bộ controllers, services, entities, DTOs, unit tests. Nghiêm cấm tự ý sửa đổi khi chưa có lệnh từ người dùng.
2. **Module Grades & Grade Categories (`src/modules/academic/grades/`, `src/modules/academic/grade-categories/`):** Khóa cứng toàn bộ mã nguồn và unit tests. Tạm khóa đóng băng trước khi triển khai tính năng tính điểm tự động từ bài tập / quiz / meet về sau.
