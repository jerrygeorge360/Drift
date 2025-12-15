# ---- Base image ----
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- Install dependencies ----
RUN npm install

# ---- Build the app ----
COPY . .
RUN npm run build

# ---- Production image ----
FROM node:18-alpine
WORKDIR /app

# Copy only necessary files from the build stage
COPY --from=base /app/package*.json ./
COPY --from=base /app/dist ./dist
RUN npm install --omit=dev

EXPOSE 4000
CMD ["node", "dist/server.js"]

# TODO : properly write the docker file