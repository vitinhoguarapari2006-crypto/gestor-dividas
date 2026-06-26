import { useState } from 'react'
import { useDividas } from '../../context/DividasContext'
import { useToast } from '../../context/ToastContext'
import Modal from '../ui/Modal'
import ProgressBar from '../ui/ProgressBar'
import {
  X, CheckCircle, RotateCcw, Pencil, Trash2, Calendar,
  CreditCard, Loader2, AlertTriangle,
} from 'lucide-react'

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

const fmtDate = (d) =>
  new Intl.DateTimeFormat('pt-BR').format(new Date(d + 'T12:00:00'))

const CAT_LABELS = {
  cartao: 'Cartão', financiamento: 'Financiamento', emprestimo: 'Empréstimo',
  boleto: 'Boleto', outros: 'Outros',
}

export default function DividaDetail({ divida, onClose, onEdit, onDeleted }) {
  const { pagamentos, marcarParcelaPaga, desfazerPagamento, deleteDivida } = useDividas()
  const toast = useToast()
  const [loadingPagar, setLoadingPagar] = useState(false)
  const [loadingDesfazer, setLoadingDesfazer] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)

  if (!divida) return null

  const historico = pagamentos
    .filter(p => p.divida_id === divida.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const restantes = divida.total_parcelas - divida.parcelas_pagas
  const valorRestante = restantes * divida.valor_parcela
  const quitada = divida.status === 'quitada'
  const pct = Math.round((divida.parcelas_pagas / divida.total_parcelas) * 100)

  async function handleMarcarPaga() {
    setLoadingPagar(true)
    try {
      const { divida: updated } = await marcarParcelaPaga(divida)
      if (updated.status === 'quitada') {
        toast.success('🎉 Dívida quitada! Parabéns!')
      } else {
        toast.success(`Parcela ${updated.parcelas_pagas}/${updated.total_parcelas} marcada como paga!`)
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao marcar parcela.')
    } finally {
      setLoadingPagar(false)
    }
  }

  async function handleDesfazer() {
    setLoadingDesfazer(true)
    try {
      await desfazerPagamento(divida)
      toast.info('Último pagamento desfeito.')
    } catch (err) {
      toast.error(err.message || 'Erro ao desfazer.')
    } finally {
      setLoadingDesfazer(false)
    }
  }

  async function handleDelete() {
    setLoadingDelete(true)
    try {
      await deleteDivida(divida.id)
      toast.success('Dívida excluída.')
      onDeleted?.()
      onClose()
    } catch (err) {
      toast.error('Erro ao excluir.')
    } finally {
      setLoadingDelete(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 bg-surface-border rounded-full" />
      </div>

      <div className="px-5 pb-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mt-3 mb-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="badge bg-surface-raised text-gray-300 text-[10px]">
                {CAT_LABELS[divida.categoria] || divida.categoria}
              </span>
              {quitada && (
                <span className="badge bg-emerald-500/15 text-emerald-400 text-[10px] flex items-center gap-1">
                  <CheckCircle size={9} /> Quitada
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white leading-tight">{divida.nome}</h2>
            {divida.credor && (
              <p className="text-sm text-gray-500 mt-0.5">{divida.credor}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Progress hero */}
        <div className="card mb-4">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Parcelas pagas</p>
              <p className="text-3xl font-extrabold text-white">
                {divida.parcelas_pagas}
                <span className="text-lg font-medium text-gray-500">/{divida.total_parcelas}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-0.5">Restante</p>
              <p className="text-xl font-bold text-brand">{fmt(valorRestante)}</p>
            </div>
          </div>
          <ProgressBar value={divida.parcelas_pagas} max={divida.total_parcelas} />
          <p className="text-xs text-gray-600 mt-2">{pct}% concluído</p>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <InfoTile label="Valor da Parcela" value={fmt(divida.valor_parcela)} />
          <InfoTile label="Total da Dívida" value={fmt(divida.valor_total)} />
          <InfoTile label="Vence todo dia" value={`Dia ${divida.dia_vencimento}`} />
          <InfoTile label="Início" value={fmtDate(divida.data_inicio)} />
        </div>

        {divida.observacoes && (
          <div className="card mb-4">
            <p className="text-xs text-gray-500 mb-1">Observações</p>
            <p className="text-sm text-white">{divida.observacoes}</p>
          </div>
        )}

        {/* Actions */}
        {!quitada && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleMarcarPaga}
              disabled={loadingPagar || restantes === 0}
              className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loadingPagar
                ? <Loader2 size={16} className="animate-spin" />
                : <CheckCircle size={16} />
              }
              Marcar Paga
            </button>
            {divida.parcelas_pagas > 0 && (
              <button
                onClick={handleDesfazer}
                disabled={loadingDesfazer}
                className="p-3 rounded-xl bg-surface-raised text-gray-400 hover:text-white border border-surface-border active:scale-95 transition-transform"
                title="Desfazer último pagamento"
              >
                {loadingDesfazer ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
              </button>
            )}
          </div>
        )}

        {/* Edit / Delete */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => onEdit(divida)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-surface-border text-gray-300 text-sm font-medium hover:border-brand/40 hover:text-white transition-colors"
          >
            <Pencil size={14} /> Editar
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/20 text-red-400 text-sm font-medium hover:border-red-400/50 transition-colors"
          >
            <Trash2 size={14} /> Excluir
          </button>
        </div>

        {/* Confirm delete */}
        {confirmDelete && (
          <div className="card border-red-500/30 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-red-400" />
              <p className="text-sm font-semibold text-red-400">Confirmar exclusão?</p>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Todos os pagamentos registrados também serão excluídos. Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={loadingDelete}
                className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/30 flex items-center justify-center gap-2"
              >
                {loadingDelete ? <Loader2 size={14} className="animate-spin" /> : null}
                Sim, excluir
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 rounded-xl bg-surface-raised text-gray-300 text-sm font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* History */}
        {historico.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Calendar size={14} className="text-brand" />
              Histórico de Pagamentos
            </h3>
            <div className="flex flex-col gap-2">
              {historico.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-surface-border last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                      <CheckCircle size={14} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">Parcela {p.numero_parcela}</p>
                      <p className="text-xs text-gray-500">{fmtDate(p.data_pagamento)}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-emerald-400">{fmt(p.valor_pago)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function InfoTile({ label, value }) {
  return (
    <div className="bg-surface-raised rounded-xl p-3 border border-surface-border">
      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  )
}
