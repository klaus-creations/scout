from supabase import create_client, Client
from functools import lru_cache
from dotenv import load_dotenv
import os

load_dotenv()


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """
    Anon client — respects Row Level Security.
    Use for all user-authenticated operations.
    """
    url  = os.getenv("SUPABASE_URL")
    key  = os.getenv("SUPABASE_ANON_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env")
    return create_client(url, key)


@lru_cache(maxsize=1)
def get_supabase_admin() -> Client:
    """
    Service role client — bypasses RLS.
    Use ONLY for server-side writes (usage events, job status updates).
    Never expose this key to the frontend.
    """
    url  = os.getenv("SUPABASE_URL")
    key  = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    return create_client(url, key)
