# syntax=docker/dockerfile:1

# ---- Builder ----
FROM --platform=$BUILDPLATFORM node:18-alpine3.16 AS builder

RUN mkdir /build
WORKDIR /build

COPY package.json .
COPY pnpm-lock.yaml .

RUN apk add --update --no-cache git
RUN npm install -g pnpm@8

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ---- Dependencies ----
FROM --platform=$BUILDPLATFORM node:18-alpine3.16 AS deps

RUN apk add --update --no-cache dumb-init git
RUN npm install -g pnpm@8

WORKDIR /deps

COPY package.json .
COPY pnpm-lock.yaml .
RUN pnpm install --frozen-lockfile --prod --no-optional

# ---- Runner ----
FROM --platform=$BUILDPLATFORM node:18-alpine3.16

RUN apk add --update --no-cache dumb-init git
RUN npm install -g pnpm@8

WORKDIR /app

COPY --from=builder /build/package.json ./package.json
COPY --from=builder /build/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /deps/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/locale ./locale

USER node
EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "API_HOST=0.0.0.0 pnpm run start"]
