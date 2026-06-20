const request = require('supertest');
const express = require('express');
const cors = require('cors');

// ═════════════════════════════════════════════
// MOCK DB
// ═════════════════════════════════════════════
jest.mock('../../config/db', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

const pool = require('../../config/db');

const productosController = require(
  '../../controllers/Productos/productos.controller'
);

// ═════════════════════════════════════════════
// APP EXPRESS TEST
// ═════════════════════════════════════════════
const app = express();

app.use(cors());
app.use(express.json());

app.get(
  '/api/productos',
  productosController.getAll
);

app.get(
  '/api/productos/:id',
  productosController.getById
);

app.post(
  '/api/productos',
  productosController.create
);

app.put(
  '/api/productos/:id',
  productosController.update
);

app.delete(
  '/api/productos/:id',
  productosController.remove
);

let mockClient;

// ═════════════════════════════════════════════
// HOOKS
// ═════════════════════════════════════════════
beforeEach(() => {

  jest.clearAllMocks();

  mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };

  pool.connect.mockResolvedValue(
    mockClient
  );

  jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});
});

afterEach(() => {

  console.error.mockRestore();
});

// ═════════════════════════════════════════════
// TESTS
// ═════════════════════════════════════════════
describe(
  'Pruebas del Controlador de Productos',
  () => {

    // ═════════════════════════════════════════
    // GET ALL
    // ═════════════════════════════════════════
    describe(
      'GET /api/productos',
      () => {

        test(
          'Debería retornar todos los productos',
          async () => {

            pool.query
              .mockResolvedValueOnce({
                rows: [
                  {
                    id_producto: 1,
                    nombre_producto: 'Camisa'
                  }
                ]
              })
              .mockResolvedValueOnce({
                rows: [
                  {
                    id_producto_color: 1,
                    id_color: 1,
                    nombre_color: 'Azul'
                  }
                ]
              })
              .mockResolvedValueOnce({
                rows: [
                  {
                    id_talla: 1,
                    nombre_talla: 'S',
                    stock_actual: 5
                  }
                ]
              })
              .mockResolvedValueOnce({
                rows: [
                  {
                    id_categoria: 1,
                    nombre_categoria: 'Ropa'
                  }
                ]
              });

            const response = await request(app)
              .get('/api/productos');

            expect(response.statusCode)
              .toBe(200);

            expect(Array.isArray(
              response.body
            )).toBe(true);
          }
        );

        test(
          'Debería manejar error getAll',
          async () => {

            pool.query.mockRejectedValueOnce(
              new Error('Crash GetAll')
            );

            const response = await request(app)
              .get('/api/productos');

            expect(response.statusCode)
              .toBe(500);
          }
        );

        test(
          'Debería manejar errores internos',
          async () => {

            pool.query
              .mockResolvedValueOnce({
                rows: [{ id_producto: 1 }]
              })
              .mockRejectedValueOnce(
                new Error('Crash cargarColores')
              );

            const response = await request(app)
              .get('/api/productos');

            expect(response.statusCode)
              .toBe(500);
          }
        );
      }
    );

    // ═════════════════════════════════════════
    // GET BY ID
    // ═════════════════════════════════════════
    describe(
      'GET /api/productos/:id',
      () => {

        test(
          'Debería retornar un producto',
          async () => {

            pool.query
              .mockResolvedValueOnce({
                rows: [
                  {
                    id_producto: 1,
                    nombre_producto: 'Camisa'
                  }
                ]
              })
              .mockResolvedValueOnce({
                rows: []
              })
              .mockResolvedValueOnce({
                rows: []
              });

            const response = await request(app)
              .get('/api/productos/1');

            expect(response.statusCode)
              .toBe(200);
          }
        );

        test(
          'Debería retornar 404',
          async () => {

            pool.query.mockResolvedValueOnce({
              rows: []
            });

            const response = await request(app)
              .get('/api/productos/999');

            expect(response.statusCode)
              .toBe(404);
          }
        );

        test(
          'Debería manejar errores',
          async () => {

            pool.query.mockRejectedValueOnce(
              new Error('Crash GetById')
            );

            const response = await request(app)
              .get('/api/productos/1');

            expect(response.statusCode)
              .toBe(500);
          }
        );
      }
    );

    // ═════════════════════════════════════════
    // CREATE
    // ═════════════════════════════════════════
    describe(
      'POST /api/productos',
      () => {

        test(
          'Debería validar nombre vacío',
          async () => {

            const response = await request(app)
              .post('/api/productos')
              .send({
                nombre_producto: '',
                precio_unitario: 100,
                categorias: [1]
              });

            expect(response.statusCode)
              .toBe(400);
          }
        );

        test(
          'Debería validar nombre > 150',
          async () => {

            const response = await request(app)
              .post('/api/productos')
              .send({
                nombre_producto: 'a'.repeat(151),
                precio_unitario: 100,
                categorias: [1]
              });

            expect(response.statusCode)
              .toBe(400);
          }
        );

        test(
          'Debería validar categoría vacía',
          async () => {

            const response = await request(app)
              .post('/api/productos')
              .send({
                nombre_producto: 'Camisa',
                precio_unitario: 100
              });

            expect(response.statusCode)
              .toBe(400);
          }
        );

        test(
          'Debería validar precio vacío',
          async () => {

            const response = await request(app)
              .post('/api/productos')
              .send({
                nombre_producto: 'Camisa',
                precio_unitario: '',
                categorias: [1]
              });

            expect(response.statusCode)
              .toBe(400);
          }
        );

        test(
          'Debería validar precio negativo',
          async () => {

            const response = await request(app)
              .post('/api/productos')
              .send({
                nombre_producto: 'Camisa',
                precio_unitario: -5,
                categorias: [1]
              });

            expect(response.statusCode)
              .toBe(400);
          }
        );

        test(
          'Debería crear producto',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: []
              })
              .mockResolvedValueOnce({
                rows: [{ id_producto: 1 }]
              })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({});

            const response = await request(app)
              .post('/api/productos')
              .send({
                nombre_producto: 'Camisa',
                precio_unitario: 100,
                categorias: [1]
              });

            expect(response.statusCode)
              .toBe(201);
          }
        );

        test(
          'Debería aceptar id_categoria',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: []
              })
              .mockResolvedValueOnce({
                rows: [{ id_producto: 1 }]
              })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({});

            const response = await request(app)
              .post('/api/productos')
              .send({
                nombre_producto: 'Camisa',
                precio_unitario: 100,
                id_categoria: 1
              });

            expect(response.statusCode)
              .toBe(201);
          }
        );

        test(
          'Debería crear usando variantes',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: []
              })
              .mockResolvedValueOnce({
                rows: [{ id_producto: 1 }]
              })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: [{ id_producto_color: 10 }]
              })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({});

            const response = await request(app)
              .post('/api/productos')
              .send({
                nombre_producto: 'Camisa',
                precio_unitario: 100,
                categorias: [1],
                variantes: [
                  {
                    id_color: 1,
                    id_talla: 1,
                    stock_actual: 5
                  },
                  {
                    id_color: 1,
                    id_talla: 2
                  }
                ]
              });

            expect(response.statusCode)
              .toBe(201);
          }
        );

        test(
          'Debería rechazar duplicados',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: [{ id_producto: 1 }]
              })
              .mockResolvedValueOnce({});

            const response = await request(app)
              .post('/api/productos')
              .send({
                nombre_producto: 'Duplicado',
                precio_unitario: 100,
                categorias: [1]
              });

            expect(response.statusCode)
              .toBe(400);
          }
        );

        test(
          'Debería manejar errores DB',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockRejectedValueOnce(
                new Error('Crash DB')
              )
              .mockResolvedValueOnce({});

            const response = await request(app)
              .post('/api/productos')
              .send({
                nombre_producto: 'Error',
                precio_unitario: 100,
                categorias: [1]
              });

            expect(response.statusCode)
              .toBe(500);
          }
        );

        test(
          'Debería crear colores sin tallas (branch false)',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: []
              })
              .mockResolvedValueOnce({
                rows: [{ id_producto: 1 }]
              })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: [{ id_producto_color: 10 }]
              })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({});

            const response = await request(app)
              .post('/api/productos')
              .send({
                nombre_producto: 'Camisa sin tallas',
                precio_unitario: 100,
                categorias: [1],
                colores: [
                  {
                    id_color: 1,
                    tallas: []
                  }
                ]
              });

            expect(response.statusCode)
              .toBe(201);
          }
        );

        test(
          'Debería crear colores con tallas sin stock_actual',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: []
              })
              .mockResolvedValueOnce({
                rows: [{ id_producto: 1 }]
              })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: [{ id_producto_color: 10 }]
              })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({});

            const response = await request(app)
              .post('/api/productos')
              .send({
                nombre_producto: 'Camisa stock undefined',
                precio_unitario: 100,
                categorias: [1],
                colores: [
                  {
                    id_color: 1,
                    tallas: [{ id_talla: 1 }]
                  }
                ]
              });

            expect(response.statusCode)
              .toBe(201);
          }
        );
      }
    );

    // ═════════════════════════════════════════
    // UPDATE
    // ═════════════════════════════════════════
    describe(
      'PUT /api/productos/:id',
      () => {

        test(
          'Debería validar nombre vacío en update',
          async () => {

            const response = await request(app)
              .put('/api/productos/1')
              .send({
                nombre_producto: '',
                precio_unitario: 100,
                categorias: [1]
              });

            expect(response.statusCode)
              .toBe(400);
          }
        );

        test(
          'Debería validar precio negativo en update',
          async () => {

            const response = await request(app)
              .put('/api/productos/1')
              .send({
                nombre_producto: 'Camisa',
                precio_unitario: -5,
                categorias: [1]
              });

            expect(response.statusCode)
              .toBe(400);
          }
        );

        test(
          'Debería validar categoría vacía en update',
          async () => {

            const response = await request(app)
              .put('/api/productos/1')
              .send({
                nombre_producto: 'Camisa',
                precio_unitario: 100
              });

            expect(response.statusCode)
              .toBe(400);
          }
        );

        test(
          'Debería actualizar producto',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: []
              })
              .mockResolvedValueOnce({
                rows: [{ id_producto: 1 }]
              })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({});

            const response = await request(app)
              .put('/api/productos/1')
              .send({
                nombre_producto: 'Update',
                precio_unitario: 100,
                categorias: [1]
              });

            expect(response.statusCode)
              .toBe(200);
          }
        );

        test(
          'Debería actualizar usando id_categoria',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: []
              })
              .mockResolvedValueOnce({
                rows: [{ id_producto: 1 }]
              })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({});

            const response = await request(app)
              .put('/api/productos/1')
              .send({
                nombre_producto: 'Update',
                precio_unitario: 100,
                id_categoria: 1
              });

            expect(response.statusCode)
              .toBe(200);
          }
        );

        test(
          'Debería rechazar duplicado',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: [{ id_producto: 99 }]
              })
              .mockResolvedValueOnce({});

            const response = await request(app)
              .put('/api/productos/1')
              .send({
                nombre_producto: 'Duplicado',
                precio_unitario: 100,
                categorias: [1]
              });

            expect(response.statusCode)
              .toBe(400);
          }
        );

        test(
          'Debería retornar 404',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: []
              })
              .mockResolvedValueOnce({
                rows: []
              })
              .mockResolvedValueOnce({});

            const response = await request(app)
              .put('/api/productos/999')
              .send({
                nombre_producto: 'No existe',
                precio_unitario: 100,
                categorias: [1]
              });

            expect(response.statusCode)
              .toBe(404);
          }
        );

        test(
          'Debería actualizar colores con tallas',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: []
              })
              .mockResolvedValueOnce({
                rows: [{ id_producto: 1 }]
              })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: [{ id_producto_color: 50 }]
              })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({});

            const response = await request(app)
              .put('/api/productos/1')
              .send({
                nombre_producto: 'Stock',
                precio_unitario: 100,
                categorias: [1],
                colores: [
                  {
                    id_color: 1,
                    tallas: [
                      {
                        id_talla: 1,
                        stock_actual: 10
                      }
                    ]
                  }
                ]
              });

            expect(response.statusCode)
              .toBe(200);
          }
        );

        test(
          'Debería actualizar colores con tallas sin stock_actual (branch || 0)',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: []
              })
              .mockResolvedValueOnce({
                rows: [{ id_producto: 1 }]
              })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: [{ id_producto_color: 50 }]
              })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({});

            const response = await request(app)
              .put('/api/productos/1')
              .send({
                nombre_producto: 'Update stock undef',
                precio_unitario: 100,
                categorias: [1],
                colores: [
                  {
                    id_color: 1,
                    tallas: [{ id_talla: 1 }]
                  }
                ]
              });

            expect(response.statusCode)
              .toBe(200);
          }
        );

        test(
          'Debería actualizar colores sin tallas (branch false)',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: []
              })
              .mockResolvedValueOnce({
                rows: [{ id_producto: 1 }]
              })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: [{ id_producto_color: 50 }]
              })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({});

            const response = await request(app)
              .put('/api/productos/1')
              .send({
                nombre_producto: 'Update sin tallas',
                precio_unitario: 100,
                categorias: [1],
                colores: [
                  {
                    id_color: 2,
                    tallas: []
                  }
                ]
              });

            expect(response.statusCode)
              .toBe(200);
          }
        );

        test(
          'Debería manejar rollback',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockRejectedValueOnce(
                new Error('Crash Update')
              )
              .mockResolvedValueOnce({});

            const response = await request(app)
              .put('/api/productos/1')
              .send({
                nombre_producto: 'Crash',
                precio_unitario: 100,
                categorias: [1]
              });

            expect(response.statusCode)
              .toBe(500);
          }
        );
      }
    );

    // ═════════════════════════════════════════
    // DELETE
    // ═════════════════════════════════════════
    describe(
      'DELETE /api/productos/:id',
      () => {

        test(
          'Debería eliminar producto con colores',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: [{ id_producto: 1 }]
              })
              .mockResolvedValueOnce({
                rows: [{ id_producto_color: 1 }]
              })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({});

            const response = await request(app)
              .delete('/api/productos/1');

            expect(response.statusCode)
              .toBe(200);
          }
        );

        test(
          'Debería eliminar producto sin colores (pcIds vacío)',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: [{ id_producto: 1 }]
              })
              .mockResolvedValueOnce({
                rows: []
              })
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({});

            const response = await request(app)
              .delete('/api/productos/1');

            expect(response.statusCode)
              .toBe(200);
          }
        );

        test(
          'Debería retornar 404',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockResolvedValueOnce({
                rows: []
              })
              .mockResolvedValueOnce({});

            const response = await request(app)
              .delete('/api/productos/999');

            expect(response.statusCode)
              .toBe(404);
          }
        );

        test(
          'Debería manejar rollback',
          async () => {

            mockClient.query
              .mockResolvedValueOnce({})
              .mockRejectedValueOnce(
                new Error('Crash Delete')
              )
              .mockResolvedValueOnce({});

            const response = await request(app)
              .delete('/api/productos/1');

            expect(response.statusCode)
              .toBe(500);
          }
        );
      }
    );
  }
);

// ═════════════════════════════════════════════
// COVERAGE EXTRA
// ═════════════════════════════════════════════
describe('Cobertura extra productos', () => {

  test('Debe ejecutar release en create', async () => {

    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id_producto: 1 }]
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    await request(app)
      .post('/api/productos')
      .send({
        nombre_producto: 'Release Create',
        precio_unitario: 100,
        categorias: [1]
      });

    expect(mockClient.release)
      .toHaveBeenCalled();
  });

  test('Debe ejecutar release en update', async () => {

    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id_producto: 1 }]
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    await request(app)
      .put('/api/productos/1')
      .send({
        nombre_producto: 'Release Update',
        precio_unitario: 100,
        categorias: [1]
      });

    expect(mockClient.release)
      .toHaveBeenCalled();
  });

  test('Debe ejecutar release en remove', async () => {

    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{ id_producto: 1 }]
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    await request(app)
      .delete('/api/productos/1');

    expect(mockClient.release)
      .toHaveBeenCalled();
  });

  test('Debe ejecutar rollback cuando update encuentra duplicado', async () => {

    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{ id_producto: 99 }]
      })
      .mockResolvedValueOnce({});

    const response = await request(app)
      .put('/api/productos/1')
      .send({
        nombre_producto: 'Duplicado',
        precio_unitario: 100,
        categorias: [1]
      });

    expect(response.statusCode)
      .toBe(400);
  });

  test('Debe ejecutar rollback cuando remove no encuentra producto', async () => {

    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({});

    const response = await request(app)
      .delete('/api/productos/999');

    expect(response.statusCode)
      .toBe(404);
  });

});