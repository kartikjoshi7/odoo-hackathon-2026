from slowapi import Limiter
from slowapi.util import get_remote_address

# Uses the client's IP address to track and limit request rates globally
limiter = Limiter(key_func=get_remote_address)
