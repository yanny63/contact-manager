const BASE_URL = 'http://localhost:8000'

interface resError {
    error?: string
    status: number
}

export async function login(username: string, password: string) {
    if (password.length < 8) return
    const form = new URLSearchParams()

    form.append('username', username)
    form.append('password', password)

    try {
        const res = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: form
        })
        if (!res.ok) {
            const data : resError = await res.json()
            throw new Error(data.error || `Błąd serwera ${data.status}`)
        }
        const data = await res.json()
        localStorage.setItem('token', data.access_token)
        return data
    }
    catch (err) {
        console.log(err)
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
            throw new Error(data.error || `Błąd serwera ${data.status}`)
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
            throw new Error(data.error || `Błąd serwera ${data.status}`)
        }
        return true
    }
    catch (err) {
        alert(err)
        console.log(err)
        return false
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
            throw new Error(data.error || `Błąd serwera ${data.status}`)
        }
        const data = await res.json()
        return data
    }
    catch (err) {
        console.log(err)
    }
}