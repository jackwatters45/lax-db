# Pipeline V2 Migration Guide

This guide helps migrate existing pipeline components from `packages/pipeline` to the new robust `packages/pipeline-v2` architecture.

## Architecture Comparison

### Old Pipeline (packages/pipeline)
- **Database**: DuckDB with custom Database class
- **Caching**: SQLite-based caching (playwright_cache.py, requests_cache.py)
- **HTTP**: RequestHelper and PlaywrightHelper classes
- **Parsing**: Schema-based HTML parsing with parse_html_with_schema
- **Validation**: Pydantic models with custom cleaning
- **Progress**: ProgressTracker class
- **CLI**: Typer-based CLI with individual commands

### New Pipeline V2 (packages/pipeline-v2)
- **Database**: PostgreSQL with AsyncPG and connection pooling
- **Caching**: Multi-level (Memory + Redis) with TTL management
- **HTTP**: RobustExtractor with circuit breaker, rate limiting, retry logic
- **Parsing**: Pydantic model validation with data quality framework
- **Validation**: Enhanced validation rules with severity levels
- **Progress**: Comprehensive metrics and monitoring
- **Orchestration**: Airflow DAGs for production scheduling

## Migration Strategy

### 1. Core Components to Migrate

#### A. Database Layer
**Old**: `utils/database.py` (DuckDB)
```python
# Old approach
from utils.database import Database
db = Database("database.duckdb")
```

**New**: `src/utils/database.py` (PostgreSQL)
```python
# New approach
from src.utils.database import DatabaseManager
db_manager = DatabaseManager("postgresql://...")
async with db_manager.get_connection() as conn:
    # Use AsyncPG connection
```

#### B. HTTP Requests
**Old**: `utils/requests_cache.py` + `utils/playwright_cache.py`
```python
# Old approach
from utils.requests_cache import RequestHelper
helper = RequestHelper()
response = helper.get(url)
```

**New**: `src/extractors/robust_extractor.py`
```python
# New approach
async with RobustExtractor(db_manager) as extractor:
    data = await extractor.robust_http_request(url, cache_key="key")
```

#### C. Data Validation
**Old**: Individual Pydantic models with custom validators
```python
# Old approach
class RosterModel(BaseModel):
    name: str
    position: Optional[str]
    
    @validator('name')
    def validate_name(cls, v):
        return v.strip()
```

**New**: Enhanced validation with data quality framework
```python
# New approach
from src.extractors.robust_extractor import DataQualityValidator

validator = DataQualityValidator()
validator.add_common_rules()
errors = validator.validate(data, field_rules)
```

### 2. Component Migration Map

| Old Component | New Component | Migration Notes |
|---------------|---------------|-----------------|
| `ncaa_directory/` | `src/extractors/ncaa_extractor.py` | Use RobustNCAExtractor |
| `ncaa_rosters/` | Create `src/extractors/roster_extractor.py` | Migrate parsing schemas |
| `ncaa_stats/` | Create `src/extractors/stats_extractor.py` | Migrate API endpoints |
| `config_data/` | Create `src/extractors/config_extractor.py` | Migrate school configs |
| `utils/progress_tracker.py` | Built into `RobustExtractor.metrics` | Use ExtractionMetrics |
| `cli.py` | `src/main.py` + Airflow DAGs | Split CLI and orchestration |

### 3. Step-by-Step Migration Process

#### Step 1: Set Up Pipeline V2 Environment
```bash
cd packages/pipeline-v2
uv sync
```

#### Step 2: Migrate Database Schema
1. Export existing DuckDB data to CSV/JSON
2. Create PostgreSQL tables using Drizzle schema
3. Import data using new database manager

#### Step 3: Migrate Core Extractors

##### NCAA Directory Extractor
**Old**: `ncaa_directory/main.py`
```python
# Old implementation
def scrape_ncaa_directory():
    helper = RequestHelper()
    data = helper.get("https://web3.ncaa.org/directory/api/directory")
    # Process data...
```

**New**: Use existing `src/extractors/ncaa_extractor.py`
```python
# Already implemented in pipeline-v2
async with RobustNCAExtractor(db_manager) as extractor:
    data = await extractor.extract_data(division=1)
```

##### NCAA Rosters Extractor (To Be Created)
```python
# Create: src/extractors/roster_extractor.py
class RobustRosterExtractor(RobustExtractor):
    async def extract_data(self, school_id: int) -> List[Dict[str, Any]]:
        # Migrate logic from ncaa_rosters/main.py
        # Use robust HTTP requests with caching
        # Apply data quality validation
        pass
```

##### NCAA Stats Extractor (To Be Created)
```python
# Create: src/extractors/stats_extractor.py
class RobustStatsExtractor(RobustExtractor):
    async def extract_data(self, team_id: int, season: int) -> List[Dict[str, Any]]:
        # Migrate logic from ncaa_stats/main.py
        # Use concurrent processing for multiple teams
        # Apply circuit breaker for stats.ncaa.org
        pass
```

#### Step 4: Migrate Parsing Schemas
**Old**: `parse_schemas.py` with HTML parsing
```python
# Old schema-based parsing
roster_schema = {
    "players": {
        "selector": ".roster-player",
        "fields": {
            "name": ".player-name",
            "position": ".player-position"
        }
    }
}
```

**New**: Enhanced validation with data quality
```python
# New approach with robust validation
class RosterExtractor(RobustExtractor):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Add roster-specific validation rules
        self.validator.add_rule(ValidationRule(
            name="valid_position",
            validator=lambda x: x in VALID_POSITIONS if x else True,
            error_message="Invalid player position"
        ))
```

#### Step 5: Create Airflow DAGs
Replace CLI commands with Airflow DAGs:

```python
# Create: dags/ncaa_rosters_sync.py
from airflow import DAG
from airflow.operators.python import PythonOperator

def extract_rosters():
    # Use RobustRosterExtractor
    pass

dag = DAG(
    'ncaa_rosters_sync',
    schedule_interval='@daily',
    default_args=default_args
)

extract_task = PythonOperator(
    task_id='extract_rosters',
    python_callable=extract_rosters,
    dag=dag
)
```

### 4. Migration Checklist

#### Pre-Migration
- [ ] Set up PostgreSQL database
- [ ] Configure Redis for caching
- [ ] Set up Airflow environment
- [ ] Export existing DuckDB data

#### Core Migration
- [ ] Migrate database schema and data
- [ ] Implement RobustRosterExtractor
- [ ] Implement RobustStatsExtractor
- [ ] Implement RobustConfigExtractor
- [ ] Create Airflow DAGs for each extractor
- [ ] Migrate validation rules and data quality checks

#### Testing
- [ ] Unit tests for each extractor
- [ ] Integration tests with PostgreSQL
- [ ] Performance testing with concurrent extraction
- [ ] Data quality validation testing
- [ ] End-to-end pipeline testing

#### Production Deployment
- [ ] Set up monitoring and alerting
- [ ] Configure production database connections
- [ ] Deploy Airflow DAGs
- [ ] Set up backup and recovery procedures
- [ ] Document operational procedures

### 5. Key Benefits After Migration

#### Robustness Improvements
- **Circuit Breaker**: Automatic failure detection and recovery
- **Multi-Level Caching**: Memory + Redis for optimal performance
- **Rate Limiting**: Respectful API usage with burst support
- **Retry Logic**: Exponential backoff with jitter
- **Concurrent Processing**: Parallel extraction with semaphores

#### Operational Improvements
- **Comprehensive Metrics**: Success rates, cache hit rates, performance
- **Health Checks**: Component status monitoring
- **Data Quality**: Enhanced validation with severity levels
- **Orchestration**: Production-ready Airflow scheduling
- **Monitoring**: Structured logging and error tracking

#### Development Improvements
- **Type Safety**: Modern Python typing with `|` unions
- **Testing**: Comprehensive pytest suite
- **Documentation**: Clear implementation and usage guides
- **Maintainability**: Separation of concerns and clean architecture

### 6. Rollback Strategy

If migration issues occur:

1. **Database Rollback**: Keep DuckDB files as backup
2. **Code Rollback**: Use git to revert to old pipeline
3. **Data Validation**: Compare outputs between old and new systems
4. **Gradual Migration**: Migrate one component at a time
5. **Parallel Running**: Run both systems during transition period

### 7. Timeline Estimate

- **Week 1**: Database migration and core infrastructure
- **Week 2**: NCAA Directory and Config extractors
- **Week 3**: Rosters and Stats extractors
- **Week 4**: Airflow DAGs and testing
- **Week 5**: Production deployment and monitoring

### 8. Support and Resources

- **Implementation Plan**: `IMPLEMENTATION_PLAN.md`
- **Improvements Roadmap**: `IMPROVEMENTS.md`
- **Example Usage**: `src/main.py`
- **Test Suite**: `tests/test_ncaa_extractor.py`
- **Robust Extractor**: `src/extractors/robust_extractor.py`

This migration will transform the pipeline from a collection of individual scripts to a production-ready, robust data processing system with comprehensive monitoring, error handling, and scalability features.