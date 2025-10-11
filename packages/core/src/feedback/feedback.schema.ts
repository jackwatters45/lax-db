import { Schema } from 'effect';

export const TOPIC_ENUM = [
  'feature-request',
  'bug-report',
  'user-interface',
  'performance',
  'documentation',
  'other',
];

export const RATING_ENUM = ['positive', 'neutral', 'negative'];

export class CreateFeedbackInput extends Schema.Class<CreateFeedbackInput>(
  'CreateFeedbackInput',
)({
  topic: Schema.Union(Schema.Literal(...TOPIC_ENUM)),
  rating: Schema.Union(Schema.Literal(...RATING_ENUM)),
  feedback: Schema.String.pipe(Schema.minLength(10)),
  userId: Schema.NullOr(Schema.String),
  userEmail: Schema.NullOr(Schema.String),
}) {}
