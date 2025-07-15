# Backend Effect - Word Count API

A TypeScript Lambda function using Effect for functional programming patterns.

## Architecture

### File Structure

```
src/
├── types.ts              # Type definitions
├── schemas.ts             # Effect Schema definitions
├── services/
│   └── WordCountService.ts # Business logic service
├── handlers/
│   └── WordCountHandler.ts # HTTP request handlers
├── lambda.ts              # Lambda entry point with layers
└── Program.ts             # Main export and testing
```

### Why This Structure?

**Effect Best Practices:**

- **Services**: Business logic separated into Effect services with dependency injection
- **Layers**: Proper Effect Layer composition for dependency management
- **Handlers**: HTTP-specific logic isolated from business logic
- **Schemas**: Runtime validation with Effect Schema

**Lambda Best Practices:**

- **No Health Endpoint**: AWS handles Lambda health automatically via CloudWatch
- **Single Responsibility**: Each Lambda should do one thing well
- **Cold Start Optimization**: Minimal imports and lazy loading where possible

## API Endpoints

### POST /wordcount

Counts word frequency in provided text.

**Request:**

```json
{
  "text": "hello world hello"
}
```

**Response:**

```json
{
  "words": [
    { "word": "hello", "count": 2 },
    { "word": "world", "count": 1 }
  ],
  "total": 3
}
```

### OPTIONS /\*

CORS preflight support.

## Development

```bash
# Test locally
bun run src/Program.ts

# Install dependencies
bun install
```

## Why No Health Endpoint?

1. **AWS Handles It**: Lambda health is managed by AWS automatically
2. **Cold Starts**: Health checks can cause unnecessary cold starts
3. **CloudWatch**: Better monitoring through AWS native tools
4. **Cost**: Unnecessary invocations cost money
5. **Complexity**: Adds routing complexity for no benefit

Use CloudWatch metrics and alarms instead of custom health endpoints.
