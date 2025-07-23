"""
Scrapy settings for NCAA Directory spider project - Extraction Only Mode
"""

BOT_NAME = "ncaa_directory"

SPIDER_MODULES = ["src.scrapy_spiders.ncaa_directory.spiders"]
NEWSPIDER_MODULE = "src.scrapy_spiders.ncaa_directory.spiders"

# Obey robots.txt rules
ROBOTSTXT_OBEY = True

# Configure delays for requests for the same website (default: 0)
DOWNLOAD_DELAY = 1
RANDOMIZE_DOWNLOAD_DELAY = 0.5

# The download delay setting will honor only one of:
CONCURRENT_REQUESTS_PER_DOMAIN = 2
CONCURRENT_REQUESTS_PER_IP = 2

# Disable cookies (enabled by default)
COOKIES_ENABLED = False

# Disable Telnet Console (enabled by default)
TELNETCONSOLE_ENABLED = False

# Override the default request headers:
DEFAULT_REQUEST_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

# Enable or disable spider middlewares
SPIDER_MIDDLEWARES = {
    "src.scrapy_spiders.middlewares.NCAADirectorySpiderMiddleware": 543,
}

# Enable or disable downloader middlewares
DOWNLOADER_MIDDLEWARES = {
    "src.scrapy_spiders.middlewares.NCAADirectoryDownloaderMiddleware": 543,
}

# Configure item pipelines - EXTRACTION ONLY
ITEM_PIPELINES = {
    "src.scrapy_spiders.pipelines.ValidationPipeline": 300,
    "src.scrapy_spiders.pipelines.JsonExportPipeline": 400,
    # 'src.scrapy_spiders.pipelines.CsvExportPipeline': 500,  # Uncomment for CSV export
}

# Enable autothrottling
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 1
AUTOTHROTTLE_MAX_DELAY = 10
AUTOTHROTTLE_TARGET_CONCURRENCY = 2.0
AUTOTHROTTLE_DEBUG = False

# Enable and configure HTTP caching
HTTPCACHE_ENABLED = True
HTTPCACHE_EXPIRATION_SECS = 3600
HTTPCACHE_DIR = "httpcache"
HTTPCACHE_IGNORE_HTTP_CODES = [500, 502, 503, 504, 408, 429]

# Configure item pipelines - EXTRACTION ONLY
ITEM_PIPELINES = {
    "src.scrapy_spiders.pipelines.ValidationPipeline": 300,
    "src.scrapy_spiders.pipelines.JsonExportPipeline": 400,
    # 'src.scrapy_spiders.pipelines.CsvExportPipeline': 500,  # Uncomment for CSV export
}

# Enable autothrottling
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 1
AUTOTHROTTLE_MAX_DELAY = 10
AUTOTHROTTLE_TARGET_CONCURRENCY = 2.0
AUTOTHROTTLE_DEBUG = False

# Enable and configure HTTP caching
HTTPCACHE_ENABLED = True
HTTPCACHE_EXPIRATION_SECS = 3600
HTTPCACHE_DIR = "httpcache"
HTTPCACHE_IGNORE_HTTP_CODES = [500, 502, 503, 504, 408, 429]

# Playwright settings
DOWNLOAD_HANDLERS = {
    "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
    "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
}

PLAYWRIGHT_BROWSER_TYPE = "chromium"
PLAYWRIGHT_LAUNCH_OPTIONS = {
    "headless": True,
    "timeout": 30000,
}

# Logging
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(levelname)s: %(message)s"

# Request fingerprinting
REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"

# Feed exports (alternative to pipelines)
FEEDS = {
    "scraped_data/%(name)s_%(time)s.json": {
        "format": "json",
        "encoding": "utf8",
        "store_empty": False,
        "indent": 2,
    },
}
