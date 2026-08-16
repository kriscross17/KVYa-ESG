FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
COPY backend/prisma ./prisma
COPY dummy-data ./dummy-data
RUN npm install --no-audit --no-fund && npx prisma generate
COPY backend/src ./src
RUN mkdir -p uploads
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push --skip-generate && node prisma/seed.js && node src/server.js"]
