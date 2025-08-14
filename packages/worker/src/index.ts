import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { memeGeneratorWorker } from './workers/meme-generator';
import { publisherWorker } from './workers/publisher';
import { batchWorker } from './workers/batch';

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// Meme generation worker
new Worker('meme-generation', memeGeneratorWorker, {
  connection,
  concurrency: 5,
});

// Publishing worker
new Worker('publishing', publisherWorker, {
  connection,
  concurrency: 10,
});

// Batch processing worker
new Worker('batch-processing', batchWorker, {
  connection,
  concurrency: 2,
});

console.log('Workers started successfully');
