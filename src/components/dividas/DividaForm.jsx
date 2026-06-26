import { useState, useEffect } from 'react'
import { useDividas } from '../../context/DividasContext'
import { useToast } from '../../context/ToastContext'
import Modal from '../ui/Modal'
import { X, Loader2 } from 'lucide-react'

const CATEGORIAS = [
  { value: 'cartao',        label: '💳 Cartão de Crédito' },
  { value: 'financiamento', label: '🏦 Financiamento' },
  { value: 'emprestimo',    label: '💰 Empréstimo' },
  { value: 'boleto',        label: '📄 Boleto' },
  { value: 'outros',        label: '📌 Outros' },
]

const EMPTY = {
  nome: '',
  credor: '',
  categoria: 'outros',
  valor_parcela: '',
  total_parcelas: '',
  valor_total: '',
  dia_vencimento: '',
  data_inicio: new Date().toISOString().split('T')[0],
  observacoes: '',
}

export default function DividaForm({ divida, onClose, onSaved }) {
  const { addDivida, updateDivida } = useDividas()
  const toast = useToast()
  const isEdit = !!divida
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (divida) {
      setForm({
        nome: divida.nome || '',
        credor: divida.credor || '',
        categoria: divida.categoria || 'outros',
        valor_parcela: String(divida.valor_parcela || ''),
        total_parcelas: String(divida.total_parcelas || ''),
        valor_total: String(divida.valor_total || ''),
        dia_vencimento: String(divida.dia_vencimento || ''),
        data_inicio: divida.data_inicio || new Date().toISOString().split('T')[0],
        observacoes: divida.observacoes || '',
      })
    }
  }, [divida])

  // Auto-calc valor_total
  useEffect(() => {
    const p = parseFloat(form.valor_parcela)
    const n = parseInt(form.total_parcelas)
    if (p > 0 && n > 0) {
      setForm(prev => ({ ...prev, valor_total: (p * n).toFixed(2) }))
    }
  }, [form.valor_parcela, form.total_parcelas])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome || !form.valor_parcela || !form.total_parcelas || !form.dia_vencimento) {
      toast.error('Preencha os campos obrigatórios.')
      return
    }
    const dia = parseInt(form.dia_vencimento)
    if (dia < 1 || dia > 31) {
      toast.error('Dia de vencimento deve ser entre 1 e 31.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        nome: form.nome.trim(),
        credor: form.credor.trim() || null,
        categoria: form.categoria,
        valor_parcela: parseFloat(form.valor_parcela),
        total_parcelas: parseInt(form.total_parcelas),
        valor_total: parseFloat(form.valor_total) || parseFloat(form.valor_parcela) * parseInt(form.total_parcelas),
        dia_vencimento: dia,
        data_inicio: form.data_inicio,
        observacoes: form.observacoes.trim() || null,
      }

      if (isEdit) {
        await updateDivida(divida.id, payload)
        toast.success('Dívida atualizada!')
      } else {
        await addDivida({ ...payload, parcelas_pagas: 0, status: 'ativa' })
        toast.success('Dívida cadastrada!')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 bg-surface-border rounded-full" />
      </div>

      <div className="px-5 pb-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 mt-2">
          <h2 className="text-lg font-bold text-white">
            {isEdit ? 'Editar Dívida' : 'Nova Dívida'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nome */}
          <div>
            <label className="label">Nome da dívida *</label>
            <input
              className="input-field"
              placeholder="Ex: Cartão Nubank, Financiamento Moto"
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
              required
            />
          </div>

          {/* Credor */}
          <div>
            <label className="label">Credor / Instituição</label>
            <input
              className="input-field"
              placeholder="Ex: Nubank, Itaú, Casas Bahia"
              value={form.credor}
              onChange={e => set('credor', e.target.value)}
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="label">Categoria *</label>
            <select
              className="input-field"
              value={form.categoria}
              onChange={e => set('categoria', e.target.value)}
            >
              {CATEGORIAS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Parcela + Total */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor da Parcela *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                <input
                  type="number"
                  className="input-field pl-9"
                  placeholder="0,00"
                  step="0.01"
                  min="0.01"
                  value={form.valor_parcela}
                  onChange={e => set('valor_parcela', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Nº de Parcelas *</label>
              <input
                type="number"
                className="input-field"
                placeholder="12"
                min="1"
                max="999"
                value={form.total_parcelas}
                onChange={e => set('total_parcelas', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Valor total (auto) */}
          <div>
            <label className="label">Valor Total</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
              <input
                type="number"
                className="input-field pl-9"
                placeholder="Calculado automaticamente"
                step="0.01"
                min="0"
                value={form.valor_total}
                onChange={e => set('valor_total', e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">Calculado automaticamente. Edite se houver juros/taxas.</p>
          </div>

          {/* Dia vencimento + Data início */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Dia de Vencimento *</label>
              <input
                type="number"
                className="input-field"
                placeholder="Ex: 15"
                min="1"
                max="31"
                value={form.dia_vencimento}
                onChange={e => set('dia_vencimento', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Data de Início *</label>
              <input
                type="date"
                className="input-field"
                value={form.data_inicio}
                onChange={e => set('data_inicio', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="label">Observações</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="Anotações opcionais…"
              value={form.observacoes}
              onChange={e => set('observacoes', e.target.value)}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2 mt-1 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? 'Salvar Alterações' : 'Cadastrar Dívida'}
          </button>
        </form>
      </div>
    </Modal>
  )
}
