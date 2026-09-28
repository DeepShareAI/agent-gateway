# Agent Gateway

## Problem

Meta Muse asks for Gmail full access. Users want to use Meta Muse with full capability, but don't want to share the personal sensitive data blindly.

## Solution

A gateway that run on-premise and connect to all personal private data sources (e.g. Gmail, Google Drive, Facebook, Twitter, Linkedin), review and approve minimal information to enable third-party agents (e.g. Meta Muse)'s maximal capability.

## Features

- Provide a MCP server for third-party agents
- Connect to different SSO accounts (e.g. Gmail)

## Tech Stack

- Backend: Node.js + TypeScript + NestJS
- Validation: Zod for runtime validation of REST and MCP inputs, with Zod also used for React form validation
- Web: React + TypeScript
- Mobile: Flutter
- Database: PostgreSQL + Prisma
- Agent protocol: MCP + REST API
- Push: APNs + FCM
- Deployment: Docker Compose
- Testing: Jest + Supertest + Playwright + Flutter Test

The backend must validate requests before policy evaluation. Web validation provides user feedback; authorization remains the backend's responsibility.
