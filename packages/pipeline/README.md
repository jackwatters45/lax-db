# Pipeline V2

Structured data pipeline with direct PostgreSQL integration, eliminating syncer complexity.

## Quick Start

```bash
# Install dependencies
uv sync

# Generate Pydantic models from Drizzle schemas
bun run scripts/generate-models.ts

# Run a simple extraction
python -m src.extractors.ncaa_extractor

# Start Airflow (development)
airflow standalone
```

## Architecture

- **Extractors**: Web scraping with caching and rate limiting
- **Processors**: Data validation using generated Pydantic models
- **Loaders**: Direct PostgreSQL writes with conflict resolution
- **Generated Models**: Auto-generated from Drizzle schemas

## Key Benefits

- ✅ Single schema source (Drizzle)
- ✅ No intermediate storage (DuckDB)
- ✅ No TypeScript syncers
- ✅ Direct database integration
- ✅ Structured Airflow orchestration

## Development

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed implementation phases.