import { PgDrizzle } from '@effect/sql-drizzle/Pg';
import { isNull } from 'drizzle-orm';
import { Effect, Schema } from 'effect';
import { DatabaseLive } from '../drizzle';
import { EmailService } from '../email';
import { FeedbackError } from './feedback.error';
import { CreateFeedbackInput } from './feedback.schema';
import { type Feedback, feedbackTable } from './feedback.sql';

export class FeedbackService extends Effect.Service<FeedbackService>()(
  'FeedbackService',
  {
    effect: Effect.gen(function* () {
      const db = yield* PgDrizzle;

      const emailService = yield* EmailService;

      return {
        create: (input: CreateFeedbackInput) =>
          Effect.gen(function* () {
            const validated = yield* Schema.decode(CreateFeedbackInput)(input);

            return yield* Effect.tryPromise({
              try: () =>
                db.transaction(async (tx) => {
                  const inserted = await tx
                    .insert(feedbackTable)
                    .values(validated)
                    .returning()
                    .then((rows) => rows.at(0));

                  if (!inserted) {
                    throw new FeedbackError({
                      cause: 'Failed to insert feedback',
                    });
                  }

                  // Send email notification in the background (don't block the response)
                  Effect.runFork(
                    emailService
                      .sendFeedbackNotification({
                        feedbackId: inserted.id,
                        topic: inserted.topic,
                        rating: inserted.rating,
                        feedback: inserted.feedback,
                        userEmail: inserted.userEmail || undefined,
                        userId: inserted.userId || undefined,
                      })
                      .pipe(
                        Effect.tapError(Effect.logError),
                        Effect.mapError(
                          (cause) => new FeedbackError({ cause }),
                        ),
                        Effect.catchAll(() => Effect.succeed(void 0)),
                      ),
                  );

                  const result = await tx
                    .select({
                      publicId: feedbackTable.publicId,
                      topic: feedbackTable.topic,
                      rating: feedbackTable.rating,
                      feedback: feedbackTable.feedback,
                      userId: feedbackTable.userId,
                      userEmail: feedbackTable.userEmail,
                      createdAt: feedbackTable.createdAt,
                      updatedAt: feedbackTable.updatedAt,
                      deletedAt: feedbackTable.deletedAt,
                    })
                    .from(feedbackTable)
                    .where(isNull(feedbackTable.deletedAt))
                    .then((rows) => rows.at(0));

                  if (!result) {
                    throw new FeedbackError({ cause: 'Feedback not found' });
                  }

                  return result;
                }),
              catch: (cause) => new FeedbackError({ cause }),
            });
          }),
      } as const;
    }),
    dependencies: [DatabaseLive, EmailService.Default],
  },
) {}

export type { Feedback };
