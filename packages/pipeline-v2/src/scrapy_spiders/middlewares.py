"""
Define here the models for your spider middleware

See documentation in:
https://docs.scrapy.org/en/latest/topics/spider-middleware.html
"""

import random
import time
from scrapy import signals
from scrapy.http import HtmlResponse
from scrapy.downloadermiddlewares.retry import RetryMiddleware
from scrapy.utils.response import response_status_message
import structlog

logger = structlog.get_logger()


class NCAADirectorySpiderMiddleware:
    """Spider middleware for NCAA Directory spider"""

    @classmethod
    def from_crawler(cls, crawler):
        s = cls()
        crawler.signals.connect(s.spider_opened, signal=signals.spider_opened)
        return s

    def process_spider_input(self, response, spider):
        """Called for each response that goes through the spider middleware"""
        return None

    def process_spider_output(self, response, result, spider):
        """Called with the results returned from the Spider"""
        for i in result:
            yield i

    def process_spider_exception(self, response, exception, spider):
        """Called when a spider or process_spider_input() method raises an exception"""
        logger.error(f"Spider exception: {exception}", url=response.url)

    def process_start_requests(self, start_requests, spider):
        """Called with the start requests of the spider"""
        for r in start_requests:
            yield r

    def spider_opened(self, spider):
        logger.info(f"Spider opened: {spider.name}")


class NCAADirectoryDownloaderMiddleware:
    """Downloader middleware for NCAA Directory spider"""

    def __init__(self):
        self.user_agents = [
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ]

    @classmethod
    def from_crawler(cls, crawler):
        s = cls()
        crawler.signals.connect(s.spider_opened, signal=signals.spider_opened)
        return s

    def process_request(self, request, spider):
        """Called for each request that goes through the downloader middleware"""
        # Rotate user agents
        request.headers["User-Agent"] = random.choice(self.user_agents)

        # Add random delay for API requests
        if "web3.ncaa.org" in request.url:
            time.sleep(random.uniform(0.5, 1.5))

        return None

    def process_response(self, request, response, spider):
        """Called with the response returned from the downloader"""
        # Log API responses
        if "web3.ncaa.org" in request.url:
            logger.debug(
                f"API response: {response.status}",
                url=request.url,
                size=len(response.body),
            )

        return response

    def process_exception(self, request, exception, spider):
        """Called when a download handler or a process_request() raises an exception"""
        logger.error(
            f"Download exception: {exception}", url=request.url, spider=spider.name
        )

    def spider_opened(self, spider):
        logger.info(f"Downloader middleware opened for spider: {spider.name}")


class NCAARetryMiddleware(RetryMiddleware):
    """Custom retry middleware with exponential backoff"""

    def __init__(self, settings):
        super().__init__(settings)
        self.max_retry_times = settings.getint("RETRY_TIMES", 3)
        self.retry_http_codes = set(
            int(x) for x in settings.getlist("RETRY_HTTP_CODES")
        )
        self.priority_adjust = settings.getint("RETRY_PRIORITY_ADJUST", -1)

    def retry(self, request, reason, spider):
        """Retry request with exponential backoff"""
        retries = request.meta.get("retry_times", 0) + 1

        if retries <= self.max_retry_times:
            # Exponential backoff
            delay = (2**retries) + random.uniform(0, 1)

            logger.warning(
                f"Retrying {request.url} (attempt {retries}/{self.max_retry_times}) "
                f"after {delay:.1f}s delay. Reason: {reason}"
            )

            time.sleep(delay)

            retryreq = request.copy()
            retryreq.meta["retry_times"] = retries
            retryreq.dont_filter = True
            retryreq.priority = request.priority + self.priority_adjust

            return retryreq
        else:
            logger.error(
                f"Gave up retrying {request.url} (failed {retries} times): {reason}"
            )
