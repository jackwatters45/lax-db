"""
Define here the models for your scraped items

See documentation in:
https://docs.scrapy.org/en/latest/topics/items.html
"""

import scrapy
from itemloaders.processors import TakeFirst, MapCompose, Join
from w3lib.html import remove_tags


def normalize_text(value):
    """Normalize text by stripping whitespace and removing empty strings"""
    if value:
        return value.strip()
    return None


def normalize_name(value):
    """Normalize names for database storage"""
    if value:
        import re

        normalized = re.sub(r"[^\w\s-]", "", value.lower())
        normalized = re.sub(r"[-\s]+", "_", normalized)
        return normalized.strip("_")
    return None


class SchoolItem(scrapy.Item):
    """Item for NCAA school data"""

    ncaa_id = scrapy.Field(
        input_processor=MapCompose(int), output_processor=TakeFirst()
    )
    name = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    display_name = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    normalized_name = scrapy.Field(
        input_processor=MapCompose(normalize_name), output_processor=TakeFirst()
    )
    abbreviation = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    mascot = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    division = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    conference_id = scrapy.Field(
        input_processor=MapCompose(int), output_processor=TakeFirst()
    )
    conference_name = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    is_private = scrapy.Field(
        input_processor=MapCompose(bool), output_processor=TakeFirst()
    )
    athletics_site = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    academics_site = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    logo_url = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    sport_region = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )

    # Location fields
    street = scrapy.Field(
        input_processor=MapCompose(remove_tags, normalize_text),
        output_processor=TakeFirst(),
    )
    city = scrapy.Field(
        input_processor=MapCompose(remove_tags, normalize_text),
        output_processor=TakeFirst(),
    )
    state = scrapy.Field(
        input_processor=MapCompose(remove_tags, normalize_text),
        output_processor=TakeFirst(),
    )
    zip_code = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    country = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )

    # Social media
    facebook = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    twitter = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    instagram = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )


class ConferenceItem(scrapy.Item):
    """Item for NCAA conference data"""

    ncaa_id = scrapy.Field(
        input_processor=MapCompose(int), output_processor=TakeFirst()
    )
    name = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    abbreviation = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    division = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    football_division = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    url = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    logo_url = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    address = scrapy.Field(
        input_processor=MapCompose(remove_tags, normalize_text),
        output_processor=TakeFirst(),
    )

    # Social media
    facebook = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    twitter = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    instagram = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )


class SportItem(scrapy.Item):
    """Item for NCAA sport data"""

    ncaa_id = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    name = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    display_name = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    gender = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    is_active = scrapy.Field(
        input_processor=MapCompose(bool), output_processor=TakeFirst()
    )
    divisions = scrapy.Field()  # List field


class LocationItem(scrapy.Item):
    """Item for location data"""

    street = scrapy.Field(
        input_processor=MapCompose(remove_tags, normalize_text),
        output_processor=TakeFirst(),
    )
    city = scrapy.Field(
        input_processor=MapCompose(remove_tags, normalize_text),
        output_processor=TakeFirst(),
    )
    state = scrapy.Field(
        input_processor=MapCompose(remove_tags, normalize_text),
        output_processor=TakeFirst(),
    )
    zip_code = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
    country = scrapy.Field(
        input_processor=MapCompose(normalize_text), output_processor=TakeFirst()
    )
