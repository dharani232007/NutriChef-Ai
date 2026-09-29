import os
import json
import hashlib

# In-memory dictionary fallback cache
_memory_cache = {}

try:
    import redis
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_client = redis.Redis.from_url(redis_url, decode_responses=True, socket_timeout=2)
    redis_client.ping()
    IS_REDIS_AVAILABLE = True
    print(" Connected to Redis Cache successfully.")
except Exception as e:
    redis_client = None
    IS_REDIS_AVAILABLE = False
    print(f"⚠️ Redis offline or not installed ({e}). Using fast in-memory fallback cache.")


def get_image_hash(image_bytes: bytes) -> str:
    """Creates a deterministic MD5 hash for image bytes."""
    return hashlib.md5(image_bytes).hexdigest()


def get_cache(key: str) -> dict | None:
    """Retrieves cached JSON result if available."""
    try:
        if IS_REDIS_AVAILABLE and redis_client:
            cached = redis_client.get(key)
            if cached:
                return json.loads(cached)
        else:
            if key in _memory_cache:
                return _memory_cache[key]
    except Exception as e:
        print(f"Cache get error: {e}")
    return None


def set_cache(key: str, data: dict, expire_seconds: int = 86400):
    """Saves result to Redis (or fallback memory) with expiration."""
    try:
        if IS_REDIS_AVAILABLE and redis_client:
            redis_client.setex(key, expire_seconds, json.dumps(data))
        else:
            _memory_cache[key] = data
    except Exception as e:
        print(f"Cache set error: {e}")