# Build stage
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist ./dist

# Railway provides PORT env variable
ENV PORT=3000
EXPOSE $PORT

CMD sh -c "serve -s dist -l \$PORT"
