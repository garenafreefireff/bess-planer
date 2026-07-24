import base64
import binascii
import hashlib
import hmac
import json
import secrets
from collections.abc import Mapping
from datetime import UTC, datetime, timedelta
from typing import Any


def utc_now() -> datetime:
    return datetime.now(UTC)


class TokenError(Exception):
    """Raised when a signed token cannot be trusted."""


def hash_password(password: str, *, iterations: int) -> str:
    salt = secrets.token_bytes(16)
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
    )
    return "$".join(
        [
            "pbkdf2_sha256",
            str(iterations),
            base64.b64encode(salt).decode("ascii"),
            base64.b64encode(derived_key).decode("ascii"),
        ]
    )


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, iterations_value, salt_value, expected_value = password_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False

        iterations = int(iterations_value)
        salt = base64.b64decode(salt_value.encode("ascii"))
        expected = base64.b64decode(expected_value.encode("ascii"))
    except (ValueError, TypeError):
        return False

    actual = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(actual, expected)


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_signed_token(
    payload: Mapping[str, Any],
    *,
    secret_key: str,
    expires_delta: timedelta,
) -> str:
    now = utc_now()
    claims = dict(payload)
    claims.update(
        {
            "iat": int(now.timestamp()),
            "nbf": int(now.timestamp()),
            "exp": int((now + expires_delta).timestamp()),
        }
    )

    header = {"alg": "HS256", "typ": "JWT"}
    signing_input = ".".join(
        [
            _base64url_json(header),
            _base64url_json(claims),
        ]
    )
    signature = hmac.new(
        secret_key.encode("utf-8"),
        signing_input.encode("ascii"),
        hashlib.sha256,
    ).digest()
    return f"{signing_input}.{_base64url_encode(signature)}"


def decode_signed_token(token: str, *, secret_key: str) -> dict[str, Any]:
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".", 2)
    except ValueError as exc:
        raise TokenError("Token must have three parts.") from exc

    signing_input = f"{encoded_header}.{encoded_payload}"
    expected_signature = hmac.new(
        secret_key.encode("utf-8"),
        signing_input.encode("ascii"),
        hashlib.sha256,
    ).digest()
    try:
        actual_signature = _base64url_decode(encoded_signature)
    except (binascii.Error, ValueError) as exc:
        raise TokenError("Invalid token signature.") from exc

    if not hmac.compare_digest(actual_signature, expected_signature):
        raise TokenError("Invalid token signature.")

    try:
        header = json.loads(_base64url_decode(encoded_header))
        payload = json.loads(_base64url_decode(encoded_payload))
    except (binascii.Error, json.JSONDecodeError, UnicodeDecodeError, ValueError) as exc:
        raise TokenError("Invalid token payload.") from exc

    if header.get("alg") != "HS256":
        raise TokenError("Unsupported token algorithm.")

    now = int(utc_now().timestamp())
    expires_at = payload.get("exp")
    not_before = payload.get("nbf")

    if not isinstance(expires_at, int) or expires_at < now:
        raise TokenError("Token has expired.")
    if isinstance(not_before, int) and not_before > now:
        raise TokenError("Token is not active yet.")

    return payload


def _base64url_json(value: Mapping[str, Any]) -> str:
    raw = json.dumps(value, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return _base64url_encode(raw)


def _base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _base64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}".encode("ascii"))
