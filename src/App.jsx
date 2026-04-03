import { Routes,  Route } from 'react-router-dom'
import Landingpage from './Pages/Landingpage'
import Notfound from './Pages/NotFound'
import UserInterface from './Pages/UserInterface'
import Admin from './Pages/Admin'



function App() {

  return (
    <>
    <Routes>
      <Route path='/' element={<Landingpage/>}/>
      <Route path='/admin' element={<Admin/>}/>
      <Route path='/user' element={<UserInterface/>}/>
      <Route path='*' element={<Notfound/>}/>
    </Routes>
    

    </>
  )
}

export default App
