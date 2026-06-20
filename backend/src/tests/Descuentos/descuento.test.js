const request  = require('supertest');
const express  = require('express');
const cors     = require('cors');

jest.mock('../../config/db', () => ({ query: jest.fn() }));
const pool = require('../../config/db');

// Importamos validar directamente para cubrir la rama esEdicion=false por default
const { validar } = require('../../controllers/Descuentos/descuentos.controller');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/descuentos', require('../../routes/descuentos/descuentos.routes'));

beforeEach(() => { jest.clearAllMocks(); });

describe('Pruebas de Integración de la API Descuentos', () => {

  // ──────────────────────────────────────────────────────────────
  // VALIDAR — rama esEdicion = false (default)
  // Cubre la línea 3 / % Branch al 100
  // ──────────────────────────────────────────────────────────────
  describe('validar() — rama esEdicion default (false)', () => {

    test('Debería marcar código obligatorio cuando se llama sin esEdicion', () => {
      const errores = validar({
        codigo: '', descripcion: 'Desc', valor_descuento: 10,
        limite_usos: 5, fecha_inicio: '2025-01-01', fecha_cierre: '2099-12-31'
      });
      expect(errores).toHaveProperty('codigo', 'El código es obligatorio.');
    });

    test('Debería marcar código muy largo cuando se llama sin esEdicion', () => {
      const errores = validar({
        codigo: 'A'.repeat(51), descripcion: 'Desc', valor_descuento: 10,
        limite_usos: 5, fecha_inicio: '2025-01-01', fecha_cierre: '2099-12-31'
      });
      expect(errores).toHaveProperty('codigo', 'El código no puede superar 50 caracteres.');
    });

    test('Debería retornar sin error de código cuando es válido y se llama sin esEdicion', () => {
      const errores = validar({
        codigo: 'VALID10', descripcion: 'Desc', valor_descuento: 10,
        limite_usos: 5, fecha_inicio: '2025-01-01', fecha_cierre: '2099-12-31'
      });
      expect(errores).not.toHaveProperty('codigo');
    });

    test('Debería retornar error de valor_descuento null cuando se llama sin esEdicion', () => {
      const errores = validar({
        codigo: 'CODE1', descripcion: 'Desc', valor_descuento: null,
        limite_usos: 5, fecha_inicio: '2025-01-01', fecha_cierre: '2099-12-31'
      });
      expect(errores).toHaveProperty('valor_descuento', 'El valor del descuento es obligatorio.');
    });

    test('Debería retornar error de limite_usos null cuando se llama sin esEdicion', () => {
      const errores = validar({
        codigo: 'CODE1', descripcion: 'Desc', valor_descuento: 10,
        limite_usos: null, fecha_inicio: '2025-01-01', fecha_cierre: '2099-12-31'
      });
      expect(errores).toHaveProperty('limite_usos', 'El límite de personas es obligatorio.');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // GET ALL
  // ──────────────────────────────────────────────────────────────
  describe('GET /api/descuentos', () => {

    test('Debería retornar todos los descuentos', async () => {
      const descuentosMock = [
        { id_descuento: 1, codigo: 'VERANO25', descripcion: 'Descuento de verano', valor_descuento: 25, limite_usos: 100, usos_actuales: 10, fecha_inicio: '2025-01-01', fecha_cierre: '2099-12-31', estado: 'activo' },
        { id_descuento: 2, codigo: 'INVIERNO10', descripcion: 'Descuento de invierno', valor_descuento: 10, limite_usos: 50, usos_actuales: 5, fecha_inicio: '2025-06-01', fecha_cierre: '2099-12-31', estado: 'activo' }
      ];

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: descuentosMock });

      const response = await request(app).get('/api/descuentos');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(descuentosMock);
    });

    test('Debería retornar 500 si falla la base de datos en getAll', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error getAll'));

      const response = await request(app).get('/api/descuentos');

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error getAll');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // GET BY ID
  // ──────────────────────────────────────────────────────────────
  describe('GET /api/descuentos/:id', () => {

    test('Debería retornar un descuento por ID', async () => {
      const descuentoMock = { id_descuento: 1, codigo: 'VERANO25', descripcion: 'Descuento de verano', valor_descuento: 25, limite_usos: 100, usos_actuales: 10, fecha_inicio: '2025-01-01', fecha_cierre: '2099-12-31', estado: 'activo' };

      pool.query.mockResolvedValueOnce({ rows: [descuentoMock] });

      const response = await request(app).get('/api/descuentos/1');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(descuentoMock);
    });

    test('Debería retornar 404 si no existe el descuento', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/descuentos/999');

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error', 'Descuento no encontrado.');
    });

    test('Debería retornar 500 si falla la base de datos en getById', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error getById'));

      const response = await request(app).get('/api/descuentos/1');

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error getById');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // POST — validaciones
  // ──────────────────────────────────────────────────────────────
  describe('POST /api/descuentos — validaciones', () => {

    const baseValido = {
      codigo: 'PROMO50', descripcion: 'Promo válida',
      valor_descuento: 50, limite_usos: 100,
      fecha_inicio: '2025-01-01', fecha_cierre: '2099-12-31'
    };

    test('Debería ejecutar validación sin pasar esEdicion (default false)', async () => {
      const response = await request(app)
        .post('/api/descuentos')
        .send({ codigo: '', descripcion: '', valor_descuento: '', limite_usos: '', fecha_inicio: '', fecha_cierre: '' });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('errores');
    });

    test('Debería retornar 400 si el código está vacío', async () => {
      const response = await request(app).post('/api/descuentos').send({ ...baseValido, codigo: '   ' });
      expect(response.statusCode).toBe(400);
      expect(response.body.errores).toHaveProperty('codigo', 'El código es obligatorio.');
    });

    test('Debería retornar 400 si el código supera 50 caracteres', async () => {
      const response = await request(app).post('/api/descuentos').send({ ...baseValido, codigo: 'A'.repeat(51) });
      expect(response.statusCode).toBe(400);
      expect(response.body.errores).toHaveProperty('codigo', 'El código no puede superar 50 caracteres.');
    });

    test('Debería retornar 400 si la descripción está vacía', async () => {
      const response = await request(app).post('/api/descuentos').send({ ...baseValido, descripcion: '   ' });
      expect(response.statusCode).toBe(400);
      expect(response.body.errores).toHaveProperty('descripcion', 'La descripción es obligatoria.');
    });

    test('Debería retornar 400 si la descripción supera 255 caracteres', async () => {
      const response = await request(app).post('/api/descuentos').send({ ...baseValido, descripcion: 'B'.repeat(256) });
      expect(response.statusCode).toBe(400);
      expect(response.body.errores).toHaveProperty('descripcion', 'La descripción no puede superar 255 caracteres.');
    });

    test('Debería retornar 400 si el valor del descuento está vacío', async () => {
      const response = await request(app).post('/api/descuentos').send({ ...baseValido, valor_descuento: '' });
      expect(response.statusCode).toBe(400);
      expect(response.body.errores).toHaveProperty('valor_descuento', 'El valor del descuento es obligatorio.');
    });

    test('Debería retornar 400 si el valor del descuento es null', async () => {
      const response = await request(app).post('/api/descuentos').send({ ...baseValido, valor_descuento: null });
      expect(response.statusCode).toBe(400);
      expect(response.body.errores).toHaveProperty('valor_descuento', 'El valor del descuento es obligatorio.');
    });

    test('Debería retornar 400 si el valor del descuento es menor a 1', async () => {
      const response = await request(app).post('/api/descuentos').send({ ...baseValido, valor_descuento: 0 });
      expect(response.statusCode).toBe(400);
      expect(response.body.errores).toHaveProperty('valor_descuento', 'El valor debe estar entre 1 y 100.');
    });

    test('Debería retornar 400 si el valor del descuento es mayor a 100', async () => {
      const response = await request(app).post('/api/descuentos').send({ ...baseValido, valor_descuento: 101 });
      expect(response.statusCode).toBe(400);
      expect(response.body.errores).toHaveProperty('valor_descuento', 'El valor debe estar entre 1 y 100.');
    });

    test('Debería retornar 400 si el límite de usos está vacío', async () => {
      const response = await request(app).post('/api/descuentos').send({ ...baseValido, limite_usos: '' });
      expect(response.statusCode).toBe(400);
      expect(response.body.errores).toHaveProperty('limite_usos', 'El límite de personas es obligatorio.');
    });

    test('Debería retornar 400 si el límite de usos es null', async () => {
      const response = await request(app).post('/api/descuentos').send({ ...baseValido, limite_usos: null });
      expect(response.statusCode).toBe(400);
      expect(response.body.errores).toHaveProperty('limite_usos', 'El límite de personas es obligatorio.');
    });

    test('Debería retornar 400 si el límite de usos es 0 o negativo', async () => {
      const response = await request(app).post('/api/descuentos').send({ ...baseValido, limite_usos: 0 });
      expect(response.statusCode).toBe(400);
      expect(response.body.errores).toHaveProperty('limite_usos', 'El límite de personas debe ser un número entero positivo.');
    });

    test('Debería retornar 400 si la fecha de inicio está vacía', async () => {
      const response = await request(app).post('/api/descuentos').send({ ...baseValido, fecha_inicio: '' });
      expect(response.statusCode).toBe(400);
      expect(response.body.errores).toHaveProperty('fecha_inicio', 'La fecha de inicio es obligatoria.');
    });

    test('Debería retornar 400 si la fecha de cierre está vacía', async () => {
      const response = await request(app).post('/api/descuentos').send({ ...baseValido, fecha_cierre: '' });
      expect(response.statusCode).toBe(400);
      expect(response.body.errores).toHaveProperty('fecha_cierre', 'La fecha de cierre es obligatoria.');
    });

    test('Debería retornar 400 si la fecha de cierre es anterior a la de inicio', async () => {
      const response = await request(app).post('/api/descuentos').send({ ...baseValido, fecha_inicio: '2025-06-01', fecha_cierre: '2025-01-01' });
      expect(response.statusCode).toBe(400);
      expect(response.body.errores).toHaveProperty('fecha_cierre', 'La fecha de cierre no puede ser anterior a la de inicio.');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // POST — flujos principales
  // ──────────────────────────────────────────────────────────────
  describe('POST /api/descuentos', () => {

    const nuevoDescuento = {
      codigo: 'PROMO50', descripcion: 'Promo válida',
      valor_descuento: 50, limite_usos: 100,
      fecha_inicio: '2025-01-01', fecha_cierre: '2099-12-31'
    };

    test('Debería crear un descuento correctamente', async () => {
      const descuentoCreado = { id_descuento: 3, ...nuevoDescuento, usos_actuales: 0, estado: 'activo' };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [descuentoCreado] });

      const response = await request(app).post('/api/descuentos').send(nuevoDescuento).set('Accept', 'application/json');

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id_descuento');
      expect(response.body.codigo).toBe('PROMO50');
    });

    test('Debería retornar 400 si el código ya está registrado', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id_descuento: 1 }] });

      const response = await request(app).post('/api/descuentos').send(nuevoDescuento);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'El código "PROMO50" ya está registrado.');
    });

    test('Debería retornar 400 si ocurre un error de unicidad (23505) en create', async () => {
      const uniqueError = new Error('unique violation');
      uniqueError.code = '23505';

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockRejectedValueOnce(uniqueError);

      const response = await request(app).post('/api/descuentos').send(nuevoDescuento);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'El código ya está registrado.');
    });

    test('Debería retornar 500 si falla la base de datos en create', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockRejectedValueOnce(new Error('DB error create'));

      const response = await request(app).post('/api/descuentos').send(nuevoDescuento);

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error create');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // PUT
  // ──────────────────────────────────────────────────────────────
  describe('PUT /api/descuentos/:id', () => {

    test('Debería actualizar correctamente el descuento', async () => {
      const datos = { descripcion: 'Promo actualizada', valor_descuento: 30, limite_usos: 200, fecha_inicio: '2025-01-01', fecha_cierre: '2099-12-31', estado: 'activo' };
      pool.query.mockResolvedValueOnce({ rows: [{ id_descuento: 1, codigo: 'VERANO25', ...datos }] });

      const response = await request(app).put('/api/descuentos/1').send(datos);

      expect(response.statusCode).toBe(200);
      expect(response.body.descripcion).toBe('Promo actualizada');
    });

    test('Debería forzar estado vencido si la fecha de cierre ya pasó', async () => {
      const datos = { descripcion: 'Promo vencida', valor_descuento: 30, limite_usos: 200, fecha_inicio: '2019-01-01', fecha_cierre: '2020-01-01', estado: 'activo' };
      pool.query.mockResolvedValueOnce({ rows: [{ id_descuento: 1, codigo: 'VERANO25', ...datos, estado: 'vencido' }] });

      const response = await request(app).put('/api/descuentos/1').send(datos);

      expect(response.statusCode).toBe(200);
      expect(response.body.estado).toBe('vencido');
    });

    test('Debería usar activo por defecto si no se envía estado en PUT', async () => {
      const datos = { descripcion: 'Sin estado', valor_descuento: 20, limite_usos: 50, fecha_inicio: '2025-01-01', fecha_cierre: '2099-12-31' };
      pool.query.mockResolvedValueOnce({ rows: [{ id_descuento: 1, codigo: 'VERANO25', ...datos, estado: 'activo' }] });

      const response = await request(app).put('/api/descuentos/1').send(datos);

      expect(response.statusCode).toBe(200);
      expect(response.body.estado).toBe('activo');
    });

    test('Debería retornar 400 si los datos enviados en PUT son inválidos', async () => {
      const response = await request(app).put('/api/descuentos/1').send({ descripcion: '', valor_descuento: '', limite_usos: '', fecha_inicio: '', fecha_cierre: '' });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('errores');
    });

    test('Debería retornar 404 si el descuento a actualizar no existe', async () => {
      const datos = { descripcion: 'Promo actualizada', valor_descuento: 30, limite_usos: 200, fecha_inicio: '2025-01-01', fecha_cierre: '2099-12-31', estado: 'activo' };
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).put('/api/descuentos/999').send(datos);

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error', 'Descuento no encontrado.');
    });

    test('Debería retornar 500 si falla la base de datos en update', async () => {
      const datos = { descripcion: 'Promo actualizada', valor_descuento: 30, limite_usos: 200, fecha_inicio: '2025-01-01', fecha_cierre: '2099-12-31', estado: 'activo' };
      pool.query.mockRejectedValueOnce(new Error('DB error update'));

      const response = await request(app).put('/api/descuentos/1').send(datos);

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error update');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────────────────────
  describe('DELETE /api/descuentos/:id', () => {

    test('Debería eliminar el descuento correctamente', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id_descuento: 1, codigo: 'VERANO25' }] });

      const response = await request(app).delete('/api/descuentos/1');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('mensaje', 'Descuento eliminado correctamente.');
    });

    test('Debería retornar 404 si el descuento a eliminar no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).delete('/api/descuentos/999');

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error', 'Descuento no encontrado.');
    });

    test('Debería retornar 500 si falla la base de datos en delete', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error delete'));

      const response = await request(app).delete('/api/descuentos/1');

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error delete');
    });

  });

});