import { useState } from 'react'
import ConfirmModal from '../../components/ConfirmModal'

const AVATAR_COLORS = ['#6366f1','#ef4444','#8b5cf6','#3b82f6','#10b981','#f59e0b','#C9962A']
const getInitials   = n => n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()

const initialPedidos = [
  { id:'PED-001', cliente:'Laura Gómez Martínez',   email:'laura.gomez@email.com',    telefono:'3001234567', metodoPago:'PSE',                   fecha:'05/01/2025', estado:'entregado',   total:245990  },
  { id:'PED-002', cliente:'Camilo Torres Ríos',     email:'camilo.torres@email.com',   telefono:'3109876543', metodoPago:'Nequi',                 fecha:'10/01/2025', estado:'enviado',     total:89500   },
  { id:'PED-003', cliente:'Valentina Herrera Cano', email:'vale.herrera@gmail.com',    telefono:'3157894561', metodoPago:'Tarjeta de crédito',    fecha:'15/01/2025', estado:'preparacion', total:549990  },
  { id:'PED-004', cliente:'Andrés Muñoz Vargas',    email:'andres.munoz@outlook.com',  telefono:'3214567890', metodoPago:'Transferencia bancaria', fecha:'18/01/2025', estado:'confirmado',  total:179900  },
  { id:'PED-005', cliente:'María Ospina López',     email:'maria.ospina@gmail.com',    telefono:'3001122334', metodoPago:'Efectivo',              fecha:'22/01/2025', estado:'cancelado',   total:99900   },
  { id:'PED-006', cliente:'Juan Pérez Silva',       email:'juan.perez@email.com',      telefono:'3187654321', metodoPago:'PSE',                   fecha:'25/01/2025', estado:'entregado',   total:329000  },
  { id:'PED-007', cliente:'Paola Ramírez Cruz',     email:'paola.ramirez@yahoo.com',   telefono:'3209876543', metodoPago:'Nequi',                 fecha:'28/01/2025', estado:'enviado',     total:149900  },
]

const ESTADO_STYLES = {
  entregado:   { label:'Entregado',      bg:'rgba(16,185,129,0.15)',  color:'#10b981', icon:'bi-box-seam'    },
  enviado:     { label:'Enviado',        bg:'rgba(59,130,246,0.15)',  color:'#3b82f6', icon:'bi-truck'       },
  preparacion: { label:'En preparación', bg:'rgba(99,102,241,0.15)',  color:'#6366f1', icon:'bi-gear-fill'   },
  confirmado:  { label:'Confirmado',     bg:'rgba(201,150,42,0.15)',  color:'#C9962A', icon:'bi-check-circle'},
  cancelado:   { label:'Cancelado',      bg:'rgba(239,68,68,0.15)',   color:'#ef4444', icon:'bi-x-circle'    },
}

const PAGO_STYLES = {
  'PSE':                    { bg:'rgba(59,130,246,0.15)',  color:'#3b82f6' },
  'Nequi':                  { bg:'rgba(139,92,246,0.15)', color:'#8b5cf6' },
  'Tarjeta de crédito':     { bg:'rgba(201,150,42,0.15)', color:'#C9962A' },
  'Transferencia bancaria': { bg:'rgba(16,185,129,0.15)', color:'#10b981' },
  'Efectivo':               { bg:'rgba(245,158,11,0.15)', color:'#f59e0b' },
}

const ESTADOS_F      = ['Todos los estados','entregado','enviado','preparacion','confirmado','cancelado']
const ITEMS_PER_PAGE = 4

export default function Pedidos() {
  const [pedidos, setPedidos]         = useState(initialPedidos)
  const [search, setSearch]           = useState('')
  const [filtroEst, setFiltroEst]     = useState('Todos los estados')
  const [toast, setToast]             = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [modal, setModal]             = useState(false)
  const [editando, setEditando]       = useState(null)
  const [confirm, setConfirm]         = useState({ show:false, id:null })
  const [form, setForm]               = useState({ cliente:'', email:'', telefono:'', metodoPago:'PSE', fecha:'', estado:'confirmado', total:'' })

  const filtered   = pedidos.filter(p=>{ const ms=p.id.toLowerCase().includes(search.toLowerCase())||p.cliente.toLowerCase().includes(search.toLowerCase()); const me=filtroEst==='Todos los estados'||p.estado===filtroEst; return ms&&me })
  const totalPages = Math.ceil(filtered.length/ITEMS_PER_PAGE)
  const paginated  = filtered.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE)
  const startRow   = (currentPage-1)*ITEMS_PER_PAGE

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(null),3000) }
  const openAdd   = ()  => { setEditando(null); setForm({ cliente:'', email:'', telefono:'', metodoPago:'PSE', fecha:'', estado:'confirmado', total:'' }); setModal(true) }
  const openEdit  = p   => { setEditando(p.id); setForm({ cliente:p.cliente, email:p.email, telefono:p.telefono, metodoPago:p.metodoPago, fecha:p.fecha, estado:p.estado, total:p.total }); setModal(true) }

  const save = () => {
    if (!form.cliente.trim()) return
    if (editando) {
      setPedidos(prev=>prev.map(p=>p.id===editando?{...p,...form,total:Number(form.total)}:p)); showToast('✅ Pedido actualizado')
    } else {
      const newId=`PED-${String(pedidos.length+1).padStart(3,'0')}`
      setPedidos(prev=>[...prev,{ id:newId, ...form, total:Number(form.total), fecha:form.fecha||new Date().toLocaleDateString('es-CO') }]); showToast('✅ Pedido creado')
    }
    setModal(false)
  }

  const stats = [
    { label:'Total pedidos', value:pedidos.length,                                                             icon:'bi-bag-fill',        bg:'rgba(201,150,42,0.2)', color:'#C9962A' },
    { label:'Pendientes',    value:pedidos.filter(p=>p.estado==='confirmado').length,                          icon:'bi-hourglass-split',  bg:'rgba(245,158,11,0.2)', color:'#f59e0b' },
    { label:'En tránsito',   value:pedidos.filter(p=>p.estado==='enviado'||p.estado==='preparacion').length,   icon:'bi-truck',            bg:'rgba(59,130,246,0.2)', color:'#3b82f6' },
    { label:'Entregados',    value:pedidos.filter(p=>p.estado==='entregado').length,                           icon:'bi-box-seam',         bg:'rgba(16,185,129,0.2)', color:'#10b981' },
  ]

  return (
    <>
      <div className="page-header">
        <div className="page-title"><h1>Pedidos</h1><p>Gestiona y crea pedidos del catálogo de Moda Mágica.</p></div>
        <div className="page-actions"><button className="btn-primary" onClick={openAdd}><i className="bi bi-plus-lg"></i> Nuevo pedido</button></div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', marginBottom:24 }}>
        {stats.map((s,i)=>(
          <div key={i} className="stat-card" style={{ display:'flex', alignItems:'center', gap:14, padding:18 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:s.bg, color:s.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}><i className={`bi ${s.icon}`}></i></div>
            <div><div style={{ fontSize:26, fontWeight:800, color:'var(--stat-text)' }}>{s.value}</div><div style={{ fontSize:13, color:'var(--text-secondary)' }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontWeight:700, fontSize:15 }}>Lista de pedidos</span>
            <span style={{ background:'rgba(201,150,42,0.2)', color:'var(--gold)', padding:'2px 9px', borderRadius:20, fontSize:12, fontWeight:700 }}>{filtered.length}</span>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            <select style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--card)', color:'var(--text)', fontSize:13, cursor:'pointer' }}
              value={filtroEst} onChange={e=>{ setFiltroEst(e.target.value); setCurrentPage(1) }}>
              {ESTADOS_F.map(e=><option key={e} value={e}>{e==='Todos los estados'?e:ESTADO_STYLES[e]?.label||e}</option>)}
            </select>
            <div className="search-input-wrap"><i className="bi bi-search"></i><input className="search-input" placeholder="Buscar pedido, cliente..." value={search} onChange={e=>{ setSearch(e.target.value); setCurrentPage(1) }} /></div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead><tr><th>#</th><th>N° Pedido</th><th>Cliente</th><th>Correo</th><th>Método de pago</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {paginated.length===0
                ? <tr><td colSpan={8}><div className="empty-state"><i className="bi bi-cart-x"></i>No hay pedidos</div></td></tr>
                : paginated.map((p,idx)=>{ const es=ESTADO_STYLES[p.estado]||ESTADO_STYLES.confirmado; const ps=PAGO_STYLES[p.metodoPago]||{bg:'rgba(99,102,241,0.15)',color:'#6366f1'}; return (
                  <tr key={p.id}>
                    <td style={{ color:'var(--text-secondary)', fontSize:13 }}>{startRow+idx+1}</td>
                    <td><span style={{ fontFamily:'monospace', fontWeight:700, fontSize:13, background:'rgba(201,150,42,0.15)', color:'#C9962A', padding:'4px 10px', borderRadius:6 }}>{p.id}</span></td>
                    <td><div style={{ display:'flex', alignItems:'center', gap:10 }}><div style={{ width:36, height:36, borderRadius:'50%', background:AVATAR_COLORS[idx%AVATAR_COLORS.length], color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, flexShrink:0 }}>{getInitials(p.cliente)}</div><div><div style={{ fontWeight:600, fontSize:13 }}>{p.cliente}</div><div style={{ fontSize:11, color:'var(--text-secondary)' }}>📞 {p.telefono}</div></div></div></td>
                    <td style={{ fontSize:12, color:'var(--text-secondary)' }}>✉ {p.email}</td>
                    <td><span style={{ background:ps.bg, color:ps.color, padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600, display:'inline-flex', alignItems:'center', gap:5 }}><i className="bi bi-credit-card-fill" style={{ fontSize:11 }}></i> {p.metodoPago}</span></td>
                    <td style={{ fontSize:13, color:'var(--text-secondary)' }}>{p.fecha}</td>
                    <td><span style={{ background:es.bg, color:es.color, padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:600, display:'inline-flex', alignItems:'center', gap:5 }}><i className={`bi ${es.icon}`} style={{ fontSize:11 }}></i> {es.label}</span></td>
                    <td><div className="action-btns">
                      <button className="tbl-btn" style={{ color:'var(--accent)' }}><i className="bi bi-eye"></i></button>
                      <button className="tbl-btn edit" onClick={()=>openEdit(p)}><i className="bi bi-pencil"></i></button>
                      <button className="tbl-btn delete" onClick={()=>setConfirm({ show:true, id:p.id })}><i className="bi bi-trash"></i></button>
                    </div></td>
                  </tr>
                )})
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
            <div className="modal-title"><i className="bi bi-cart-plus" style={{ color:'var(--gold)' }}></i> {editando?'Editar':'Nuevo'} Pedido</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">Cliente <span style={{ color:'var(--gold)' }}>*</span></label><input className="form-control" value={form.cliente} onChange={e=>setForm({...form,cliente:e.target.value})} placeholder="Nombre completo del cliente" /></div>
              <div className="form-group"><label className="form-label">Correo</label><input className="form-control" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="correo@ejemplo.com" /></div>
              <div className="form-group"><label className="form-label">Teléfono</label><input className="form-control" value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} placeholder="3001234567" /></div>
              <div className="form-group"><label className="form-label">Método de pago</label><select className="form-control" value={form.metodoPago} onChange={e=>setForm({...form,metodoPago:e.target.value})}><option>PSE</option><option>Nequi</option><option>Tarjeta de crédito</option><option>Transferencia bancaria</option><option>Efectivo</option></select></div>
              <div className="form-group"><label className="form-label">Total (COP)</label><input className="form-control" type="number" value={form.total} onChange={e=>setForm({...form,total:e.target.value})} placeholder="129900" /></div>
              <div className="form-group"><label className="form-label">Fecha</label><input className="form-control" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})} placeholder="DD/MM/AAAA" /></div>
              <div className="form-group"><label className="form-label">Estado</label><select className="form-control" value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}><option value="confirmado">Confirmado</option><option value="preparacion">En preparación</option><option value="enviado">Enviado</option><option value="entregado">Entregado</option><option value="cancelado">Cancelado</option></select></div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save}><i className="bi bi-check-lg"></i> {editando?'Actualizar':'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal show={confirm.show} titulo="¿Eliminar pedido?" mensaje="Esta acción no se puede deshacer. El pedido será eliminado permanentemente."
        onCancel={()=>setConfirm({show:false,id:null})}
        onConfirm={()=>{ setPedidos(prev=>prev.filter(p=>p.id!==confirm.id)); setConfirm({show:false,id:null}); showToast('🗑️ Pedido eliminado') }} />

      {toast && <div className="toast"><i className="bi bi-check-circle-fill"></i> {toast}</div>}
    </>
  )
}