# syntax=docker/dockerfile:1

# ---- Builder ----
FROM node:18-alpine AS builder

RUN mkdir /build
WORKDIR /build

COPY package.json .
COPY yarn.lock .
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# ---- Dependencies ----
FROM node:18-alpine AS deps

WORKDIR /deps

COPY package.json .
COPY yarn.lock .
RUN yarn install --frozen-lockfile --prod --ignore-optional

# ---- Runner ----
FROM node:18-alpine

RUN apk add dumb-init

WORKDIR /app

COPY --from=builder /build/package.json ./package.json
COPY --from=builder /build/yarn.lock ./yarn.lock
COPY --from=deps /deps/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/locale ./locale

USER node
EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "API_HOST=0.0.0.0 yarn start"]
