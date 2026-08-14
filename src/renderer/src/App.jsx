import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('Connecting to database...')
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    async function testDB() {
      try {
        // 1. Insert a test customer
        await window.api.db.execute(
          'INSERT INTO customers (name, phone_no, total_amount_receivable) VALUES (?, ?, ?)',
          ['Devraj Store', '9876543210', 5000]
        )

        // 2. Fetch customers
        const data = await window.api.db.select('SELECT * FROM customers')
        setCustomers(data)
        setStatus('✅ Database Connected & Working!')
      } catch (err) {
        console.error(err)
        setStatus(`❌ DB Error: ${err.message}`)
      }
    }

    testDB()
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Hisab365 Desktop</h1>
      <p>
        <strong>Status:</strong> {status}
      </p>
      <h3>Customer Records:</h3>
      <ul>
        {customers.map((c) => (
          <li key={c.id}>
            {c.name} - {c.phone_no} (Receivable: ₹{c.total_amount_receivable})
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
