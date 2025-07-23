from abc import ABC, abstractmethod
from pydantic import BaseModel
import structlog
from ..utils.database import db_manager

logger = structlog.get_logger()


class BaseLoader(ABC):
    """Base class for all data loaders"""

    def __init__(self, batch_size: int = 100):
        self.batch_size = batch_size

    async def load_records(
        self,
        records: list[BaseModel],
        table_name: str,
        conflict_fields: list[str],
        update_fields: list[str] | None = None,
    ) -> int:
        """
        Load records into database with batching and conflict resolution

        Args:
            records: List of Pydantic model instances
            table_name: Database table name
            conflict_fields: Fields to use for conflict detection
            update_fields: Fields to update on conflict

        Returns:
            Total number of records processed
        """
        if not records:
            logger.info("No records to load", table=table_name)
            return 0

        total_processed = 0

        # Process records in batches
        for i in range(0, len(records), self.batch_size):
            batch = records[i : i + self.batch_size]

            # Convert Pydantic models to dictionaries
            batch_dicts = []
            for record in batch:
                record_dict = record.model_dump(by_alias=False)

                # Apply field mapping if available
                if hasattr(record.Config, "field_mapping"):
                    mapped_dict = {}
                    for pydantic_field, db_field in record.Config.field_mapping.items():
                        if pydantic_field in record_dict:
                            mapped_dict[db_field] = record_dict[pydantic_field]
                    record_dict = mapped_dict

                batch_dicts.append(record_dict)

            # Upsert batch
            processed = await db_manager.upsert_records(
                table_name=table_name,
                records=batch_dicts,
                conflict_fields=conflict_fields,
                update_fields=update_fields,
            )

            total_processed += processed

            logger.info(
                "Batch processed",
                table=table_name,
                batch_size=len(batch),
                batch_number=i // self.batch_size + 1,
                total_batches=(len(records) + self.batch_size - 1) // self.batch_size,
            )

        logger.info("Load complete", table=table_name, total_records=total_processed)

        return total_processed

    @abstractmethod
    async def load(self, data: list[any]) -> int:
        """Load data - must be implemented by subclasses"""
        pass


class PostgresLoader(BaseLoader):
    """PostgreSQL-specific loader implementation"""

    async def load_locations(self, locations: list[any]) -> int:
        """Load location records"""
        from ..generated.models import Location

        validated_locations = [
            Location.model_validate(loc) if not isinstance(loc, Location) else loc
            for loc in locations
        ]

        return await self.load_records(
            records=validated_locations,
            table_name=Location.Config.table_name,
            conflict_fields=Location.Config.conflict_fields,
        )

    async def load_conferences(self, conferences: list[any]) -> int:
        """Load conference records"""
        from ..generated.models import Conference

        validated_conferences = [
            Conference.model_validate(conf)
            if not isinstance(conf, Conference)
            else conf
            for conf in conferences
        ]

        return await self.load_records(
            records=validated_conferences,
            table_name=Conference.Config.table_name,
            conflict_fields=Conference.Config.conflict_fields,
        )

    async def load_sports(self, sports: list[any]) -> int:
        """Load sport records"""
        from ..generated.models import Sport

        validated_sports = [
            Sport.model_validate(sport) if not isinstance(sport, Sport) else sport
            for sport in sports
        ]

        return await self.load_records(
            records=validated_sports,
            table_name=Sport.Config.table_name,
            conflict_fields=Sport.Config.conflict_fields,
        )

    async def load_schools(self, schools: list[any]) -> int:
        """Load school records"""
        from ..generated.models import School

        validated_schools = [
            School.model_validate(school) if not isinstance(school, School) else school
            for school in schools
        ]

        return await self.load_records(
            records=validated_schools,
            table_name=School.Config.table_name,
            conflict_fields=School.Config.conflict_fields,
        )

    async def load(self, data: list[any]) -> int:
        """Generic load method - determines type and routes appropriately"""
        if not data:
            return 0

        # Determine data type from first record
        first_record = data[0]

        if hasattr(first_record, "__class__"):
            class_name = first_record.__class__.__name__

            if class_name == "Location":
                return await self.load_locations(data)
            elif class_name == "Conference":
                return await self.load_conferences(data)
            elif class_name == "Sport":
                return await self.load_sports(data)
            elif class_name == "School":
                return await self.load_schools(data)

        raise ValueError(f"Unknown data type: {type(first_record)}")
