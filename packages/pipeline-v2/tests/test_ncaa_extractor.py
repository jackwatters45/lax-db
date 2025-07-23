import os
import sys
from unittest.mock import patch

import pytest

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from extractors.ncaa_extractor import NCAADirectoryExtractor
from generated.models import Conference, Location, School, Sport


class TestNCAADirectoryExtractor:
    @pytest.fixture
    def extractor(self):
        return NCAADirectoryExtractor()

    @pytest.fixture
    def mock_sports_response(self):
        return [
            {"code": "MLA", "name": "Men's Lacrosse"},
            {"code": "WLA", "name": "Women's Lacrosse"},
        ]

    @pytest.fixture
    def mock_schools_response(self):
        return [
            {
                "orgId": 12345,
                "name": "Test University",
                "primaryConferenceId": 67890,
                "isPrivate": False,
                "athleticsUrl": "https://testuniversity.edu/athletics",
                "institutionUrl": "https://testuniversity.edu",
                "region": "Northeast",
            }
        ]

    @pytest.mark.asyncio
    async def test_extract_sports(self, extractor, mock_sports_response):
        """Test sports extraction"""
        with patch.object(extractor, "fetch_json", return_value=mock_sports_response):
            async with extractor:
                sports = await extractor.extract_sports()

        assert len(sports) == 2
        assert isinstance(sports[0], Sport)
        assert sports[0].ncaaId == "MLA"
        assert sports[0].name == "lacrosse"
        assert sports[0].displayName == "Men's Lacrosse"
        assert sports[0].gender == "male"

        assert sports[1].ncaaId == "WLA"
        assert sports[1].gender == "female"

    @pytest.mark.asyncio
    async def test_extract_schools_overview(self, extractor, mock_schools_response):
        """Test schools overview extraction"""
        with patch.object(extractor, "fetch_json", return_value=mock_schools_response):
            async with extractor:
                schools = await extractor.extract_schools_overview()

        assert len(schools) == 3  # Called for 3 divisions
        school = schools[0]
        assert school["ncaa_id"] == 12345
        assert school["name"] == "test_university"
        assert school["display_name"] == "Test University"
        assert school["division"] == "1"

    @pytest.mark.asyncio
    async def test_school_detail_extraction(self, extractor):
        """Test detailed school extraction"""
        mock_detail_response = {
            "name": "Test University",
            "abbreviation": "TU",
            "mascot": "Eagles",
            "logoUrl": "https://example.com/logo.png",
            "address": "<p>123 Main St<br>Test City, NY 12345</p>",
            "facebookUrl": "https://facebook.com/testuniversity",
            "twitterUrl": "https://twitter.com/testuniversity",
        }

        with patch.object(extractor, "fetch_json", return_value=mock_detail_response):
            async with extractor:
                details = await extractor.extract_school_details(12345)

        assert details is not None
        assert details["ncaa_id"] == 12345
        assert details["name"] == "test_university"
        assert details["abbreviation"] == "TU"
        assert details["mascot"] == "Eagles"
        assert details["facebook"] == "https://facebook.com/testuniversity"

        # Test location extraction
        location = details["location"]
        assert location["street"] == "123 Main St"
        assert location["city"] == "Test City"
        assert location["state"] == "NY"
        assert location["zip_code"] == "12345"

    def test_normalize_name(self, extractor):
        """Test name normalization"""
        assert extractor._normalize_name("Test University") == "test_university"
        assert extractor._normalize_name("St. John's College") == "st_johns_college"
        assert (
            extractor._normalize_name("University of North Carolina")
            == "university_of_north_carolina"
        )

    def test_normalize_sport_name(self, extractor):
        """Test sport name normalization"""
        assert extractor._normalize_sport_name("Men's Lacrosse") == "lacrosse"
        assert extractor._normalize_sport_name("Women's Basketball") == "basketball"
        assert extractor._normalize_sport_name("Track and Field") == "track_and_field"

    def test_infer_gender(self, extractor):
        """Test gender inference"""
        assert extractor._infer_gender("Men's Lacrosse") == "male"
        assert extractor._infer_gender("Women's Basketball") == "female"
        assert extractor._infer_gender("Track and Field") == "mixed"

    def test_extract_location_from_html(self, extractor):
        """Test location extraction from HTML"""
        html = "<p>123 Main Street<br>Test City, NY 12345</p>"
        location = extractor._extract_location_from_html(html)

        assert location["street"] == "123 Main Street"
        assert location["city"] == "Test City"
        assert location["state"] == "NY"
        assert location["zip_code"] == "12345"
        assert location["country"] == "United States"

    def test_extract_social_media(self, extractor):
        """Test social media extraction"""
        data = {
            "facebookUrl": "https://facebook.com/test",
            "twitterUrl": "https://twitter.com/test",
            "instagramUrl": "https://instagram.com/test",
        }

        social = extractor._extract_social_media(data)

        assert social["facebook"] == "https://facebook.com/test"
        assert social["twitter"] == "https://twitter.com/test"
        assert social["instagram"] == "https://instagram.com/test"


if __name__ == "__main__":
    pytest.main([__file__])
