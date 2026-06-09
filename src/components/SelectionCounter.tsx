import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { ShoppingBag } from 'lucide-react'

export default function SelectionCounter() {
  const { totalCount } = useSession()
  const navigate = useNavigate()

  if (totalCount === 0) return null

  return (
    <button
      onClick={() => navigate('/summary')}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-2 rounded-full shadow-lg transition-colors font-body text-sm font-medium"
    >
      <ShoppingBag size={16} />
      {totalCount} selected
    </button>
  )
}
