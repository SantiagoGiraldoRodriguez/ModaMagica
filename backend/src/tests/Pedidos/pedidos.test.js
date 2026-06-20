const request = require('supertest');
const express = require('express');
const cors    = require('cors');

jest.mock('../../config/db', () => ({
  query:   jest.fn(),
  connect: jest.fn(),
}));
const pool = require('../../config/db');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/pedidos', require('../../routes/pedidos/pedidos.routes'));

// ─── cliente mock reutilizable ───────────────────────────────────────────────
const makeClient = (responses = []) => {
  let call = 0;
  const client = {
    query: jest.fn(() => {
      const r = responses[call++] ?? { rows: [] };
      return r instanceof Promise ? r : Promise.resolve(r);
    }),
    release: jest.fn(),
  };
  pool.connect.mockResolvedValue(client);
  return client;
};

// ─── silenciar console.error del controlador durante los tests ──────────────
beforeAll(() => { jest.spyOn(console, 'error').mockImplementation(() => {}); });
afterAll(() => { console.error.mockRestore(); });

beforeEach(() => { jest.clearAllMocks(); });

describe('Pruebas de Integración de la API Pedidos', () => {

  // ──────────────────────────────────────────────────────────────
  // GET ALL
  // ──────────────────────────────────────────────────────────────
  describe('GET /api/pedidos', () => {

    test('Debería retornar todos los pedidos con sus detalles', async () => {
      const pedidosMock = [
        {
          id_pedido: 1, fecha_pedido: '2025-01-10', estado_pedido: 'pendiente',
          total_pedido: 150000, descuento_aplicado: 0, total_final: 150000,
          id_descuento: null, id_usuario: 1, nombre_cliente: 'Juan Pérez',
          correo: 'juan@test.com', telefono: '3001234567',
          id_direccion: 1, departamento: 'Antioquia', ciudad: 'Medellín',
          direccion_envio: 'Calle 10 # 20-30', codigo_descuento: null, porcentaje_descuento: null
        }
      ];
      const detallesMock = [
        {
          id_detalle: 1, cantidad: 2, precio_vendido: 50000, subtotal: 100000,
          id_producto: 1, nombre_producto: 'Camiseta', nombre_color: 'Rojo',
          hex_code: '#FF0000', nombre_talla: 'M', id_producto_color: 1, imagen_principal: 'img.jpg'
        }
      ];

      pool.query
        .mockResolvedValueOnce({ rows: pedidosMock })
        .mockResolvedValueOnce({ rows: detallesMock });

      const response = await request(app).get('/api/pedidos');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('detalles');
      expect(response.body[0].detalles).toHaveLength(1);
    });

    test('Debería retornar lista vacía si no hay pedidos', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/pedidos');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('Debería retornar 500 si falla la base de datos en getAll', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error getAll'));

      const response = await request(app).get('/api/pedidos');

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error getAll');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // GET BY ID
  // ──────────────────────────────────────────────────────────────
  describe('GET /api/pedidos/:id', () => {

    const pedidoMock = {
      id_pedido: 1, fecha_pedido: '2025-01-10', estado_pedido: 'pendiente',
      total_pedido: 150000, descuento_aplicado: 0, total_final: 150000,
      id_descuento: null, id_usuario: 1, nombre_cliente: 'Juan Pérez',
      correo: 'juan@test.com', telefono: '3001234567',
      id_direccion: 1, departamento: 'Antioquia', ciudad: 'Medellín',
      direccion_envio: 'Calle 10 # 20-30', codigo_descuento: null, porcentaje_descuento: null
    };

    test('Debería retornar un pedido por ID con sus detalles', async () => {
      const detallesMock = [
        {
          id_detalle: 1, cantidad: 2, precio_vendido: 50000, subtotal: 100000,
          id_producto: 1, nombre_producto: 'Camiseta', nombre_color: 'Rojo',
          hex_code: '#FF0000', nombre_talla: 'M', id_producto_color: 1, imagen_principal: 'img.jpg'
        }
      ];

      pool.query
        .mockResolvedValueOnce({ rows: [pedidoMock] })
        .mockResolvedValueOnce({ rows: detallesMock });

      const response = await request(app).get('/api/pedidos/1');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('id_pedido', 1);
      expect(response.body).toHaveProperty('detalles');
      expect(response.body.detalles).toHaveLength(1);
    });

    test('Debería retornar 404 si el pedido no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/pedidos/999');

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error', 'Pedido no encontrado.');
    });

    test('Debería retornar 500 si falla la base de datos en getById', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error getById'));

      const response = await request(app).get('/api/pedidos/1');

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error getById');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // GET CLIENTES
  // ──────────────────────────────────────────────────────────────
  describe('GET /api/pedidos/clientes', () => {

    test('Debería retornar la lista de clientes activos', async () => {
      const clientesMock = [
        { id_usuario: 1, nombre: 'Juan Pérez',  correo: 'juan@test.com',  telefono: '3001234567' },
        { id_usuario: 2, nombre: 'María López', correo: 'maria@test.com', telefono: '3007654321' }
      ];

      pool.query.mockResolvedValueOnce({ rows: clientesMock });

      const response = await request(app).get('/api/pedidos/clientes');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('nombre');
    });

    test('Debería retornar lista vacía si no hay clientes activos', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/pedidos/clientes');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('Debería retornar 500 si falla la base de datos en getClientes', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error getClientes'));

      const response = await request(app).get('/api/pedidos/clientes');

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error getClientes');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // GET PRODUCTOS
  // ──────────────────────────────────────────────────────────────
  describe('GET /api/pedidos/productos', () => {

    test('Debería retornar los productos activos con variantes', async () => {
      const productosMock = [
        {
          id_producto_color: 1, id_producto: 1, nombre_producto: 'Camiseta',
          precio_unitario: 50000, nombre_color: 'Rojo', hex_code: '#FF0000',
          id_talla: 1, nombre_talla: 'M', stock_actual: 10, imagen_principal: 'img.jpg'
        }
      ];

      pool.query.mockResolvedValueOnce({ rows: productosMock });

      const response = await request(app).get('/api/pedidos/productos');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('nombre_producto');
      expect(response.body[0]).toHaveProperty('stock_actual');
    });

    test('Debería retornar lista vacía si no hay productos disponibles', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/pedidos/productos');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('Debería retornar 500 si falla la base de datos en getProductos', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error getProductos'));

      const response = await request(app).get('/api/pedidos/productos');

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error getProductos');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // GET DESCUENTO (validarDescuento)
  // ──────────────────────────────────────────────────────────────
  describe('GET /api/pedidos/descuento/:codigo', () => {

    const descuentoMock = {
      id_descuento: 1, codigo: 'VERANO25', descripcion: 'Descuento de verano',
      tipo_descuento: 'porcentaje', valor_descuento: 25,
      estado: 'activo', fecha_cierre: '2099-12-31',
      limite_usos: 100, usos_actuales: 10
    };

    test('Debería retornar el descuento válido para el código dado', async () => {
      pool.query.mockResolvedValueOnce({ rows: [descuentoMock] });

      const response = await request(app).get('/api/pedidos/descuento/VERANO25');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('codigo', 'VERANO25');
      expect(response.body).toHaveProperty('valor_descuento', 25);
    });

    test('Debería retornar 404 si el código de descuento no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/pedidos/descuento/INVALIDO');

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error', 'Código de descuento no encontrado.');
    });

    test('Debería retornar 400 si el descuento no está activo', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ ...descuentoMock, estado: 'inactivo' }] });

      const response = await request(app).get('/api/pedidos/descuento/VERANO25');

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'El descuento está inactivo.');
    });

    test('Debería retornar 400 si el descuento ha vencido', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ ...descuentoMock, fecha_cierre: '2020-01-01' }] });

      const response = await request(app).get('/api/pedidos/descuento/VERANO25');

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'El descuento ha vencido.');
    });

    test('Debería retornar 400 si el descuento alcanzó su límite de usos', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ ...descuentoMock, usos_actuales: 100, limite_usos: 100 }] });

      const response = await request(app).get('/api/pedidos/descuento/VERANO25');

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'El descuento ha alcanzado su límite de usos.');
    });

    test('Debería retornar 500 si falla la base de datos en validarDescuento', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error validarDescuento'));

      const response = await request(app).get('/api/pedidos/descuento/VERANO25');

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error validarDescuento');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // GET DIRECCIONES
  // ──────────────────────────────────────────────────────────────
  describe('GET /api/pedidos/direcciones/:id_usuario', () => {

    test('Debería retornar las direcciones activas del usuario', async () => {
      const direccionesMock = [
        { id_direccion: 1, departamento: 'Antioquia', ciudad: 'Medellín', direccion: 'Calle 10 # 20-30' },
        { id_direccion: 2, departamento: 'Cundinamarca', ciudad: 'Bogotá', direccion: 'Carrera 5 # 10-15' }
      ];

      pool.query.mockResolvedValueOnce({ rows: direccionesMock });

      const response = await request(app).get('/api/pedidos/direcciones/1');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('ciudad');
    });

    test('Debería retornar lista vacía si el usuario no tiene direcciones', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/api/pedidos/direcciones/999');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('Debería retornar 500 si falla la base de datos en getDirecciones', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error getDirecciones'));

      const response = await request(app).get('/api/pedidos/direcciones/1');

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error getDirecciones');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // POST DIRECCIONES (addDireccion)
  // ──────────────────────────────────────────────────────────────
  describe('POST /api/pedidos/direcciones', () => {

    const direccionValida = {
      id_usuario: 1, departamento: 'Antioquia',
      ciudad: 'Medellín', direccion: 'Calle 10 # 20-30'
    };

    test('Debería agregar una nueva dirección correctamente', async () => {
      const creada = { id_direccion: 3, ...direccionValida, codigo_postal: null, es_predeterminada: 0, activa: 1 };
      pool.query.mockResolvedValueOnce({ rows: [creada] });

      const response = await request(app).post('/api/pedidos/direcciones').send(direccionValida);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id_direccion');
      expect(response.body.ciudad).toBe('Medellín');
    });

    test('Debería aceptar dirección con código postal opcional', async () => {
      const creada = { id_direccion: 4, ...direccionValida, codigo_postal: '050001', es_predeterminada: 0, activa: 1 };
      pool.query.mockResolvedValueOnce({ rows: [creada] });

      const response = await request(app).post('/api/pedidos/direcciones').send({ ...direccionValida, codigo_postal: '050001' });

      expect(response.statusCode).toBe(201);
      expect(response.body.codigo_postal).toBe('050001');
    });

    test('Debería retornar 400 si falta el departamento', async () => {
      const response = await request(app).post('/api/pedidos/direcciones').send({ id_usuario: 1, ciudad: 'Medellín', direccion: 'Calle 10' });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'Departamento, ciudad y dirección son obligatorios.');
    });

    test('Debería retornar 400 si falta la ciudad', async () => {
      const response = await request(app).post('/api/pedidos/direcciones').send({ id_usuario: 1, departamento: 'Antioquia', direccion: 'Calle 10' });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'Departamento, ciudad y dirección son obligatorios.');
    });

    test('Debería retornar 400 si falta la dirección', async () => {
      const response = await request(app).post('/api/pedidos/direcciones').send({ id_usuario: 1, departamento: 'Antioquia', ciudad: 'Medellín' });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'Departamento, ciudad y dirección son obligatorios.');
    });

    test('Debería retornar 400 si falta el id_usuario', async () => {
      const response = await request(app).post('/api/pedidos/direcciones').send({ departamento: 'Antioquia', ciudad: 'Medellín', direccion: 'Calle 10' });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'Departamento, ciudad y dirección son obligatorios.');
    });

    test('Debería retornar 500 si falla la base de datos en addDireccion', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error addDireccion'));

      const response = await request(app).post('/api/pedidos/direcciones').send(direccionValida);

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error addDireccion');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // POST — CREATE (validaciones)
  // ──────────────────────────────────────────────────────────────
  describe('POST /api/pedidos — validaciones', () => {

    test('Debería retornar 400 si falta el cliente', async () => {
      const response = await request(app).post('/api/pedidos').send({
        id_direccion: 1, items: [{ id_producto_color: 1, id_talla: 1, cantidad: 1 }]
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'El cliente es obligatorio.');
    });

    test('Debería retornar 400 si falta la dirección', async () => {
      const response = await request(app).post('/api/pedidos').send({
        id_cliente: 1, items: [{ id_producto_color: 1, id_talla: 1, cantidad: 1 }]
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'La dirección es obligatoria.');
    });

    test('Debería retornar 400 si items está vacío', async () => {
      const response = await request(app).post('/api/pedidos').send({
        id_cliente: 1, id_direccion: 1, items: []
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'El pedido debe tener al menos un producto.');
    });

    test('Debería retornar 400 si items no se envía', async () => {
      const response = await request(app).post('/api/pedidos').send({
        id_cliente: 1, id_direccion: 1
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'El pedido debe tener al menos un producto.');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // POST — CREATE (flujos principales)
  // ──────────────────────────────────────────────────────────────
  describe('POST /api/pedidos', () => {

    const pedidoValido = {
      id_cliente:   1,
      id_direccion: 1,
      items: [{ id_producto_color: 1, id_talla: 1, cantidad: 2 }]
    };

    // ── Flujo sin descuento: id_descuento no se envía → el if(id_descuento) no entra ──
    test('Debería crear un pedido correctamente sin descuento', async () => {
      const pedidoCreado = {
        id_pedido: 5, id_cliente: 1, id_direccion: 1, id_descuento: null,
        descuento_aplicado: 0, total_pedido: 100000, total_final: 100000,
        estado_pedido: 'pendiente'
      };

      makeClient([
        { rows: [] },                                // BEGIN
        { rows: [{ precio_unitario: 50000 }] },      // precio variante (loop validación)
        { rows: [{ stock_actual: 10 }] },            // stock (loop validación)
        { rows: [pedidoCreado] },                    // INSERT pedido
        { rows: [{ precio_unitario: 50000 }] },      // precio variante (loop detalle)
        { rows: [] },                                // INSERT detalle_pedido
        { rows: [] },                                // UPDATE inventario_color_talla
        { rows: [] },                                // UPDATE inventario_color
        { rows: [] },                                // INSERT movimiento_inventario
        { rows: [] },                                // INSERT historial_estado_pedido
        { rows: [] },                                // COMMIT
      ]);

      const response = await request(app).post('/api/pedidos').send(pedidoValido);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id_pedido');
      expect(response.body.total_pedido).toBe(100000);
    });

    // ── línea 312: rama if → descuento tipo 'porcentaje' ──────────
    test('Debería crear un pedido correctamente con descuento tipo porcentaje', async () => {
      const pedidoConDesc = { ...pedidoValido, id_descuento: 1 };
      const pedidoCreado = {
        id_pedido: 6, id_cliente: 1, id_direccion: 1, id_descuento: 1,
        descuento_aplicado: 10000, total_pedido: 100000, total_final: 90000,
        estado_pedido: 'pendiente'
      };

      makeClient([
        { rows: [] },                                // BEGIN
        { rows: [{ precio_unitario: 50000 }] },      // precio variante (loop validación)
        { rows: [{ stock_actual: 10 }] },            // stock (loop validación)
        { rows: [{ id_descuento: 1, tipo_descuento: 'porcentaje', valor_descuento: 0.1, limite_usos: 100, usos_actuales: 5 }] }, // SELECT descuento
        { rows: [pedidoCreado] },                    // INSERT pedido
        { rows: [{ precio_unitario: 50000 }] },      // precio variante (loop detalle)
        { rows: [] },                                // INSERT detalle_pedido
        { rows: [] },                                // UPDATE inventario_color_talla
        { rows: [] },                                // UPDATE inventario_color
        { rows: [] },                                // INSERT movimiento_inventario
        { rows: [] },                                // INSERT historial_estado_pedido
        { rows: [] },                                // UPDATE usos_actuales descuento
        { rows: [] },                                // COMMIT
      ]);

      const response = await request(app).post('/api/pedidos').send(pedidoConDesc);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id_pedido');
      expect(response.body.descuento_aplicado).toBe(10000);
    });

    // ── línea 312: rama else → descuento tipo 'fijo' ──────────────
    test('Debería crear un pedido correctamente con descuento tipo fijo', async () => {
      const pedidoFijo = {
        id_cliente:   1,
        id_direccion: 1,
        id_descuento: 2,
        items: [{ id_producto_color: 1, id_talla: 1, cantidad: 2 }]
      };
      const pedidoCreado = {
        id_pedido: 7, id_cliente: 1, id_direccion: 1, id_descuento: 2,
        descuento_aplicado: 20000, total_pedido: 100000, total_final: 80000,
        estado_pedido: 'pendiente'
      };

      makeClient([
        { rows: [] },                                // BEGIN
        { rows: [{ precio_unitario: 50000 }] },      // precio variante (loop validación)
        { rows: [{ stock_actual: 10 }] },            // stock (loop validación)
        { rows: [{ id_descuento: 2, tipo_descuento: 'fijo', valor_descuento: 20000, limite_usos: 50, usos_actuales: 0 }] }, // SELECT descuento → fijo entra al else
        { rows: [pedidoCreado] },                    // INSERT pedido
        { rows: [{ precio_unitario: 50000 }] },      // precio variante (loop detalle)
        { rows: [] },                                // INSERT detalle_pedido
        { rows: [] },                                // UPDATE inventario_color_talla
        { rows: [] },                                // UPDATE inventario_color
        { rows: [] },                                // INSERT movimiento_inventario
        { rows: [] },                                // INSERT historial_estado_pedido
        { rows: [] },                                // UPDATE usos_actuales descuento
        { rows: [] },                                // COMMIT
      ]);

      const response = await request(app).post('/api/pedidos').send(pedidoFijo);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id_pedido');
      expect(response.body.total_final).toBe(80000);
    });

    // ── línea 312 complemento: id_descuento enviado pero no encontrado en DB ──
    test('Debería crear pedido cuando el descuento enviado no está vigente en DB', async () => {
      const pedidoConDescNoValido = {
        id_cliente:   1,
        id_direccion: 1,
        id_descuento: 99,
        items: [{ id_producto_color: 1, id_talla: 1, cantidad: 2 }]
      };
      const pedidoCreado = {
        id_pedido: 8, id_cliente: 1, id_direccion: 1, id_descuento: null,
        descuento_aplicado: 0, total_pedido: 100000, total_final: 100000,
        estado_pedido: 'pendiente'
      };

      makeClient([
        { rows: [] },                                // BEGIN
        { rows: [{ precio_unitario: 50000 }] },      // precio variante (loop validación)
        { rows: [{ stock_actual: 10 }] },            // stock (loop validación)
        { rows: [] },                                // SELECT descuento → vacío (no vigente)
        { rows: [pedidoCreado] },                    // INSERT pedido sin descuento
        { rows: [{ precio_unitario: 50000 }] },      // precio variante (loop detalle)
        { rows: [] },                                // INSERT detalle_pedido
        { rows: [] },                                // UPDATE inventario_color_talla
        { rows: [] },                                // UPDATE inventario_color
        { rows: [] },                                // INSERT movimiento_inventario
        { rows: [] },                                // INSERT historial_estado_pedido
        { rows: [] },                                // COMMIT
      ]);

      const response = await request(app).post('/api/pedidos').send(pedidoConDescNoValido);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id_pedido');
      expect(response.body.descuento_aplicado).toBe(0);
    });

    test('Debería retornar 500 si la variante del producto no existe', async () => {
      makeClient([
        { rows: [] },   // BEGIN
        { rows: [] },   // variante no encontrada → throw
      ]);

      const response = await request(app).post('/api/pedidos').send(pedidoValido);

      expect(response.statusCode).toBe(500);
      expect(response.body.error).toMatch(/no encontrada/);
    });

    test('Debería retornar 500 si no hay stock suficiente', async () => {
      makeClient([
        { rows: [] },                                // BEGIN
        { rows: [{ precio_unitario: 50000 }] },      // precio variante ok
        { rows: [{ stock_actual: 1 }] },             // stock insuficiente (cantidad pedida: 2) → throw
      ]);

      const response = await request(app).post('/api/pedidos').send(pedidoValido);

      expect(response.statusCode).toBe(500);
      expect(response.body.error).toMatch(/Stock insuficiente/);
    });

    // ── línea 370: catch interno de create → pool.connect falla ANTES del try ──
    test('Debería retornar 500 si pool.connect falla en create', async () => {
      const clientError = {
        query:   jest.fn()
          .mockResolvedValueOnce({ rows: [] })                   // BEGIN
          .mockResolvedValueOnce({ rows: [{ precio_unitario: 50000 }] }) // precio variante
          .mockResolvedValueOnce({ rows: [{ stock_actual: 10 }] })       // stock
          .mockRejectedValueOnce(new Error('DB error create'))            // INSERT pedido falla
          .mockResolvedValueOnce({ rows: [] }),                           // ROLLBACK
        release: jest.fn(),
      };
      pool.connect.mockResolvedValue(clientError);

      const response = await request(app).post('/api/pedidos').send(pedidoValido);

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error create');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // PUT — UPDATE ESTADO
  // ──────────────────────────────────────────────────────────────
  describe('PUT /api/pedidos/:id/estado', () => {

    const estadoValido = { estado_pedido: 'procesando', id_usuario_cambio: 1 };

    test('Debería actualizar el estado del pedido correctamente', async () => {
      const pedidoActualizado = {
        id_pedido: 1, estado_pedido: 'procesando',
        total_pedido: 150000, total_final: 150000
      };

      makeClient([
        { rows: [] },                                          // BEGIN
        { rows: [{ estado_pedido: 'pendiente' }] },           // SELECT estado actual
        { rows: [pedidoActualizado] },                         // UPDATE pedido
        { rows: [] },                                          // INSERT historial
        { rows: [] },                                          // COMMIT
      ]);

      const response = await request(app).put('/api/pedidos/1/estado').send(estadoValido);

      expect(response.statusCode).toBe(200);
      expect(response.body.estado_pedido).toBe('procesando');
    });

    test('Debería actualizar a todos los estados válidos', async () => {
      const estados = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];

      for (const estado of estados) {
        makeClient([
          { rows: [] },
          { rows: [{ estado_pedido: 'pendiente' }] },
          { rows: [{ id_pedido: 1, estado_pedido: estado }] },
          { rows: [] },
          { rows: [] },
        ]);

        const response = await request(app).put('/api/pedidos/1/estado').send({ estado_pedido: estado, id_usuario_cambio: 1 });
        expect(response.statusCode).toBe(200);
        expect(response.body.estado_pedido).toBe(estado);
      }
    });

    test('Debería registrar el estado con observación opcional', async () => {
      makeClient([
        { rows: [] },
        { rows: [{ estado_pedido: 'procesando' }] },
        { rows: [{ id_pedido: 1, estado_pedido: 'enviado' }] },
        { rows: [] },
        { rows: [] },
      ]);

      const response = await request(app).put('/api/pedidos/1/estado').send({
        estado_pedido: 'enviado', id_usuario_cambio: 1, observacion: 'Guía: 123456'
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.estado_pedido).toBe('enviado');
    });

    // ── línea 419: rama id_usuario_cambio || 1 → sin enviar id_usuario_cambio ──
    test('Debería usar id_usuario_cambio = 1 por defecto si no se envía', async () => {
      makeClient([
        { rows: [] },
        { rows: [{ estado_pedido: 'pendiente' }] },
        { rows: [{ id_pedido: 1, estado_pedido: 'procesando' }] },
        { rows: [] },
        { rows: [] },
      ]);

      const response = await request(app).put('/api/pedidos/1/estado').send({
        estado_pedido: 'procesando'
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.estado_pedido).toBe('procesando');
    });

    test('Debería retornar 400 si el estado enviado es inválido', async () => {
      const response = await request(app).put('/api/pedidos/1/estado').send({ estado_pedido: 'inventado' });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error', 'Estado inválido.');
    });

    test('Debería retornar 404 si el pedido a actualizar no existe', async () => {
      makeClient([
        { rows: [] },   // BEGIN
        { rows: [] },   // pedido no encontrado → ROLLBACK + 404
      ]);

      const response = await request(app).put('/api/pedidos/999/estado').send(estadoValido);

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error', 'Pedido no encontrado.');
    });

    // ── líneas 419: catch interno → query falla dentro de la transacción ──
    test('Debería retornar 500 y hacer ROLLBACK si falla una query interna en updateEstado', async () => {
      makeClient([
        { rows: [] },                                          // BEGIN
        { rows: [{ estado_pedido: 'pendiente' }] },           // SELECT estado actual
        new Promise((_, reject) => reject(new Error('DB error updateEstado interno'))), // UPDATE pedido falla
        { rows: [] },                                          // ROLLBACK
      ]);

      const response = await request(app).put('/api/pedidos/1/estado').send(estadoValido);

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error updateEstado interno');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────────────────────
  describe('DELETE /api/pedidos/:id', () => {

    test('Debería eliminar el pedido correctamente', async () => {
      makeClient([
        { rows: [] },                                // BEGIN
        { rows: [{ id_pedido: 1 }] },               // SELECT existe
        { rows: [] },                                // DELETE historial_estado_pedido
        { rows: [] },                                // DELETE comprobante_pago
        { rows: [] },                                // DELETE movimiento_inventario
        { rows: [] },                                // DELETE detalle_pedido
        { rows: [] },                                // DELETE pedido
        { rows: [] },                                // COMMIT
      ]);

      const response = await request(app).delete('/api/pedidos/1');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('mensaje', 'Pedido eliminado correctamente.');
    });

    test('Debería retornar 404 si el pedido a eliminar no existe', async () => {
      makeClient([
        { rows: [] },   // BEGIN
        { rows: [] },   // pedido no encontrado → ROLLBACK + 404
      ]);

      const response = await request(app).delete('/api/pedidos/999');

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error', 'Pedido no encontrado.');
    });

    // ── líneas 457-458: catch interno → query falla dentro de la transacción ──
    test('Debería retornar 500 y hacer ROLLBACK si falla una query interna en delete', async () => {
      makeClient([
        { rows: [] },                                // BEGIN
        { rows: [{ id_pedido: 1 }] },               // SELECT existe ok
        new Promise((_, reject) => reject(new Error('DB error delete interno'))), // DELETE historial falla
        { rows: [] },                                // ROLLBACK
      ]);

      const response = await request(app).delete('/api/pedidos/1');

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error delete interno');
    });

  });

});