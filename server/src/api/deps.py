from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import httpx
from jose import jwt, JWTError, jwk
import os
from dotenv import load_dotenv
from typing import Optional, Any

load_dotenv()

_bearer = HTTPBearer(auto_error=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# Simple in-memory cache for JWKS
_jwks_cache: Optional[dict[str, Any]] = None

async def _get_jwks() -> dict[str, Any]:
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache
    
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise ValueError("SUPABASE_URL or SUPABASE_ANON_KEY not set")
    
    jwks_url = f"{SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
    try:
        async with httpx.AsyncClient() as client:

            resp = await client.get(jwks_url, headers={"apikey": SUPABASE_ANON_KEY})
            resp.raise_for_status()
            _jwks_cache = resp.json()
            return _jwks_cache
    except Exception as e:
        print(f"DEBUG: Could not fetch JWKS from {jwks_url}: {e}")
        raise JWTError(f"Failed to fetch public keys from {jwks_url}: {e}")

async def get_current_user(

    credentials: HTTPAuthorizationCredentials = Security(_bearer),
) -> str:
    """
    FastAPI dependency — validates a Supabase-issued JWT.
    Supports HS256 (symmetric) and ES256/RS256 (asymmetric via JWKS).
    """
    token = credentials.credentials
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
        kid = header.get("kid")

        # Prioritize HS256 (Supabase standard with JWT Secret)
        if alg == "HS256" and SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        
        # Fallback to JWKS for asymmetric tokens (ES256/RS256)
        else:
            jwks = await _get_jwks()
            key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
            
            if not key:
                if alg == "HS256" and not SUPABASE_JWT_SECRET:
                    raise JWTError("Server misconfiguration: SUPABASE_JWT_SECRET not set")
                raise JWTError(f"Unsupported algorithm {alg} or missing public key")


            payload = jwt.decode(
                token,
                key,
                algorithms=["ES256", "RS256", "HS256"],
                options={"verify_aud": False},
            )

        user_id: str = payload.get("sub")
        if not user_id:
            raise ValueError("Missing sub claim")
        return user_id

    except JWTError as exc:
        print(f"DEBUG: Auth error ({alg}): {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as exc:
        print(f"DEBUG: Unexpected auth error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )



