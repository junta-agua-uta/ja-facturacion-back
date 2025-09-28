FROM node:20-alpine AS deps
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false NPM_CONFIG_FUND=false
COPY package*.json ./
COPY prisma/schema.prisma ./prisma/
RUN npm ci && npx prisma generate

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate

FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S nodegrp && adduser -S nodeusr -G nodegrp \
 && apk add --no-cache openssl
USER nodeusr

COPY --chown=nodeusr:nodegrp --from=prod-deps /app/node_modules ./node_modules
COPY --chown=nodeusr:nodegrp --from=build /app/dist ./dist
COPY --chown=nodeusr:nodegrp prisma ./prisma
COPY --chown=nodeusr:nodegrp package*.json ./
COPY --chown=nodeusr:nodegrp firmajunta.p12 ./firmajunta.p12

EXPOSE 4000

HEALTHCHECK --interval=20s --timeout=3s --retries=5 \
  CMD node -e "fetch('http://localhost:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
