from fastapi import FastAPI, HTTPException, Depends, Form, WebSocket, Query, WebSocketDisconnect, Header
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from pydantic_settings import BaseSettings
from typing import Optional
from jose import jwt, JWTError
from auth import AuthEssentials as auth
import psycopg2
from psycopg2 import pool as pg_pool
from psycopg2.extras import RealDictCursor
import json
import dotenv
import os
import magic

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

connection_pool = pg_pool.SimpleConnectionPool(
    minconn=1,
    maxconn=10,
    host=settings.host,
    database=settings.database,
    user=settings.database_user,
    password=settings.database_password
)


def _fetch_all(query, params=None):
    conn = connection_pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            return cur.fetchall()
    finally:
        connection_pool.putconn(conn)


def _fetch_one(query, params=None):
    conn = connection_pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            return cur.fetchone()
    finally:
        connection_pool.putconn(conn)


def _fetch_one_commit(query, params=None):
    conn = connection_pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            row = cur.fetchone()
        conn.commit()
        return row
    finally:
        connection_pool.putconn(conn)


def _execute(query, params=None):
    conn = connection_pool.getconn()
    try:
        with conn.cursor() as cur:
            cur.execute(query, params)
        conn.commit()
    finally:
        connection_pool.putconn(conn)


async def fetch_all(query, params=None):
    return await run_in_threadpool(_fetch_all, query, params)


async def fetch_one(query, params=None):
    return await run_in_threadpool(_fetch_one, query, params)


async def fetch_one_commit(query, params=None):
    return await run_in_threadpool(_fetch_one_commit, query, params)


async def execute(query, params=None):
    return await run_in_threadpool(_execute, query, params)


def decode_token(token: str):
    try:
        return jwt.decode(token, settings.secret_key, settings.algorithm)
    except JWTError:
        raise HTTPException(status_code=401)


@app.get("/me")
async def me(token: str = Depends(oauth_scheme)):
    if not token:
        raise HTTPException(status_code=401)
    payload = decode_token(token)
    user_id = payload.get('sub')
    user = await fetch_one(
        "SELECT id, phone, prefix, picture FROM users WHERE isActive = %s AND id = %s",
        (True, user_id)
    )
    return user


@app.post('/register')
async def register(prefix: str = Form(...), phone: str = Form(...), password: str = Form(...), token: str = Depends(oauth_scheme)):
    if token:
        raise HTTPException(status_code=403)
    user = await fetch_one("SELECT id FROM users WHERE phone = %s", (phone,))
    if user:
        raise HTTPException(status_code=409, detail="Uzytkownik juz istnieje")
    hashed = auth.hashPassword(password)
    u = await fetch_one_commit(
        "INSERT INTO users (phone, password, prefix) VALUES (%s, %s, %s) RETURNING id, role",
        (phone, auth.toDB(hashed), prefix)
    )
    u['phone'] = phone
    u['prefix'] = prefix
    user_model = User(**u)
    new_token = auth.createToken(user_model, settings.access_token_expire_minutes, settings.algorithm, settings.secret_key)
    return {"access_token": new_token}


@app.post('/login')
async def login(phone: str = Form(...), prefix: str = Form(...), password: str = Form(...), token: str = Depends(oauth_scheme)):
    if token:
        raise HTTPException(status_code=403)
    user = await fetch_one(
        "SELECT id, phone, prefix, password, role FROM users WHERE phone = %s",
        (phone,)
    )
    if not user or not auth.checkPassword(password, user.get('password')):
        raise HTTPException(status_code=401, detail='Złe dane logowania')
    new_token = auth.createToken(User(**user), settings.access_token_expire_minutes, settings.algorithm, settings.secret_key)
    return {'access_token': new_token, 'token_type': 'bearer'}


@app.post('/API/newContact')
async def newContact(contact: Contact, status_code=201, token: str = Depends(oauth_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Wymagane zalogwanie")
    payload = decode_token(token)
    owner_id = payload.get('sub')

    added = await fetch_one(
        "SELECT id FROM users WHERE phone = %s AND prefix = %s",
        (contact.phone, contact.prefix)
    )
    if not added:
        raise HTTPException(status_code=404, detail='Taki numer nie istnieje')

    exists = await fetch_one(
        """SELECT id FROM contacts WHERE owner_id = %s AND contact_id = %s""", (owner_id, added['id'])
    )
    if exists:
        raise HTTPException(status_code=409, detail="Kontakt juz istnieje")

    await execute(
        "INSERT INTO contacts (owner_id, contact_id, nickname, favourite) VALUES (%s, %s, %s, %s)",
        (owner_id, added["id"], contact.nickname, contact.favourite)
    )

    row = await fetch_one(
        "SELECT id FROM contacts WHERE owner_id = %s AND contact_id = %s",
        (owner_id, added["id"])
    )
    contact.id = row['id']

    conversation = await fetch_one(
        """SELECT cp1.conversation_id
        FROM conversation_participants cp1
        JOIN conversation_participants cp2
        ON cp1.conversation_id = cp2.conversation_id
        WHERE cp1.user_id = %s AND cp2.user_id = %s LIMIT 1
        """, (owner_id, added["id"])
    )

    if conversation:
        conversation_id = conversation['id']
        await execute(
            """UPDATE conversation_participants SET accepted = TRUE WHERE conversation_id = %s AND user_id = %s""", (conversation_id, owner_id)
        )

    else:
        conv = await fetch_one_commit("INSERT INTO conversations DEFAULT VALUES RETURNING id")
        conversation_id = conv['id']

        await execute(
            "INSERT INTO conversation_participants (conversation_id, user_id, accepted) VALUES (%s, %s, %s), (%s, %s, %s)",
            (conversation_id, added["id"], True, conversation_id, owner_id, False)
        )

    return contact


@app.put('/API/favToggle')
async def unfavourite(contact_id: str = Form(...), toggle: str = Form(...), token: str = Depends(oauth_scheme)):
    if not token:
        raise HTTPException(status_code=401)
    if not contact_id or not toggle:
        raise HTTPException(status_code=400)

    payload = decode_token(token)
    user_id = payload.get('sub')

    t = toggle == "true"

    await execute(
        "UPDATE contacts SET favourite = %s WHERE id = %s AND owner_id = %s",
        (t, contact_id, user_id)
    )
    return {"ok": True}


@app.get('/API/contacts')
async def contacts(token: str = Depends(oauth_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Uzytkownik niezalogowany")
    payload = decode_token(token)
    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=401)

    data = await fetch_all(
        """SELECT contacts.id, contacts.contact_id, contacts.nickname, contacts.picture, contacts.favourite,
                contact_user.phone, contact_user.prefix
        FROM contacts
        JOIN users AS owner         ON owner.id        = contacts.owner_id
        JOIN users AS contact_user  ON contact_user.id = contacts.contact_id
        WHERE owner.id = %s""",
        (user_id,)
    )
    return data


@app.get("/API/chats")
async def getChats(token: str = Depends(oauth_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Uzytkownik niezalogowany")
    payload = decode_token(token)
    user_id = payload.get('sub')

    chats = await fetch_all(
        """SELECT u.id, u.phone, c.picture, c.nickname, c.favourite, u.prefix, other.conversation_id, last_msg.body, last_msg.created_at
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
    print(chats)
    return chats


@app.get('/API/chat')
async def chat(token: str = Depends(oauth_scheme), conversation_id: str = Query(...)):
    if not token:
        raise HTTPException(status_code=401, detail="Uzytkownik niezalogowany")

    c = await fetch_all(
        """SELECT m.sender_id, m.body, m.created_at, m.read_at, m_a.type, m_a.url
        FROM messages AS m
        LEFT JOIN message_attachments AS m_a ON m.id = m_a.message_id
        WHERE m.conversation_id = %s
        ORDER BY m.created_at ASC LIMIT 20""",
        (int(conversation_id),)
    )
    return c


connections: dict[int, WebSocket] = {}

@app.websocket("/ws/chat")
async def chat_endpoint(websocket: WebSocket, token: str = Query(...)):
    try:
        payload = jwt.decode(token, settings.secret_key, settings.algorithm)
    except JWTError:
        await websocket.close(code=1008)
        return
    user_id = int(payload.get('sub'))
    await websocket.accept()
    connections[user_id] = websocket

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)

            conversation_id = data['conversationId']
            msg_type = data['type']

            if msg_type == 'message':
                row = await fetch_one_commit(
                    """INSERT INTO messages (conversation_id, sender_id, body)
                    VALUES (%s, %s, %s)
                    RETURNING id, created_at""",
                    (conversation_id, user_id, data["text"])
                )

                payload_out = {
                    "type": "message",
                    "conversationId": conversation_id,
                    "senderId": user_id,
                    "messageId": row["id"],
                    "text": data['text'],
                    "createdAt": row["created_at"].isoformat()
                }

                participants = await fetch_all(
                    "SELECT user_id FROM conversation_participants WHERE conversation_id = %s",
                    (conversation_id,)
                )
                participant_ids = [p["user_id"] for p in participants]

                for u_id in participant_ids:
                    if u_id in connections:
                        await connections[u_id].send_json(payload_out)
            else:
                payload_out = {
                    "type": msg_type,
                    "conversationId": conversation_id,
                    "senderId": user_id
                }

                participants = await fetch_all(
                    "SELECT user_id FROM conversation_participants WHERE conversation_id = %s",
                    (conversation_id,)
                )
                participant_ids = [p["user_id"] for p in participants]

                for u_id in participant_ids:
                    if u_id != user_id and u_id in connections:
                        await connections[u_id].send_json(payload_out)
    except WebSocketDisconnect:
        connections.pop(user_id, None)