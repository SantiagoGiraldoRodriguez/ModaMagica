# Cambios aplicados — Moda Mágica

## ⚠️ PASO OBLIGATORIO ANTES DE PROBAR: configurar Gmail

El envío de correos usa Gmail vía nodemailer. Esto requiere verificación
en 2 pasos activada y una "contraseña de aplicación" — pero a cambio,
**envía a cualquier correo destinatario sin restricciones**.

1. Activa la verificación en 2 pasos en la cuenta de Gmail que usarás como
   remitente: https://myaccount.google.com/security → "Verificación en
   2 pasos" → actívala (te pedirá tu número de teléfono).
2. Una vez activada, ve a https://myaccount.google.com/apppasswords →
   ponle un nombre (ej. "ModaMagica") → Google te genera una contraseña
   de **16 caracteres** sin espacios.
3. Abre `backend/.env` y reemplaza:
   ```
   EMAIL_USER=tucorreo@gmail.com
   EMAIL_PASS=pega_aqui_tu_contraseña_de_aplicacion_de_16_caracteres
   ```
   con tu correo real y esa contraseña de 16 caracteres (NO tu contraseña
   normal de Gmail, esa ya no funciona para esto desde 2022).
4. Reinicia el backend (`npm run dev`).

Con esta configuración puedes enviar códigos de verificación y de
recuperación de contraseña a **cualquier correo electrónico**, sin
restricciones de destinatario.

---

## Qué se corrigió y se agregó en esta sesión

### 1. Registro en la tienda no creaba el usuario (bug de columnas SQL)
`authController.js` → `register` intentaba insertar en columnas que nunca
existieron en la tabla `usuario` (`documento`, `tipo_documento`,
`departamento`, `ciudad`). Esto causaba el error
`no existe la columna «documento»` y el registro fallaba siempre, antes
de siquiera intentar enviar el correo.

### 2. El correo de verificación no llegaba
Gmail + nodemailer requiere verificación en 2 pasos y una "contraseña de
aplicación" generada en Google — eso es lo que faltaba configurar. El
módulo de envío (`backend/src/utils/correo.js`) usa nodemailer/Gmail y es
usado por:
- `authController.js` (registro, reenvío de código, recuperar contraseña)
- `usuarios.controllers.js` (correo de bienvenida al crear usuario desde
  el panel admin)
- `recoveryController.js` (flujo de recuperación por enlace, no usado
  activamente por el frontend pero actualizado por consistencia)

### 3. "Restablecer contraseña" en el panel ADMIN no funcionaba
`RecuperarContrasena.jsx` (la pantalla del login admin) nunca llamaba al
backend — todos los pasos (enviar correo, verificar código, guardar nueva
contraseña) solo simulaban éxito en el frontend sin tocar la base de datos.
Ahora está conectado a los endpoints reales:
`/api/auth/recovery-request`, `/api/auth/recovery-verify`,
`/api/auth/recovery-reset`.

### 4. "Restablecer contraseña" en la TIENDA
Ya estaba conectado al backend correctamente en `TiendaAuth.jsx` — el
problema era únicamente que el correo nunca llegaba (resuelto con Resend).

### 5. Registro en la tienda ahora pide los mismos campos que el panel admin
`TiendaAuth.jsx` (panel de Registro) ahora incluye:
- Primer nombre / Segundo nombre
- Primer apellido / Segundo apellido
- Correo / Teléfono
- Dirección (ahora obligatoria)
- Fecha de nacimiento (nueva — valida que el usuario sea mayor de 18 años)
- Contraseña / Confirmar contraseña

El backend (`authController.js` → `register`) valida y guarda todos estos
campos, incluyendo el chequeo de mayoría de edad del lado del servidor
(no solo en el frontend).

---

## Cambios de la sesión anterior (ya incluidos en este ZIP)
- Solo puede existir un Superadmin en el sistema.
- Usuarios inactivos no se pueden editar.
- Verificación de dominio de correo real (DNS MX) al crear usuario desde
  el panel admin.
- Botón de eliminar producto removido del panel admin.
- Carrito de la tienda: precio unitario visible, subtotal + IVA antes de
  checkout, login obligatorio para finalizar compra.
- Checkout con modal de verificación de datos del cliente + creación real
  del pedido en la base de datos.

---

## Instalación

```bash
# Backend
cd ModaMagica-local/backend
npm install
npm run dev

# Frontend (otra terminal)
cd ModaMagica-local/Cliente
npm install
npm run dev
```
