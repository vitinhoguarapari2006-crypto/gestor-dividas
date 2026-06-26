import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts'
import { useDividas } from '../../context/DividasContext'
import { TrendingDown, TrendingUp, CreditCard, CheckCircle2, Calendar, AlertCircle } from 'lucide-react'

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

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

export default function Dashboard({ setCurrentPage }) {
  const { dividas, pagamentos, loading } = useDividas()

  const stats = useMemo(() => {
    const ativas = dividas.filter(d => d.status === 'ativa')
    const quitadas = dividas.filter(d => d.status === 'quitada')

    const totalAPagar = ativas.reduce((sum, d) => {
      return sum + (d.total_parcelas - d.parcelas_pagas) * d.valor_parcela
    }, 0)

    const totalPago = pagamentos.reduce((sum, p) => sum + Number(p.valor_pago), 0)

    const porCategoria = ativas.reduce((acc, d) => {
      const key = d.categoria
      acc[key] = (acc[key] || 0) + (d.total_parcelas - d.parcelas_pagas) * d.valor_parcela
      return acc
    }, {})

    const barData = Object.entries(porCategoria).map(([k, v]) => ({
      name: CAT_LABELS[k] || k,
      valor: v,
    }))

    const donutData = [
      { name: 'A Pagar', value: totalAPagar, color: '#FF6B00' },
      { name: 'Pago', value: totalPago, color: '#22C55E' },
    ]

    const upcoming = ativas
      .filter(d => d.parcelas_pagas < d.total_parcelas)
      .map(d => ({ ...d, dias: daysUntilVencimento(d.dia_vencimento) }))
      .sort((a, b) => a.dias - b.dias)
      .slice(0, 5)

    return { ativas, quitadas, totalAPagar, totalPago, donutData, barData, upcoming }
  }, [dividas, pagamentos])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const hasData = dividas.length > 0
  const donutTotal = stats.totalAPagar + stats.totalPago

  return (
    <div className="px-4 py-5 flex flex-col gap-5">
      {/* Hero card */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-brand/20 to-surface border border-brand/20">
        <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-1">Total a Pagar</p>
        <p className="text-4xl font-extrabold text-white tracking-tight">{fmt(stats.totalAPagar)}</p>
        {stats.ativas.length > 0 && (
          <p className="text-sm text-gray-400 mt-1">
            em {stats.ativas.length} dívida{stats.ativas.length !== 1 ? 's' : ''} ativa{stats.ativas.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<TrendingUp size={18} className="text-emerald-400" />}
          label="Já Pago"
          value={fmt(stats.totalPago)}
          small
        />
        <StatCard
          icon={<CreditCard size={18} className="text-brand" />}
          label="Ativas"
          value={stats.ativas.length}
          onClick={() => setCurrentPage('ativas')}
        />
        <StatCard
          icon={<CheckCircle2 size={18} className="text-emerald-400" />}
          label="Quitadas"
          value={stats.quitadas.length}
          onClick={() => setCurrentPage('quitadas')}
        />
      </div>

      {hasData && (
        <>
          {/* Donut chart */}
          {donutTotal > 0 && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Pago vs. A Pagar</h2>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={140}>
                  <PieChart>
                    <Pie
                      data={stats.donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={62}
                      paddingAngle={3}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {stats.donutData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3 flex-1">
                  {stats.donutData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <div>
                        <p className="text-[11px] text-gray-500">{item.name}</p>
                        <p className="text-sm font-bold text-white">{fmt(item.value)}</p>
                      </div>
                    </div>
                  ))}
                  {donutTotal > 0 && (
                    <div className="mt-1 pt-3 border-t border-surface-border">
                      <p className="text-[11px] text-gray-500">% Pago</p>
                      <p className="text-sm font-bold text-white">
                        {Math.round((stats.totalPago / donutTotal) * 100)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bar chart by category */}
          {stats.barData.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Dívidas por Categoria</h2>
              <ResponsiveContainer width="100%" height={stats.barData.length * 44 + 16}>
                <BarChart
                  data={stats.barData}
                  layout="vertical"
                  margin={{ left: 4, right: 16, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={68}
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v) => [fmt(v), 'A pagar']}
                    contentStyle={{ background: '#1C1C1C', border: '1px solid #242424', borderRadius: 10, fontSize: 12 }}
                    itemStyle={{ color: '#FF6B00' }}
                    labelStyle={{ color: '#fff' }}
                    cursor={{ fill: 'rgba(255,107,0,0.08)' }}
                  />
                  <Bar dataKey="valor" fill="#FF6B00" radius={[0, 6, 6, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Upcoming payments */}
          {stats.upcoming.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Calendar size={15} className="text-brand" />
                  Próximos Vencimentos
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                {stats.upcoming.map(d => (
                  <UpcomingItem key={d.id} divida={d} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!hasData && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-surface-raised flex items-center justify-center">
            <CreditCard size={28} className="text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium text-center">Nenhuma dívida cadastrada</p>
          <p className="text-gray-600 text-sm text-center">Toque no + para adicionar sua primeira dívida</p>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, small = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`card flex flex-col gap-1.5 items-start ${onClick ? 'active:scale-95 transition-transform' : 'cursor-default'}`}
    >
      {icon}
      <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">{label}</span>
      <span className={`font-bold text-white leading-none ${small ? 'text-sm' : 'text-xl'}`}>{value}</span>
    </button>
  )
}

function UpcomingItem({ divida }) {
  const urgent = divida.dias <= 3
  const soon = divida.dias <= 7

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {urgent && <AlertCircle size={14} className="text-red-400 shrink-0" />}
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{divida.nome}</p>
          <p className="text-xs text-gray-500">
            Parcela {divida.parcelas_pagas + 1}/{divida.total_parcelas}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-white">{fmt(divida.valor_parcela)}</p>
        <p className={`text-xs font-semibold ${urgent ? 'text-red-400' : soon ? 'text-amber-400' : 'text-gray-500'}`}>
          {divida.dias === 0 ? 'Hoje!' : divida.dias === 1 ? 'Amanhã' : `Em ${divida.dias} dias`}
        </p>
      </div>
    </div>
  )
}
