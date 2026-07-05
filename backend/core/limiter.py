"""Shared rate-limiter singleton — imported by server.py and routers."""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Single limiter instance so all routers share the same in-memory store.
limiter = Limiter(key_func=get_remote_address)
