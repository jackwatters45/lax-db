# AGENTS.md

This file provides guidance to agentic coding agents working with the Lax-db
Pipeline codebase.

## Commands

- **Development**: `uv sync` - Install dependencies and set up virtual environment
- **Generate Models**: `bun run scripts/generate-models.ts` - Generate Pydantic models from Drizzle schemas
- **Run Pipeline**: `python -m src.main sync --limit 10` - Run NCAA directory sync with limit
- **Test Extraction**: `python -m src.main test` - Test extraction without database operations
- **Single Test**: `pytest tests/test_ncaa_extractor.py::test_specific_function` - Run specific test
- **All Tests**: `pytest` - Run all tests with async support
- **Linting**: `ruff check .` and `ruff format .` - Code formatting and linting
- **Type Checking**: `mypy src/` - Run type checking
- **Airflow**: `airflow standalone` - Start Airflow for orchestration

## Code Style

- **Python Version**: Requires Python >=3.12
- **Formatting**: Ruff with 88 character line length, ignore E501
- **Imports**: Use ruff isort, known-first-party = ["src"]
- **Types**: Strict mypy configuration, use Python 3.12+ native types (e.g., `str | None` not `Optional[str]`), avoid `typing` module
- **Naming**: snake_case for variables/functions, PascalCase for classes
- **Error Handling**: Use structured logging (structlog), async/await patterns
- **Models**: Auto-generated Pydantic models from Drizzle schemas in `generated/models/`
- **Database**: Direct PostgreSQL integration with asyncpg, no intermediate storage
- **Architecture**: Extractors → Processors → Loaders pattern with async operations

## Other Notes

- Models are auto-generated - regenerate after schema changes with `bun run scripts/generate-models.ts`
- Use structured logging with contextual information for debugging
- All database operations are async and use connection pooling
- Airflow DAGs are in `dags/` directory for orchestration