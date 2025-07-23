import asyncio
from typing import Any
import asyncpg
import os
from contextlib import asynccontextmanager
import structlog

logger = structlog.get_logger()


class DatabaseManager:
    def __init__(self):
        self.pool: asyncpg.Pool | None = None
        self.database_url = os.getenv("DATABASE_URL")
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is required")

    async def initialize(self):
        """Initialize the connection pool"""
        if self.pool is None:
            self.pool = await asyncpg.create_pool(
                self.database_url, min_size=2, max_size=10, command_timeout=60
            )
            logger.info("Database connection pool initialized")

    async def close(self):
        """Close the connection pool"""
        if self.pool:
            await self.pool.close()
            self.pool = None
            logger.info("Database connection pool closed")

    @asynccontextmanager
    async def get_connection(self):
        """Get a database connection from the pool"""
        if not self.pool:
            await self.initialize()

        async with self.pool.acquire() as connection:
            yield connection

    @asynccontextmanager
    async def get_transaction(self):
        """Get a database transaction"""
        async with self.get_connection() as conn:
            async with conn.transaction():
                yield conn

    async def upsert_records(
        self,
        table_name: str,
        records: list[dict[str, Any]],
        conflict_fields: list[str],
        update_fields: list[str] | None = None,
    ) -> int:
        """
        Upsert records into a table with conflict resolution

        Args:
            table_name: Name of the table
            records: List of record dictionaries
            conflict_fields: Fields to use for conflict detection
            update_fields: Fields to update on conflict (if None, updates all fields except conflict fields)

        Returns:
            Number of records processed
        """
        if not records:
            return 0

        # Get field names from first record
        field_names = list(records[0].keys())

        # Determine update fields
        if update_fields is None:
            update_fields = [
                f for f in field_names if f not in conflict_fields and f != "id"
            ]

        # Build SQL
        placeholders = ", ".join([f"${i + 1}" for i in range(len(field_names))])
        conflict_clause = ", ".join(conflict_fields)
        update_clause = ", ".join(
            [f"{field} = EXCLUDED.{field}" for field in update_fields]
        )

        sql = f"""
            INSERT INTO {table_name} ({", ".join(field_names)})
            VALUES ({placeholders})
            ON CONFLICT ({conflict_clause})
            DO UPDATE SET
                {update_clause},
                time_updated = NOW()
        """

        async with self.get_transaction() as conn:
            # Convert records to tuples in correct order
            record_tuples = [
                tuple(record.get(field) for field in field_names) for record in records
            ]

            await conn.executemany(sql, record_tuples)

            logger.info(
                "Upserted records",
                table=table_name,
                count=len(records),
                conflict_fields=conflict_fields,
            )

            return len(records)

    async def execute_query(self, query: str, *args) -> list[dict[str, any]]:
        """Execute a query and return results as dictionaries"""
        async with self.get_connection() as conn:
            rows = await conn.fetch(query, *args)
            return [dict(row) for row in rows]

    async def execute_command(self, command: str, *args) -> str:
        """Execute a command and return status"""
        async with self.get_connection() as conn:
            return await conn.execute(command, *args)


# Global database manager instance
db_manager = DatabaseManager()
