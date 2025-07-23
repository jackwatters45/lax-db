#!/usr/bin/env python3

import asyncio
import os
import sys
import structlog
import argparse

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

from extractors.ncaa_extractor import NCAADirectoryExtractor
from loaders.base_loader import PostgresLoader
from utils.database import db_manager


async def run_ncaa_directory_sync(limit: int | None = None):
    """Run the NCAA directory sync pipeline"""
    logger.info("Starting NCAA directory sync", limit=limit)

    try:
        # Initialize database
        await db_manager.initialize()

        # Create extractor and loader
        loader = PostgresLoader()

        async with NCAADirectoryExtractor() as extractor:
            logger.info("Extracting NCAA directory data")

            # Extract sports
            logger.info("Extracting sports...")
            sports = await extractor.extract_sports()
            sports_loaded = await loader.load_sports(sports)
            logger.info("Sports loaded", count=sports_loaded)

            # Extract conferences (sample for testing)
            logger.info("Extracting conferences...")
            conferences = await extractor.extract_conferences()
            if limit:
                conferences = conferences[:limit]
            conferences_loaded = await loader.load_conferences(conferences)
            logger.info("Conferences loaded", count=conferences_loaded)

            # Extract schools and locations (sample for testing)
            logger.info("Extracting schools and locations...")
            schools_overview = await extractor.extract_schools_overview()
            if limit:
                schools_overview = schools_overview[:limit]

            locations = []
            schools = []

            for school_data in schools_overview:
                school_details = await extractor.extract_school_details(
                    school_data["ncaa_id"]
                )
                if school_details:
                    # Handle location
                    if school_details.get("location"):
                        from generated.models import Location

                        location = Location(**school_details["location"])
                        locations.append(location)
                        school_details["location_id"] = location.id
                        del school_details["location"]

                    # Create school
                    from generated.models import School

                    merged_data = {**school_data, **school_details}
                    school = School(**merged_data)
                    schools.append(school)

            # Load locations first
            locations_loaded = await loader.load_locations(locations)
            logger.info("Locations loaded", count=locations_loaded)

            # Load schools
            schools_loaded = await loader.load_schools(schools)
            logger.info("Schools loaded", count=schools_loaded)

            logger.info(
                "NCAA directory sync complete",
                sports=sports_loaded,
                conferences=conferences_loaded,
                locations=locations_loaded,
                schools=schools_loaded,
            )

    except Exception as e:
        logger.error("NCAA directory sync failed", error=str(e), exc_info=True)
        raise
    finally:
        await db_manager.close()


async def test_extraction_only():
    """Test extraction without database operations"""
    logger.info("Testing extraction only")

    async with NCAADirectoryExtractor() as extractor:
        # Test sports extraction
        sports = await extractor.extract_sports()
        logger.info("Sports extracted", count=len(sports))

        # Test schools overview
        schools = await extractor.extract_schools_overview()
        logger.info("Schools overview extracted", count=len(schools))

        # Test single school detail
        if schools:
            school_detail = await extractor.extract_school_details(
                schools[0]["ncaa_id"]
            )
            logger.info(
                "School detail extracted",
                school_id=schools[0]["ncaa_id"],
                success=school_detail is not None,
            )


def main():
    parser = argparse.ArgumentParser(description="NCAA Directory Pipeline V2")
    parser.add_argument("command", choices=["sync", "test"], help="Command to run")
    parser.add_argument("--limit", type=int, help="Limit number of records for testing")
    parser.add_argument(
        "--log-level", default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR"]
    )

    args = parser.parse_args()

    # Set log level
    import logging

    logging.basicConfig(level=getattr(logging, args.log_level))

    # Check for required environment variables
    if args.command == "sync" and not os.getenv("DATABASE_URL"):
        logger.error("DATABASE_URL environment variable is required for sync command")
        sys.exit(1)

    # Run the appropriate command
    if args.command == "sync":
        asyncio.run(run_ncaa_directory_sync(limit=args.limit))
    elif args.command == "test":
        asyncio.run(test_extraction_only())


if __name__ == "__main__":
    main()
