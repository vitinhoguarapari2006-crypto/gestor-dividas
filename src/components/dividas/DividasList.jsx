import { useMemo, useState } from 'react'
import { useDividas } from '../../context/DividasContext'
import DividaCard from './DividaCard'
import { Search, CreditCard, CheckCircle2 } from 'lucide-react'

export default function DividasList({ status, onSelectDivida }) {
  const { dividas, loading } = useDividas()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const list = dividas.filter(d => d.status === status)
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(d =>
      d.nome.toLowerCase().includes(q) ||
      (d.credor && d.credor.toLowerCase().includes(q)) ||
      d.categoria.toLowerCase().includes(q)
    )
  }, [dividas, status, search])

  const isAtivas = status === 'ativa'
  const EmptyIcon = isAtivas ? CreditCard : CheckCircle2
  const emptyMsg = isAtivas
    ? 'Nenhuma dívida ativa'
    : 'Nenhuma dívida quitada ainda'
  const emptyHint = isAtivas
    ? 'Toque no + para cadastrar sua primeira dívida'
    : 'As dívidas quitadas aparecem aqui'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-4 pt-4 pb-2 sticky top-[57px] bg-[#0A0A0A] z-10">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            className="input-field pl-9 py-2.5 text-sm"
            placeholder="Buscar por nome, credor ou categoria…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2 ml-0.5">
          {filtered.length} {filtered.length === 1 ? 'dívida' : 'dívidas'}
        </p>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3 px-4 pt-1 pb-4">
        {filtered.map(d => (
          <DividaCard
            key={d.id}
            divida={d}
            onClick={() => onSelectDivida(d.id)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-surface-raised flex items-center justify-center">
              <EmptyIcon size={28} className="text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium text-center">{emptyMsg}</p>
            <p className="text-gray-600 text-sm text-center">{emptyHint}</p>
          </div>
        )}
      </div>
    </div>
  )
}
