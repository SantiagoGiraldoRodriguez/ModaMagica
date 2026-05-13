import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) }

const REQS = [
  { key:'length',  label:'Mínimo 8 caracteres',                  test: v => v.length >= 8 },
  { key:'upper',   label:'Al menos una letra mayúscula',          test: v => /[A-Z]/.test(v) },
  { key:'lower',   label:'Al menos una letra minúscula',          test: v => /[a-z]/.test(v) },
  { key:'number',  label:'Al menos un número',                    test: v => /[0-9]/.test(v) },
  { key:'special', label:'Al menos un carácter especial (!@#$%)', test: v => /[^A-Za-z0-9]/.test(v) },
]

export default function RecuperarContrasena({ dark, setDark }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [code, setCode] = useState(['','','','','',''])
  const [codeErr, setCodeErr] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [newPwdErr, setNewPwdErr] = useState('')
  const [confirmPwdErr, setConfirmPwdErr] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [timer, setTimer] = useState(0)
  const timerRef = useRef(null)
  const codeRefs = useRef([])

  const startTimer = () => {
    setTimer(30)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0 } return t - 1 }), 1000)
  }
  useEffect(() => () => clearInterval(timerRef.current), [])

  const goStep = (n) => setStep(n)

  // Step 1
  const submitEmail = (e) => {
    e.preventDefault()
    if (!email.trim()) { setEmailErr('El correo electrónico es obligatorio.'); return }
    if (!isValidEmail(email)) { setEmailErr('Por favor ingresa un correo electrónico válido.'); return }
    setEmailErr(''); goStep(2); startTimer(); setTimeout(() => codeRefs.current[0]?.focus(), 100)
  }

  // Step 2 — code inputs
  const handleCodeChange = (i, v) => {
    const val = v.replace(/[^0-9]/g, '')
    const next = [...code]; next[i] = val; setCode(next); setCodeErr('')
    if (val && i < 5) codeRefs.current[i+1]?.focus()
  }
  const handleCodeKeyDown = (i, e) => { if (e.key === 'Backspace' && !code[i] && i > 0) codeRefs.current[i-1]?.focus() }
  const handleCodePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g,'').slice(0,6).split('')
    const next = [...code]; pasted.forEach((c,i) => { next[i] = c }); setCode(next)
    codeRefs.current[Math.min(pasted.length, 5)]?.focus()
  }
  const submitCode = (e) => {
    e.preventDefault()
    if (code.join('').length < 6) { setCodeErr('Por favor ingresa el código completo de 6 dígitos.'); return }
    setCodeErr(''); goStep(3)
  }

  // Step 3
  const allReqs = REQS.every(r => r.test(newPwd))
  const submitPwd = (e) => {
    e.preventDefault()
    let err = false
    if (!allReqs) { setNewPwdErr('La contraseña no cumple con todos los requisitos.'); err = true } else setNewPwdErr('')
    if (!confirmPwd) { setConfirmPwdErr('Por favor confirma tu contraseña.'); err = true }
    else if (confirmPwd !== newPwd) { setConfirmPwdErr('Las contraseñas no coinciden.'); err = true }
    else setConfirmPwdErr('')
    if (err) return
    navigate('/login')
  }

  return (
    <div className="auth-page">
      <button className="icon-btn" onClick={() => setDark(v => !v)}
        style={{ position:'fixed', top:20, right:20, zIndex:100 }}>
        {dark
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="1.6" d="M12 17a5 5 0 100-10 5 5 0 000 10zM12 3v2M12 19v2M5 12H3M21 12h-2M6.34 6.34l-1.41 1.41M19.07 19.07l-1.41 1.41"/></svg>
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeWidth="1.6" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        }
      </button>

      <div className="auth-container">
        <span className="auth-logo">✦ Moda Mágica ✦</span>

        {/* Dots */}
        <div className="steps-indicator">
          {[1,2,3].map(n => (
            <div key={n} className={`step-dot${step === n ? ' active' : step > n ? ' done' : ''}`} />
          ))}
        </div>

        {/* PASO 1 */}
        <div className={`step-panel${step===1?' active':''}`}>
          <div className="auth-title">Recuperar contraseña</div>
          <p className="auth-subtitle">Ingresa tu correo y te enviaremos un código de verificación.</p>
          <form onSubmit={submitEmail} noValidate>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input type="email" className={`form-input${emailErr?' input-error':''}`}
                placeholder="ejemplo@correo.com" value={email} autoComplete="email"
                onChange={e => { setEmail(e.target.value); if (isValidEmail(e.target.value)) setEmailErr('') }}
                onBlur={() => { if (!email.trim()) setEmailErr('El correo es obligatorio.') }} />
              <div className={`error-msg${emailErr?' visible':''}`}>
                <i className="bi bi-exclamation-circle"></i> {emailErr}
              </div>
            </div>
            <button type="submit" className="btn-primary auth-btn">Enviar código</button>
            <button type="button" className="back-link" onClick={() => navigate('/login')} style={{ display:'flex', marginTop:14 }}>
              <i className="bi bi-arrow-left"></i> Volver al inicio de sesión
            </button>
          </form>
        </div>

        {/* PASO 2 */}
        <div className={`step-panel${step===2?' active':''}`}>
          <div className="auth-title">Código de verificación</div>
          <p className="auth-subtitle">Ingresa el código de 6 dígitos enviado a <strong style={{ color:'var(--gold)' }}>{email}</strong></p>
          <form onSubmit={submitCode} noValidate>
            <div className="form-group">
              <div className="code-inputs" onPaste={handleCodePaste}>
                {code.map((c, i) => (
                  <input key={i} ref={el => codeRefs.current[i] = el}
                    className={`code-input${codeErr?' input-error':''}`}
                    type="text" maxLength={1} inputMode="numeric" value={c}
                    onChange={e => handleCodeChange(i, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(i, e)} />
                ))}
              </div>
              <div className={`error-msg${codeErr?' visible':''}`} style={{ justifyContent:'center', marginTop:8 }}>
                <i className="bi bi-exclamation-circle"></i> {codeErr}
              </div>
            </div>
            <div style={{ textAlign:'center', marginBottom:12, fontSize:13 }}>
              <button type="button" className="resend-link" disabled={timer > 0}
                onClick={() => { setCode(['','','','','','']); codeRefs.current[0]?.focus(); startTimer() }}>
                Reenviar código
              </button>
              {timer > 0 && <span style={{ color:'var(--text-secondary)', marginLeft:6 }}>(espera {timer}s)</span>}
            </div>
            <button type="submit" className="btn-primary auth-btn">Verificar código</button>
            <button type="button" className="back-link" onClick={() => goStep(1)}>
              <i className="bi bi-arrow-left"></i> Cambiar correo
            </button>
          </form>
        </div>

        {/* PASO 3 */}
        <div className={`step-panel${step===3?' active':''}`}>
          <div className="auth-title">Nueva contraseña</div>
          <p className="auth-subtitle">Crea una contraseña segura para tu cuenta.</p>
          <form onSubmit={submitPwd} noValidate>
            <div className="form-group">
              <label className="form-label">Nueva contraseña</label>
              <div className="password-wrap">
                <input type={showNew?'text':'password'} className={`form-input${newPwdErr?' input-error':''}`}
                  placeholder="Ingresa tu nueva contraseña" value={newPwd} style={{ paddingRight:46 }}
                  onChange={e => { setNewPwd(e.target.value); setNewPwdErr(''); if (confirmPwd && confirmPwd === e.target.value) setConfirmPwdErr('') }}
                  onBlur={() => { if (!REQS.every(r => r.test(newPwd))) setNewPwdErr('La contraseña no cumple con todos los requisitos.') }} />
                <button type="button" className="password-toggle" onClick={() => setShowNew(v=>!v)}>
                  <i className={`bi bi-eye${showNew?'-slash':''}`}></i>
                </button>
              </div>
              <div className={`error-msg${newPwdErr?' visible':''}`}>
                <i className="bi bi-exclamation-circle"></i> {newPwdErr}
              </div>
              {/* Requisitos */}
              <div className="password-requirements" style={{ marginTop:8 }}>
                {REQS.map(r => (
                  <div key={r.key} className={`req-item${r.test(newPwd)?' valid':''}`}>
                    <i className={`bi bi-${r.test(newPwd)?'check-circle-fill':'x-circle'}`}></i>
                    {r.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar contraseña</label>
              <div className="password-wrap">
                <input type={showConfirm?'text':'password'} className={`form-input${confirmPwdErr?' input-error':''}`}
                  placeholder="Repite tu nueva contraseña" value={confirmPwd} style={{ paddingRight:46 }}
                  onChange={e => { setConfirmPwd(e.target.value); if (e.target.value === newPwd) setConfirmPwdErr('') }}
                  onBlur={() => { if (!confirmPwd) setConfirmPwdErr('Por favor confirma tu contraseña.'); else if (confirmPwd !== newPwd) setConfirmPwdErr('Las contraseñas no coinciden.') }} />
                <button type="button" className="password-toggle" onClick={() => setShowConfirm(v=>!v)}>
                  <i className={`bi bi-eye${showConfirm?'-slash':''}`}></i>
                </button>
              </div>
              <div className={`error-msg${confirmPwdErr?' visible':''}`}>
                <i className="bi bi-exclamation-circle"></i> {confirmPwdErr}
              </div>
            </div>

            <button type="submit" className="btn-primary auth-btn" style={{ marginTop:8 }}>Guardar contraseña</button>
          </form>
        </div>
      </div>
    </div>
  )
}
