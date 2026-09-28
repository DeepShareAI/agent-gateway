FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY web/package.json web/package.json
RUN npm ci
COPY backend backend
RUN npm run build --workspace backend && npm prune --omit=dev

FROM node:22-alpine AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY backend/package.json ./backend/package.json
USER node
EXPOSE 3000
CMD ["node", "backend/dist/main.js"]
