# Task 1: Repo Init & Tooling

> **Read PLAN.md first** for full context.

## Prerequisites

- Bun installed (`bun -v`)

## Goal

Initialize the root of the monorepo, configure Turborepo, and set up the shared configuration packages (`tooling/*`) to ensure a consistent developer experience across apps and packages.

## Files to Modify

| File                   | Action | Description               |
| ---------------------- | ------ | ------------------------- |
| `package.json`         | Create | Root workspace config     |
| `turbo.json`           | Create | Turbo pipeline config     |
| `bun.lockb`            | Create | Lockfile (auto-generated) |
| `tooling/typescript/*` | Create | Shared tsconfigs          |
| `tooling/eslint/*`     | Create | Shared eslint configs     |
| `tooling/tailwind/*`   | Create | Shared tailwind preset    |

## Steps

### 1. Root Setup

**File**: `package.json`
**Action**: Create

Initialize the project with Bun workspaces.

```json
{
  "name": "poynt-monorepo",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "clean": "turbo clean"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "^5.0.0",
    "prettier": "latest"
  },
  "packageManager": "bun@1.0.0",
  "workspaces": ["apps/*", "packages/*", "tooling/*"]
}
```

**File**: `turbo.json`
**Action**: Create

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

### 2. TypeScript Config

**File**: `tooling/typescript/package.json`
**Action**: Create

```json
{
  "name": "@poynt/typescript-config",
  "version": "0.0.0",
  "private": true,
  "license": "MIT",
  "main": "base.json",
  "exports": {
    "./base": "./base.json",
    "./nextjs": "./nextjs.json",
    "./react": "./react.json"
  }
}
```

**File**: `tooling/typescript/base.json`
**Action**: Create
Standard strict TS config.

### 3. ESLint Config

**File**: `tooling/eslint/package.json`
**Action**: Create

```json
{
  "name": "@poynt/eslint-config",
  "version": "0.0.0",
  "private": true,
  "dependencies": {
    "eslint-config-next": "^14.0.0",
    "eslint-config-prettier": "^9.0.0"
  },
  "main": "index.js"
}
```

**File**: `tooling/eslint/next.js`
**Action**: Create

### 4. Tailwind Config

**File**: `tooling/tailwind/package.json`
**Action**: Create

```json
{
  "name": "@poynt/tailwind-config",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./tailwind.config.ts"
  },
  "dependencies": {
    "tailwindcss": "^3.4.0",
    "tailwindcss-animate": "^1.0.7"
  }
}
```

**File**: `tooling/tailwind/tailwind.config.ts`
**Action**: Create
Export a standard configuration preset.

## Verification

### Automated

```bash
bun install
bun turbo build --dry-run
```

- [ ] Lockfile generated
- [ ] Turbo pipeline is valid
