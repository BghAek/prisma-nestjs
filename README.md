# Prisma 7 + NestJS V11 Complete Setup Guide

This guide provides step-by-step instructions for setting up Prisma 7 with NestJS V11 without errors and with full compatibility.

## Table of Contents

1. [Create a New NestJS Project](#1-create-a-new-nestjs-project)
2. [Install Prisma Dependencies](#2-install-prisma-dependencies)
3. [Initialize Prisma ORM](#3-initialize-prisma-orm)
4. [Configure Prisma Schema](#4-configure-prisma-schema)
5. [Set up Database Connection](#5-set-up-database-connection)
6. [Define Your Data Model](#6-define-your-data-model)
7. [Create and Apply Your First Migration](#7-create-and-apply-your-first-migration)
8. [Generate Prisma Client](#8-generate-prisma-client)
9. [Create and Configure Prisma Service](#9-create-and-configure-prisma-service)
10. [Import Prisma Service](#10-import-prisma-service)

---

## 1. Create a New NestJS Project

Start by creating a new NestJS project:

```bash
nest new project-name
```

This will scaffold a new NestJS application with all necessary dependencies.

---

## 2. Install Prisma Dependencies

Install Prisma and related dependencies:

### Development Dependencies
```bash
npm install prisma @types/pg --save-dev
```

### Production Dependencies
```bash
npm install @prisma/client @prisma/adapter-pg pg dotenv
```

---

## 3. Initialize Prisma ORM

Initialize Prisma in your project:

```bash
npx prisma init
```

This command will create:
- A `prisma/` folder
- A `.env` file for environment variables
- A `prisma/schema.prisma` file

---

## 4. Configure Prisma Schema

Update your `prisma/schema.prisma` file with the following configuration:

```prisma
generator client {
  provider = "prisma-client"
  // Add src directory for generated files
  output = "../src/generated/prisma"
  // Required for Prisma 7 compatibility with CommonJS modules
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Important Notes:**
- The `output` path tells Prisma to generate the client in `src/generated/prisma`
- `moduleFormat = "cjs"` is essential for full compatibility with NestJS

---

## 5. Set up Database Connection

Add your PostgreSQL connection string to the `.env` file:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/mydb?schema=public"
```

**For Neon PostgreSQL:**
- Log in to your Neon dashboard
- Copy your connection string
- Paste it into the `.env` file

---

## 6. Define Your Data Model

Update your `prisma/schema.prisma` file with your data models. Here's an example with User and Post models:

```prisma
generator client {
  provider = "prisma-client"
  output = "../src/generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  content   String?
  published Boolean @default(false)
  author    User    @relation(fields: [authorId], references: [id])
  authorId  Int
}
```

---

## 7. Create and Apply Your First Migration

Create your first migration:

```bash
npx prisma migrate dev --name init
```

This command will:
- Create a migration file in `prisma/migrations/`
- Apply the migration to your database
- Generate the Prisma Client

---

## 8. Generate Prisma Client

Generate the Prisma Client explicitly (usually done automatically in step 7, but can be run separately):

```bash
npx prisma generate
```

This generates TypeScript types and the Prisma Client in `src/generated/prisma/`.

---

## 9. Create and Configure Prisma Service

Generate a new NestJS service for Prisma:

```bash
nest g service prisma
```

Update the generated `src/prisma/prisma.service.ts` with the following code:

```typescript
import 'dotenv/config';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$queryRaw`SELECT 1`;
      Logger.log('Database connection successful!');
    } catch (error) {
      Logger.error('Database connection failed', error);
      throw error;
    }
  }
}
```

**Key Points:**
- Extends `PrismaClient` for full ORM functionality
- Implements `OnModuleInit` to validate database connection on startup
- Uses `PrismaPg` adapter for PostgreSQL
- Imports from `src/generated/prisma/client` (the generated client)

---

## 10. Import Prisma Service

### Create a Prisma Module

Generate a module for Prisma:

```bash
nest g module prisma
```

Update `src/prisma/prisma.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**Important:** Always export `PrismaService` so other modules can inject it.

### Use Prisma in Your Services

Import `PrismaModule` in your feature modules:

```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

Then inject `PrismaService` in your services:

```typescript
import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateUserDto: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async remove(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
```

---

## Common Issues & Solutions

### Issue: Dependency Resolution Error
**Problem:** `Nest can't resolve dependencies of the UsersService`

**Solution:** Make sure:
1. `PrismaModule` exports `PrismaService`
2. Your feature module imports `PrismaModule`

### Issue: Generated Client Not Found
**Problem:** `Cannot find module 'src/generated/prisma/client'`

**Solution:** Run `npx prisma generate` to generate the client

### Issue: Database Connection Failed
**Problem:** Logger shows "Database connection failed"

**Solution:** 
- Verify `DATABASE_URL` in `.env` is correct
- Ensure PostgreSQL server is running
- Check network connectivity to the database

---

## Running Your Application

### Development Mode
```bash
npm run start:dev
```

### Production Build
```bash
npm run build
npm run start:prod
```

---

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma with NestJS Guide](https://docs.nestjs.com/recipes/prisma)
