import { createContext, useContext, useEffect, useRef } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAuth } from './AuthContext'
import { cartService } from '../services/cartService'
import { normalizeProduct } from '../services/productService'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useLocalStorage('paynex_cart', [])
  const { isAuthenticated } = useAuth()
  const initialSyncRef = useRef(false)

  // Sync with backend when authenticated
  useEffect(() => {
    async function syncBackendCart() {
      if (!isAuthenticated) {
        initialSyncRef.current = false
        return
      }

      try {
        const backendCart = await cartService.getCart()
        const backendItems = (backendCart.items || []).map(item => ({
          backendId: item.id,
          product: normalizeProduct(item.product),
          quantity: item.quantity,
        }))

        if (backendItems.length > 0) {
          // If backend has items, populate cart
          setCartItems(backendItems)
        } else if (cartItems.length > 0 && !initialSyncRef.current) {
          // If backend is empty but local has items, push local items to backend
          initialSyncRef.current = true
          for (const item of cartItems) {
            const pId = item.product.numericId || item.product.id
            try {
              await cartService.addToCart(pId, item.quantity)
            } catch {}
          }
        }
      } catch (err) {
        console.warn('Could not sync cart with backend:', err)
      }
    }

    syncBackendCart()
  }, [isAuthenticated])

  const addToCart = async (product) => {
    // 1. Update local state immediately for instant feedback
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, 10) }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })

    // 2. Persist to backend if authenticated
    if (isAuthenticated) {
      try {
        const pId = product.numericId || product.id
        await cartService.addToCart(pId, 1)
      } catch (err) {
        console.warn('Failed to add to backend cart:', err)
      }
    }
  }

  const removeFromCart = async (productId) => {
    const itemToRemove = cartItems.find(i => i.product.id === productId)
    setCartItems(prev => prev.filter(item => item.product.id !== productId))

    if (isAuthenticated && itemToRemove) {
      try {
        if (itemToRemove.backendId) {
          await cartService.removeFromCart(itemToRemove.backendId)
        } else {
          // If backendId not stored, re-fetch to find backend item
          const remoteCart = await cartService.getCart()
          const match = remoteCart.items?.find(i => (i.product.slug === productId || i.product.id === productId))
          if (match) {
            await cartService.removeFromCart(match.id)
          }
        }
      } catch (err) {
        console.warn('Failed to remove from backend cart:', err)
      }
    }
  }

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId)
      return
    }

    const target = cartItems.find(i => i.product.id === productId)
    setCartItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(quantity, 10) }
          : item
      )
    )

    if (isAuthenticated && target) {
      try {
        if (target.backendId) {
          await cartService.updateQuantity(target.backendId, Math.min(quantity, 10))
        } else {
          const remoteCart = await cartService.getCart()
          const match = remoteCart.items?.find(i => (i.product.slug === productId || i.product.id === productId))
          if (match) {
            await cartService.updateQuantity(match.id, Math.min(quantity, 10))
          }
        }
      } catch (err) {
        console.warn('Failed to update quantity on backend:', err)
      }
    }
  }

  const clearCart = async () => {
    setCartItems([])
    if (isAuthenticated) {
      try {
        await cartService.clearCart()
      } catch (err) {
        console.warn('Failed to clear backend cart:', err)
      }
    }
  }

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity, 0
  )

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
