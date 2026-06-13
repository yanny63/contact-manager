from fastapi import FastAPI, HTTPException, Depends, Form
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pydantic_settings import BaseSettings
from typing import Optional
from jose import jwt, JWTError
from auth import AuthEssentials as auth
import psycopg2
from psycopg2.extras import RealDictCursor
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

def db_connection():
    conn = psycopg2.connect(
        host=settings.host,
        database=settings.database,
        user=settings.database_user,
        password=settings.database_password
    )
    cur = conn.cursor(cursor_factory=RealDictCursor)
    return conn, cur

@app.get("/me")
def me(token: str = Depends(oauth_scheme)):
    if not token:
        raise HTTPException(status_code=401)
    try:
        conn, cur = db_connection()
        payload = jwt.decode(token, settings.secret_key, settings.algorithm)
        user_id = payload.get('sub')
        cur.execute(
            "SELECT id, phone, prefix, picture FROM users WHERE isActive = %s AND id = %s", (True, user_id)
        )
        user = cur.fetchone()
        return user
    except JWTError:
        raise HTTPException(status_code=401)
    finally:
        conn.close()

@app.post('/register')
def register(prefix: str = Form(...), phone: str = Form(...), password: str = Form(...), token: str = Depends(oauth_scheme)):
    if token:
        raise HTTPException(status_code=403)
    try:
        conn, cur = db_connection()
        cur.execute(
            "SELECT id FROM users WHERE phone = %s", (phone,)
        )
        user = cur.fetchone()
        if user:
            raise HTTPException(status_code=409, detail="Uzytkownik juz istnieje")
        hashed = auth.hashPassword(password)
        cur.execute(
            "INSERT INTO users (phone, password, prefix) VALUES (%s, %s, %s) RETURNING id, role",
            (phone, auth.toDB(hashed), prefix)
        )
        u = cur.fetchone()
        conn.commit()
        u['phone'] = phone
        u['prefix'] = prefix
        user = User(**u)
        token = auth.createToken(user, settings.access_token_expire_minutes, settings.algorithm, settings.secret_key)
        return {"access_token": token}
    except Exception as e:
        print(e)
    finally:
        conn.close()

    
@app.post('/login')
def login(phone: str = Form(...), prefix: str = Form(...), password: str = Form(...), token: str = Depends(oauth_scheme)):
    if token:
        raise HTTPException(status_code=403)
    try:
        conn, cur = db_connection()
        cur.execute(
            "SELECT id, phone, prefix, password, role FROM users WHERE phone = %s", (phone,)
        )
        user = cur.fetchone()
        if not user or not auth.checkPassword(password, user.get('password')):
            raise HTTPException(status_code=401, detail='Złe dane logowania')
        token = auth.createToken(User(**user), settings.access_token_expire_minutes, settings.algorithm, settings.secret_key)
        return {'access_token': token, 'token_type': 'bearer'}
    except Exception as e:
        print(e)
        return {"error": e}
    finally:
        conn.close()

@app.post('/API/newContact')
def newContact(contact: Contact, status_code=201, token: str = Depends(oauth_scheme)):
    if not token or token is None:
        raise HTTPException(status_code=401, detail="Wymagane zalogwanie")
    payload = jwt.decode(token, settings.secret_key, settings.algorithm)
    try:
        conn, cur = db_connection()
        cur.execute(
            "SELECT id FROM users WHERE phone = %s", (contact.phone,)
        )
        user = cur.fetchone()
        cur.execute(
            "SELECT id FROM users WHERE phone = %s AND prefix = %s", (contact.phone, contact.prefix)
        )
        added = cur.fetchone()
        if not user or not added:
            raise HTTPException(status_code=404, detail='Taki numer nie istnieje')
        cur.execute(
            "INSERT INTO contacts (owner_id, contact_id, nickname, favourite) VALUES (%s, %s, %s, %s)", 
            (payload.get('sub'), added.get("id"), contact.nickname, contact.favourite)
        )
        conn.commit()
        cur.execute(
            "SELECT id FROM contacts WHERE owner_id = %s AND contact_id = %s",
            (payload.get('sub'), added.get("id"))
        )
        row = cur.fetchone()
        contact.id = row['id']
        cur.execute(
            "INSERT INTO conversations DEFAULT VALUES RETURNING id"
        )
        conversation_id = cur.fetchone()['id']
        print(conversation_id)
        conn.commit()
        cur.execute( 
            "INSERT INTO conversation_participants (conversation_id, user_id) VALUES (%s, %s), (%s, %s)", 
            (conversation_id, added.get("id"), conversation_id, payload.get("sub"))
        )
        conn.commit()
        return contact
    except Exception as e:
        print(e)
    finally:
        conn.close()
    

@app.put('/API/favToggle')
def unfavourite(contact_id: str = Form(...), toggle: str = Form(...), token: str = Depends(oauth_scheme)):
    if not token or token is None:
        raise HTTPException(status_code=401)
    if not contact_id or not toggle:
        raise HTTPException(status_code=400)
    try:
        payload = jwt.decode(token, settings.secret_key, settings.algorithm)
        user_id = payload.get('sub')
        t = False 
        match toggle:
            case "false":
                pass
            case "true":
                t = True
        conn, cur = db_connection()
        cur.execute(
            "UPDATE contacts SET favourite = %s WHERE id = %s AND owner_id = %s", (t, contact_id, user_id)
        )
        conn.commit()
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=e)
    finally: 
        conn.close()
    
@app.get('/API/contacts')
def contacts(token: str = Depends(oauth_scheme)):
    if not token or token is None:
        raise HTTPException(status_code=401, detail="Uzytkownik niezalogowany")
    payload = jwt.decode(token, settings.secret_key, settings.algorithm)
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=401)
    try:
        conn, cur = db_connection()
        cur.execute(
            """SELECT contacts.id, contacts.contact_id, contacts.nickname, contacts.picture, contacts.favourite,
                    contact_user.phone, contact_user.prefix
            FROM contacts
            JOIN users AS owner         ON owner.id        = contacts.owner_id
            JOIN users AS contact_user  ON contact_user.id = contacts.contact_id
            WHERE owner.id = %s""",
            (user_id,)
        )
        data = cur.fetchall()
        
        return data
    except Exception as e:
        print(e)
        return []
    finally:
        conn.close()

@app.get("/API/chats")
def getChats(token: str = Depends(oauth_scheme)):
    if not token or token == '':
        raise HTTPException(status_code=401, detail="Uzytkownik niezalogowany")
    
    payload = jwt.decode(token, settings.secret_key, settings.algorithm)
    if not payload:
        raise HTTPException(status_code=401)
    user_id = payload.get('sub')

    try:
        conn, cur = db_connection()
        cur.execute(
            """SELECT u.phone, c.picture, c.nickname, c.favourite, u.prefix, other.conversation_id, last_msg.body, last_msg.created_at
            FROM conversation_participants AS me
            JOIN conversation_participants AS other
                ON other.conversation_id = me.conversation_id AND other.user_id != %s
            JOIN users AS u ON u.id = other.user_id
            JOIN contacts AS c ON c.owner_id = %s AND c.contact_id = u.id
            LEFT JOIN (
                SELECT DISTINCT ON (conversation_id)
                    conversation_id, body, created_at
                FROM messages ORDER BY conversation_id, created_at DESC)
            AS last_msg ON last_msg.conversation_id = me.conversation_id WHERE me.user_id = %s""",
            (user_id, user_id, user_id)
        )
        chats = cur.fetchall()
        print(chats)
        return chats
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=e)
    finally:
        conn.close()

@app.get('/API/chat')
def chat(token: str = Depends(oauth_scheme), chat_id: str = Form(...)):
    if not token or token == '':
        raise HTTPException(status_code=401, detail="Uzytkownik niezalogowany")
    try:
        conn, cur = db_connection()
        cur.execute(
            """SELECT m.sender_id, m.body, m.created_at, m.read_at, m_a.type, m_a.url
            FROM messages AS m
            LEFT JOIN message_attachments AS m_a ON m.id = m_a.message_id
            WHERE m.conversation_id = %s
            ORDER BY m.created_at DESC LIMIT 20""",
            (int(chat_id),)
        )
        c = cur.fetchall()
        print(c)
        return {"chat": c}
    except Exception as e:
        print(e)
        return {"error": e}
    finally:
        conn.close()