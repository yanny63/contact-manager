import { useState, useEffect } from "react"
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

function Aside({ search, setSearch, onError }) {
  const [ numbers, setNumbers ] = useState([])
  const [ numberIndex, SetNumberIndex ] = useState(1)
  const [ value, setValue ] = useState('')
  
  function addNumber(e) {
    e.preventDefault()
    const data = new FormData(e.target)
    const number = Object.fromEntries(data)
    // number['phone'] = value
    number['fav'] = true
    number['id'] = numberIndex
    SetNumberIndex(numberIndex + 1)
    setNumbers([...numbers, number])
    e.target.reset()
  }
//   async function addNumber(e) {
//     e.preventDefault()
//     const data = new FormData(e.target)
//     const number = Object.fromEntries(data)
//     number['fav'] = false 

//     try {
//       const res = await fetch('', {
//         method: "POST",
//         headers: {"Content-Type": "application/json"},
//         body: JSON.stringify({
//           newContact: number
//         })
//       })
//       if (!res.ok) {
//         throw new Error(res.error || res.status)
//       }
//       const data = await res.json()
//       console.log(data)

//       // setNumbers([...numbers, number])
//       e.target.reset()
//     }
//     catch (err) {
//       onError(err)
//     }
//   }

    function removeContact(id) {
        setNumbers(n => n.filter(number => number.id !== id)
    )}

    function Star({active, onClick}) {
    return (
        <svg
          onClick={onClick}
          xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={active ? "gold" : "none"}
        stroke="gold"
        strokeWidth="2"
        style={{ width: "18px", cursor: "pointer" }}>
        <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9" />
        </svg>
    )
    }

    

    function toggleFav(id) {
        setNumbers(numb =>
            numb.map(item => 
              item.id === id ? {...item, fav: !item.fav}
              : item
            )
        )
    }

    const filteredNumbers = numbers.filter(n => 
        n.phone.includes(search) || 
        n.nickname.includes(search)
    ).sort((a, b) => b.fav - a.fav)

    function hideError(e) {
        e.target.remove()
    }

    const [ favourites, setFavourites ] = useState([])

    async function getFavourites() {
        try {
            const res = await fetch('', {
                headers: {'Content-Type': 'application/json', 
                    'Authorizatiom': `Bearer ${localStorage.getItem('token')}`
                }
            })
            if (!res.ok) {
                throw new Error(res.error)
            }
            const data = await res.json() // Dokonczyc aside
        }
        catch (err) {
            onError(err)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
            <form className='add-contact-form' onSubmit={addNumber}>
                <h3>Nowy Kontakt</h3>
                {/* <input className='form-input' name='name' placeholder='Imię...' type='text'/>
                <input className='form-input' name='surname' placeholder='Nazwisko...' type='text'/> */}
                {/* <PhoneInput 
                    international
                    defaultCountry='PL'
                    value={value}
                    onChange={setValue}
                /> */}
                <input className='form-input' name='phone' placeholder='Numer telefonu' type='number'/>
                <input className='form-input' name='nickname' placeholder='Pseudonim (opcjonalne)' type='text'/>
                <button className='form-button'>Dodaj</button>
            </form>
            <div className="line"></div>
            <div className="favourites-container">
                {numbers.filter(numb => numb.fav).map((n) => 
                    <div key={n.id} className="favourite">{n.nickname ? n.nickname : n.phone} </div>
                )}
            </div>

            
            {/* <div className='saved-numbers-container'>
                <ul className='numbersList'>
                {filteredNumbers.map((number) => (
                    <li className='isNumbersElement' key={number.id}>
                    <span className='liListElement'>{ number.nickname ? number.nickname : number.name + " " + number.surname}  - {number.phone}</span>
                    <button className='listButton' onClick={() => {removeContact(number.id)}}>Usuń</button>
                    <Star active={number.fav} onClick={() => toggleFav(number.id)}></Star>  
                    </li>
                ))}
                </ul>
            </div> */}

            {/* <div className='error-container'>
                { error.map((err) => 
                <div key={err.id} onClick={(e) => {hideError(e)}} >{err.err}</div>
                
                )}
            </div> */}
        </div>
    )
}

export default Aside