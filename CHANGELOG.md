# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- **JWT signing**: Replaced SHA256 with HMAC-SHA256 in generated project's `crypto.ts` — fixes non-compliant HS256 implementation
- **User API**: Strip password hashes from all user endpoint responses
- **Auth on GET /api/users/:id**: Added `requireAuth` middleware — endpoint was previously unauthenticated
- **SQL injection pattern**: Removed `executeSimpleQuery()` raw SQL helper from generated DB client
- **User enumeration**: Registration endpoint now returns a generic error instead of confirming email existence
- **Seed data**: Added production guard to prevent seeding in production; changed default passwords
- **JWT_SECRET**: Added current `.env.example` default value to production deny-list
- **CORS**: Removed blanket dev-mode origin bypass — dev origins are now explicitly allowlisted
- **CSRF docs**: Added warning about in-memory token store limitations for multi-instance deployments
- **Health endpoint**: Restricted detailed diagnostics to development mode only

### Fixed

- **CLI TOCTOU race**: Replaced `existsSync` + later `mkdir` with atomic `mkdirSync` to prevent symlink attacks
- **Exclude patterns**: Changed from substring `.includes()` to exact match / extension match — `"dist"` no longer excludes `"distance.ts"`
- **`.env` permissions**: Set to `0600` (owner-only) after creation — was world-readable `0644`
- **PostgreSQL `updatedAt`**: `PostgresUserRepository.update()` now sets `updatedAt` like the SQLite repo does

### Added

- **SIGINT handler**: Ctrl+C during scaffold now cleans up partial project directory
- **CHANGELOG.md**: This file
- **CI workflow**: GitHub Actions for lint, typecheck, tests, and scaffold smoke test
- **CLI tests**: `parseArgs()` and `validateProjectName()` unit tests

## [1.0.9] - 2025-01-01

- Initial stable release on npm
