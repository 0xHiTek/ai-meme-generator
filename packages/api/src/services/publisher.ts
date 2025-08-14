import type { Database, Transaction } from '@meme/shared/db';
import { TwitterPublisher } from '../publishers/twitter';
import { RedditPublisher } from '../publishers/reddit';
import { InstagramPublisher } from '../publishers/instagram';
import { TikTokPublisher } from '../publishers/tiktok';

type DbConnection = Database | Transaction<Database>;

export class Publisher {
  private publishers = {
    TWITTER: new TwitterPublisher(),
    REDDIT: new RedditPublisher(),
    INSTAGRAM: new InstagramPublisher(),
    TIKTOK: new TikTokPublisher(),
  };

  async publish(
    db: DbConnection,
    memeId: string,
    platforms: string[],
    options?: {
      scheduled?: Date;
      caption?: string;
      hashtags?: string[];
    }
  ) {
    const meme = await db
      .selectFrom('Meme')
      .where('id', '=', memeId)
      .selectAll()
      .executeTakeFirstOrThrow();

    const results = await Promise.allSettled(
      platforms.map(async (platform) => {
        const publisher = this.publishers[platform as keyof typeof this.publishers];
        
        if (!publisher) {
          throw new Error(`Unsupported platform: ${platform}`);
        }

        // Create post record
        const post = await db
          .insertInto('Post')
          .values({
            memeId,
            platform: platform as any,
            status: options?.scheduled ? 'SCHEDULED' : 'PENDING',
            scheduledAt: options?.scheduled,
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        // Publish or schedule
        if (options?.scheduled) {
          // Add to job queue for scheduled posting
          await this.schedulePost(post.id, options.scheduled);
        } else {
          // Publish immediately
          const result = await publisher.publish({
            imageUrl: meme.imageUrl,
            caption: options?.caption || meme.caption,
            hashtags: options?.hashtags,
          });

          await db
            .updateTable('Post')
            .set({
              postId: result.id,
              status: 'PUBLISHED',
              publishedAt: new Date(),
              metrics: result.metrics,
            })
            .where('id', '=', post.id)
            .execute();
        }

        return post;
      })
    );

    return results;
  }

  private async schedulePost(postId: string, scheduledTime: Date) {
    // Add to BullMQ job queue
    // Implementation depends on queue setup
  }
}
