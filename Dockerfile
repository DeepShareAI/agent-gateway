FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY relay/package.json relay/package.json
COPY agent-adapter/package.json agent-adapter/package.json
RUN npm ci
COPY --chown=node:node relay relay
COPY --chown=node:node agent-adapter agent-adapter
COPY --chown=node:node dev dev
RUN chown -R node:node /app/relay /app/agent-adapter /app/dev
USER node
CMD ["npm", "run", "dev", "--workspace", "@agent-gateway/relay"]
