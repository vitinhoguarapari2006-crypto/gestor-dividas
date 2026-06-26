import { CheckCircle, ChevronRight, AlertCircle } from 'lucide-react'
import ProgressBar from '../ui/ProgressBar'

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

const CAT_COLORS = {
  cartao: 'bg-purple-500/20 text-purple-300',
  financiamento: 'bg-blue-500/20 text-blue-300',
  emprestimo: 'bg-amber-500/20 text-amber-300',
  boleto: 'bg-pink-500/20 text-pink-300',
  outros: 'bg-gray-500/20 text-gray-300',
}

const CAT_LABELS = {
  cartao: 'Cartão', financiamento: 'Financ.', emprestimo: 'Empréstimo',
  boleto: 'Boleto', outros: 'Outros',
}

function daysUntilVencimento(diaVenc) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), diaVenc)
  const target = thisMonth < today
    ? new Date(today.getFullYear(), today.getMonth() + 1, diaVenc)
    : thisMonth
  return Math.ceil((target - today) / 86400000)
}

export default function DividaCard({ divida, onClick }) {
  const restantes = divida.total_parcelas - divida.parcelas_pagas
  const valorRestante = restantes * divida.valor_parcela
  const quitada = divida.status === 'quitada'
  const dias = quitada ? null : daysUntilVencimento(divida.dia_vencimento)
  const urgent = dias !== null && dias <= 3
  const soon = dias !== null && dias <= 7

  return (
    <button
      onClick={onClick}
      className="card w-full text-left active:scale-[0.98] transition-transform hover:border-brand/30"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Title + category */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${CAT_COLORS[divida.categoria] || CAT_COLORS.outros}`}>
              {CAT_LABELS[divida.categoria] || divida.categoria}
            </span>
            {quitada && (
              <span className="badge bg-emerald-500/15 text-emerald-400 flex items-center gap-1">
                <CheckCircle size={10} /> Quitada
              </span>
            )}
          </div>
          <h3 className="font-semibold text-white text-base leading-tight truncate">{divida.nome}</h3>
          {divida.credor && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{divida.credor}</p>
          )}
        </div>

        {/* Valor restante */}
        <div className="text-right shrink-0">
          <p className={`text-base font-bold ${quitada ? 'text-emerald-400' : 'text-white'}`}>
            {quitada ? fmt(0) : fmt(valorRestante)}
          </p>
          <p className="text-[11px] text-gray-500">restante</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-gray-400">
            <span className="font-semibold text-white">{divida.parcelas_pagas}</span>
            <span className="text-gray-600">/{divida.total_parcelas} parcelas pagas</span>
          </span>
          <span className="text-xs text-gray-500">{fmt(divida.valor_parcela)}/mês</span>
        </div>
        <ProgressBar value={divida.parcelas_pagas} max={divida.total_parcelas} />
      </div>

      {/* Footer */}
      {!quitada && dias !== null && (
        <div className="flex items-center justify-between mt-2">
          <div className={`flex items-center gap-1.5 text-xs ${urgent ? 'text-red-400' : soon ? 'text-amber-400' : 'text-gray-500'}`}>
            {urgent && <AlertCircle size={12} />}
            <span>
              Vence dia {divida.dia_vencimento} —{' '}
              {dias === 0 ? 'hoje!' : dias === 1 ? 'amanhã' : `em ${dias} dias`}
            </span>
          </div>
          <ChevronRight size={14} className="text-gray-600" />
        </div>
      )}
    </button>
  )
}
