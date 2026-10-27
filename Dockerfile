FROM node:22.13-bookworm

WORKDIR /workspace
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:server"]