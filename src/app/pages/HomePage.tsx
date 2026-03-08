import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()
  return (
    <div>
      <h1>Welcome to FileFlip</h1>
      <button onClick={() => navigate('/login')}>Get Started</button>
    </div>
  )
}