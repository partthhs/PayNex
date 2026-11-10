import { createContext, useContext, useState } from 'react'
import { MAX_COMPARE_ITEMS } from '../constants'

const CompareContext = createContext(null)

export function CompareProvider({ children }) {
  const [compareItems, setCompareItems] = useState([])

  const addToCompare = (product) => {
    setCompareItems(prev => {
      if (prev.find(p => p.id === product.id)) return prev
      if (prev.length >= MAX_COMPARE_ITEMS) {
        console.warn(`Maximum ${MAX_COMPARE_ITEMS} items for comparison`)
        return prev
      }
      return [...prev, product]
    })
  }

  const removeFromCompare = (productId) => {
    setCompareItems(prev => prev.filter(p => p.id !== productId))
  }

  const clearCompare = () => setCompareItems([])

  const isInCompare = (productId) => compareItems.some(p => p.id === productId)

  return (
    <CompareContext.Provider value={{
      compareItems, addToCompare, removeFromCompare, clearCompare, isInCompare
    }}>
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare must be used within CompareProvider')
  return ctx
}
