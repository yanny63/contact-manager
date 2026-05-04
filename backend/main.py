from fastapi import FastAPI
from pydantic import BaseModel
from database import DatabaseManagement
import dotenv
import os 

dotenv.load_dotenv()

app = FastAPI()

class Contact(BaseModel):
    user_id: int
    name: str
    surname: str 
    phone: int
    nickname: str
    id: int | None = None
    
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
    