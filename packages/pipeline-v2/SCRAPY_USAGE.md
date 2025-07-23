# NCAA Directory Scrapy Spider - Usage Guide

This guide shows how to use the Scrapy spider for extracting NCAA directory data.

## Quick Start

### 1. Install Dependencies
```bash
cd packages/pipeline-v2
uv sync
```

### 2. Run the Spider

#### Basic Usage (Extract all data)
```bash
python run_scrapy.py
```

#### Extract specific divisions only
```bash
# Division I only
python run_scrapy.py --divisions 1

# Division I and II
python run_scrapy.py --divisions 1,2
```

#### Limit for testing
```bash
# Extract only 5 schools per division
python run_scrapy.py --limit 5
```

#### Choose output format
```bash
# JSON output (default)
python run_scrapy.py --output json

# CSV output
python run_scrapy.py --output csv

# Both formats
python run_scrapy.py --output both
```

#### Adjust logging
```bash
# Debug mode
python run_scrapy.py --log-level DEBUG

# Quiet mode
python run_scrapy.py --log-level ERROR
```

### 3. Using Scrapy Commands Directly

You can also use Scrapy's built-in commands:

```bash
# Basic run
scrapy crawl ncaa_directory

# With custom settings
scrapy crawl ncaa_directory -s LOG_LEVEL=DEBUG

# With spider arguments
scrapy crawl ncaa_directory -a divisions=1 -a limit=10

# Save to specific file
scrapy crawl ncaa_directory -o schools.json
```

## Output

The spider extracts three types of data:

### 1. Schools
- NCAA ID, name, display name
- Division, conference information
- Location (street, city, state, zip)
- Contact info (athletics site, academics site)
- Social media (Facebook, Twitter, Instagram)
- Logo URL, mascot, abbreviation

### 2. Conferences  
- NCAA ID, name, abbreviation
- Division, football division
- Website, logo, address
- Social media links

### 3. Sports
- NCAA ID, name, display name
- Gender (male/female/mixed)
- Active status, divisions

## Output Files

Data is saved to `scraped_data/YYYYMMDD_HHMMSS/`:

```
scraped_data/
└── 20240123_143022/
    ├── schools.json
    ├── conferences.json
    ├── sports.json
    └── summary.json
```

## Examples

### Extract Division I schools only (for testing)
```bash
python run_scrapy.py --divisions 1 --limit 10 --log-level DEBUG
```

### Full extraction with both JSON and CSV output
```bash
python run_scrapy.py --output both
```

### Quick test run
```bash
python run_scrapy.py --limit 3 --log-level INFO
```

## Configuration

The spider is configured in `src/scrapy_spiders/settings.py`:

- **Rate limiting**: 1-2 second delays between requests
- **Caching**: HTTP responses cached for 1 hour
- **Retries**: Automatic retry with exponential backoff
- **User agents**: Rotated to avoid blocking
- **Playwright**: JavaScript rendering for dynamic content

## Data Quality

The spider includes validation:
- Required fields (NCAA ID, name) must be present
- Location parsing from HTML addresses
- Social media URL extraction
- Name normalization for database storage

## Troubleshooting

### Common Issues

1. **Playwright not installed**
   ```bash
   playwright install chromium
   ```

2. **Rate limiting/blocking**
   - Increase `DOWNLOAD_DELAY` in settings
   - Reduce `CONCURRENT_REQUESTS_PER_DOMAIN`

3. **Memory issues with large datasets**
   - Use `--limit` parameter for testing
   - Process divisions separately

### Debug Mode
```bash
python run_scrapy.py --log-level DEBUG --limit 1
```

This will show detailed request/response information for troubleshooting.