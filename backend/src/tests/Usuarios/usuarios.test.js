const request = require('supertest');
const express = require('express');
const cors    = require('cors');

// ────────────────────────────────────────────────────────────────
// Mock de la base de datos y bcrypt
// ────────────────────────────────────────────────────────────────
jest.mock('../../config/db', () => ({ query: jest.fn() }));
jest.mock('bcryptjs', () => ({
  hash:    jest.fn().mockResolvedValue('$2b$10$hashedPassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

const pool = require('../../config/db');

// ────────────────────────────────────────────────────────────────
// Configuración de Express
// ────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/usuarios', require('../../routes/Usuarios/usuarios.routes'));

// ────────────────────────────────────────────────────────────────
// Limpiar mocks antes de cada test
// ────────────────────────────────────────────────────────────────
beforeEach(() => jest.clearAllMocks());

// ────────────────────────────────────────────────────────────────
// Datos de prueba reutilizables
// ────────────────────────────────────────────────────────────────
const usuarioMock = {
  id_usuario:       1,
  primer_nombre:    'Laura',
  segundo_nombre:   'María',
  primer_apellido:  'Martínez',
  segundo_apellido: 'García',
  correo:           'laura@modamagica.com',
  telefono:         '3001234567',
  contrasena:       '$2b$10$hashedPassword',
  id_rol:           2,
  direccion:        'Calle 10 #20-30, Medellín',
  fecha_nacimiento: '1998-07-22',
  estado:           'activo',
  fecha_creacion:   '2024-01-01T00:00:00.000Z'
};

const bodyValido = {
  primer_nombre:    'Laura',
  segundo_nombre:   'María',
  primer_apellido:  'Martínez',
  segundo_apellido: 'García',
  correo:           'laura@modamagica.com',
  telefono:         '3001234567',
  contrasena:       'Clave123',
  id_rol:           2,
  direccion:        'Calle 10 #20-30, Medellín',
  fecha_nacimiento: '1998-07-22',
  estado:           'activo'
};

// ════════════════════════════════════════════════════════════════
// PRUEBAS DE INTEGRACIÓN
// ════════════════════════════════════════════════════════════════
describe('Pruebas de Integración de la API Usuarios', () => {

  // ──────────────────────────────────────────────────────────────
  // GET ALL
  // ──────────────────────────────────────────────────────────────
  describe('GET /api/usuarios', () => {

    test('Debería retornar todos los usuarios', async () => {
      pool.query.mockResolvedValueOnce({ rows: [usuarioMock] });
      const response = await request(app).get('/api/usuarios');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([usuarioMock]);
    });

    test('Debería retornar 500 si falla la base de datos en getAll', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error getAll'));
      const response = await request(app).get('/api/usuarios');
      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error getAll');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // GET BY ID
  // ──────────────────────────────────────────────────────────────
  describe('GET /api/usuarios/:id', () => {

    test('Debería retornar un usuario por ID', async () => {
      pool.query.mockResolvedValueOnce({ rows: [usuarioMock] });
      const response = await request(app).get('/api/usuarios/1');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(usuarioMock);
    });

    test('Debería retornar 404 si no existe el usuario', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const response = await request(app).get('/api/usuarios/999');
      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error', 'Usuario no encontrado.');
    });

    test('Debería retornar 500 si falla la base de datos en getById', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error getById'));
      const response = await request(app).get('/api/usuarios/1');
      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty('error', 'DB error getById');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // POST — validaciones
  // ──────────────────────────────────────────────────────────────
  describe('POST /api/usuarios — validaciones', () => {

    // ── Primer nombre ────────────────────────────────────────────
    test('Debería retornar 400 si primer_nombre está vacío', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, primer_nombre: '   ' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('primer_nombre', 'El primer nombre es obligatorio.');
    });

    test('Debería retornar 400 si primer_nombre contiene números', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, primer_nombre: 'Laura123' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('primer_nombre', 'El primer nombre solo permite letras.');
    });

    test('Debería retornar 400 si primer_nombre tiene menos de 2 caracteres', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, primer_nombre: 'L' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('primer_nombre', 'El primer nombre debe tener al menos 2 caracteres.');
    });

    test('Debería retornar 400 si primer_nombre supera 50 caracteres', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, primer_nombre: 'L'.repeat(51) });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('primer_nombre', 'El primer nombre no puede superar 50 caracteres.');
    });

    // ── Segundo nombre ───────────────────────────────────────────
    test('Debería retornar 400 si segundo_nombre tiene caracteres inválidos', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, segundo_nombre: 'María123' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('segundo_nombre', 'El segundo nombre solo permite letras.');
    });

    test('Debería retornar 400 si segundo_nombre tiene menos de 2 caracteres', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, segundo_nombre: 'M' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('segundo_nombre', 'El segundo nombre debe tener al menos 2 caracteres.');
    });

    test('Debería retornar 400 si segundo_nombre supera 50 caracteres', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, segundo_nombre: 'M'.repeat(51) });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('segundo_nombre', 'El segundo nombre no puede superar 50 caracteres.');
    });

    // ── Primer apellido ──────────────────────────────────────────
    test('Debería retornar 400 si primer_apellido está vacío', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, primer_apellido: '' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('primer_apellido', 'El primer apellido es obligatorio.');
    });

    test('Debería retornar 400 si primer_apellido contiene números', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, primer_apellido: 'Martínez99' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('primer_apellido', 'El primer apellido solo permite letras.');
    });

    test('Debería retornar 400 si primer_apellido tiene menos de 2 caracteres', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, primer_apellido: 'M' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('primer_apellido', 'El primer apellido debe tener al menos 2 caracteres.');
    });

    test('Debería retornar 400 si primer_apellido supera 50 caracteres', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, primer_apellido: 'M'.repeat(51) });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('primer_apellido', 'El primer apellido no puede superar 50 caracteres.');
    });

    // ── Segundo apellido ─────────────────────────────────────────
    test('Debería retornar 400 si segundo_apellido tiene caracteres inválidos', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, segundo_apellido: 'García@#' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('segundo_apellido', 'El segundo apellido solo permite letras.');
    });

    test('Debería retornar 400 si segundo_apellido tiene menos de 2 caracteres', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, segundo_apellido: 'G' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('segundo_apellido', 'El segundo apellido debe tener al menos 2 caracteres.');
    });

    test('Debería retornar 400 si segundo_apellido supera 50 caracteres', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, segundo_apellido: 'G'.repeat(51) });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('segundo_apellido', 'El segundo apellido no puede superar 50 caracteres.');
    });

    // ── Correo ───────────────────────────────────────────────────
    test('Debería retornar 400 si el correo está vacío', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, correo: '' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('correo', 'El correo es obligatorio.');
    });

    test('Debería retornar 400 si el correo tiene doble @', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, correo: 'laura@@modamagica.com' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('correo', 'El correo no puede contener más de un @.');
    });

    test('Debería retornar 400 si el correo tiene formato inválido', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, correo: 'correosindominio' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('correo', 'Ingresa un correo electrónico válido.');
    });

    test('Debería retornar 400 si el correo supera 100 caracteres', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, correo: 'a'.repeat(90) + '@correo.com' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('correo', 'El correo no puede superar 100 caracteres.');
    });

    // ── Teléfono ─────────────────────────────────────────────────
    test('Debería retornar 400 si el teléfono está vacío', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, telefono: '' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('telefono', 'El teléfono es obligatorio.');
    });

    test('Debería retornar 400 si el teléfono contiene letras', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, telefono: '300ABC1234' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('telefono', 'El teléfono solo permite números.');
    });

    test('Debería retornar 400 si el teléfono tiene menos de 7 dígitos', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, telefono: '123' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('telefono', 'El teléfono debe tener entre 7 y 15 dígitos.');
    });

    // ── Contraseña (crear) ───────────────────────────────────────
    test('Debería retornar 400 si la contraseña está vacía al crear', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, contrasena: '' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('contrasena', 'La contraseña es obligatoria.');
    });

    test('Debería retornar 400 si la contraseña tiene menos de 6 caracteres', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, contrasena: 'Ab1' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('contrasena', 'La contraseña debe tener mínimo 6 caracteres.');
    });

    test('Debería retornar 400 si la contraseña no tiene minúscula', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, contrasena: 'CLAVE123' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('contrasena', 'La contraseña debe tener al menos una minúscula.');
    });

    test('Debería retornar 400 si la contraseña no tiene mayúscula', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, contrasena: 'clave123' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('contrasena', 'La contraseña debe tener al menos una mayúscula.');
    });

    test('Debería retornar 400 si la contraseña no tiene número', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, contrasena: 'ClaveSegura' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('contrasena', 'La contraseña debe tener al menos un número.');
    });

    // ── Rol ──────────────────────────────────────────────────────
    test('Debería retornar 400 si no se selecciona rol', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, id_rol: '' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('id_rol', 'Debes seleccionar un rol.');
    });

    test('Debería retornar 400 si el rol no es válido', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, id_rol: 99 });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('id_rol', 'El rol seleccionado no es válido.');
    });

    // ── Dirección ────────────────────────────────────────────────
    test('Debería retornar 400 si la dirección está vacía', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, direccion: '' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('direccion', 'La dirección es obligatoria.');
    });

    test('Debería retornar 400 si la dirección supera 255 caracteres', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, direccion: 'C'.repeat(256) });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('direccion', 'La dirección no puede superar 255 caracteres.');
    });

    // ── Fecha nacimiento ─────────────────────────────────────────
    test('Debería retornar 400 si la fecha de nacimiento está vacía', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, fecha_nacimiento: '' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('fecha_nacimiento', 'La fecha de nacimiento es obligatoria.');
    });

    test('Debería retornar 400 si la fecha de nacimiento es inválida', async () => {
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, fecha_nacimiento: 'fecha-invalida' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('fecha_nacimiento', 'La fecha de nacimiento no es válida.');
    });

    test('Debería retornar 400 si el usuario es menor de 18 años', async () => {
      const hoy = new Date();
      const menor = `${hoy.getFullYear() - 10}-01-01`;
      const res = await request(app).post('/api/usuarios').send({ ...bodyValido, fecha_nacimiento: menor });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('fecha_nacimiento', 'El usuario debe ser mayor de 18 años.');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // POST — flujos principales
  // ──────────────────────────────────────────────────────────────
  describe('POST /api/usuarios', () => {

    test('Debería crear un usuario correctamente', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [usuarioMock] });

      const res = await request(app).post('/api/usuarios').send(bodyValido);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id_usuario');
      expect(res.body.correo).toBe('laura@modamagica.com');
    });

    test('Debería retornar 400 si el correo ya está registrado', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id_usuario: 1 }] });

      const res = await request(app).post('/api/usuarios').send(bodyValido);
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Ya existe un usuario con ese correo.');
    });

    test('Debería retornar 500 si falla la base de datos en create', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error create'));

      const res = await request(app).post('/api/usuarios').send(bodyValido);
      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('error', 'DB error create');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // PUT
  // ──────────────────────────────────────────────────────────────
  describe('PUT /api/usuarios/:id', () => {

    test('Debería actualizar correctamente el usuario sin cambiar contraseña', async () => {
      const actualizado = { ...usuarioMock, primer_nombre: 'Lorena' };
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [usuarioMock] })
        .mockResolvedValueOnce({ rows: [actualizado] });

      const res = await request(app).put('/api/usuarios/1').send({ ...bodyValido, primer_nombre: 'Lorena', contrasena: '' });
      expect(res.statusCode).toBe(200);
      expect(res.body.primer_nombre).toBe('Lorena');
    });

    test('Debería actualizar correctamente el usuario cambiando contraseña', async () => {
      const actualizado = { ...usuarioMock };
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [actualizado] });

      const res = await request(app).put('/api/usuarios/1').send({ ...bodyValido, contrasena: 'NuevaClave1' });
      expect(res.statusCode).toBe(200);
    });

    test('Debería retornar 400 si los datos enviados en PUT son inválidos', async () => {
      const res = await request(app).put('/api/usuarios/1').send({ ...bodyValido, primer_nombre: '', primer_apellido: '' });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('errores');
    });

    // ── Contraseña en edición ────────────────────────────────────
    test('Debería retornar 400 si la contraseña en edición tiene menos de 6 caracteres', async () => {
      const res = await request(app).put('/api/usuarios/1').send({ ...bodyValido, contrasena: 'Ab1' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('contrasena', 'La contraseña debe tener mínimo 6 caracteres.');
    });

    test('Debería retornar 400 si la contraseña en edición no tiene minúscula', async () => {
      const res = await request(app).put('/api/usuarios/1').send({ ...bodyValido, contrasena: 'CLAVE123' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('contrasena', 'La contraseña debe tener al menos una minúscula.');
    });

    test('Debería retornar 400 si la contraseña en edición no tiene mayúscula', async () => {
      const res = await request(app).put('/api/usuarios/1').send({ ...bodyValido, contrasena: 'clave123' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('contrasena', 'La contraseña debe tener al menos una mayúscula.');
    });

    test('Debería retornar 400 si la contraseña en edición no tiene número', async () => {
      const res = await request(app).put('/api/usuarios/1').send({ ...bodyValido, contrasena: 'ClaveSegura' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('contrasena', 'La contraseña debe tener al menos un número.');
    });

    test('Debería retornar 400 si ya existe otro usuario con ese correo en PUT', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id_usuario: 2 }] });

      const res = await request(app).put('/api/usuarios/1').send(bodyValido);
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Ya existe otro usuario con ese correo.');
    });

    test('Debería retornar 404 si el usuario a actualizar no existe al buscar contraseña', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app).put('/api/usuarios/999').send({ ...bodyValido, contrasena: '' });
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'Usuario no encontrado.');
    });

    test('Debería retornar 404 si el UPDATE no encuentra el usuario', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [usuarioMock] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app).put('/api/usuarios/999').send({ ...bodyValido, contrasena: '' });
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'Usuario no encontrado.');
    });

    test('Debería retornar 500 si falla la base de datos en update', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error update'));

      const res = await request(app).put('/api/usuarios/1').send(bodyValido);
      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('error', 'DB error update');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────────────────────
  describe('DELETE /api/usuarios/:id', () => {

    test('Debería eliminar el usuario correctamente', async () => {
      pool.query.mockResolvedValueOnce({ rows: [usuarioMock] });
      const res = await request(app).delete('/api/usuarios/1');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('mensaje', 'Usuario eliminado correctamente.');
    });

    test('Debería retornar 404 si el usuario a eliminar no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).delete('/api/usuarios/999');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'Usuario no encontrado.');
    });

    test('Debería retornar 500 si falla la base de datos en delete', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error delete'));
      const res = await request(app).delete('/api/usuarios/1');
      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('error', 'DB error delete');
    });

  });

  // ──────────────────────────────────────────────────────────────
  // Cobertura de ramas: ternarios y || en controlador
  // ──────────────────────────────────────────────────────────────
  describe('Cobertura de ramas adicionales', () => {

    // Cubre líneas 188-190 (CREATE): ternarios segundo_nombre y segundo_apellido = null
    test('POST: Debería crear usuario sin segundo nombre ni segundo apellido', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [usuarioMock] });

      const res = await request(app).post('/api/usuarios').send({
        ...bodyValido,
        segundo_nombre:   '',
        segundo_apellido: ''
      });
      expect(res.statusCode).toBe(201);
    });

    // Cubre líneas 254-263 (UPDATE): ternarios segundo_nombre y segundo_apellido = null
    // y estado || 'activo' cuando estado viene undefined
    test('PUT: Debería actualizar usuario sin segundo nombre, segundo apellido ni estado', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [usuarioMock] })
        .mockResolvedValueOnce({ rows: [usuarioMock] });

      const { estado, segundo_nombre, segundo_apellido, ...bodyBase } = bodyValido;
      const res = await request(app).put('/api/usuarios/1').send({
        ...bodyBase,
        segundo_nombre:   '',
        segundo_apellido: '',
        contrasena:       ''
      });
      expect(res.statusCode).toBe(200);
    });

    // Cubre línea 123: rama m < 0 (cumpleaños aún no ha llegado este año)
    test('POST: Debería aceptar usuario mayor de 18 años con cumpleaños futuro este año', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [usuarioMock] });

      const hoy = new Date();
      // Mes siguiente para garantizar que m < 0
      const mes = String(hoy.getMonth() + 2).padStart(2, '0');
      const dia = String(hoy.getDate()).padStart(2, '0');
      const fecha = `${hoy.getFullYear() - 20}-${mes}-${dia}`;

      const res = await request(app).post('/api/usuarios').send({
        ...bodyValido,
        fecha_nacimiento: fecha
      });
      expect(res.statusCode).toBe(201);
    });

    // Cubre líneas 28 y 48: segundo_nombre y segundo_apellido con solo espacios (trim = '')
    test('POST: Debería crear usuario con segundo nombre y apellido solo espacios', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [usuarioMock] });

      const res = await request(app).post('/api/usuarios').send({
        ...bodyValido,
        segundo_nombre:   '   ',
        segundo_apellido: '   '
      });
      expect(res.statusCode).toBe(201);
    });

    // Cubre línea 9: llamar validar sin segundo argumento (esEdicion = false por defecto)
    test('POST: Debería validar correctamente con el valor por defecto de esEdicion', async () => {
      const res = await request(app).post('/api/usuarios').send({
        ...bodyValido,
        primer_nombre: ''
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('primer_nombre');
    });

    // Cubre línea 123: rama m === 0 && hoy.getDate() < nacimiento.getDate()
    // Construye una fecha de nacimiento en este mismo mes del año (currentYear - 18),
    // pero con un día MAYOR al de hoy, garantizando que el cumpleaños aún no llegó.
    // Se evita el problema de timezone usando LOCAL date parts y asegurando al menos
    // 2 días de diferencia para que UTC nunca desplace la fecha al día de hoy.
    test('POST: Deberia restar 1 anio si el cumpleanios es este mes pero aun no ha llegado', async () => {
      const hoy = new Date();
      const diaHoy   = hoy.getDate();
      const mesHoy   = hoy.getMonth();     // 0-indexed
      const anioNacimiento = hoy.getFullYear() - 18;

      // Último día del mes actual (usamos año actual; la cantidad de días es igual)
      const ultimoDiaMes = new Date(hoy.getFullYear(), mesHoy + 1, 0).getDate();

      let mes, dia;

      // Necesitamos dia > diaHoy + 1 para evitar que el offset UTC lo retroceda al día de hoy
      if (diaHoy + 2 <= ultimoDiaMes) {
        // Al menos 2 días disponibles adelante en este mes
        mes = mesHoy + 1;        // convertir a 1-indexed para el string
        dia = diaHoy + 2;
      } else if (diaHoy + 1 <= ultimoDiaMes) {
        // Solo 1 día disponible adelante — añadimos +1 pero compensamos con hora fija
        // usando el 1ro del mes siguiente (siempre seguro)
        const siguienteMes = mesHoy + 2; // 1-indexed siguiente mes
        if (siguienteMes > 12) {
          // Estamos en diciembre; usamos el 15 de julio del año de nacimiento
          // (mes arbitrario futuro respecto a cualquier fecha de hoy en diciembre)
          mes = 7;
          dia = 15;
        } else {
          mes = siguienteMes;
          dia = 1;
        }
      } else {
        // Hoy es el último día del mes
        const siguienteMes = mesHoy + 2;
        if (siguienteMes > 12) {
          mes = 7;
          dia = 15;
        } else {
          mes = siguienteMes;
          dia = 1;
        }
      }

      const fecha = `${anioNacimiento}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

      const res = await request(app).post('/api/usuarios').send({
        ...bodyValido,
        fecha_nacimiento: fecha
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.errores).toHaveProperty('fecha_nacimiento', 'El usuario debe ser mayor de 18 años.');
    });

    // Cubre línea 124: rama m === 0 && hoy.getDate() >= nacimiento.getDate()
    // El cumpleaños es este mes pero ya ocurrió (o es hoy) → edad NO se resta → persona tiene exactamente 18
    test('POST: Debería aceptar usuario que cumplió 18 años este mes (cumpleaños ya pasó)', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [usuarioMock] });

      const hoy = new Date();
      const anioNacimiento = hoy.getFullYear() - 18;
      // Usamos el mismo día de hoy pero del año de nacimiento → cumpleaños es HOY → edad = exactamente 18
      const mes  = String(hoy.getMonth() + 1).padStart(2, '0');
      const dia  = String(hoy.getDate()).padStart(2, '0');
      const fecha = `${anioNacimiento}-${mes}-${dia}`;

      const res = await request(app).post('/api/usuarios').send({
        ...bodyValido,
        fecha_nacimiento: fecha
      });
      expect(res.statusCode).toBe(201);
    });

    // Cubre línea 9 rama esEdicion=true: PUT llama validar(body, true)
    test('PUT: Debería aceptar contraseña vacía en edición (esEdicion=true)', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [usuarioMock] })
        .mockResolvedValueOnce({ rows: [usuarioMock] });

      const res = await request(app).put('/api/usuarios/1').send({
        ...bodyValido,
        contrasena: ''
      });
      expect(res.statusCode).toBe(200);
    });

  });

});