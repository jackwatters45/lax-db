"""
Robust extraction framework with advanced error handling, caching, and data quality validation.

This module provides enhanced extraction capabilities including:
- Circuit breaker pattern for API resilience
- Multi-level caching (memory + Redis)
- Data quality validation framework
- Concurrent processing with rate limiting
- Comprehensive metrics and monitoring
- Automatic retry with exponential backoff
"""

import asyncio
import hashlib
import json
import logging
import time
from abc import ABC, abstractmethod
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import (
    Any,
    AsyncGenerator,
    Callable,
    Dict,
    List,
    Optional,
    Set,
    TypeVar,
    Union,
)

import aiohttp
import redis.asyncio as redis
from pydantic import BaseModel, ValidationError

from ..utils.database import DatabaseManager

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class CircuitState(Enum):
    """Circuit breaker states."""

    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if service recovered


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker."""

    failure_threshold: int = 5
    recovery_timeout: int = 60
    expected_exception: type = Exception


@dataclass
class CacheConfig:
    """Configuration for caching layer."""

    memory_ttl: int = 300  # 5 minutes
    redis_ttl: int = 3600  # 1 hour
    max_memory_size: int = 1000  # Max items in memory cache


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting."""

    requests_per_second: float = 10.0
    burst_size: int = 20
    concurrent_limit: int = 5


@dataclass
class RetryConfig:
    """Configuration for retry logic."""

    max_attempts: int = 3
    base_delay: float = 1.0
    max_delay: float = 60.0
    exponential_base: float = 2.0
    jitter: bool = True


@dataclass
class ValidationRule:
    """Data quality validation rule."""

    name: str
    validator: Callable[[Any], bool]
    error_message: str
    severity: str = "error"  # error, warning, info


@dataclass
class ExtractionMetrics:
    """Metrics for extraction operations."""

    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    validation_errors: int = 0
    circuit_breaker_trips: int = 0
    start_time: datetime = field(default_factory=datetime.now)

    @property
    def success_rate(self) -> float:
        """Calculate success rate percentage."""
        if self.total_requests == 0:
            return 0.0
        return (self.successful_requests / self.total_requests) * 100

    @property
    def cache_hit_rate(self) -> float:
        """Calculate cache hit rate percentage."""
        total_cache_requests = self.cache_hits + self.cache_misses
        if total_cache_requests == 0:
            return 0.0
        return (self.cache_hits / total_cache_requests) * 100


class CircuitBreaker:
    """Circuit breaker implementation for API resilience."""

    def __init__(self, config: CircuitBreakerConfig):
        self.config = config
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.next_attempt_time: Optional[datetime] = None

    async def call(self, func: Callable, *args, **kwargs):
        """Execute function with circuit breaker protection."""
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
            else:
                raise Exception("Circuit breaker is OPEN")

        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except self.config.expected_exception as e:
            self._on_failure()
            raise e

    def _should_attempt_reset(self) -> bool:
        """Check if we should attempt to reset the circuit."""
        if self.next_attempt_time is None:
            return True
        return datetime.now() >= self.next_attempt_time

    def _on_success(self):
        """Handle successful operation."""
        self.failure_count = 0
        self.state = CircuitState.CLOSED

    def _on_failure(self):
        """Handle failed operation."""
        self.failure_count += 1
        self.last_failure_time = datetime.now()

        if self.failure_count >= self.config.failure_threshold:
            self.state = CircuitState.OPEN
            self.next_attempt_time = datetime.now() + timedelta(
                seconds=self.config.recovery_timeout
            )


class MultiLevelCache:
    """Multi-level caching with memory and Redis backends."""

    def __init__(self, config: CacheConfig, redis_client: Optional[redis.Redis] = None):
        self.config = config
        self.redis_client = redis_client
        self.memory_cache: Dict[str, tuple[Any, datetime]] = {}
        self.access_times: Dict[str, datetime] = {}

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache (memory first, then Redis)."""
        # Check memory cache first
        if key in self.memory_cache:
            value, expiry = self.memory_cache[key]
            if datetime.now() < expiry:
                self.access_times[key] = datetime.now()
                return value
            else:
                del self.memory_cache[key]
                if key in self.access_times:
                    del self.access_times[key]

        # Check Redis cache
        if self.redis_client:
            try:
                cached_data = await self.redis_client.get(key)
                if cached_data:
                    value = json.loads(cached_data)
                    # Store in memory cache for faster access
                    await self.set_memory(key, value)
                    return value
            except Exception as e:
                logger.warning(f"Redis cache error: {e}")

        return None

    async def set(self, key: str, value: Any):
        """Set value in both memory and Redis caches."""
        await self.set_memory(key, value)

        if self.redis_client:
            try:
                await self.redis_client.setex(
                    key, self.config.redis_ttl, json.dumps(value, default=str)
                )
            except Exception as e:
                logger.warning(f"Redis cache set error: {e}")

    async def set_memory(self, key: str, value: Any):
        """Set value in memory cache with LRU eviction."""
        expiry = datetime.now() + timedelta(seconds=self.config.memory_ttl)
        self.memory_cache[key] = (value, expiry)
        self.access_times[key] = datetime.now()

        # LRU eviction if cache is full
        if len(self.memory_cache) > self.config.max_memory_size:
            oldest_key = min(
                self.access_times.keys(), key=lambda k: self.access_times[k]
            )
            del self.memory_cache[oldest_key]
            del self.access_times[oldest_key]

    def generate_key(self, prefix: str, **kwargs) -> str:
        """Generate cache key from parameters."""
        key_data = json.dumps(kwargs, sort_keys=True, default=str)
        key_hash = hashlib.md5(key_data.encode()).hexdigest()
        return f"{prefix}:{key_hash}"


class RateLimiter:
    """Token bucket rate limiter with burst support."""

    def __init__(self, config: RateLimitConfig):
        self.config = config
        self.tokens = config.burst_size
        self.last_update = time.time()
        self.semaphore = asyncio.Semaphore(config.concurrent_limit)

    async def acquire(self):
        """Acquire rate limit token."""
        await self.semaphore.acquire()

        now = time.time()
        time_passed = now - self.last_update
        self.last_update = now

        # Add tokens based on time passed
        self.tokens = min(
            self.config.burst_size,
            self.tokens + time_passed * self.config.requests_per_second,
        )

        if self.tokens < 1:
            sleep_time = (1 - self.tokens) / self.config.requests_per_second
            await asyncio.sleep(sleep_time)
            self.tokens = 0
        else:
            self.tokens -= 1

    def release(self):
        """Release concurrent request slot."""
        self.semaphore.release()


class DataQualityValidator:
    """Data quality validation framework."""

    def __init__(self):
        self.rules: List[ValidationRule] = []
        self.validation_results: Dict[str, List[str]] = {}

    def add_rule(self, rule: ValidationRule):
        """Add validation rule."""
        self.rules.append(rule)

    def add_common_rules(self):
        """Add common validation rules."""
        self.add_rule(
            ValidationRule(
                name="not_empty",
                validator=lambda x: x is not None and str(x).strip() != "",
                error_message="Value cannot be empty",
            )
        )

        self.add_rule(
            ValidationRule(
                name="valid_email",
                validator=lambda x: "@" in str(x) if x else True,
                error_message="Invalid email format",
                severity="warning",
            )
        )

        self.add_rule(
            ValidationRule(
                name="positive_number",
                validator=lambda x: isinstance(x, (int, float)) and x > 0
                if x is not None
                else True,
                error_message="Number must be positive",
                severity="warning",
            )
        )

    def validate(
        self, data: Dict[str, Any], field_rules: Dict[str, List[str]] = None
    ) -> Dict[str, List[str]]:
        """Validate data against rules."""
        errors = {}
        field_rules = field_rules or {}

        for field, value in data.items():
            field_errors = []
            rules_to_check = field_rules.get(field, [])

            for rule in self.rules:
                if rule.name in rules_to_check or not rules_to_check:
                    try:
                        if not rule.validator(value):
                            field_errors.append(
                                f"{rule.severity.upper()}: {rule.error_message}"
                            )
                    except Exception as e:
                        field_errors.append(f"VALIDATION_ERROR: {str(e)}")

            if field_errors:
                errors[field] = field_errors

        return errors


class RobustExtractor(ABC):
    """
    Enhanced base extractor with robustness features.

    Features:
    - Circuit breaker for API resilience
    - Multi-level caching (memory + Redis)
    - Rate limiting with burst support
    - Automatic retry with exponential backoff
    - Data quality validation
    - Comprehensive metrics and monitoring
    - Concurrent processing with semaphores
    """

    def __init__(
        self,
        db_manager: DatabaseManager,
        circuit_config: Optional[CircuitBreakerConfig] = None,
        cache_config: Optional[CacheConfig] = None,
        rate_limit_config: Optional[RateLimitConfig] = None,
        retry_config: Optional[RetryConfig] = None,
        redis_client: Optional[redis.Redis] = None,
    ):
        self.db_manager = db_manager
        self.circuit_breaker = CircuitBreaker(circuit_config or CircuitBreakerConfig())
        self.cache = MultiLevelCache(cache_config or CacheConfig(), redis_client)
        self.rate_limiter = RateLimiter(rate_limit_config or RateLimitConfig())
        self.retry_config = retry_config or RetryConfig()
        self.validator = DataQualityValidator()
        self.metrics = ExtractionMetrics()

        # Add common validation rules
        self.validator.add_common_rules()

        # HTTP session for connection pooling
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            connector=aiohttp.TCPConnector(limit=100, limit_per_host=20),
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()

    @abstractmethod
    async def extract_data(self, **kwargs) -> List[T]:
        """Extract data - to be implemented by subclasses."""
        pass

    async def robust_http_request(
        self, url: str, method: str = "GET", cache_key: Optional[str] = None, **kwargs
    ) -> Dict[str, Any]:
        """Make HTTP request with all robustness features."""
        # Check cache first
        if cache_key:
            cached_result = await self.cache.get(cache_key)
            if cached_result:
                self.metrics.cache_hits += 1
                return cached_result
            self.metrics.cache_misses += 1

        # Apply rate limiting
        await self.rate_limiter.acquire()

        try:
            result = await self._retry_request(url, method, **kwargs)

            # Cache successful result
            if cache_key:
                await self.cache.set(cache_key, result)

            self.metrics.successful_requests += 1
            return result

        except Exception as e:
            self.metrics.failed_requests += 1
            logger.error(f"Request failed after retries: {url} - {str(e)}")
            raise
        finally:
            self.rate_limiter.release()
            self.metrics.total_requests += 1

    async def _retry_request(self, url: str, method: str, **kwargs) -> Dict[str, Any]:
        """Execute HTTP request with retry logic."""
        last_exception = None

        for attempt in range(self.retry_config.max_attempts):
            try:
                return await self.circuit_breaker.call(
                    self._make_request, url, method, **kwargs
                )
            except Exception as e:
                last_exception = e

                if attempt < self.retry_config.max_attempts - 1:
                    delay = self._calculate_retry_delay(attempt)
                    logger.warning(
                        f"Request failed (attempt {attempt + 1}), retrying in {delay}s: {str(e)}"
                    )
                    await asyncio.sleep(delay)
                else:
                    logger.error(
                        f"Request failed after {self.retry_config.max_attempts} attempts: {str(e)}"
                    )

        raise last_exception

    async def _make_request(self, url: str, method: str, **kwargs) -> Dict[str, Any]:
        """Make actual HTTP request."""
        if not self.session:
            raise RuntimeError(
                "HTTP session not initialized. Use async context manager."
            )

        async with self.session.request(method, url, **kwargs) as response:
            response.raise_for_status()
            return await response.json()

    def _calculate_retry_delay(self, attempt: int) -> float:
        """Calculate retry delay with exponential backoff and jitter."""
        delay = min(
            self.retry_config.base_delay
            * (self.retry_config.exponential_base**attempt),
            self.retry_config.max_delay,
        )

        if self.retry_config.jitter:
            import random

            delay *= 0.5 + random.random() * 0.5  # Add 0-50% jitter

        return delay

    async def validate_and_process_batch(
        self,
        raw_data: List[Dict[str, Any]],
        model_class: type[T],
        validation_rules: Optional[Dict[str, List[str]]] = None,
    ) -> tuple[List[T], List[Dict[str, Any]]]:
        """Validate and process batch of raw data."""
        valid_items = []
        invalid_items = []

        for item in raw_data:
            try:
                # Data quality validation
                validation_errors = self.validator.validate(item, validation_rules)
                if validation_errors:
                    logger.warning(f"Data quality issues: {validation_errors}")
                    # Count as validation error but continue processing
                    self.metrics.validation_errors += 1

                # Pydantic model validation
                validated_item = model_class(**item)
                valid_items.append(validated_item)

            except ValidationError as e:
                logger.error(f"Validation failed for item: {e}")
                invalid_items.append(
                    {
                        "data": item,
                        "error": str(e),
                        "timestamp": datetime.now().isoformat(),
                    }
                )
                self.metrics.validation_errors += 1
            except Exception as e:
                logger.error(f"Unexpected error processing item: {e}")
                invalid_items.append(
                    {
                        "data": item,
                        "error": str(e),
                        "timestamp": datetime.now().isoformat(),
                    }
                )

        return valid_items, invalid_items

    async def concurrent_extract(
        self, extract_tasks: List[Callable], max_concurrent: int = 5
    ) -> List[Any]:
        """Execute multiple extraction tasks concurrently."""
        semaphore = asyncio.Semaphore(max_concurrent)

        async def bounded_task(task):
            async with semaphore:
                return await task()

        results = await asyncio.gather(
            *[bounded_task(task) for task in extract_tasks], return_exceptions=True
        )

        # Separate successful results from exceptions
        successful_results = []
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Concurrent task failed: {result}")
                self.metrics.failed_requests += 1
            else:
                successful_results.append(result)
                self.metrics.successful_requests += 1

        return successful_results

    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get comprehensive metrics summary."""
        runtime = datetime.now() - self.metrics.start_time

        return {
            "runtime_seconds": runtime.total_seconds(),
            "total_requests": self.metrics.total_requests,
            "successful_requests": self.metrics.successful_requests,
            "failed_requests": self.metrics.failed_requests,
            "success_rate_percent": self.metrics.success_rate,
            "cache_hits": self.metrics.cache_hits,
            "cache_misses": self.metrics.cache_misses,
            "cache_hit_rate_percent": self.metrics.cache_hit_rate,
            "validation_errors": self.metrics.validation_errors,
            "circuit_breaker_trips": self.metrics.circuit_breaker_trips,
            "circuit_breaker_state": self.circuit_breaker.state.value,
            "requests_per_second": self.metrics.total_requests / runtime.total_seconds()
            if runtime.total_seconds() > 0
            else 0,
        }

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check of extractor components."""
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "components": {},
        }

        # Check database connection
        try:
            async with self.db_manager.get_connection() as conn:
                await conn.fetchval("SELECT 1")
            health_status["components"]["database"] = "healthy"
        except Exception as e:
            health_status["components"]["database"] = f"unhealthy: {str(e)}"
            health_status["status"] = "degraded"

        # Check Redis connection
        if self.cache.redis_client:
            try:
                await self.cache.redis_client.ping()
                health_status["components"]["redis"] = "healthy"
            except Exception as e:
                health_status["components"]["redis"] = f"unhealthy: {str(e)}"
                health_status["status"] = "degraded"

        # Circuit breaker status
        health_status["components"]["circuit_breaker"] = (
            self.circuit_breaker.state.value
        )
        if self.circuit_breaker.state == CircuitState.OPEN:
            health_status["status"] = "degraded"

        # Metrics summary
        health_status["metrics"] = self.get_metrics_summary()

        return health_status


# Example usage and concrete implementation
class RobustNCAExtractor(RobustExtractor):
    """Robust NCAA directory extractor implementation."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.base_url = "https://web3.ncaa.org/directory/api"

        # Add NCAA-specific validation rules
        self.validator.add_rule(
            ValidationRule(
                name="valid_ncaa_id",
                validator=lambda x: isinstance(x, int) and x > 0 if x else False,
                error_message="NCAA ID must be positive integer",
            )
        )

    async def extract_data(
        self, division: int = 1, sport_id: int = 1
    ) -> List[Dict[str, Any]]:
        """Extract NCAA directory data with robustness features."""
        cache_key = self.cache.generate_key(
            "ncaa_directory", division=division, sport_id=sport_id
        )

        # Make robust HTTP request
        response_data = await self.robust_http_request(
            f"{self.base_url}/directory",
            params={"division": division, "sport": sport_id},
            cache_key=cache_key,
        )

        return response_data.get("schools", [])

    async def extract_conferences(self, division: int = 1) -> List[Dict[str, Any]]:
        """Extract conference data."""
        cache_key = self.cache.generate_key("ncaa_conferences", division=division)

        response_data = await self.robust_http_request(
            f"{self.base_url}/conferences",
            params={"division": division},
            cache_key=cache_key,
        )

        return response_data.get("conferences", [])

    async def extract_all_data_concurrent(self) -> Dict[str, List[Dict[str, Any]]]:
        """Extract all data types concurrently."""
        tasks = [
            lambda: self.extract_data(division=1),
            lambda: self.extract_data(division=2),
            lambda: self.extract_data(division=3),
            lambda: self.extract_conferences(division=1),
            lambda: self.extract_conferences(division=2),
            lambda: self.extract_conferences(division=3),
        ]

        results = await self.concurrent_extract(tasks, max_concurrent=3)

        return {
            "d1_schools": results[0] if len(results) > 0 else [],
            "d2_schools": results[1] if len(results) > 1 else [],
            "d3_schools": results[2] if len(results) > 2 else [],
            "d1_conferences": results[3] if len(results) > 3 else [],
            "d2_conferences": results[4] if len(results) > 4 else [],
            "d3_conferences": results[5] if len(results) > 5 else [],
        }


# Usage example
async def example_usage():
    """Example of using the robust extractor."""
    from ..utils.database import DatabaseManager

    db_manager = DatabaseManager("postgresql://user:pass@localhost/db")

    # Configure robustness features
    circuit_config = CircuitBreakerConfig(failure_threshold=3, recovery_timeout=30)
    cache_config = CacheConfig(memory_ttl=600, redis_ttl=7200)
    rate_limit_config = RateLimitConfig(requests_per_second=5.0, concurrent_limit=3)
    retry_config = RetryConfig(max_attempts=3, base_delay=2.0)

    async with RobustNCAExtractor(
        db_manager=db_manager,
        circuit_config=circuit_config,
        cache_config=cache_config,
        rate_limit_config=rate_limit_config,
        retry_config=retry_config,
    ) as extractor:
        # Health check
        health = await extractor.health_check()
        logger.info(f"Health status: {health['status']}")

        # Extract data with all robustness features
        try:
            all_data = await extractor.extract_all_data_concurrent()
            logger.info(f"Extracted {len(all_data)} data sets")

            # Get metrics
            metrics = extractor.get_metrics_summary()
            logger.info(f"Extraction metrics: {metrics}")

        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            # Metrics still available for debugging
            metrics = extractor.get_metrics_summary()
            logger.error(f"Failure metrics: {metrics}")
