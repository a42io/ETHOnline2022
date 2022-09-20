# Dockerfile Best Practice Multi Stage Build Pattern

# ----------
# build stage
# ----------
FROM node:16-alpine3.15 AS web

WORKDIR /web
COPY . ../../yarn*.lock ./

RUN yarn install --immutable --immutable-cache --check-cache && \
yarn run build

# ----------
# runtime stage
# ----------
FROM node:16-alpine3.15
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN yarn install --immutable --immutable-cache --check-cache
COPY --from=web /web/dist ./src
CMD [ "node", "./src/server.js"]