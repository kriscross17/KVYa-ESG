import 'dotenv/config';
import http from 'node:http';
import app from './app.js';
import { prisma } from './prisma.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set to at least 32 characters');
  process.exit(1);
}

const server = http.createServer(app);
const port = Number(process.env.PORT || 4000);
server.listen(port, () => console.log(`SIH BRSR API listening on http://localhost:${port}`));

const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down...`);
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
