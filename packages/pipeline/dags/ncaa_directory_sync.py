import os
import sys
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

import structlog

from extractors.ncaa_extractor import NCAADirectoryExtractor
from loaders.base_loader import PostgresLoader

logger = structlog.get_logger()

# DAG configuration
default_args = {
    "owner": "data-team",
    "depends_on_past": False,
    "start_date": datetime(2024, 1, 1),
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
}

dag = DAG(
    "ncaa_directory_sync",
    default_args=default_args,
    description="Sync NCAA directory data (sports, schools, conferences)",
    schedule_interval="0 2 * * *",  # Daily at 2 AM
    catchup=False,
    max_active_runs=1,
    tags=["ncaa", "directory", "pipeline-v2"],
)


async def extract_and_load_sports(**context):
    """Extract and load NCAA sports data"""
    logger.info("Starting sports extraction and loading")

    async with NCAADirectoryExtractor() as extractor:
        # Extract sports
        sports = await extractor.extract_sports()
        logger.info("Sports extracted", count=len(sports))

        # Load to database
        loader = PostgresLoader()
        loaded_count = await loader.load_sports(sports)

        logger.info("Sports loading complete", loaded=loaded_count)
        return loaded_count


async def extract_and_load_conferences(**context):
    """Extract and load NCAA conference data"""
    logger.info("Starting conferences extraction and loading")

    async with NCAADirectoryExtractor() as extractor:
        # Extract conferences
        conferences = await extractor.extract_conferences()
        logger.info("Conferences extracted", count=len(conferences))

        # Load to database
        loader = PostgresLoader()
        loaded_count = await loader.load_conferences(conferences)

        logger.info("Conferences loading complete", loaded=loaded_count)
        return loaded_count


async def extract_and_load_schools(**context):
    """Extract and load NCAA school data"""
    logger.info("Starting schools extraction and loading")

    async with NCAADirectoryExtractor() as extractor:
        # Extract all data (includes schools and locations)
        data = await extractor.extract()

        schools = data["schools"]
        locations = data["locations"]

        logger.info(
            "Schools and locations extracted",
            schools=len(schools),
            locations=len(locations),
        )

        # Load to database
        loader = PostgresLoader()

        # Load locations first (schools reference them)
        locations_loaded = await loader.load_locations(locations)

        # Then load schools
        schools_loaded = await loader.load_schools(schools)

        logger.info(
            "Schools and locations loading complete",
            schools_loaded=schools_loaded,
            locations_loaded=locations_loaded,
        )

        return {"schools_loaded": schools_loaded, "locations_loaded": locations_loaded}


def run_async_task(async_func):
    """Wrapper to run async functions in Airflow"""
    import asyncio

    return asyncio.run(async_func())


# Define tasks
extract_sports_task = PythonOperator(
    task_id="extract_and_load_sports",
    python_callable=lambda **context: run_async_task(
        lambda: extract_and_load_sports(**context)
    ),
    dag=dag,
)

extract_conferences_task = PythonOperator(
    task_id="extract_and_load_conferences",
    python_callable=lambda **context: run_async_task(
        lambda: extract_and_load_conferences(**context)
    ),
    dag=dag,
)

extract_schools_task = PythonOperator(
    task_id="extract_and_load_schools",
    python_callable=lambda **context: run_async_task(
        lambda: extract_and_load_schools(**context)
    ),
    dag=dag,
)

# Define dependencies
# Sports and conferences can run in parallel, schools depend on both
[extract_sports_task, extract_conferences_task] >> extract_schools_task
