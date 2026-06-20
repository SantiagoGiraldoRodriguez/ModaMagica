const request = require('supertest');
const express = require('express');
const cors = require('cors');

// ────────────────────────────────────────────────────────────────
// Mock DB
// ────────────────────────────────────────────────────────────────
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

const pool = require('../../config/db');

// ────────────────────────────────────────────────────────────────
// Express App
// ────────────────────────────────────────────────────────────────
const app = express();

app.use(cors());
app.use(express.json());

app.use(
  '/api/colores',
  require('../../routes/Productos/colores.routes')
);

// ────────────────────────────────────────────────────────────────
// Limpiar mocks
// ────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════
// TESTS
// ════════════════════════════════════════════════════════════════

describe('Pruebas de Integración de la API Colores', () => {

  // ──────────────────────────────────────────────────────────────
  // GET ALL
  // ──────────────────────────────────────────────────────────────
  describe('GET /api/colores', () => {

    test('Debería retornar todos los colores', async () => {

      const coloresMock = [
        {
          id_color: 1,
          nombre_color: 'Azul',
          hex_code: '#0000FF'
        },
        {
          id_color: 2,
          nombre_color: 'Rojo',
          hex_code: '#FF0000'
        }
      ];

      pool.query.mockResolvedValueOnce({
        rows: coloresMock
      });

      const response = await request(app)
        .get('/api/colores');

      expect(response.statusCode).toBe(200);

      expect(response.body).toEqual(coloresMock);

    });

    test('Debería retornar 500 si falla getAll', async () => {

      pool.query.mockRejectedValueOnce(
        new Error('DB error getAll')
      );

      const response = await request(app)
        .get('/api/colores');

      expect(response.statusCode).toBe(500);

      expect(response.body).toHaveProperty(
        'error',
        'DB error getAll'
      );

    });

  });

  // ──────────────────────────────────────────────────────────────
  // POST
  // ──────────────────────────────────────────────────────────────
  describe('POST /api/colores', () => {

    test('Debería crear un color correctamente', async () => {

      const colorCreado = {
        id_color: 1,
        nombre_color: 'Negro',
        hex_code: '#000000'
      };

      pool.query
        .mockResolvedValueOnce({
          rows: []
        })
        .mockResolvedValueOnce({
          rows: [colorCreado]
        });

      const response = await request(app)
        .post('/api/colores')
        .send({
          nombre_color: 'Negro',
          hex_code: '#000000'
        });

      expect(response.statusCode).toBe(201);

      expect(response.body).toHaveProperty(
        'nombre_color',
        'Negro'
      );

    });

    test('Debería retornar 400 si nombre_color está vacío', async () => {

      const response = await request(app)
        .post('/api/colores')
        .send({
          nombre_color: '   ',
          hex_code: '#FFFFFF'
        });

      expect(response.statusCode).toBe(400);

      expect(response.body).toHaveProperty(
        'error',
        'El nombre del color es obligatorio.'
      );

    });

    test('Debería retornar 400 si hex_code es inválido', async () => {

      const response = await request(app)
        .post('/api/colores')
        .send({
          nombre_color: 'Rojo',
          hex_code: 'rojo'
        });

      expect(response.statusCode).toBe(400);

      expect(response.body).toHaveProperty(
        'error',
        'El código hex no es válido. Ej: #FF5733'
      );

    });

    test('Debería retornar 400 si el color ya existe', async () => {

      pool.query.mockResolvedValueOnce({
        rows: [{ id_color: 1 }]
      });

      const response = await request(app)
        .post('/api/colores')
        .send({
          nombre_color: 'Rojo',
          hex_code: '#FF0000'
        });

      expect(response.statusCode).toBe(400);

      expect(response.body).toHaveProperty(
        'error',
        'Ya existe un color con ese nombre.'
      );

    });

    test('Debería retornar 500 si falla create', async () => {

      pool.query.mockRejectedValueOnce(
        new Error('DB error create')
      );

      const response = await request(app)
        .post('/api/colores')
        .send({
          nombre_color: 'Verde',
          hex_code: '#00FF00'
        });

      expect(response.statusCode).toBe(500);

      expect(response.body).toHaveProperty(
        'error',
        'DB error create'
      );

    });

  });

  // ──────────────────────────────────────────────────────────────
  // PUT
  // ──────────────────────────────────────────────────────────────
  describe('PUT /api/colores/:id', () => {

    test('Debería actualizar correctamente el color', async () => {

      const colorActualizado = {
        id_color: 1,
        nombre_color: 'Blanco',
        hex_code: '#FFFFFF'
      };

      pool.query.mockResolvedValueOnce({
        rows: [colorActualizado]
      });

      const response = await request(app)
        .put('/api/colores/1')
        .send({
          nombre_color: 'Blanco',
          hex_code: '#FFFFFF'
        });

      expect(response.statusCode).toBe(200);

      expect(response.body).toHaveProperty(
        'nombre_color',
        'Blanco'
      );

    });

    test('Debería permitir actualizar solo nombre_color', async () => {

      const colorActualizado = {
        id_color: 1,
        nombre_color: 'Gris',
        hex_code: '#000000'
      };

      pool.query.mockResolvedValueOnce({
        rows: [colorActualizado]
      });

      const response = await request(app)
        .put('/api/colores/1')
        .send({
          nombre_color: 'Gris'
        });

      expect(response.statusCode).toBe(200);

    });

    test('Debería permitir actualizar solo hex_code', async () => {

      const colorActualizado = {
        id_color: 1,
        nombre_color: 'Negro',
        hex_code: '#111111'
      };

      pool.query.mockResolvedValueOnce({
        rows: [colorActualizado]
      });

      const response = await request(app)
        .put('/api/colores/1')
        .send({
          hex_code: '#111111'
        });

      expect(response.statusCode).toBe(200);

    });

    test('Debería retornar 404 si el color no existe', async () => {

      pool.query.mockResolvedValueOnce({
        rows: []
      });

      const response = await request(app)
        .put('/api/colores/999')
        .send({
          nombre_color: 'Morado'
        });

      expect(response.statusCode).toBe(404);

      expect(response.body).toHaveProperty(
        'error',
        'Color no encontrado.'
      );

    });

    test('Debería retornar 500 si falla update', async () => {

      pool.query.mockRejectedValueOnce(
        new Error('DB error update')
      );

      const response = await request(app)
        .put('/api/colores/1')
        .send({
          nombre_color: 'Gris'
        });

      expect(response.statusCode).toBe(500);

      expect(response.body).toHaveProperty(
        'error',
        'DB error update'
      );

    });

  });

  // ──────────────────────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────────────────────
  describe('DELETE /api/colores/:id', () => {

    test('Debería eliminar correctamente el color', async () => {

      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id_color: 1,
            nombre_color: 'Rojo'
          }
        ]
      });

      const response = await request(app)
        .delete('/api/colores/1');

      expect(response.statusCode).toBe(200);

      expect(response.body).toHaveProperty(
        'mensaje',
        'Color eliminado.'
      );

    });

    test('Debería retornar 404 si el color no existe', async () => {

      pool.query.mockResolvedValueOnce({
        rows: []
      });

      const response = await request(app)
        .delete('/api/colores/999');

      expect(response.statusCode).toBe(404);

      expect(response.body).toHaveProperty(
        'error',
        'Color no encontrado.'
      );

    });

    test('Debería retornar 500 si falla remove', async () => {

      pool.query.mockRejectedValueOnce(
        new Error('DB error remove')
      );

      const response = await request(app)
        .delete('/api/colores/1');

      expect(response.statusCode).toBe(500);

      expect(response.body).toHaveProperty(
        'error',
        'DB error remove'
      );

    });

  });

});