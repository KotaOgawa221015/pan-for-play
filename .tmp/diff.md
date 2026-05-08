diff --git a/.env.example b/.env.example
index 75edf2a..4c1323d 100644
--- a/.env.example
+++ b/.env.example
@@ -1,2 +1,14 @@
-# Local SQLite database for development
+# Local SQLite database for development.
+#
+# Production should inject DATABASE_URL via the environment (Docker/hosting platform)
+# and should not rely on a committed .env file.
 DATABASE_URL="file:./dev.db"
+
+# --- Docker Compose Settings ---
+PANCOLLE_BIND_IP=127.0.0.1
+PANCOLLE_PORT=3000
+
+# --- Docker Build/Init Settings ---
+
+# Container DB location overrides (optional)
+PANCOLLE_DATABASE_URL="file:/data/dev.db"
diff --git a/Dockerfile b/Dockerfile
index fbeaf9e..83108e2 100644
--- a/Dockerfile
+++ b/Dockerfile
@@ -1,14 +1,100 @@
-FROM node:24-slim
+# syntax=docker/dockerfile:1
+# ==============================================================================
+# Stage 1: Base runtime
+# ==============================================================================
+FROM node:24.14.1-slim AS base
 
 WORKDIR /app
 
-RUN apt-get update && apt-get install -y \
-    git \
+ENV NEXT_TELEMETRY_DISABLED=1
+
+RUN apt-get update && apt-get install -y --no-install-recommends \
+        ca-certificates \
+    && rm -rf /var/lib/apt/lists/*
+
+RUN groupadd -r appgroup && useradd -r -g appgroup -d /home/appuser -m appuser
+
+
+# ==============================================================================
+# Stage 2: Development dependencies (includes Prisma CLI)
+# ==============================================================================
+FROM base AS dev-deps
+
+ENV NODE_ENV=development
+
+RUN apt-get update && apt-get install -y --no-install-recommends \
+        git \
+        python3 \
+        make \
+        g++ \
     && rm -rf /var/lib/apt/lists/*
 
 COPY package.json package-lock.json ./
-RUN npm ci
+
+RUN --mount=type=cache,target=/root/.npm \
+    npm ci
+
+COPY prisma ./prisma
+COPY prisma.config.ts ./prisma.config.ts
+
+ENV DATABASE_URL="file:/tmp/pancolle-generate.db"
+
+RUN npx prisma generate
+
+
+# ==============================================================================
+# Stage 3: Development runtime / tooling (hot reload; compose overrides CMD for db-init)
+# ==============================================================================
+FROM dev-deps AS dev
 
 COPY . .
 
-CMD ["npm", "run", "dev"]
\ No newline at end of file
+RUN mkdir -p /data && chown -R appuser:appgroup /app /data
+
+USER appuser
+
+EXPOSE 3000
+
+CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]
+
+
+# ==============================================================================
+# Stage 4: Builder (creates production Next.js build, then prunes dev deps)
+# ==============================================================================
+FROM dev-deps AS builder
+
+ENV NODE_ENV=production
+
+COPY . .
+
+ARG BUILD_DATABASE_URL="file:/tmp/pancolle-build.db"
+ENV DATABASE_URL=${BUILD_DATABASE_URL}
+
+RUN npx prisma migrate deploy && \
+    npx prisma db seed && \
+    npm run build && \
+    npm prune --omit=dev
+
+
+# ==============================================================================
+# Stage 5: Production runtime
+# ==============================================================================
+FROM base AS prod
+
+ENV NODE_ENV=production
+
+RUN mkdir -p /data && chown appuser:appgroup /app /data
+
+COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
+COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json
+COPY --from=builder --chown=appuser:appgroup /app/next.config.ts ./next.config.ts
+COPY --from=builder --chown=appuser:appgroup /app/public ./public
+COPY --from=builder --chown=appuser:appgroup /app/.next ./.next
+COPY --from=builder --chown=appuser:appgroup /app/prisma ./prisma
+COPY --from=builder --chown=appuser:appgroup /app/prisma.config.ts ./prisma.config.ts
+
+USER appuser
+
+EXPOSE 3000
+
+CMD ["npm", "run", "start"]
\ No newline at end of file
diff --git a/README.md b/README.md
index 7425beb..be9646d 100644
--- a/README.md
+++ b/README.md
@@ -21,6 +21,8 @@ npm install
 cp .env.example .env
 ```
 
+This project uses DATABASE_URL on the server side (Prisma). In production, set DATABASE_URL via your hosting platform or Docker environment variables instead of committing a .env file.
+
 3. Create the database and seed data.
 
 ```bash
@@ -46,16 +48,40 @@ Open http://localhost:3000.
 
 The project uses Prisma 7 with the better-sqlite3 driver adapter. The local database file is created at ./dev.db.
 
-- just db-generate
+- just db-setup
 - just db-migrate name=init
-- just db-seed
 - just db-reset
 - just db-studio
 
 ## Docker
 
-The compose setup initializes the database and seeds data before starting the dev server.
+The compose setup runs a one-shot db-init service (Prisma generate, migrate, seed) and then starts the Next.js server.
+
+```bash
+PANCOLLE_BUILD_TARGET=prod docker compose up --build
+```
+
+For development, use the development build target and dev migration mode.
+
+```bash
+just up
+```
+
+For a production-like stack with prod.db defaults:
+
+```bash
+just up-prod
+```
+
+The SQLite database is stored in a named Docker volume at /data/prod.db inside the containers.
+You can override the database location by setting PANCOLLE_DATABASE_URL.
+
+```bash
+PANCOLLE_BUILD_TARGET=prod PANCOLLE_DATABASE_URL="file:/data/prod.db" docker compose up --build
+```
+
+To run a separate staging instance side-by-side, change the project name and database path.
 
 ```bash
-docker compose up
+PANCOLLE_BUILD_TARGET=prod PANCOLLE_PROJECT_NAME=pancolle-staging PANCOLLE_DATABASE_URL="file:/data/staging.db" docker compose up --build
 ```
diff --git a/compose.yaml b/compose.yaml
index 55df775..39619de 100644
--- a/compose.yaml
+++ b/compose.yaml
@@ -1,16 +1,38 @@
 services:
-  web:
-    build: .
+  db-init:
+    build:
+      context: .
+      target: dev
+    environment:
+      DATABASE_URL: ${PANCOLLE_DATABASE_URL:-file:/data/prod.db}
     volumes:
-      - .:/app
-      - node_modules:/app/node_modules
+      - sqlite-data:/data
+    command:
+      - sh
+      - -c
+      - |
+          set -eu
+          npx prisma migrate deploy
+          npx prisma db seed
+    restart: "no"
+
+  web:
+    build:
+      context: .
+      target: ${PANCOLLE_BUILD_TARGET:-prod}
     ports:
-      - "3000:3000"
+      - "${PANCOLLE_BIND_IP:-127.0.0.1}:${PANCOLLE_PORT:-3000}:3000"
     environment:
-      DATABASE_URL: file:./dev.db
-    command: ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npx prisma db seed && npm run dev"]
-    working_dir: /app
-    tty: true
+      DATABASE_URL: ${PANCOLLE_DATABASE_URL:-file:/data/prod.db}
+    volumes:
+      - sqlite-data:/data
+    depends_on:
+      db-init:
+        condition: service_completed_successfully
+    restart: unless-stopped
 
 volumes:
-  node_modules:
\ No newline at end of file
+  sqlite-data:
+    driver: local
+    name: ${COMPOSE_PROJECT_NAME:-pancolle}-sqlite-data
+    external: false
\ No newline at end of file
diff --git a/justfile b/justfile
index 9684c54..d4dc632 100644
--- a/justfile
+++ b/justfile
@@ -1,7 +1,13 @@
 set shell := ["bash", "-eu", "-o", "pipefail", "-c"]
+set dotenv-load
+
+APP_NAME := env("COMPOSE_PROJECT_NAME", "pancolle")
+HOST_IP := env("PANCOLLE_BIND_IP", "127.0.0.1")
+DEV_PORT := env("PANCOLLE_PORT", "3000")
 
 default: help
 
+# List available recipes
 help:
     @echo "Usage: just [recipe]"
     @echo ""
@@ -16,10 +22,18 @@ dev:
 build:
     npm run build
 
-# Install repository dependencies from the lockfile
+# Setup development environment
 setup:
+    @if [ ! -f .env ]; then \
+        cp .env.example .env; \
+        echo "Created .env from .env.example"; \
+    fi
     npm ci
 
+# ==============================================================================
+# Code Quality
+# ==============================================================================
+
 # Apply formatter and safe lint fixes
 fix:
     npm run format
@@ -30,28 +44,88 @@ check:
     npm run format:check
     npm run lint
     npm run typecheck
+# ==============================================================================
+# Docker Environment Commands
+# ==============================================================================
+
+# Start development stack
+up *args:
+    @echo "Starting development stack..."
+    @COMPOSE_PROJECT_NAME={{ APP_NAME }}-dev \
+        PANCOLLE_BUILD_TARGET=dev \
+        PANCOLLE_DATABASE_URL=${PANCOLLE_DATABASE_URL:-file:/data/dev.db} \
+        docker compose up {{ args }}
+
+# Stop development stack
+down:
+    @echo "Stopping development stack..."
+    @COMPOSE_PROJECT_NAME={{ APP_NAME }}-dev \
+        docker compose down --remove-orphans
+
+# Rebuild and restart development stack
+rebuild:
+    @echo "Rebuilding development stack..."
+    @just down
+    @just build-dev
+    @just up
+
+# Start production stack
+up-prod *args:
+    @echo "Starting production stack..."
+    @COMPOSE_PROJECT_NAME={{ APP_NAME }}-prod \
+        PANCOLLE_BUILD_TARGET=prod \
+        docker compose up {{ args }}
+
+# Stop production stack
+down-prod:
+    @echo "Stopping production stack..."
+    @COMPOSE_PROJECT_NAME={{ APP_NAME }}-prod \
+        docker compose down --remove-orphans
+
+# Rebuild and restart production stack
+rebuild-prod:
+    @echo "Rebuilding production stack..."
+    @just down-prod
+    @just build-prod
+    @just up-prod
+
+# Build development images
+build-dev:
+    @COMPOSE_PROJECT_NAME={{ APP_NAME }}-dev \
+        PANCOLLE_BUILD_TARGET=dev \
+        docker compose build --no-cache
+
+# Build production images
+build-prod:
+    @COMPOSE_PROJECT_NAME={{ APP_NAME }}-prod \
+        PANCOLLE_BUILD_TARGET=prod \
+        docker compose build --no-cache
+
+# ==============================================================================
+# Prisma / Database
+# ==============================================================================
 
 # Prisma / DB operations
-db-generate:
+db-setup:
     npx prisma generate
+    npx prisma migrate dev --name init
+    npx prisma db seed
 
-db-migrate name="init":
-    npx prisma migrate dev --name {{ name }}
-
-db-deploy:
-    npx prisma migrate deploy
-
-db-push:
-    npx prisma db push
+# Run Prisma migrate dev with optional arguments
+db-migrate *args:
+    npx prisma migrate dev {{ args }}
 
-db-seed:
-    npx prisma db seed
+# Reset the database (caution: deletes all data)
+db-reset:
+    npx prisma migrate reset --force
 
+# Open Prisma Studio to browse/edit data
 db-studio:
     npx prisma studio
 
-db-reset:
-    npx prisma migrate reset --force
+# ==============================================================================
+# Testing
+# ==============================================================================
 
 # Run test suite
 test:
@@ -62,6 +136,10 @@ coverage:
     rm -rf coverage
     npm run test:coverage
 
+# ==============================================================================
+# Cleanup
+# ==============================================================================
+
 # Remove repository-local generated artifacts
 clean:
     rm -rf \
diff --git a/package.json b/package.json
index be18e66..a0e5c4f 100644
--- a/package.json
+++ b/package.json
@@ -18,8 +18,8 @@
     "test:coverage": "vitest run --coverage"
   },
   "dependencies": {
-    "@prisma/adapter-better-sqlite3": "^7.8.0",
     "@prisma/client": "^7.8.0",
+    "@prisma/adapter-better-sqlite3": "^7.8.0",
     "better-sqlite3": "^12.1.1",
     "next": "16.2.5",
     "react": "19.2.4",
diff --git a/src/app/admin/page.tsx b/src/app/admin/page.tsx
deleted file mode 100644
index 1774989..0000000
--- a/src/app/admin/page.tsx
+++ /dev/null
@@ -1,36 +0,0 @@
-import Link from 'next/link';
-
-export default function AdminPage() {
-  return (
-    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
-      <div className="max-w-4xl mx-auto space-y-6">
-        <header className="flex items-center justify-between border-b pb-4 dark:border-zinc-800">
-          <h1 className="text-xl font-bold">管理者ページ</h1>
-          <Link href="/" className="text-sm text-zinc-500 hover:underline">
-            ボードへ戻る
-          </Link>
-        </header>
-
-        <main className="grid gap-4 md:grid-cols-2">
-          <Link
-            href="/admin/upload"
-            className="flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:ring-2 hover:ring-zinc-200 transition"
-          >
-            <span className="text-2xl mb-2">📄</span>
-            <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
-              納品書読み込み
-            </h2>
-            <p className="text-xs text-zinc-400 mt-1">
-              画像をアップロードして在庫を一括更新します
-            </p>
-          </Link>
-
-          {/* 今後追加される機能のプレースホルダー */}
-          <div className="flex flex-col items-center justify-center p-8 bg-zinc-100 dark:bg-zinc-800/50 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl opacity-50 cursor-not-allowed">
-            <h2 className="font-semibold text-zinc-400">（Coming Soon）</h2>
-          </div>
-        </main>
-      </div>
-    </div>
-  );
-}
diff --git a/src/app/admin/upload/UploadForm.tsx b/src/app/admin/upload/UploadForm.tsx
deleted file mode 100644
index 8d9f029..0000000
--- a/src/app/admin/upload/UploadForm.tsx
+++ /dev/null
@@ -1,51 +0,0 @@
-'use client';
-
-import { useState } from 'react';
-
-export function UploadForm() {
-  const [isProcessing, setIsProcessing] = useState(false);
-
-  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
-    event.preventDefault();
-    setIsProcessing(true);
-
-    // OCR処理のシミュレーション
-    console.log('OCR処理がここに実装されます');
-
-    setTimeout(() => {
-      alert('画像を送信しました（OCR処理は現在準備中です）');
-      setIsProcessing(false);
-    }, 1500);
-  }
-
-  return (
-    <form onSubmit={handleSubmit} className="space-y-6">
-      <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-center">
-        <input
-          id="file"
-          name="file"
-          type="file"
-          accept="image/*"
-          required
-          disabled={isProcessing}
-          className="block w-full text-sm text-zinc-500
-            file:mr-4 file:py-2 file:px-4
-            file:rounded-full file:border-0
-            file:text-sm file:font-semibold
-            file:bg-zinc-900 file:text-white
-            hover:file:bg-zinc-800
-            dark:file:bg-zinc-100 dark:file:text-zinc-900
-            disabled:opacity-50 cursor-pointer"
-        />
-      </div>
-
-      <button
-        type="submit"
-        disabled={isProcessing}
-        className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:bg-zinc-400 transition shadow-lg shadow-emerald-500/20"
-      >
-        {isProcessing ? '読み込み中...' : 'アップロードして読み込む'}
-      </button>
-    </form>
-  );
-}
diff --git a/src/app/admin/upload/page.tsx b/src/app/admin/upload/page.tsx
deleted file mode 100644
index aa1b3d7..0000000
--- a/src/app/admin/upload/page.tsx
+++ /dev/null
@@ -1,33 +0,0 @@
-import Link from 'next/link';
-import { UploadForm } from './UploadForm';
-
-export default function UploadPage() {
-  return (
-    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
-      <div className="max-w-xl mx-auto space-y-6">
-        <header className="flex items-center justify-between">
-          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
-            納品書読み込み
-          </h1>
-          <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
-            戻る
-          </Link>
-        </header>
-
-        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
-          <div className="mb-6">
-            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
-              画像アップロード
-            </h2>
-            <p className="text-xs text-zinc-500 mt-1">
-              撮影した納品書の画像をアップロードしてください。
-            </p>
-          </div>
-
-          {/* フォームコンポーネント */}
-          <UploadForm />
-        </div>
-      </div>
-    </div>
-  );
-}
diff --git a/src/app/page.tsx b/src/app/page.tsx
index e997123..3c86870 100644
--- a/src/app/page.tsx
+++ b/src/app/page.tsx
@@ -1,6 +1,5 @@
 import { ItemCard } from '@/components/ItemCard';
 import { getInventoryItems } from '@/app/actions';
-import Link from 'next/link';
 import {
   CATEGORY_LABELS,
   ITEM_CATEGORIES,
@@ -21,23 +20,13 @@ export default async function Page() {
 
   return (
     <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-12">
-      <header className="relative p-6 border-b bg-white dark:bg-black dark:border-zinc-800">
-        <div className="max-w-4xl mx-auto flex items-center justify-center relative">
-          <h1 className="font-bold text-lg">冷凍庫在庫</h1>
-
-          <div className="absolute right-0 top-1/2 -translate-y-1/2">
-            <Link
-              href="/admin"
-              className="px-4 py-2 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm whitespace-nowrap"
-            >
-              管理者用
-            </Link>
-          </div>
-        </div>
-        <p className="text-xs text-zinc-400 mt-2 text-center">
+      <header className="p-6 text-center border-b bg-white dark:bg-black dark:border-zinc-800">
+        <h1 className="font-bold text-lg">冷凍庫在庫</h1>
+        <p className="text-xs text-zinc-400 mt-2">
           3段階の在庫状態をタップで更新
         </p>
       </header>
+
       <main className="max-w-4xl mx-auto p-4 space-y-10">
         {ITEM_CATEGORIES.map((category) => {
           const categoryItems = itemsByCategory[category];
