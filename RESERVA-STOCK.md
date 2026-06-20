# Reserva temporal de stock en el carrito — Instrucciones

## ⚠️ PASO OBLIGATORIO: crear la tabla en tu base de datos

Antes de probar nada, abre pgAdmin (o tu cliente de PostgreSQL favorito),
conéctate a tu base de datos `ModaMagica`, y ejecuta el contenido del
archivo `reserva_stock.sql` que está en la raíz de este proyecto.

Eso crea la tabla `reserva_stock` con sus índices. Sin esto, el backend
fallará al intentar reservar/consultar disponibilidad.

---

## Cómo funciona

1. Cada navegador (sin necesidad de login) genera un `session_id` único
   guardado en `localStorage` (`mm_session_id`), que identifica su carrito
   frente a los demás.

2. **Al agregar un producto al carrito** o **cambiar su cantidad**, el
   frontend llama a `POST /api/reservas`, que:
   - Verifica que la cantidad pedida quepa dentro del stock real menos lo
     ya reservado por OTRAS sesiones.
   - Si no alcanza, responde con error y el frontend muestra un toast
     (ej. "Solo quedan 2 unidades disponibles").
   - Si alcanza, crea o actualiza la reserva y reinicia su expiración a
     **15 minutos** desde ese momento.

3. **Al quitar un producto del carrito**, se llama a
   `DELETE /api/reservas`, liberando esa reserva de inmediato (no hay que
   esperar los 15 minutos).

4. **Al cargar el catálogo de la tienda** (`GET /api/productos/tienda`),
   el stock que se muestra ya está ajustado: `stock_real - reservado por
   otras sesiones`. Así, si alguien más tiene reservadas las últimas
   unidades, otros clientes ven menos disponibilidad (o "sin stock") en
   tiempo real.

5. **Al confirmar la compra exitosamente**, se llama a
   `DELETE /api/reservas/sesion` para liberar todas las reservas de esa
   sesión (el stock real ya se descontó de verdad en `pedidos.controller.js`,
   así que la reserva temporal ya no hace falta).

6. **Limpieza automática de reservas vencidas:**
   - Cada vez que se reserva, se libera, o se consulta disponibilidad, el
     backend borra primero cualquier reserva con `expira_en < now()`.
   - Además, `app.js` corre un `setInterval` cada 60 segundos que borra
     reservas vencidas, como red de seguridad para carritos abandonados
     sin que el cliente vuelva a interactuar con la página.

## Notas importantes

- El panel **admin** sigue usando `GET /api/productos` (sin ajuste de
  reservas) porque el admin necesita ver el stock real total del
  inventario, no el "disponible para la tienda".
- Solo la tienda pública usa el nuevo endpoint `GET /api/productos/tienda`.
- No se requiere login del cliente para que la reserva funcione — el
  `session_id` es anónimo y persiste mientras no se borre el localStorage
  del navegador.
