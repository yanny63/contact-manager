from fastapi import FastAPI, HTTPException, Depends, Form
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import DatabaseManagement as db
from pydantic_settings import BaseSettings
from typing import Optional
from jose import jwt, JWTError
from auth import AuthEssentials as auth
import dotenv
import os 

dotenv.load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

class Settings(BaseSettings):
    secret_key: str
    algorithm: str = 'HS256'
    access_token_expire_minutes: int = 60
    host: str = 'localhost'
    database: str = 'contact_manager'
    database_user: str 
    database_password: str 

    class Config:
        env_file = '.env'

class User:
    id: int
    phone: str
    role: str
    picture: Optional[str] = None
    isActive: Optional[bool] = None

class Contact(BaseModel):
    user_id: int
    phone: str
    nickname: str
    id: int | None = None

settings = Settings()
oauth_scheme = OAuth2PasswordBearer(tokenUrl='token', auto_error=False)

async def getCurrentUser(token: str = Depends(oauth_scheme)):
    c = db()
    c.connection(settings.host, settings.database, settings.database_user, settings.database_password)
    
    exception = HTTPException(status_code=401, detail='Błąd podczas próby weryfikacji danych uwierzytelniających', headers={'WWW-Authenticate': 'Bearer'})

    try:
        payload = jwt.decode(token, settings.secret_key, settings.algorithm)
        phone = payload.get('sub')
        if phone is None:
            raise exception
        print(phone)

        from_db = c.execute(
            "SELECT id, phone, role, picture, isActive FROM users WHERE phone = %s", 
            (phone,)
        )
        user = User(**from_db)
        return user

    except JWTError:
        raise exception
    
async def isActive(user: User = Depends(getCurrentUser)) -> User:
    if not user.isActive:
        raise HTTPException(status_code=400, detail='Nieaktywne konto')
    return user

@app.post('/register')
def register():
    pass


@app.post('/login')
def login(phone: str = Form(...), password: str = Form(...), token: str = Depends(oauth_scheme)):
    if token:
        raise HTTPException(status_code=403)
    c = db()
    c.connection(settings.host, settings.database, settings.database_user, settings.database_password)
    user = c.execute(
        "SELECT id, password, role FROM users WHERE phone = %s", (phone,)
    )
    if not user or not auth.checkPassword(password, user.password):
        raise HTTPException(status_code=401, detail='Złe dane logowania')
    
    token = auth.createToken(User(user.id, user.phone, user.role))
    return {'access_token': token, 'token_type': 'bearer'}

@app.post('/API/newContact')
def newContact(contact: Contact, status_code=201, token: str = Depends(oauth_scheme)):
    if not token or token is None:
        raise HTTPException(status_code=401, detail="Wymagane zalogwanie")
    c = db()
    c.connection(settings.host, settings.database, settings.database_user, settings.database_password)
    c.execute(
        "INSERT INTO contacts (user_id, phone, nickname) VALUES (%s, %s, %s)", 
        (contact.user_id, contact.phone, contact.nickname)
    )
    row = c.execute(
        "SELECT id FROM contacts WHERE user_id = %s AND phone = %s",
        (contact.user_id, contact.phone)
    )
    contact.id = row['id']
    return contact
    
@app.get('/API/contacts')
def contacts(token: str = Depends(oauth_scheme)):
    if not token or token is None:
        raise HTTPException(status_code=401, detail="Uzytkownik niezalogowany")
    payload = jwt.decode(token, settings.secret_key, settings.algorithm)
    phone = payload.get('sub')
    if not phone:
        raise HTTPException(status_code=401)
    c = db()
    c.connection(settings.host, settings.database, settings.database_user, settings.database_password)
    data = c.execute(
        """SELECT contacts.phone, contacts.nickname, contacts.picture, contacts.favourite 
        FROM users 
        JOIN contacts ON users.id = contacts.user_id 
        WHERE users.phone = %s""", (phone,)
    )
    print(data)
    return data