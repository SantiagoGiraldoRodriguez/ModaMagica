import { useState, useEffect } from 'react'
import ConfirmModal from '../../components/ConfirmModal'

const API = 'http://localhost:3000/api/descuentos'

const ESTADOS_F      = ['Todos los estados','activo','inactivo','vencido']
const ITEMS_PER_PAGE = 4

const formVacio = {
  codigo:'', descripcion:'', valor_descuento:'',
  fecha_inicio:'', fecha_cierre:'', limite_usos:''
}

export default function Descuentos() {
  const [descuentos, setDescuentos]   = useState([])
  const [search, setSearch]           = useState('')
  const [filtroEst, setFiltroEst]     = useState('Todos los estados')
  const [modal, setModal]             = useState(false)
  const [editando, setEditando]       = useState(null)
  const [form, setForm]               = useState(formVacio)
  const [currentPage, setCurrentPage] = useState(1)
  const [confirm, setConfirm]         = useState({ show:false, id:null })

  const cargar = async () => {
    try {
      const res = await fetch(API)
      setDescuentos(await res.json())
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => { cargar() }, [])

  const filtered   = descuentos.filter(d => {
    const ms = d.codigo.toLowerCase().includes(search.toLowerCase()) || (d.descripcion || '').toLowerCase().includes(search.toLowerCase())
    const me = filtroEst === 'Todos los estados' || d.estado === filtroEst
    return ms && me
  })
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE)
  const startRow   = (currentPage-1)*ITEMS_PER_PAGE

  const openAdd  = () => { setEditando(null); setForm(formVacio); setModal(true) }
  const openEdit = d  => {
    setEditando(d.id_descuento)
    setForm({
      codigo:          d.codigo,
      descripcion:     d.descripcion     || '',
      valor_descuento: d.valor_descuento,
      fecha_inicio:    d.fecha_inicio    || '',
      fecha_cierre:    d.fecha_cierre    || '',
      limite_usos:     d.limite_usos
    })
    setModal(true)
  }

  const save = async () => {
    try {
      const url    = editando ? `${API}/${editando}` : API
      const method = editando ? 'PUT' : 'POST'
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      await cargar()
      setModal(false)
    } catch (err) {
      console.log(err)
    }
  }

  const eliminar = async id => {
    try {
      await fetch(`${API}/${id}`, { method:'DELETE' })
      await cargar()
    } catch (err) {
      console.log(err)
    }
  }

  const estadoCls = e => e==='activo' ? 'status-active' : e==='vencido' ? 'status-cancelled' : 'status-inactivo'

  return (
    <>
      <div className="page-header">
        <div className="page-title"><h1>Descuentos</h1><p>Gestiona los códigos de descuento de Moda Mágica.</p></div>
        <div className="page-actions"><button className="btn-primary" onClick={openAdd}><i className="bi bi-plus-lg"></i> Crear descuento</button></div>
      </div>

      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontWeight:700, fontSize:15 }}>Descuentos registrados</span>
            <span style={{ background:'rgba(201,150,42,0.2)', color:'var(--gold)', padding:'2px 9px', borderRadius:20, fontSize:12, fontWeight:700 }}>{filtered.length}</span>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            <select style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--card)', color:'var(--text)', fontSize:13, cursor:'pointer' }} value={filtroEst} onChange={e=>{ setFiltroEst(e.target.value); setCurrentPage(1) }}>{ESTADOS_F.map(e=><option key={e}>{e}</option>)}</select>
            <div className="search-input-wrap"><i className="bi bi-search"></i><input className="search-input" placeholder="Buscar código..." value={search} onChange={e=>{ setSearch(e.target.value); setCurrentPage(1) }} /></div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr><th>#</th><th>Código</th><th>Descripción</th><th>Descuento</th><th>Fecha inicio</th><th>Fecha cierre</th><th>Límite personas</th><th>Usos actuales</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {paginated.length === 0
                ? <tr><td colSpan={10}><div className="empty-state"><i className="bi bi-ticket-perforated"></i>No hay descuentos</div></td></tr>
                : paginated.map((d, idx) => (
                  <tr key={d.id_descuento}>
                    <td style={{ color:'var(--text-secondary)', fontSize:13 }}>{startRow+idx+1}</td>
                    <td><span style={{ fontFamily:'monospace', fontWeight:700, fontSize:13, background:'rgba(201,150,42,0.1)', color:'#a67820', padding:'4px 10px', borderRadius:6, letterSpacing:1 }}>{d.codigo}</span></td>
                    <td style={{ fontSize:13, color:'var(--text-secondary)' }}>{d.descripcion}</td>
                    <td style={{ fontWeight:700 }}>{d.valor_descuento}%</td>
                    <td style={{ fontSize:13, color:'var(--text-secondary)' }}>{d.fecha_inicio}</td>
                    <td style={{ fontSize:13, color:'var(--text-secondary)' }}>{d.fecha_cierre}</td>
                    <td style={{ fontWeight:600 }}>{d.limite_usos}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontWeight:600, fontSize:13 }}>{d.usos_actuales}</span>
                        <div style={{ width:50, height:5, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${Math.min((d.usos_actuales / d.limite_usos) * 100, 100)}%`, background:'var(--accent)', borderRadius:3 }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${estadoCls(d.estado)}`} style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:d.estado==='activo'?'#10b981':d.estado==='vencido'?'#ef4444':'#9ca3af', display:'inline-block' }}></span>
                        {d.estado.charAt(0).toUpperCase()+d.estado.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="tbl-btn edit"   onClick={()=>openEdit(d)}><i className="bi bi-pencil"></i></button>
                        <button className="tbl-btn delete" onClick={()=>setConfirm({ show:true, id:d.id_descuento })}><i className="bi bi-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {totalPages>1 && (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:6, marginTop:18 }}>
            <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1} style={{ width:34,height:34,borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',cursor:currentPage===1?'not-allowed':'pointer',opacity:currentPage===1?0.4:1,display:'flex',alignItems:'center',justifyContent:'center' }}><i className="bi bi-chevron-left"></i></button>
            {Array.from({length:totalPages},(_,i)=>i+1).map(page=>(<button key={page} onClick={()=>setCurrentPage(page)} style={{ width:34,height:34,borderRadius:8,border:'1px solid var(--border)',background:currentPage===page?'var(--accent)':'var(--card)',color:currentPage===page?'white':'var(--text)',fontWeight:600,fontSize:13,cursor:'pointer' }}>{page}</button>))}
            <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages} style={{ width:34,height:34,borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',cursor:currentPage===totalPages?'not-allowed':'pointer',opacity:currentPage===totalPages?0.4:1,display:'flex',alignItems:'center',justifyContent:'center' }}><i className="bi bi-chevron-right"></i></button>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal-box" style={{ maxWidth:560 }}>
            <button className="modal-close" onClick={()=>setModal(false)}><i className="bi bi-x-lg"></i></button>
            <div className="modal-title"><i className="bi bi-ticket-perforated" style={{ color:'var(--gold)' }}></i> {editando?'Editar':'Crear'} Descuento</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">Código</label><input className="form-control" value={form.codigo} onChange={e=>setForm({...form,codigo:e.target.value.toUpperCase()})} placeholder="Ej: VERANO25" style={{ fontFamily:'monospace', letterSpacing:1 }} /></div>
              <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">Descripción</label><input className="form-control" value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="Descripción del descuento" /></div>
              <div className="form-group"><label className="form-label">Valor (%)</label><input className="form-control" type="number" value={form.valor_descuento} onChange={e=>setForm({...form,valor_descuento:e.target.value})} placeholder="Ej: 25" /></div>
              <div className="form-group"><label className="form-label">Límite de personas</label><input className="form-control" type="number" value={form.limite_usos} onChange={e=>setForm({...form,limite_usos:e.target.value})} placeholder="100" /></div>
              <div className="form-group"><label className="form-label">Fecha inicio</label><input className="form-control" type="date" value={form.fecha_inicio} onChange={e=>setForm({...form,fecha_inicio:e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Fecha cierre</label><input className="form-control" type="date" value={form.fecha_cierre} onChange={e=>setForm({...form,fecha_cierre:e.target.value})} /></div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save}><i className="bi bi-check-lg"></i> {editando?'Actualizar':'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal show={confirm.show} titulo="¿Eliminar descuento?" mensaje="Esta acción no se puede deshacer. El código de descuento será eliminado permanentemente."
        onCancel={()=>setConfirm({show:false,id:null})}
        onConfirm={()=>{ eliminar(confirm.id); setConfirm({show:false,id:null}) }} />
    </>
  )
}