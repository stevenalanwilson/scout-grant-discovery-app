# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

---

## Project Overview

A fullstack web application built with **TypeScript** (backend) and **React** (frontend).

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React, TypeScript, Vite           |
| Backend   | Node.js, TypeScript, Express      |
| Testing   | Vitest, React Testing Library     |
| Linting   | ESLint, Prettier                  |
| Git Hooks | Husky, lint-staged                |
| Commits   | Conventional Commits              |
| Infra     | Docker, Docker Compose            |

---

## Project Structure

```
/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── features/        # Feature-scoped modules (co-locate logic, hooks, tests)
│   │   ├── hooks/           # Shared custom hooks
│   │   ├── services/        # API client functions
│   │   ├── types/           # Shared frontend types
│   │   └── main.tsx
│   └── vite.config.ts
├── server/                  # TypeScript backend
│   ├── src/
│   │   ├── controllers/     # Route handlers (thin layer, no business logic)
│   │   ├── services/        # Business logic (pure, injectable)
│   │   ├── repositories/    # Data access layer
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # Route definitions
│   │   ├── types/           # Shared backend types
│   │   └── index.ts
│   └── tsconfig.json
├── shared/                  # Types/utilities shared between client and server
├── docker-compose.yml
├── .husky/
├── .eslintrc.cjs
├── .prettierrc
└── CLAUDE.md
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Run full stack in development
docker-compose up --build

# Run frontend only
cd client && npm run dev

# Run backend only
cd server && npm run dev

# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Lint and format
npm run lint
npm run format

# Type check
npm run typecheck
```

---

## Architecture Principles

### SOLID
- **Single Responsibility:** Each module, class, or function does one thing. Controllers handle HTTP; services handle logic; repositories handle data.
- **Open/Closed:** Extend behaviour via composition and interfaces, not by modifying existing code.
- **Liskov Substitution:** Implementations must be substitutable for their interfaces without changing behaviour.
- **Interface Segregation:** Define narrow, focused interfaces. Avoid large catch-all interfaces.
- **Dependency Inversion:** Depend on abstractions. Inject dependencies rather than importing concrete implementations directly.

### DRY
- Extract shared logic into utilities or services. Never duplicate business rules.
- Share types between client and server via the `/shared` directory.

### YAGNI
- Do not add abstractions, configuration, or features speculatively. Build what is needed now.

### Separation of Concerns
- Controllers must not contain business logic — delegate to services.
- Services must not contain data access logic — delegate to repositories.
- React components must not contain data fetching logic — delegate to hooks or services.

---

## Coding Standards

### TypeScript
- Strict mode enabled (`"strict": true` in all `tsconfig.json` files).
- No use of `any`. Use `unknown` and narrow with type guards where necessary.
- Prefer `interface` for object shapes; use `type` for unions, intersections, and aliases.
- All functions must have explicit return types.
- Use `readonly` for data that should not be mutated.

### React
- Use functional components only. No class components.
- Co-locate feature-specific components, hooks, and tests within `/features`.
- Avoid prop drilling beyond two levels — use context or state management.
- Keep components small and focused. Extract logic into custom hooks.
- Do not fetch data directly in components. Use a dedicated hook or service layer.

### General
- Prefer `const` over `let`. Never use `var`.
- Use early returns to reduce nesting.
- Name things clearly and descriptively. Avoid abbreviations.
- Avoid comments that explain *what* code does — write code that is self-explanatory. Use comments only to explain *why*.

---

## Testing

### Philosophy
Follow **TDD** where practical: write a failing test, implement the minimum code to pass, then refactor.

### Framework
- **Vitest** for unit and integration tests (backend and frontend).
- **React Testing Library** for component tests.
- **Playwright** may be added later for end-to-end tests.

### Rules
- Every service and utility must have unit tests.
- Every React component must have at least a render test and tests for key interactions.
- Tests must not depend on external services — mock at the boundary (repository layer, API clients).
- Aim for high coverage of business logic. Do not chase 100% coverage of trivial code.
- Test files live alongside source files: `foo.ts` → `foo.test.ts`.

### Running Tests
```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## Git Workflow

### Commits
This project follows the **Conventional Commits** specification.

Format: `<type>(<scope>): <short description>`

| Type       | When to use                              |
|------------|------------------------------------------|
| `feat`     | A new feature                            |
| `fix`      | A bug fix                                |
| `refactor` | Code change with no feature or fix       |
| `test`     | Adding or updating tests                 |
| `docs`     | Documentation only changes               |
| `chore`    | Tooling, config, dependency updates      |
| `ci`       | CI/CD pipeline changes                   |

Examples:
```
feat(auth): add JWT refresh token support
fix(api): handle null response from user service
test(cart): add unit tests for discount calculation
```

### Husky Pre-commit Hooks
The following checks run automatically on every commit:
- **ESLint** — linting via `lint-staged`
- **Prettier** — formatting via `lint-staged`
- **TypeScript** — type check via `tsc --noEmit`
- **Vitest** — runs tests related to staged files

Commits will be rejected if any check fails. Fix the issue before committing.

---

## Docker

The application runs fully in Docker for local development.

```bash
# Start all services
docker-compose up --build

# Stop all services
docker-compose down

# Rebuild a single service
docker-compose up --build server
```

Services defined in `docker-compose.yml`:
- `client` — Vite dev server (React frontend)
- `server` — Node.js backend with hot reload
- `db` — PostgreSQL (or your chosen database)

---

## Environment Variables

Never commit secrets or environment-specific values to the repository.

- Copy `.env.example` to `.env` and populate values locally.
- The `.env` file is gitignored.
- All required variables must be documented in `.env.example` with placeholder values.

---

## When in Doubt

- **Simplicity first.** Choose the simpler solution unless there is a clear reason not to.
- **Make it work, then make it right.** Get tests passing, then refactor.
- **Ask before inventing.** If requirements are unclear, surface the ambiguity rather than assuming.
- **Leave the code better than you found it.** Opportunistic refactoring is encouraged, but keep it in a separate commit.
