FROM node:20-alpine AS base

WORKDIR /app
RUN apk add --no-cache openssl

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Generate Prisma client
COPY prisma ./prisma/
RUN npx prisma generate

# Build TypeScript
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# Production image
FROM node:20-alpine AS production

WORKDIR /app
RUN apk add --no-cache openssl dumb-init

# Copy built files and dependencies
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/package.json ./

ENV NODE_ENV=production

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]