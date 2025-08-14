import { describe, expect, test, beforeEach } from 'vitest';
import { MemeGenerator } from './meme-generator';
import { createTestDb } from '../test/utils';

describe('MemeGenerator', () => {
  let generator: MemeGenerator;
  let db: TestDatabase;

  beforeEach(async () => {
    generator = new MemeGenerator();
    db = await createTestDb();
  });

  test('generates meme from vibe', async () => {
    const userId = 'test-user';
    const vibe = 'lazy cat Monday';
    
    const meme = await generator.generateMeme(db, userId, vibe);
    
    expect(meme).toMatchObject({
      userId,
      vibe,
      status: 'COMPLETED',
      caption: expect.any(String),
      imageUrl: expect.stringMatching(/^https:\/\/.+\.jpg$/),
    });
  });

  test('supports batch generation', async () => {
    const userId = 'test-user';
    const vibe = 'crypto crash';
    
    const memes = await generator.generateMeme(db, userId, vibe, {
      batch: 3,
    });
    
    expect(memes).toHaveLength(3);
    expect(new Set(memes.map(m => m.caption)).size).toBe(3); // All unique
  });

  test('applies style correctly', async () => {
    const userId = 'test-user';
    const vibe = 'dating apps';
    
    const meme = await generator.generateMeme(db, userId, vibe, {
      style: 'minimal',
    });
    
    expect(meme.metadata).toMatchObject({
      style: 'minimal',
    });
  });
});
