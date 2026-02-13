"""Tests for wix_duplicate_api.py — Wix REST API site duplication.

Tests cover:
- API key loading from environment
- list_sites() — verifies API access with correct headers
- duplicate_site() — creates site copy with correct payload
- Error handling for 401, 403, 404, and unexpected status codes
- Success path with site ID extraction
"""

import json
import os
import pytest
from unittest.mock import patch, MagicMock

# We need to import from the script — add its directory to path
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from wix_duplicate_api import (
    get_api_key,
    list_sites,
    duplicate_site,
    SITE_ID,
    NEW_SITE_NAME,
    API_BASE,
)


# ── Constants ──────────────────────────────────────────────────────────

FAKE_API_KEY = "IST.fake-test-key-12345"


# ── get_api_key ────────────────────────────────────────────────────────

class TestGetApiKey:
    """Tests for get_api_key() — loads WIX_API_KEY from env."""

    def test_returns_key_from_env(self):
        """Should return the API key when WIX_API_KEY is set."""
        with patch.dict(os.environ, {"WIX_API_KEY": FAKE_API_KEY}):
            key = get_api_key()
            assert key == FAKE_API_KEY

    def test_returns_nonempty_string(self):
        """Key should be a non-empty string."""
        with patch.dict(os.environ, {"WIX_API_KEY": FAKE_API_KEY}):
            key = get_api_key()
            assert isinstance(key, str)
            assert len(key) > 0


# ── list_sites ─────────────────────────────────────────────────────────

class TestListSites:
    """Tests for list_sites() — GET /site-management/v1/sites."""

    @patch("wix_duplicate_api.requests.get")
    def test_calls_correct_url(self, mock_get):
        """Should call the sites listing endpoint."""
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {"sites": []},
        )
        list_sites(FAKE_API_KEY)
        mock_get.assert_called_once()
        call_url = mock_get.call_args[0][0]
        assert call_url == f"{API_BASE}/site-management/v1/sites"

    @patch("wix_duplicate_api.requests.get")
    def test_sends_auth_header(self, mock_get):
        """Should send Authorization header with the API key."""
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {"sites": []},
        )
        list_sites(FAKE_API_KEY)
        call_headers = mock_get.call_args[1].get("headers") or mock_get.call_args[0][1] if len(mock_get.call_args[0]) > 1 else mock_get.call_args[1].get("headers", {})
        assert call_headers.get("Authorization") == FAKE_API_KEY

    @patch("wix_duplicate_api.requests.get")
    def test_returns_true_on_200(self, mock_get):
        """Should return True when API responds with 200."""
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {"sites": [
                {"displayName": "flaviovalle.com", "id": SITE_ID, "state": "ACTIVE"}
            ]},
        )
        result = list_sites(FAKE_API_KEY)
        assert result is True

    @patch("wix_duplicate_api.requests.get")
    def test_returns_false_on_401(self, mock_get):
        """Should return False on auth failure."""
        mock_get.return_value = MagicMock(
            status_code=401,
            text='{"message": "Unauthorized"}',
        )
        result = list_sites(FAKE_API_KEY)
        assert result is False

    @patch("wix_duplicate_api.requests.get")
    def test_returns_false_on_network_error(self, mock_get):
        """Should return False on network exception."""
        import requests as req
        mock_get.side_effect = req.exceptions.ConnectionError("Connection refused")
        result = list_sites(FAKE_API_KEY)
        assert result is False


# ── duplicate_site ─────────────────────────────────────────────────────

class TestDuplicateSite:
    """Tests for duplicate_site() — POST /sites/{id}/duplicate."""

    @patch("wix_duplicate_api.requests.post")
    def test_calls_correct_url(self, mock_post):
        """Should POST to the correct duplicate endpoint with site ID."""
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"site": {"id": "new-site-id-123"}},
        )
        duplicate_site(FAKE_API_KEY)
        call_url = mock_post.call_args[0][0]
        assert SITE_ID in call_url
        assert "/duplicate" in call_url

    @patch("wix_duplicate_api.requests.post")
    def test_sends_site_name_in_payload(self, mock_post):
        """Should send newSiteName in the request body."""
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"site": {"id": "new-site-id-123"}},
        )
        duplicate_site(FAKE_API_KEY)
        call_kwargs = mock_post.call_args[1]
        payload = call_kwargs.get("json", {})
        assert payload.get("newSiteName") == NEW_SITE_NAME

    @patch("wix_duplicate_api.requests.post")
    def test_sends_auth_header(self, mock_post):
        """Should send Authorization header with API key."""
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"site": {"id": "new-site-id-123"}},
        )
        duplicate_site(FAKE_API_KEY)
        call_headers = mock_post.call_args[1].get("headers", {})
        assert call_headers.get("Authorization") == FAKE_API_KEY

    @patch("wix_duplicate_api.requests.post")
    def test_handles_200_success(self, mock_post, capsys):
        """On 200, should print success message."""
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"site": {"id": "new-site-id-abc"}},
        )
        duplicate_site(FAKE_API_KEY)
        captured = capsys.readouterr()
        assert "SUCCESS" in captured.out or "success" in captured.out.lower()

    @patch("wix_duplicate_api.requests.post")
    def test_handles_401_unauthorized(self, mock_post, capsys):
        """On 401, should print auth error message."""
        mock_post.return_value = MagicMock(
            status_code=401,
            json=lambda: {"message": "Unauthorized"},
        )
        duplicate_site(FAKE_API_KEY)
        captured = capsys.readouterr()
        assert "401" in captured.out or "Unauthorized" in captured.out

    @patch("wix_duplicate_api.requests.post")
    def test_handles_403_forbidden(self, mock_post, capsys):
        """On 403, should print permissions error."""
        mock_post.return_value = MagicMock(
            status_code=403,
            json=lambda: {"message": "Forbidden"},
        )
        duplicate_site(FAKE_API_KEY)
        captured = capsys.readouterr()
        assert "403" in captured.out or "Forbidden" in captured.out or "permission" in captured.out.lower()

    @patch("wix_duplicate_api.requests.post")
    def test_handles_404_not_found(self, mock_post, capsys):
        """On 404, should indicate site not found."""
        mock_post.return_value = MagicMock(
            status_code=404,
            json=lambda: {"message": "Not Found"},
        )
        duplicate_site(FAKE_API_KEY)
        captured = capsys.readouterr()
        assert "404" in captured.out or "not found" in captured.out.lower()

    @patch("wix_duplicate_api.requests.post")
    def test_does_not_crash_on_network_error(self, mock_post):
        """Should handle network errors gracefully (sys.exit or exception, not crash)."""
        import requests as req
        mock_post.side_effect = req.exceptions.Timeout("Request timed out")
        with pytest.raises(SystemExit):
            duplicate_site(FAKE_API_KEY)


# ── Integration: constants ─────────────────────────────────────────────

class TestConstants:
    """Verify the script's constants are correct."""

    def test_site_id_is_flaviovalle(self):
        """Site ID should match flaviovalle.com's metaSiteId."""
        assert SITE_ID == "3d861f70-c919-4aa5-8420-e7643606ce2b"

    def test_new_site_name(self):
        """New site should be named flaviovalle-dev."""
        assert NEW_SITE_NAME == "flaviovalle-dev"

    def test_api_base_url(self):
        """API base should point to wixapis.com."""
        assert "wixapis.com" in API_BASE
