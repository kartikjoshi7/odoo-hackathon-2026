import os

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-transitops-key-for-hackathon-only")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days for hackathon convenience
