import { Routes, Route } from 'react-router-dom'
import InitScreen from './pages/InitScreen'

function App() {
  return (
    <Routes>
      <Route path="/" element={<InitScreen />} />
    </Routes>
  )
}

export default App
