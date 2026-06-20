const request = require('supertest');
const express = require('express');
const cors = require('cors');

// ────────────────────────────────────────────────────────────────
// Mock DB
// ────────────────────────────────────────────────────────────────
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

// ────────────────────────────────────────────────────────────────
// Mock FS
// ────────────────────────────────────────────────────────────────
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  unlinkSync: jest.fn(),
  mkdirSync: jest.fn()
}));

// ────────────────────────────────────────────────────────────────
// Variable para controlar archivos mock
// ────────────────────────────────────────────────────────────────
let mockFiles = [
  {
    filename: 'test.jpg',
    originalname: 'test.jpg',
    mimetype: 'image/jpeg'
  }
];

// ────────────────────────────────────────────────────────────────
// Mock Multer
// ────────────────────────────────────────────────────────────────
jest.mock('../../config/upload', () => {
  return {
    array: () => (req, res, next) => {
      req.files = mockFiles;
      next();
    }
  };
});

const pool = require('../../config/db');
const fs = require('fs');

// ────────────────────────────────────────────────────────────────
// Express App
// ────────────────────────────────────────────────────────────────
const app = express();

app.use(cors());
app.use(express.json());

app.use(
  '/api/imagenes',
  require('../../routes/Productos/imagenes.routes')
);

// ────────────────────────────────────────────────────────────────
// Limpiar mocks
// ────────────────────────────────────────────────────────────────
beforeEach(() => {

  jest.clearAllMocks();

  mockFiles = [
    {
      filename: 'test.jpg',
      originalname: 'test.jpg',
      mimetype: 'image/jpeg'
    }
  ];

});

// ════════════════════════════════════════════════════════════════
// TESTS
// ════════════════════════════════════════════════════════════════

describe('Pruebas de Integración de la API Imágenes', () => {

  // ──────────────────────────────────────────────────────────────
  // GET
  // ──────────────────────────────────────────────────────────────
  describe('GET /api/imagenes/:id_producto', () => {

    test('Debería retornar las imágenes del producto', async () => {

      const imagenesMock = [
        {
          id_imagen: 1,
          id_producto: 1,
          url_imagen: '/uploads/productos/img1.jpg'
        }
      ];

      pool.query.mockResolvedValueOnce({
        rows: imagenesMock
      });

      const response = await request(app)
        .get('/api/imagenes/1');

      expect(response.statusCode).toBe(200);

      expect(response.body).toEqual(imagenesMock);

    });

    test('Debería retornar 500 si falla getByProducto', async () => {

      pool.query.mockRejectedValueOnce(
        new Error('DB error getByProducto')
      );

      const response = await request(app)
        .get('/api/imagenes/1');

      expect(response.statusCode).toBe(500);

      expect(response.body).toHaveProperty(
        'error',
        'DB error getByProducto'
      );

    });

  });

  // ──────────────────────────────────────────────────────────────
  // POST
  // ──────────────────────────────────────────────────────────────
  describe('POST /api/imagenes/:id_producto', () => {

    test('Debería retornar 400 si no se envían imágenes', async () => {

      mockFiles = [];

      const response = await request(app)
        .post('/api/imagenes/1');

      expect(response.statusCode).toBe(400);

      expect(response.body).toHaveProperty(
        'error',
        'No se enviaron imágenes.'
      );

    });

    test('Debería subir imágenes correctamente', async () => {

      pool.query
        .mockResolvedValueOnce({
          rows: [{ count: '0' }]
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id_imagen: 1,
              nombre_archivo: 'test.jpg',
              es_principal: 1
            }
          ]
        });

      const response = await request(app)
        .post('/api/imagenes/1');

      expect(response.statusCode).toBe(201);

      expect(response.body.length).toBeGreaterThan(0);

      expect(response.body[0]).toHaveProperty(
        'es_principal',
        1
      );

    });

    test('Debería crear una imagen NO principal cuando ya existen imágenes', async () => {

      pool.query
        .mockResolvedValueOnce({
          rows: [{ count: '1' }]
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id_imagen: 2,
              es_principal: 0
            }
          ]
        });

      const response = await request(app)
        .post('/api/imagenes/1');

      expect(response.statusCode).toBe(201);

      expect(response.body[0]).toHaveProperty(
        'es_principal',
        0
      );

    });

    test('Debería retornar 500 si falla upload', async () => {

      pool.query.mockRejectedValueOnce(
        new Error('DB error upload')
      );

      const response = await request(app)
        .post('/api/imagenes/1');

      expect(response.statusCode).toBe(500);

      expect(response.body).toHaveProperty(
        'error',
        'DB error upload'
      );

    });

  });

  // ──────────────────────────────────────────────────────────────
  // PUT
  // ──────────────────────────────────────────────────────────────
  describe('PUT /api/imagenes/principal/:id_imagen', () => {

    test('Debería actualizar imagen principal correctamente', async () => {

      pool.query
        .mockResolvedValueOnce({
          rows: [{ id_producto: 1 }]
        })
        .mockResolvedValueOnce({
          rows: []
        })
        .mockResolvedValueOnce({
          rows: []
        });

      const response = await request(app)
        .put('/api/imagenes/principal/1');

      expect(response.statusCode).toBe(200);

      expect(response.body).toHaveProperty(
        'mensaje',
        'Imagen principal actualizada.'
      );

    });

    test('Debería retornar 404 si la imagen no existe', async () => {

      pool.query.mockResolvedValueOnce({
        rows: []
      });

      const response = await request(app)
        .put('/api/imagenes/principal/999');

      expect(response.statusCode).toBe(404);

      expect(response.body).toHaveProperty(
        'error',
        'Imagen no encontrada.'
      );

    });

    test('Debería retornar 500 si falla setPrincipal', async () => {

      pool.query.mockRejectedValueOnce(
        new Error('DB error setPrincipal')
      );

      const response = await request(app)
        .put('/api/imagenes/principal/1');

      expect(response.statusCode).toBe(500);

      expect(response.body).toHaveProperty(
        'error',
        'DB error setPrincipal'
      );

    });

  });

  // ──────────────────────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────────────────────
  describe('DELETE /api/imagenes/:id_imagen', () => {

    test('Debería eliminar imagen correctamente', async () => {

      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id_imagen: 1,
            nombre_archivo: 'test.jpg'
          }
        ]
      });

      fs.existsSync.mockReturnValueOnce(true);

      const response = await request(app)
        .delete('/api/imagenes/1');

      expect(response.statusCode).toBe(200);

      expect(response.body).toHaveProperty(
        'mensaje',
        'Imagen eliminada.'
      );

      expect(fs.unlinkSync).toHaveBeenCalled();

    });

    test('Debería eliminar imagen aunque el archivo físico no exista', async () => {

      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id_imagen: 1,
            nombre_archivo: 'test.jpg'
          }
        ]
      });

      fs.existsSync.mockReturnValueOnce(false);

      const response = await request(app)
        .delete('/api/imagenes/1');

      expect(response.statusCode).toBe(200);

      expect(response.body).toHaveProperty(
        'mensaje',
        'Imagen eliminada.'
      );

      expect(fs.unlinkSync).not.toHaveBeenCalled();

    });

    test('Debería eliminar imagen cuando nombre_archivo es null', async () => {

      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id_imagen: 1,
            nombre_archivo: null
          }
        ]
      });

      fs.existsSync.mockReturnValueOnce(false);

      const response = await request(app)
        .delete('/api/imagenes/1');

      expect(response.statusCode).toBe(200);

      expect(response.body).toHaveProperty(
        'mensaje',
        'Imagen eliminada.'
      );

      expect(fs.unlinkSync).not.toHaveBeenCalled();

    });

    test('Debería retornar 404 si la imagen no existe', async () => {

      pool.query.mockResolvedValueOnce({
        rows: []
      });

      const response = await request(app)
        .delete('/api/imagenes/999');

      expect(response.statusCode).toBe(404);

      expect(response.body).toHaveProperty(
        'error',
        'Imagen no encontrada.'
      );

    });

    test('Debería retornar 500 si falla remove', async () => {

      pool.query.mockRejectedValueOnce(
        new Error('DB error remove')
      );

      const response = await request(app)
        .delete('/api/imagenes/1');

      expect(response.statusCode).toBe(500);

      expect(response.body).toHaveProperty(
        'error',
        'DB error remove'
      );
    });
  });
});