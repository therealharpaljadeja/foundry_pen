// frontend/src/App.jsx
import { useState, useEffect } from 'react'

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/hello')
      .then(response => response.json())
      .then(data => setMessage(data.message));
  }, []);

  return (
    <div>
      <h1>Vite + React</h1>
      <p>Message from backend: {message}</p>
    </div>
  )
}

export default App