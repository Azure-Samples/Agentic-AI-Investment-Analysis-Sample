from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from sqlalchemy.orm import Session
# from jose import JWTError, jwt
# from passlib.context import CryptContext
import uuid

# from app.core.config import settings
# from app.database.connection import get_db
from app.models import User


# Security setup
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# security = HTTPBearer()

# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     """Verify a password against its hash"""
#     return pwd_context.verify(plain_password, hashed_password)

# def get_password_hash(password: str) -> str:
#     """Hash a password"""
#     return pwd_context.hash(password)

# def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
#     """Create a JWT access token"""
#     to_encode = data.copy()
#     if expires_delta:
#         expire = datetime.utcnow() + expires_delta
#     else:
#         expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
#     to_encode.update({"exp": expire})
#     encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
#     return encoded_jwt

# async def get_current_user(
#     credentials: HTTPAuthorizationCredentials = Depends(security),
#     cosmos_client: CosmosDBClient = Depends(get_cosmos_client)
# ) -> User:
#     """Get the current authenticated user"""
#     credentials_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="Could not validate credentials",
#         headers={"WWW-Authenticate": "Bearer"},
#     )
    
#     try:
#         payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=["HS256"])
#         user_email: str = payload.get("sub")
#         if user_email is None:
#             raise credentials_exception
#     except JWTError:
#         raise credentials_exception
    
#     user_repo = UserRepository(cosmos_client)
#     user = await user_repo.get_by_email(user_email)
#     if user is None or not user.is_active:
#         raise credentials_exception
    
#     return user

# async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
#     """Get the current active user"""
#     if not current_user.is_active:
#         raise HTTPException(status_code=400, detail="Inactive user")
#     return current_user

async def get_current_active_user() -> User:
    """Get the current active user"""
    
    # This is a placeholder for the actual user retrieval logic.
    current_user = User(
        id=str(uuid.uuid4()),
        partition_key="user",
        email="user@email.com",
        is_active=True
    )

    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user