import { useState } from 'react'
import { useEffect } from 'react'

function App() {
  const [numbers, setNumbers] = useState([])
  const [numberIndex, SetNumberIndex] = useState(1)
  const [search, setSearch] = useState('')

  function addNumber(e) {
    e.preventDefault()
    const data = new FormData(e.target)
    const number = Object.fromEntries(data)
    number['fav'] = false
    number['id'] = numberIndex
    SetNumberIndex(numberIndex + 1)
    setNumbers([...numbers, number])
    e.target.reset()
  }

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
  n.name.toLowerCase().includes(search.toLowerCase()) || 
  n.surname.toLowerCase().includes(search.toLowerCase()) || 
  n.phone.includes(search) 
).sort((a, b) => b.fav - a.fav)

  return (
    <div className='main-container'>
      <form className='add-contact-form' onSubmit={addNumber}>
        <h3>Dodaj Kontakt</h3>
        <input className='form-input' name='name' placeholder='Imię...' type='text'/>
        <input className='form-input' name='surname' placeholder='Nazwisko...' type='text'/>
        <input className='form-input' name='phone' placeholder='Numer telefonu' type='number'/>
        <button className='form-button'>Dodaj</button>
      </form>

      <input className='search-input' placeholder='Szukaj kontaktu' onChange={(e) => {setSearch(e.target.value)}}/>

      <div className='saved-numbers-container'>
        <ul className='numbersList'>
          {filteredNumbers.map((number) => (
            <li className='isNumbersElement' key={number.id}>
              <span className='liListElement'>{number.name} {number.surname} - {number.phone}</span>
              <button className='listButton' onClick={() => {removeContact(number.id)}}>Usuń</button>
              <Star active={number.fav} onClick={() => toggleFav(number.id)}></Star>  
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default App