# Agent Gateway

## Problem

Meta Muse asks for Gmail full access. Users want to use Meta Muse with full capability, but don't want to share the personal sensitive data blindly.

## Solution

A gateway that connects to personal private data sources (e.g. Gmail, Google Drive, Facebook, Twitter, Linkedin), review and approve minimal information to enable third-party agents (e.g. Meta Muse)'s maximal capability.

## Features

- Provide a MCP server for third-party agents
- Connect to different SSO accounts (e.g. Gmail)

## Tech Stack

- Backend: Node.js + TypeScript + NestJS
- Validation: Zod for runtime validation of REST and MCP inputs, with Zod also used for React form validation
- Web: React + TypeScript
- Mobile: Flutter
- Database: Neon PostgreSQL + Prisma
- Agent protocol: MCP + REST API
- Push: APNs + FCM
- CI/CD: GitHub Actions, with Codemagic for mobile builds, signing, and distribution
- Production from Day 1: Cloudflare (web and edge) + Cloud Run (backend) + Neon PostgreSQL + Codemagic
- Local development: Docker Compose
- Testing: Jest + Supertest + Playwright + Flutter Test

The backend must validate requests before policy evaluation. Web validation provides user feedback; authorization remains the backend's responsibility.

## Deployment requirements

Production is required from Day 1. A hosted test environment is deferred for now. GitHub Actions coordinates CI validation and gated production deployment. Codemagic provides Android and iOS build and release workflows. Production initially hosts only the skeleton; private-data features require their later security milestones. On-premises packaging is a future option.

See [deployment and CI/CD](docs/deployment.md) for the environment contract and acceptance criteria.
