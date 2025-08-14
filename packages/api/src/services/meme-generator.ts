import type { Transaction } from 'kysely';
import type { Database } from '@meme/shared/db';
import { OpenAI } from 'openai';
import sharp from 'sharp';
import { s3Client } from '../lib/s3';
import { imageSourcer } from './image-sourcer';
import { captionGenerator } from './caption-generator';

type DbConnection = Database | Transaction<Database>;

export class MemeGenerator {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateMeme(
    db: DbConnection,
    userId: string,
    vibe: string,
    options?: {
      template?: string;
      style?: 'classic' | 'modern' | 'minimal';
      batch?: number;
    }
  ) {
    // 1. Generate AI caption based on vibe
    const caption = await captionGenerator.generate(vibe, {
      style: options?.style || 'classic',
      model: 'gpt-4',
    });

    // 2. Source appropriate image
    const image = await imageSourcer.findImage(vibe, {
      source: 'unsplash',
      fallback: ['pexels', 'pixabay'],
    });

    // 3. Process image with caption
    const processedImage = await this.processImage(
      image.buffer,
      caption,
      options?.style
    );

    // 4. Upload to S3
    const imageUrl = await this.uploadToS3(processedImage, userId);

    // 5. Save to database
    const meme = await db
      .insertInto('Meme')
      .values({
        userId,
        vibe,
        caption,
        imageUrl,
        templateId: options?.template,
        status: 'COMPLETED',
        metadata: {
          imageSource: image.source,
          style: options?.style,
        },
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return meme;
  }

  private async processImage(
    imageBuffer: Buffer,
    caption: string,
    style?: string
  ): Promise<Buffer> {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    const width = metadata.width || 800;
    const height = metadata.height || 600;
    
    // Create caption overlay
    const captionSvg = this.createCaptionSvg(caption, width, height, style);
    
    return image
      .composite([
        {
          input: Buffer.from(captionSvg),
          top: 0,
          left: 0,
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  private createCaptionSvg(
    text: string,
    width: number,
    height: number,
    style?: string
  ): string {
    const fontSize = Math.max(width / 20, 24);
    const strokeWidth = fontSize / 12;
    
    return `
      <svg width="${width}" height="${height}">
        <defs>
          <style>
            .caption {
              font-family: Impact, Arial Black, sans-serif;
              font-size: ${fontSize}px;
              font-weight: bold;
              fill: white;
              stroke: black;
              stroke-width: ${strokeWidth}px;
              text-anchor: middle;
            }
          </style>
        </defs>
        <text x="${width / 2}" y="${height - 20}" class="caption">
          ${text.toUpperCase()}
        </text>
      </svg>
    `;
  }

  private async uploadToS3(buffer: Buffer, userId: string): Promise<string> {
    const key = `memes/${userId}/${Date.now()}.jpg`;
    await s3Client.upload(buffer, key);
    return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
  }
}
