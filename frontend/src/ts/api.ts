import { preinit } from "react-dom"

const BASE_URL = 'http://192.168.1.34:8000'

interface resError {
    detail?: string
    status: number
}

interface ChatsInt {
    id: string
    phone: string
    prefix: string
    nickname?: string
    picture?: string
    body?: string
    created_at?: string
    favourite: boolean
    conversation_id: number
}

export async function login(phone: string, prefix: string, password: string) {
    if (password.length < 8) {
        throw new Error('Zbyt słabe hasło')
    }
    const form = new URLSearchParams()

    form.append('phone', phone)
    form.append('prefix', prefix)
    form.append('password', password)
    
    try {
        const res = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: form
        })
        if (!res.ok) {
            const data : resError = await res.json()
            throw new Error(data.detail || `Błąd serwera ${data.status}`)
        }
        const data = await res.json()
        localStorage.setItem('token', data.access_token)
        return data
    }
    catch (err) {
        console.log(err)
        return false
    }
}

export function logout() {
    localStorage.removeItem('token')
}

export async function checkToken() {
    const token = localStorage.getItem('token')
    if (!token || token === '') return false
    try {
        const res = await fetch('', {
            headers: {'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}`
            }
        })
        if (res.status === 401) {
            logout()
            window.location.reload()
            throw new Error("Sesja wygasła")
        }
        else if (!res.ok) {
            const data : resError = await res.json()
            throw new Error(data.detail || `Błąd serwera ${data.status}`)
        }
        const data = await res.json()
        if (!data) return false
        return data
    }
    catch (err) {
        console.log(err)
        return false
    }
}

function getToken() {
    const token = localStorage.getItem('token')
    if (!token || token === '') return false
    return token
}

export async function newContact(contact: object) {
    try {
        const token = getToken()
        if (!token) {
            throw new Error('Uzytkownik niezalogowany')
        }
        const res = await fetch(`${BASE_URL}/API/newContact`, {
            method: "POST",
            headers: {'Content-Type': "application/json", 
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(contact)
        })
        if (!res.ok) {
            const data : resError = await res.json()

            if (res.status === 422) {
                const messages = 'Nieprawidłowe dane'
                throw new Error(messages)
            }
            throw new Error(data.detail || `Błąd serwera ${data.status}`)
        }
        const data = await res.json()
        console.log(`data: ${data}`)
        return data
    }
    catch (err) {
        console.log(err)
    }
}

export async function getContacts() {
    try {
        const token = getToken()
        if (!token) {
            throw new Error('Nieudało się pobrać kontaktów - uzytkownik niezalogowany')
        }
        const res = await fetch(`${BASE_URL}/API/contacts`, {
            headers: {"Authorization": `Bearer ${token}`}
        })
        if (!res.ok) {
            const data : resError = await res.json()
            throw new Error(data.detail || `Błąd serwera ${data.status}`)
        }
        const data = await res.json()
        return data
    }
    catch (err) {
        console.log(err)
    }
}

export async function favToggle(id: number, toggle: boolean) {
    try {
        const token = localStorage.getItem('token')
        if (!token) {
            throw new Error('Uzytkownik niezalogowany')
        }
        const Form = new URLSearchParams()

        Form.append('contact_id', String(id))
        Form.append('toggle', String(toggle))

        const res = await fetch(`${BASE_URL}/API/favToggle`, {
            method: "PUT",
            headers: {'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`
            },
            body: Form
        })
        if (!res.ok) {
            const data : resError = await res.json()
            throw new Error(data.detail || `Błąd serwera ${data.status}`)
        }
        return true
    }
    catch (err) {
        console.log(err)
        return false
    }
}

export async function getMe() {
    try {
        const token = localStorage.getItem('token')
        if (!token || token === '') {
            throw new Error('Uzytkownik niezalogowany')
        }
        const res = await fetch(`${BASE_URL}/me`, {
            headers: {'Authorization': `Bearer ${token}`}
        })
        if (!res.ok) {
            const data : resError = await res.json()
            throw new Error(data.detail || `Błąd serwera ${data.status}`)
        }
        const user = await res.json()
        return user
    }
    catch (err) {
        console.log(err)
        return null
    }
}

export async function register(phone: string, prefix: string, password: string) {
    try {
        if (localStorage.getItem('token')) {
            throw new Error('Uzytkownik juz zalogowany')
        }
        const urlForm = new URLSearchParams()

        urlForm.append('phone', phone)
        urlForm.append('prefix', prefix)
        urlForm.append('password', password)

        const res = await fetch(`${BASE_URL}/register`, {
            method: "POST",
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
            body: urlForm
        })
        if (!res.ok) {
            const data : resError = await res.json()
            throw new Error(data.detail || `Błąd serwera ${data.status}`)
        }
        const data = await res.json()
        localStorage.setItem('token', data.access_token)
        return true
    }
    catch (err) {
        console.log(err)
        return false
    }
}

export async function getChats() {
    try {
        const token = getToken()
        if (!token) {
            throw new Error('Uzytkownik niezalogowany')
        }
        const res = await fetch(`${BASE_URL}/API/chats`, {
            headers: {"Authorization": `Bearer ${token}`}
        })
        if (!res.ok) {
            const data : resError = await res.json()
            throw new Error(data.detail || `Błąd serwera ${data.status}`)
        }
        const data : ChatsInt[] = await res.json()
        return data
    }
    catch (err) {
        console.log(err)
    }
}

export async function getChat(id: string) {
    const token = localStorage.getItem('token')
    if (!token || token === '') {
        throw new Error('Uzytkownik niezalogowany')
    }
    const res = await fetch(`${BASE_URL}/API/chat?conversation_id=${String(id)}`, {
        headers: {"Authorization": `Bearer ${token}`}
    })
    if (!res.ok) {
        const data : resError = await res.json()
        throw new Error(data.detail || `Błąd serwera: ${data.status}`)
    }
    const data = await res.json()
    console.log(data)
    return data.map((m: any) => ({
        senderId: m.sender_id,
        text: m.body,
        createdAt: m.created_at,
        readAt: m.read_at,
        messageId: m.id,
    }));
}