import asyncio
import httpx
from abc import ABC, abstractmethod
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential
import time

logger = structlog.get_logger()


class BaseExtractor(ABC):
    """Base class for all data extractors"""

    def __init__(self, rate_limit_delay: float = 1.0):
        self.rate_limit_delay = rate_limit_delay
        self.last_request_time = 0
        self.session: httpx.AsyncClient | None = None

    async def __aenter__(self):
        """Async context manager entry"""
        self.session = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
            headers={"User-Agent": "Goalbound Data Pipeline v2.0"},
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.aclose()

    async def _rate_limit(self):
        """Enforce rate limiting between requests"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time

        if time_since_last < self.rate_limit_delay:
            sleep_time = self.rate_limit_delay - time_since_last
            await asyncio.sleep(sleep_time)

        self.last_request_time = time.time()

    @retry(
        stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def _make_request(
        self, url: str, method: str = "GET", **kwargs
    ) -> httpx.Response:
        """Make HTTP request with retry logic"""
        await self._rate_limit()

        if not self.session:
            raise RuntimeError("Extractor not initialized. Use async context manager.")

        logger.debug("Making request", url=url, method=method)

        response = await self.session.request(method, url, **kwargs)
        response.raise_for_status()

        return response

    async def fetch_json(self, url: str, **kwargs) -> dict[str, any]:
        """Fetch JSON data from URL"""
        response = await self._make_request(url, **kwargs)
        return response.json()

    async def fetch_text(self, url: str, **kwargs) -> str:
        """Fetch text data from URL"""
        response = await self._make_request(url, **kwargs)
        return response.text

    @abstractmethod
    async def extract(self) -> list[any]:
        """Extract data - must be implemented by subclasses"""
        pass
    
    def validate_data(self, data: list[any], model_class) -> list[any]:        """Validate extracted data using Pydantic model"""
        validated_records = []
        errors = []

        for i, record in enumerate(data):
            try:
                validated_record = model_class.model_validate(record)
                validated_records.append(validated_record)
            except Exception as e:
                errors.append(f"Record {i}: {str(e)}")

        if errors:
            logger.warning(
                "Data validation errors",
                error_count=len(errors),
                total_records=len(data),
                errors=errors[:5],  # Log first 5 errors
            )

        logger.info(
            "Data validation complete",
            valid_records=len(validated_records),
            total_records=len(data),
            error_rate=len(errors) / len(data) if data else 0,
        )

        return validated_records
