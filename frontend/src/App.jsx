import { Routes, Route } from 'react-router-dom'
import MainLayout      from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'
import Landing         from './pages/Landing'
import Login           from './pages/Login'
import Register        from './pages/Register'
import Dashboard       from './pages/Dashboard'
import Assistant       from './pages/Assistant'
import Explore         from './pages/Explore'
import ProductDetail   from './pages/ProductDetail'
import Compare         from './pages/Compare'
import Cart            from './pages/Cart'
import Checkout        from './pages/Checkout'
import Orders          from './pages/Orders'
import Profile         from './pages/Profile'
import NotFound        from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      {/* Public pages (each has its own full layout) */}
      <Route element={<MainLayout />}>
        <Route path="/"         element={<Landing />}  />
        <Route path="/login"    element={<Login />}    />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Dashboard pages (sidebar + topnav) */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard"    element={<Dashboard />}     />
        <Route path="/assistant"    element={<Assistant />}     />
        <Route path="/explore"      element={<Explore />}       />
        <Route path="/product/:id"  element={<ProductDetail />} />
        <Route path="/compare"      element={<Compare />}       />
        <Route path="/cart"         element={<Cart />}          />
        <Route path="/checkout"     element={<Checkout />}      />
        <Route path="/orders"       element={<Orders />}        />
        <Route path="/profile"      element={<Profile />}       />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
