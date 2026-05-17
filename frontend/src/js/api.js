const BASE_URL = 'http://localhost:8000'

export function loginValidator(password) {
    const validP = password.length >= 8 ? true : false
    return validP
}


export async function login(username, password) {
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
            throw new Error(res.error || res.status)
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
            throw new Error(res.error || res.status)
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

