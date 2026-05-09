import bcrypt
from jose import jwt
from datetime import timedelta, datetime

class AuthEssentials:
    @staticmethod 
    def hashPassword(password: str):
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode(), salt)

    @staticmethod 
    def checkPassword(password, hashed) -> bool:
        return bcrypt.checkpw(password, hashed)
    
    @staticmethod 
    def createToken(user: object, minutes: int, algorithm: str, secret_key: str) -> str:
        expire = datetime.utcnow() + timedelta(minutes=minutes)
        return jwt.encode({
            "sub": str(user.id),
            "phone": str(user.phone),
            "role": str(user.role),
            "expire": expire
        }, secret_key, algorithm=algorithm)
    
    