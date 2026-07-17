import pytest

from app.core.encryption import decrypt, encrypt, maybe_decrypt, maybe_encrypt
from app.exceptions import FinArivuException


def test_encrypt_decrypt_round_trip():
    plain = "sensitive-123"
    cipher = encrypt(plain)
    assert cipher != plain
    assert decrypt(cipher) == plain


def test_maybe_encrypt_decrypt_round_trip():
    plain = "PAN1234"
    cipher = maybe_encrypt(plain)
    assert isinstance(cipher, str)
    assert maybe_decrypt(cipher) == plain


def test_maybe_encrypt_non_string_passthrough():
    assert maybe_encrypt(None) is None
    assert maybe_encrypt(123) == 123


def test_maybe_decrypt_non_string_passthrough():
    assert maybe_decrypt(None) is None
    assert maybe_decrypt(123) == 123


def test_decrypt_invalid_ciphertext_raises():
    with pytest.raises(FinArivuException):
        decrypt("not-valid-base64!!!")
