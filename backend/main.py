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
    allow_origins=['*'],
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

class User(BaseModel):
    id: int
    phone: str
    prefix: str
    role: str
    picture: Optional[str] = None
    isActive: Optional[bool] = None

class Contact(BaseModel):
    phone: str
    prefix: str
    nickname: str
    id: int | None = None
    favourite: Optional[bool] = False

settings = Settings()
oauth_scheme = OAuth2PasswordBearer(tokenUrl='token', auto_error=False)

@app.get("/me")
def me(token: str = Depends(oauth_scheme)):
    if not token:
        raise HTTPException(status_code=404)
    try:
        c = db()
        c.connection(settings.host, settings.database, settings.database_user, settings.database_password)
        payload = jwt.decode(token, settings.secret_key, settings.algorithm)
        user_id = payload.get('sub')
        user = c.execute(
            "SELECT id, phone, prefix, picture FROM users WHERE isActive = %s AND id = %s", (True, user_id)
        )
        c.close()
        return user
    except JWTError:
        raise HTTPException(status_code=401)

@app.post('/register')
def register(prefix: str = Form(...), phone: str = Form(...), password: str = Form(...), token: str = Depends(oauth_scheme)):
    if token:
        raise HTTPException(status_code=403)
    c = db()
    c.connection(settings.host, settings.database, settings.database_user, settings.database_password)
    user = c.execute(
        "SELECT id FROM users WHERE phone = %s", (phone,)
    )
    if user: 
        c.close()
        raise HTTPException(status_code=409, detail="Uzytkownik juz istnieje")
    hashed = auth.hashPassword(password)
    u = c.execute(
        "INSERT INTO users (phone, password, prefix) VALUES (%s, %s, %s) RETURNING id, role", 
        (phone, auth.toDB(hashed), prefix)
    )
    u['phone'] = phone
    u['prefix'] = prefix
    c.close()
    user = User(**u)
    token = auth.createToken(user, settings.access_token_expire_minutes, settings.algorithm, settings.secret_key)
    return {"access_token": token}
    


@app.post('/login')
def login(phone: str = Form(...), prefix: str = Form(...), password: str = Form(...), token: str = Depends(oauth_scheme)):
    if token:
        raise HTTPException(status_code=403)
    c = db()
    c.connection(settings.host, settings.database, settings.database_user, settings.database_password)
    user = c.execute(
        "SELECT id, phone, prefix, password, role FROM users WHERE phone = %s", (phone,)
    )
    print(user)
    c.close()
    if not user or not auth.checkPassword(password, user.get('password')):
        raise HTTPException(status_code=401, detail='Złe dane logowania')
    token = auth.createToken(User(**user), settings.access_token_expire_minutes, settings.algorithm, settings.secret_key)
    return {'access_token': token, 'token_type': 'bearer'}

@app.post('/API/newContact')
def newContact(contact: Contact, status_code=201, token: str = Depends(oauth_scheme)):
    if not token or token is None:
        raise HTTPException(status_code=401, detail="Wymagane zalogwanie")
    payload = jwt.decode(token, settings.secret_key, settings.algorithm)
    c = db()
    c.connection(settings.host, settings.database, settings.database_user, settings.database_password)
    user = c.execute(
        "SELECT id FROM users WHERE phone = %s", (contact.phone,)
    )
    added = c.execute(
        "SELECT id FROM users WHERE phone = %s AND prefix = %s", (contact.phone, contact.prefix)
    )
    if not user or not added:
        raise HTTPException(status_code=404, detail='Taki numer nie istnieje')
    c.execute(
        "INSERT INTO contacts (owner_id, contact_id, nickname, favourite) VALUES (%s, %s, %s, %s)", 
        (payload.get('sub'), added.id, contact.nickname, contact.favourite)
    )
    row = c.execute(
        "SELECT id FROM contacts WHERE owner_id = %s AND contact_id = %s",
        (payload.get('sub'), added.id)
    )
    c.close()
    contact.id = row['id']
    return contact

@app.put('/API/unfavourite')
def unfavourite(contact_id: str = Form(...), token: str = Depends(oauth_scheme)):
    if not token or token is None:
        raise HTTPException(status_code=401)
    if not contact_id:
        raise HTTPException(status_code=400)
    try:
        payload = jwt.decode(token, settings.secret_key, settings.algorithm)
        user_id = payload.get('sub')
        c = db()
        c.connection(settings.host, settings.database, settings.database_user, settings.database_password)
        c.execute(
            "UPDATE contacts SET favourite = %s WHERE id = %s AND owner_id = %s", (False, contact_id, user_id)
        )
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=e)
    finally: 
        c.close()
    
@app.get('/API/contacts')
def contacts(token: str = Depends(oauth_scheme)):
    if not token or token is None:
        raise HTTPException(status_code=401, detail="Uzytkownik niezalogowany")
    payload = jwt.decode(token, settings.secret_key, settings.algorithm)
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=401)
    c = db()
    c.connection(settings.host, settings.database, settings.database_user, settings.database_password)
    data = c.execute(
        """SELECT contacts.id, contacts.contact_id, contacts.nickname, contacts.picture, contacts.favourite,
                contact_user.phone, contact_user.prefix
        FROM contacts
        JOIN users AS owner         ON owner.id        = contacts.owner_id
        JOIN users AS contact_user  ON contact_user.id = contacts.contact_id
        WHERE owner.id = %s""",
        (user_id,)
    )
    c.close()
    if isinstance(data, list):
        return data
    print(data)
    dataToList = [data]
    return dataToList