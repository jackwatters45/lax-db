import { Schema } from 'effect';

export class SendEmailInput extends Schema.Class<SendEmailInput>(
  'SendEmailInput',
)({
  to: Schema.Array(Schema.String),
  subject: Schema.String,
  htmlBody: Schema.String,
  textBody: Schema.optional(Schema.String),
  from: Schema.optional(Schema.String),
}) {}

export class SendFeedbackEmailInput extends Schema.Class<SendFeedbackEmailInput>(
  'SendFeedbackEmailInput',
)({
  feedbackId: Schema.Number,
  topic: Schema.String,
  rating: Schema.String,
  feedback: Schema.String,
  userEmail: Schema.optional(Schema.String),
  userId: Schema.optional(Schema.String),
}) {}
