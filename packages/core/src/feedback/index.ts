import { isNull } from 'drizzle-orm';
import { Context, Effect, Layer, Schema } from 'effect';
import type { ParseError } from 'effect/ParseResult';
import {
  type DatabaseError,
  DatabaseLive,
  DatabaseService,
} from '../drizzle/index';
import { EmailAPI } from '../email/index';
import { type Feedback, feedbackTable } from './feedback.sql';
import { RATING_ENUM, TOPIC_ENUM } from './types';

// Input schemas
export const CreateFeedbackInput = Schema.Struct({
  topic: Schema.Union(Schema.Literal(...TOPIC_ENUM)),
  rating: Schema.Union(Schema.Literal(...RATING_ENUM)),
  feedback: Schema.String.pipe(Schema.minLength(10)),
  userId: Schema.optional(Schema.String),
  userEmail: Schema.optional(Schema.String),
});
export type CreateFeedbackInput = typeof CreateFeedbackInput.Type;

// Error classes
export class FeedbackError extends Error {
  readonly _tag = 'FeedbackError';
  constructor(
    readonly cause: unknown,
    message?: string,
  ) {
    super(message ?? 'Feedback operation failed');
  }
}

// Feedback Service
export class FeedbackService extends Context.Tag('FeedbackService')<
  FeedbackService,
  {
    readonly create: (
      input: CreateFeedbackInput,
    ) => Effect.Effect<Feedback, DatabaseError | ParseError | FeedbackError>;
  }
>() {}

// Feedback Service Implementation
export const FeedbackServiceLive = Layer.effect(
  FeedbackService,
  Effect.gen(function* () {
    const dbService = yield* DatabaseService;

    return {
      create: (input) =>
        Effect.gen(function* () {
          const validated = yield* Schema.decode(CreateFeedbackInput)(input);

          const newFeedback = {
            topic: validated.topic,
            rating: validated.rating,
            feedback: validated.feedback,
            userId: validated.userId || null,
            userEmail: validated.userEmail || null,
          };

          return yield* dbService.transaction(async (tx) => {
            const inserted = await tx
              .insert(feedbackTable)
              .values(newFeedback)
              .returning()
              .then((rows) => rows.at(0));

            if (!inserted) {
              throw new FeedbackError(null, 'Failed to create feedback');
            }

            // Send email notification in the background (don't block the response)
            Effect.runFork(
              Effect.tryPromise(() =>
                EmailAPI.sendFeedbackNotification({
                  feedbackId: inserted.id,
                  topic: inserted.topic,
                  rating: inserted.rating,
                  feedback: inserted.feedback,
                  userEmail: inserted.userEmail || undefined,
                  userId: inserted.userId || undefined,
                }),
              ).pipe(
                Effect.mapError((cause) => {
                  console.error(
                    'Failed to send feedback notification email:',
                    cause,
                  );
                  return new FeedbackError(cause, 'Email notification failed');
                }),
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
              throw new FeedbackError(null, 'Failed to retrieve feedback');
            }

            return result;
          });
        }),
    };
  }),
).pipe(Layer.provide(DatabaseLive));

// Simple async API - no Effect boilerplate needed
export const FeedbackAPI = {
  async createFeedback(input: CreateFeedbackInput): Promise<Feedback> {
    const effect = Effect.gen(function* () {
      const service = yield* FeedbackService;
      return yield* service.create(input);
    });

    const result = await Effect.runPromise(
      Effect.provide(effect, FeedbackServiceLive),
    );

    return result;
  },
};

// Re-export types
export type { Feedback };
