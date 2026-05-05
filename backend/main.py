from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from database import DatabaseManagement
from pydantic_settings import BaseSettings
from auth import AuthEssentials
import dotenv
import os 

dotenv.load_dotenv()

app = FastAPI()

class Settings(BaseSettings):
    secret_key: str
    algorithm: str = 'HS256'
    access_token_expire_minutes: int = 60

    class Config:
        env_file = '.env'

settings = Settings()

class LoginRequest(BaseModel):
    email: str
    password: str

class User:
    def __init__(self, id: int, username: str, email: str, phone, role, profile_picture):
        self.id = id 
        self.username = username 
        self.email = email 
        self.phone = phone | None = None
        self.role = role | None = None
        self.picture = profile_picture | None = None

class Contact(BaseModel):
    user_id: int
    name: str
    surname: str 
    phone: int
    nickname: str
    id: int | None = None
    


@app.post('/login')
def login(data: LoginRequest):
    c = DatabaseManagement()
    c.connection('localhost', 'contact_manager', os.getenv('DATABASE_USER'), os.getenv('DATABASE_PASSWORD'))
    user = c.execute(
        "SELECT id, username, password, role FROM users WHERE email = %s", (data.email,)
    )
    if not user or not AuthEssentials.checkPassword(data.password, user.password):
        raise HTTPException(status_code=401, details='Wrong login credentials')
    
    token = AuthEssentials.createToken(User(user.id, user.username, user.role))
    return {'access_token': token, 'token_type': 'bearer'}

@app.post('/API/newContact')
def newContact(contact: Contact, status_code=201):
    c = DatabaseManagement()
    conn, cur = c.connection('localhost', 'contact_manager', os.getenv('DATABASE_USER'), os.getenv('DATABASE_PASSWORD'))
    c.execute(
        "INSERT INTO contacts (user_id, name, surname, phone, nickname) VALUES (%s, %s, %s, %s, %s)", 
        (contact.user_id, contact.name, contact.surname, contact.phone, contact.nickname)
    )
    row = c.execute(
        "SELECT id FROM contacts WHERE user_id = %s AND phone = %s",
        (contact.user_id, contact.phone)
    )
    contact.id = row['id']
    return contact
    
@app.get('/API/contacts')
def contacts(token: str):
    pass