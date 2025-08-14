import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { memeRoutes } from './routes/meme';
import { publishRoutes } from './routes/publish';
import { jobRoutes } from './routes/job';
import { initializeWorkers } from './workers';
import { db } from './db';

const server = Fastify({
  logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

async function start() {
  // Register plugins
  await server.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  });
  
  await server.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  });
  
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Register routes
  await server.register(memeRoutes, { prefix: '/api/meme' });
  await server.register(publishRoutes, { prefix: '/api/publish' });
  await server.register(jobRoutes, { prefix: '/api/job' });

  // Initialize background workers
  await initializeWorkers();

  // Start server
  const port = parseInt(process.env.PORT || '8080');
  await server.listen({ port, host: '0.0.0.0' });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
