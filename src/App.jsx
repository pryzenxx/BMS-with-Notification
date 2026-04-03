import { Routes, Route, Navigate } from 'react-router-dom'
import Landingpage from './Pages/Landingpage'
import Notfound from './Pages/NotFound'
import UserInterface from './Pages/UserInterface'
import Admin from './Pages/admin'



function App() {

  return (
    <>
    <Routes>
      <Route path='/' element={<Landingpage/>}/>
      <Route path='/login' element={<Landingpage/>}/>
      <Route path='/admin' element={<Admin/>}/>
      <Route path='/Admin' element={<Navigate to="/admin" replace />} />
      <Route path='/user' element={<UserInterface/>}/>
      <Route path='/User' element={<Navigate to="/user" replace />} />
      <Route path='*' element={<Notfound/>}/>
    </Routes>
    

    </>
  )
}

export default App
