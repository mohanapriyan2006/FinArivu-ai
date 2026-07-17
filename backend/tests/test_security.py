import jwt
import pytest

from app.core.security import verify_token
from app.exceptions import AuthenticationError


def test_strip_bearer():
    from app.core.security import _strip_bearer

    assert _strip_bearer("Bearer abc") == "abc"
    assert _strip_bearer("abc") == "abc"


async def test_verify_valid_development_token(auth_token):
    payload = verify_token(auth_token)
    assert payload["sub"] == "test-user-001"


def test_verify_invalid_token():
    with pytest.raises(AuthenticationError):
        verify_token("not-a-token")


def test_verify_token_with_bearer_prefix(auth_token):
    payload = verify_token(f"Bearer {auth_token}")
    assert payload["sub"] == "test-user-001"
