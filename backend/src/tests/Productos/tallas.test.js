const request = require('supertest');
const express = require('express');
const cors = require('cors');

// ────────────────────────────────────────────────────────────────
// Mock de la base de datos
// ────────────────────────────────────────────────────────────────
jest.mock('../../config/db', () => {
  return {
    query: jest.fn()
  };
});

const pool = require('../../config/db');

// ────────────────────────────────────────────────────────────────
// Configuración de Express
// ────────────────────────────────────────────────────────────────
const app = express();

app.use(cors());
app.use(express.json());

app.use(
  '/api/tallas',
  require('../../routes/Productos/tallas.routes')
);

// ────────────────────────────────────────────────────────────────
// Limpiar mocks antes de cada test
// ────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════
// PRUEBAS DE INTEGRACIÓN
// ════════════════════════════════════════════════════════════════

describe('Pruebas de Integración de la API Tallas', () => {

  // ──────────────────────────────────────────────────────────────
  // GET ALL
  // ──────────────────────────────────────────────────────────────
  describe('GET /api/tallas', () => {

    test('Debería retornar todas las tallas', async () => {
      const tallasMock = [
        { id_talla: 1, nombre_talla: 'S' },
        { id_talla: 2, nombre_talla: 'M' }
      ];

      pool.query.mockResolvedValueOnce({ rows: tallasMock });

      const response = await request(app).get('/api/tallas');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(tallasMock);
    });

    test('Debería retornar 500 si falla la base de datos en getAll', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error getAll'));

      const response = await request(app).get('/api/tallas');

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error getAll');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // POST
  // ──────────────────────────────────────────────────────────────
  describe('POST /api/tallas', () => {

    test('Debería retornar 400 si nombre_talla está vacío', async () => {
      const response = await request(app)
        .post('/api/tallas')
        .send({ nombre_talla: '   ' });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        'El nombre de la talla es obligatorio.'
      );
    });

    test('Debería crear una talla correctamente', async () => {
      const nuevaTalla = { nombre_talla: 'XL' };
      const tallaCreada = { id_talla: 3, nombre_talla: 'XL' };

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [tallaCreada] });

      const response = await request(app)
        .post('/api/tallas')
        .send(nuevaTalla);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id_talla');
      expect(response.body.nombre_talla).toBe('XL');
    });

    test('Debería retornar error si la talla ya existe', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id_talla: 1 }]
      });

      const response = await request(app)
        .post('/api/tallas')
        .send({ nombre_talla: 'M' });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        'Ya existe una talla con ese nombre.'
      );
    });

    test('Debería retornar 500 si falla la base de datos en create', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error create'));

      const response = await request(app)
        .post('/api/tallas')
        .send({ nombre_talla: 'L' });

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error create');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // PUT
  // ──────────────────────────────────────────────────────────────
  describe('PUT /api/tallas/:id', () => {

    test('Debería retornar 400 si nombre_talla está vacío', async () => {
      const response = await request(app)
        .put('/api/tallas/1')
        .send({ nombre_talla: '   ' });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        'El nombre es obligatorio.'
      );
    });

    test('Debería actualizar correctamente la talla', async () => {
      const tallaActualizada = {
        id_talla: 1,
        nombre_talla: 'XXL'
      };

      pool.query.mockResolvedValueOnce({
        rows: [tallaActualizada]
      });

      const response = await request(app)
        .put('/api/tallas/1')
        .send({ nombre_talla: 'XXL' });

      expect(response.statusCode).toBe(200);
      expect(response.body.nombre_talla).toBe('XXL');
    });

    test('Debería retornar 404 si la talla no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/api/tallas/999')
        .send({ nombre_talla: 'XXL' });

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty(
        'error',
        'Talla no encontrada.'
      );
    });

    test('Debería retornar 500 si falla la base de datos en update', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error update'));

      const response = await request(app)
        .put('/api/tallas/1')
        .send({ nombre_talla: 'XL' });

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error update');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────────────────────
  describe('DELETE /api/tallas/:id', () => {

    test('Debería eliminar la talla correctamente', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id_talla: 1, nombre_talla: 'M' }]
      });

      const response = await request(app)
        .delete('/api/tallas/1');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty(
        'mensaje',
        'Talla eliminada.'
      );
    });

    test('Debería retornar 404 si la talla no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .delete('/api/tallas/999');

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty(
        'error',
        'Talla no encontrada.'
      );
    });

    test('Debería retornar 500 si falla la base de datos en delete', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error delete'));

      const response = await request(app)
        .delete('/api/tallas/1');

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error delete');
    });

  });

});