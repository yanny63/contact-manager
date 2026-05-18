import bcrypt
from jose import jwt
from datetime import timedelta, datetime

class AuthEssentials:
    @staticmethod 
    def hashPassword(password: str):
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode(), salt)

    @staticmethod 
    def checkPassword(password: str, hashed: str) -> bool:
        return bcrypt.checkpw(password.encode(), hashed.encode())

    @staticmethod
    def toDB(password: bytes) -> str: 
        return password.decode()
    
    @staticmethod 
    def createToken(user: object, minutes: int, algorithm: str, secret_key: str) -> str:
        expire = datetime.utcnow() + timedelta(minutes=minutes)
        return jwt.encode({
                "sub": str(user.id),
                "phone": str(user.phone),
                "prefix": str(user.prefix),
                "role": str(user.role),
                "expire": str(expire)
            }, secret_key, algorithm=algorithm)