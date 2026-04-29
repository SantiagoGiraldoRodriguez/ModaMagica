-- ============================================================
--  MODA MÁGICA — Esquema PostgreSQL Completo
--  Incluye: colores por producto, stock por color, imágenes
-- ============================================================

-- Limpia si ya existía
DROP TABLE IF EXISTS historial_estado_pedido  CASCADE;
DROP TABLE IF EXISTS comprobante_pago         CASCADE;
DROP TABLE IF EXISTS detalle_pedido           CASCADE;
DROP TABLE IF EXISTS detalle_carrito          CASCADE;
DROP TABLE IF EXISTS pedido                   CASCADE;
DROP TABLE IF EXISTS carrito                  CASCADE;
DROP TABLE IF EXISTS descuento_producto       CASCADE;
DROP TABLE IF EXISTS descuento                CASCADE;
DROP TABLE IF EXISTS movimiento_inventario    CASCADE;
DROP TABLE IF EXISTS inventario_color         CASCADE;
DROP TABLE IF EXISTS inventario               CASCADE;
DROP TABLE IF EXISTS imagen_producto          CASCADE;
DROP TABLE IF EXISTS producto_color           CASCADE;
DROP TABLE IF EXISTS color                    CASCADE;
DROP TABLE IF EXISTS producto                 CASCADE;
DROP TABLE IF EXISTS categoria_producto       CASCADE;
DROP TABLE IF EXISTS direccion_envio          CASCADE;
DROP TABLE IF EXISTS usuario                  CASCADE;
DROP TABLE IF EXISTS rol_usuario              CASCADE;


-- ============================================================
--  1. ROL_USUARIO
-- ============================================================
CREATE TABLE rol_usuario (
    id_rol      SERIAL PRIMARY KEY,
    nombre_rol  VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO rol_usuario (id_rol, nombre_rol) VALUES
    (1, 'superAdmin'),
    (2, 'admin'),
    (3, 'cliente'),
    (4, 'bodega'),
    (5, 'soporte');


-- ============================================================
--  2. USUARIO
-- ============================================================
CREATE TABLE usuario (
    id_usuario       SERIAL PRIMARY KEY,
    primer_nombre    VARCHAR(80)  NOT NULL,
    segundo_nombre   VARCHAR(80),
    primer_apellido  VARCHAR(80)  NOT NULL,
    segundo_apellido VARCHAR(80),
    correo           VARCHAR(150) NOT NULL UNIQUE,
    telefono         VARCHAR(20)  NOT NULL UNIQUE,
    contrasena       VARCHAR(255) NOT NULL,
    id_rol           INT          NOT NULL REFERENCES rol_usuario(id_rol),
    estado           VARCHAR(20)  NOT NULL DEFAULT 'activo'
                         CHECK (estado IN ('activo','inactivo')),
    fecha_creacion   TIMESTAMP    NOT NULL DEFAULT NOW()
);

INSERT INTO usuario (id_usuario, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
                     correo, telefono, contrasena, id_rol, estado, fecha_creacion) VALUES
    (1, 'Carlos',   'Andrés',  'Gómez',    'Ruiz',    'carlos.gomez@mail.com',   '3001234567', 'Hashed$1234', 1, 'activo', '2025-01-10'),
    (2, 'María',    NULL,      'López',    'Torres',  'maria.lopez@mail.com',    '3109876543', 'Hashed$5678', 3, 'activo', '2025-02-14'),
    (3, 'Andrés',   'Felipe',  'Martínez', 'Cruz',    'andres.m@mail.com',       '3202345678', 'Hashed$9012', 3, 'activo', '2025-02-20'),
    (4, 'Lucía',    'Fernanda','Herrera',  NULL,      'lucia.herrera@mail.com',  '3157654321', 'Hashed$3456', 2, 'activo', '2025-03-01'),
    (5, 'Diego',    NULL,      'Ramírez',  'Vega',    'diego.ramirez@mail.com',  '3013456789', 'Hashed$7890', 3, 'activo', '2025-03-05'),
    (6, 'Valentina','Sofía',   'Torres',   'Ossa',    'valentina.t@mail.com',    '3124567890', 'Hashed$2345', 3, 'activo', '2025-03-10');


-- ============================================================
--  3. DIRECCIÓN DE ENVÍO
-- ============================================================
CREATE TABLE direccion_envio (
    id_direccion       SERIAL PRIMARY KEY,
    id_usuario         INT          NOT NULL REFERENCES usuario(id_usuario),
    departamento       VARCHAR(80)  NOT NULL,
    ciudad             VARCHAR(80)  NOT NULL,
    direccion          VARCHAR(200) NOT NULL,
    codigo_postal      VARCHAR(20),
    es_predeterminada  SMALLINT     NOT NULL DEFAULT 0 CHECK (es_predeterminada IN (0,1)),
    activa             SMALLINT     NOT NULL DEFAULT 1 CHECK (activa IN (0,1))
);

INSERT INTO direccion_envio VALUES
    (1, 1, 'Cundinamarca', 'Bogotá',    'Calle 12 # 5-20, Apto 301',      '110111', 1, 1),
    (2, 2, 'Cundinamarca', 'Bogotá',    'Av. 68 # 22-15, Casa 4',         '110221', 1, 1),
    (3, 3, 'Antioquia',    'Medellín',  'Cra 43A # 11-100, Apto 502',     '050021', 1, 1),
    (4, 4, 'Valle',        'Cali',      'Calle 5 # 38-25, Apto 301',      '760001', 1, 1),
    (5, 5, 'Atlántico',    'Barranquilla','Cra 46 # 79-50, Casa 12',      '080001', 1, 1),
    (6, 6, 'Santander',    'Bucaramanga','Calle 35 # 28-45, Apto 203',    '680001', 1, 1);


-- ============================================================
--  4. CATEGORÍA DE PRODUCTO
-- ============================================================
CREATE TABLE categoria_producto (
    id_categoria      SERIAL PRIMARY KEY,
    nombre_categoria  VARCHAR(100) NOT NULL UNIQUE,
    descripcion       TEXT
);

INSERT INTO categoria_producto VALUES
    (1, 'Ropa Deportiva',   'Prendas para deporte y actividad física'),
    (2, 'Accesorios',       'Accesorios de moda y uso diario'),
    (3, 'Hogar y Cocina',   'Artículos para el hogar y la cocina'),
    (4, 'Tecnología',       'Dispositivos electrónicos y gadgets'),
    (5, 'Textiles Hogar',   'Sábanas, cobijas, tendidos y ropa de cama'),
    (6, 'Calzado',          'Calzado deportivo y casual'),
    (7, 'Joyería',          'Bisutería y joyería de moda');


-- ============================================================
--  5. PRODUCTO
-- ============================================================
CREATE TABLE producto (
    id_producto       SERIAL PRIMARY KEY,
    nombre_producto   VARCHAR(150) NOT NULL,
    id_categoria      INT          NOT NULL REFERENCES categoria_producto(id_categoria),
    descripcion       TEXT,
    precio_unitario   NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0),
    maneja_serial     SMALLINT     NOT NULL DEFAULT 0 CHECK (maneja_serial IN (0,1)),
    estado            VARCHAR(20)  NOT NULL DEFAULT 'activo'
                          CHECK (estado IN ('activo','inactivo'))
);

INSERT INTO producto VALUES
    (1,  'Pantaloneta',     1, 'Pantaloneta deportiva unisex',             45000,  0, 'activo'),
    (2,  'Reloj',           2, 'Reloj análogo de moda',                   120000,  0, 'activo'),
    (3,  'Olla a presión',  3, 'Olla a presión 4 litros acero inoxidable',185000,  0, 'activo'),
    (4,  'Medias',          1, 'Pack x3 medias deportivas',                18000,  0, 'activo'),
    (5,  'Parlante',        4, 'Parlante Bluetooth portátil',              95000,  1, 'activo'),
    (6,  'Tendido',         5, 'Tendido doble estampado floral',           75000,  0, 'activo'),
    (7,  'Dron',            4, 'Dron con cámara HD',                      450000, 1, 'activo'),
    (8,  'Camiseta',        1, 'Camiseta deportiva de secado rápido',      35000,  0, 'activo'),
    (9,  'Tenis',           6, 'Tenis deportivos unisex',                 150000,  0, 'activo'),
    (10, 'Pulsera',         7, 'Pulsera de acero inoxidable ajustable',    28000,  0, 'activo');


-- ============================================================
--  6. COLOR  (catálogo global de colores)
-- ============================================================
CREATE TABLE color (
    id_color     SERIAL PRIMARY KEY,
    nombre_color VARCHAR(50)  NOT NULL UNIQUE,
    hex_code     CHAR(7)               -- p.ej. '#FF5733'
);

INSERT INTO color (nombre_color, hex_code) VALUES
    ('Negro',    '#000000'),
    ('Blanco',   '#FFFFFF'),
    ('Rojo',     '#FF0000'),
    ('Azul',     '#0000FF'),
    ('Verde',    '#008000'),
    ('Amarillo', '#FFFF00'),
    ('Gris',     '#808080'),
    ('Rosa',     '#FFC0CB'),
    ('Naranja',  '#FFA500'),
    ('Morado',   '#800080'),
    ('Café',     '#6F4E37'),
    ('Beige',    '#F5F5DC'),
    ('Turquesa', '#40E0D0'),
    ('Plateado', '#C0C0C0'),
    ('Dorado',   '#FFD700');


-- ============================================================
--  7. PRODUCTO_COLOR  (qué colores maneja cada producto)
--     Tabla pivote: un producto puede tener N colores
-- ============================================================
CREATE TABLE producto_color (
    id_producto_color SERIAL PRIMARY KEY,
    id_producto       INT NOT NULL REFERENCES producto(id_producto)  ON DELETE CASCADE,
    id_color          INT NOT NULL REFERENCES color(id_color),
    UNIQUE (id_producto, id_color)
);

-- Pantaloneta: Negro, Azul, Verde, Gris
INSERT INTO producto_color (id_producto, id_color) VALUES
    (1, 1),(1, 4),(1, 5),(1, 7);
-- Reloj: Negro, Plateado, Dorado
INSERT INTO producto_color (id_producto, id_color) VALUES
    (2, 1),(2, 14),(2, 15);
-- Olla: solo Plateado
INSERT INTO producto_color (id_producto, id_color) VALUES
    (3, 14);
-- Medias: Negro, Blanco, Gris
INSERT INTO producto_color (id_producto, id_color) VALUES
    (4, 1),(4, 2),(4, 7);
-- Parlante: Negro, Azul, Rojo
INSERT INTO producto_color (id_producto, id_color) VALUES
    (5, 1),(5, 4),(5, 3);
-- Tendido: Beige, Rosa, Turquesa
INSERT INTO producto_color (id_producto, id_color) VALUES
    (6, 12),(6, 8),(6, 13);
-- Dron: Negro, Gris
INSERT INTO producto_color (id_producto, id_color) VALUES
    (7, 1),(7, 7);
-- Camiseta: Negro, Blanco, Azul, Rojo, Verde
INSERT INTO producto_color (id_producto, id_color) VALUES
    (8, 1),(8, 2),(8, 4),(8, 3),(8, 5);
-- Tenis: Negro, Blanco, Azul
INSERT INTO producto_color (id_producto, id_color) VALUES
    (9, 1),(9, 2),(9, 4);
-- Pulsera: Plateado, Dorado, Negro
INSERT INTO producto_color (id_producto, id_color) VALUES
    (10, 14),(10, 15),(10, 1);


-- ============================================================
--  8. INVENTARIO  (stock general por producto — mantiene
--     compatibilidad con la BD original)
-- ============================================================
CREATE TABLE inventario (
    id_inventario        SERIAL PRIMARY KEY,
    id_producto          INT  NOT NULL UNIQUE REFERENCES producto(id_producto),
    stock_minimo         INT  NOT NULL DEFAULT 0,
    stock_maximo         INT  NOT NULL DEFAULT 0,
    ultima_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO inventario (id_producto, stock_minimo, stock_maximo, ultima_actualizacion) VALUES
    (1,  10, 200, '2026-03-12'),
    (2,   5,  50, '2026-03-12'),
    (3,   3,  30, '2026-03-12'),
    (4,  20, 300, '2026-03-12'),
    (5,   5,  80, '2026-03-12'),
    (6,   5, 100, '2026-03-12'),
    (7,   2,  20, '2026-03-12'),
    (8,  15, 250, '2026-03-12'),
    (9,   8, 120, '2026-03-12'),
    (10, 10, 200, '2026-03-12');


-- ============================================================
--  9. INVENTARIO_COLOR  (stock REAL por producto + color)
--     Esta tabla es la fuente de verdad para disponibilidad
-- ============================================================
CREATE TABLE inventario_color (
    id_inv_color         SERIAL PRIMARY KEY,
    id_producto_color    INT  NOT NULL UNIQUE REFERENCES producto_color(id_producto_color),
    stock_actual         INT  NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    ultima_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Stock por color — Pantaloneta (pc_id 1-4)
INSERT INTO inventario_color (id_producto_color, stock_actual) VALUES
    (1, 12),(2, 8),(3, 15),(4, 10);
-- Reloj (pc_id 5-7)
INSERT INTO inventario_color (id_producto_color, stock_actual) VALUES
    (5, 6),(6, 7),(7, 5);
-- Olla (pc_id 8)
INSERT INTO inventario_color (id_producto_color, stock_actual) VALUES
    (8, 9);
-- Medias (pc_id 9-11)
INSERT INTO inventario_color (id_producto_color, stock_actual) VALUES
    (9, 30),(10, 25),(11, 20);
-- Parlante (pc_id 12-14)
INSERT INTO inventario_color (id_producto_color, stock_actual) VALUES
    (12, 10),(13, 8),(14, 6);
-- Tendido (pc_id 15-17)
INSERT INTO inventario_color (id_producto_color, stock_actual) VALUES
    (15, 12),(16, 9),(17, 7);
-- Dron (pc_id 18-19)
INSERT INTO inventario_color (id_producto_color, stock_actual) VALUES
    (18, 4),(19, 3);
-- Camiseta (pc_id 20-24)
INSERT INTO inventario_color (id_producto_color, stock_actual) VALUES
    (20, 20),(21, 18),(22, 15),(23, 12),(24, 10);
-- Tenis (pc_id 25-27)
INSERT INTO inventario_color (id_producto_color, stock_actual) VALUES
    (25, 14),(26, 12),(27, 10);
-- Pulsera (pc_id 28-30)
INSERT INTO inventario_color (id_producto_color, stock_actual) VALUES
    (28, 22),(29, 18),(30, 15);


-- ============================================================
--  10. IMAGEN_PRODUCTO  (múltiples imágenes por producto)
-- ============================================================
CREATE TABLE imagen_producto (
    id_imagen      SERIAL PRIMARY KEY,
    id_producto    INT          NOT NULL REFERENCES producto(id_producto) ON DELETE CASCADE,
    id_color       INT                   REFERENCES color(id_color),     -- NULL = imagen genérica
    url_imagen     VARCHAR(500) NOT NULL,
    nombre_archivo VARCHAR(200),
    orden          SMALLINT     NOT NULL DEFAULT 1,   -- 1 = imagen principal
    es_principal   SMALLINT     NOT NULL DEFAULT 0 CHECK (es_principal IN (0,1)),
    alt_text       VARCHAR(200),
    fecha_carga    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Pantaloneta
INSERT INTO imagen_producto (id_producto, id_color, url_imagen, nombre_archivo, orden, es_principal, alt_text) VALUES
    (1, NULL, '/uploads/productos/pantaloneta_principal.jpg',  'pantaloneta_principal.jpg',  1, 1, 'Pantaloneta deportiva unisex'),
    (1, 1,    '/uploads/productos/pantaloneta_negra.jpg',      'pantaloneta_negra.jpg',       2, 0, 'Pantaloneta color negro'),
    (1, 4,    '/uploads/productos/pantaloneta_azul.jpg',       'pantaloneta_azul.jpg',        3, 0, 'Pantaloneta color azul'),
    (1, 5,    '/uploads/productos/pantaloneta_verde.jpg',      'pantaloneta_verde.jpg',       4, 0, 'Pantaloneta color verde'),
    (1, 7,    '/uploads/productos/pantaloneta_gris.jpg',       'pantaloneta_gris.jpg',        5, 0, 'Pantaloneta color gris');
-- Reloj
INSERT INTO imagen_producto (id_producto, id_color, url_imagen, nombre_archivo, orden, es_principal, alt_text) VALUES
    (2, NULL, '/uploads/productos/reloj_principal.jpg',   'reloj_principal.jpg',  1, 1, 'Reloj análogo de moda'),
    (2, 1,    '/uploads/productos/reloj_negro.jpg',       'reloj_negro.jpg',      2, 0, 'Reloj color negro'),
    (2, 14,   '/uploads/productos/reloj_plateado.jpg',    'reloj_plateado.jpg',   3, 0, 'Reloj color plateado'),
    (2, 15,   '/uploads/productos/reloj_dorado.jpg',      'reloj_dorado.jpg',     4, 0, 'Reloj color dorado');
-- Olla
INSERT INTO imagen_producto (id_producto, id_color, url_imagen, nombre_archivo, orden, es_principal, alt_text) VALUES
    (3, NULL, '/uploads/productos/olla_principal.jpg', 'olla_principal.jpg', 1, 1, 'Olla a presión 4 litros'),
    (3, NULL, '/uploads/productos/olla_detalle.jpg',   'olla_detalle.jpg',   2, 0, 'Detalle tapa y válvula');
-- Parlante
INSERT INTO imagen_producto (id_producto, id_color, url_imagen, nombre_archivo, orden, es_principal, alt_text) VALUES
    (5, NULL, '/uploads/productos/parlante_principal.jpg', 'parlante_principal.jpg', 1, 1, 'Parlante Bluetooth portátil'),
    (5, 1,    '/uploads/productos/parlante_negro.jpg',     'parlante_negro.jpg',     2, 0, 'Parlante color negro'),
    (5, 4,    '/uploads/productos/parlante_azul.jpg',      'parlante_azul.jpg',      3, 0, 'Parlante color azul'),
    (5, 3,    '/uploads/productos/parlante_rojo.jpg',      'parlante_rojo.jpg',      4, 0, 'Parlante color rojo');
-- Camiseta
INSERT INTO imagen_producto (id_producto, id_color, url_imagen, nombre_archivo, orden, es_principal, alt_text) VALUES
    (8, NULL, '/uploads/productos/camiseta_principal.jpg', 'camiseta_principal.jpg', 1, 1, 'Camiseta deportiva'),
    (8, 1,    '/uploads/productos/camiseta_negra.jpg',     'camiseta_negra.jpg',     2, 0, 'Camiseta negra'),
    (8, 2,    '/uploads/productos/camiseta_blanca.jpg',    'camiseta_blanca.jpg',    3, 0, 'Camiseta blanca'),
    (8, 4,    '/uploads/productos/camiseta_azul.jpg',      'camiseta_azul.jpg',      4, 0, 'Camiseta azul');


-- ============================================================
--  11. DESCUENTO
-- ============================================================
CREATE TABLE descuento (
    id_descuento     SERIAL PRIMARY KEY,
    codigo           VARCHAR(30)  NOT NULL UNIQUE,
    descripcion      TEXT,
    tipo_descuento   VARCHAR(20)  NOT NULL CHECK (tipo_descuento IN ('porcentaje','valor_fijo')),
    valor_descuento  NUMERIC(12,2) NOT NULL CHECK (valor_descuento >= 0),
    fecha_inicio     TIMESTAMP    NOT NULL,
    fecha_cierre     TIMESTAMP    NOT NULL,
    limite_usos      INT          NOT NULL DEFAULT 0,
    usos_actuales    INT          NOT NULL DEFAULT 0,
    estado           VARCHAR(20)  NOT NULL DEFAULT 'activo'
                         CHECK (estado IN ('activo','inactivo','expirado'))
);

INSERT INTO descuento VALUES
    (1, 'VERANO20',     'Descuento temporada verano',      'porcentaje',  0.20, '2025-01-01', '2025-06-30', 500, 134, 'expirado'),
    (2, 'BIENVENIDA10', 'Descuento nuevos clientes',       'porcentaje',  0.10, '2025-01-01', '2025-12-31', 200,  87, 'expirado'),
    (3, 'CYBER15',      'Descuento Cyber Monday',          'porcentaje',  0.15, '2025-11-01', '2025-11-30', 1000, 0, 'expirado'),
    (4, 'PROMO2026',    'Promoción arranque año',          'porcentaje',  0.12, '2026-01-01', '2026-03-31',  300, 42, 'activo'),
    (5, 'ENVIOGRATIS',  'Envío gratis en compras > 100k',  'valor_fijo', 15000, '2026-02-01', '2026-04-30',  500, 78, 'activo');


-- ============================================================
--  12. DESCUENTO_PRODUCTO  (descuentos aplicables por producto)
-- ============================================================
CREATE TABLE descuento_producto (
    id              SERIAL PRIMARY KEY,
    id_descuento    INT NOT NULL REFERENCES descuento(id_descuento),
    id_producto     INT NOT NULL REFERENCES producto(id_producto),
    UNIQUE (id_descuento, id_producto)
);

INSERT INTO descuento_producto (id_descuento, id_producto) VALUES
    (1,1),(1,2),(1,4),(1,6),
    (2,1),(2,2),(2,3),(2,5),
    (4,1),(4,8),(4,9),
    (5,3),(5,7);


-- ============================================================
--  13. CARRITO
-- ============================================================
CREATE TABLE carrito (
    id_carrito          SERIAL PRIMARY KEY,
    id_usuario          INT NOT NULL REFERENCES usuario(id_usuario),
    fecha_creacion      TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),
    estado              VARCHAR(20) NOT NULL DEFAULT 'activo'
                            CHECK (estado IN ('activo','convertido','abandonado')),
    id_descuento        INT REFERENCES descuento(id_descuento)
);

INSERT INTO carrito VALUES
    (1, 2, '2026-03-10', '2026-03-10', 'convertido', 1),
    (2, 3, '2026-03-11', '2026-03-11', 'convertido', NULL),
    (3, 5, '2026-03-12', '2026-03-12', 'activo',     4),
    (4, 6, '2026-03-13', '2026-03-13', 'activo',     NULL);


-- ============================================================
--  14. DETALLE_CARRITO  (ahora referencia producto_color)
-- ============================================================
CREATE TABLE detalle_carrito (
    id_det_carrito    SERIAL PRIMARY KEY,
    id_carrito        INT           NOT NULL REFERENCES carrito(id_carrito),
    id_producto_color INT           NOT NULL REFERENCES producto_color(id_producto_color),
    cantidad          INT           NOT NULL CHECK (cantidad > 0),
    precio_guardado   NUMERIC(12,2) NOT NULL CHECK (precio_guardado >= 0),
    subtotal          NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * precio_guardado) STORED
);

-- Carrito 1: Pantaloneta Negra x2, Reloj Plateado x1
INSERT INTO detalle_carrito (id_carrito, id_producto_color, cantidad, precio_guardado) VALUES
    (1, 1,  2, 45000),
    (1, 6,  1, 120000);
-- Carrito 2: Medias Negras x3, Parlante Azul x1
INSERT INTO detalle_carrito (id_carrito, id_producto_color, cantidad, precio_guardado) VALUES
    (2, 9,  3, 18000),
    (2, 13, 1, 95000);
-- Carrito 3 (activo): Camiseta Azul x2
INSERT INTO detalle_carrito (id_carrito, id_producto_color, cantidad, precio_guardado) VALUES
    (3, 22, 2, 35000);


-- ============================================================
--  15. PEDIDO
-- ============================================================
CREATE TABLE pedido (
    id_pedido          SERIAL PRIMARY KEY,
    id_cliente         INT           NOT NULL REFERENCES usuario(id_usuario),
    id_direccion       INT           NOT NULL REFERENCES direccion_envio(id_direccion),
    fecha_pedido       TIMESTAMP     NOT NULL DEFAULT NOW(),
    estado_pedido      VARCHAR(30)   NOT NULL DEFAULT 'pendiente'
                           CHECK (estado_pedido IN
                               ('pendiente','procesando','enviado','entregado','cancelado')),
    id_descuento       INT           REFERENCES descuento(id_descuento),
    descuento_aplicado NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_pedido       NUMERIC(12,2) NOT NULL,
    total_final        NUMERIC(12,2) NOT NULL
);

INSERT INTO pedido VALUES
    (1, 2, 1, '2026-03-01', 'entregado',   1, 50000,  210000, 160000),
    (2, 3, 3, '2026-03-05', 'procesando',  2, 18000,  216000, 198000),
    (3, 5, 5, '2026-03-08', 'enviado',     NULL, 0,   180000, 180000),
    (4, 6, 6, '2026-03-10', 'pendiente',   4, 12600,  105000,  92400);


-- ============================================================
--  16. DETALLE_PEDIDO  (ahora referencia producto_color)
-- ============================================================
CREATE TABLE detalle_pedido (
    id_detalle        SERIAL PRIMARY KEY,
    id_pedido         INT           NOT NULL REFERENCES pedido(id_pedido),
    id_producto_color INT           NOT NULL REFERENCES producto_color(id_producto_color),
    cantidad          INT           NOT NULL CHECK (cantidad > 0),
    precio_vendido    NUMERIC(12,2) NOT NULL,
    subtotal          NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * precio_vendido) STORED
);

INSERT INTO detalle_pedido (id_pedido, id_producto_color, cantidad, precio_vendido) VALUES
    (1, 1,  2, 45000),
    (1, 6,  1, 120000),
    (2, 9,  3, 18000),
    (2, 13, 1, 95000),
    (3, 22, 2, 35000),
    (3, 25, 1, 150000),
    (4, 8,  1, 35000),
    (4, 29, 2, 28000);


-- ============================================================
--  17. COMPROBANTE_PAGO
-- ============================================================
CREATE TABLE comprobante_pago (
    id_comprobante       SERIAL PRIMARY KEY,
    id_pedido            INT          NOT NULL UNIQUE REFERENCES pedido(id_pedido),
    nombre_archivo       VARCHAR(200) NOT NULL,
    tipo_archivo         VARCHAR(10)  NOT NULL CHECK (tipo_archivo IN ('jpg','png','pdf')),
    url_archivo          VARCHAR(500) NOT NULL,
    fecha_envio          TIMESTAMP    NOT NULL DEFAULT NOW(),
    estado_verificacion  VARCHAR(20)  NOT NULL DEFAULT 'pendiente'
                             CHECK (estado_verificacion IN ('pendiente','verificado','rechazado')),
    fecha_verificacion   TIMESTAMP,
    id_admin_verifica    INT          REFERENCES usuario(id_usuario),
    observacion_admin    TEXT
);

INSERT INTO comprobante_pago VALUES
    (1, 1, 'comp_pedido1.jpg', 'jpg', '/uploads/comprobantes/comp_pedido1.jpg', '2026-03-01 09:15', 'verificado', '2026-03-01 10:00', 4, 'Pago confirmado'),
    (2, 2, 'comp_pedido2.png', 'png', '/uploads/comprobantes/comp_pedido2.png', '2026-03-05 11:30', 'verificado', '2026-03-05 12:00', 4, 'Aprobado'),
    (3, 3, 'comp_pedido3.pdf', 'pdf', '/uploads/comprobantes/comp_pedido3.pdf', '2026-03-08 14:00', 'verificado', '2026-03-08 15:00', 4, 'Aprobado'),
    (4, 4, 'comp_pedido4.jpg', 'jpg', '/uploads/comprobantes/comp_pedido4.jpg', '2026-03-10 09:00', 'pendiente',  NULL,               NULL, NULL);


-- ============================================================
--  18. MOVIMIENTO_INVENTARIO
-- ============================================================
CREATE TABLE movimiento_inventario (
    id_movimiento     SERIAL PRIMARY KEY,
    id_producto_color INT          NOT NULL REFERENCES producto_color(id_producto_color),
    tipo              VARCHAR(20)  NOT NULL CHECK (tipo IN ('entrada','salida','ajuste')),
    cantidad          INT          NOT NULL,
    fecha             TIMESTAMP    NOT NULL DEFAULT NOW(),
    id_pedido         INT          REFERENCES pedido(id_pedido),
    motivo            VARCHAR(200) NOT NULL,
    id_usuario        INT          NOT NULL REFERENCES usuario(id_usuario)
);

INSERT INTO movimiento_inventario (id_producto_color, tipo, cantidad, fecha, id_pedido, motivo, id_usuario) VALUES
    (1,  'entrada', 50, '2026-01-05', NULL, 'Compra proveedor inicial', 4),
    (18, 'entrada',  5, '2026-01-05', NULL, 'Compra proveedor inicial', 4),
    (1,  'salida',   2, '2026-03-01', 1,    'Venta pedido #1',          4),
    (6,  'salida',   1, '2026-03-01', 1,    'Venta pedido #1',          4),
    (9,  'salida',   3, '2026-03-05', 2,    'Venta pedido #2',          4),
    (13, 'salida',   1, '2026-03-05', 2,    'Venta pedido #2',          4);


-- ============================================================
--  19. HISTORIAL_ESTADO_PEDIDO
-- ============================================================
CREATE TABLE historial_estado_pedido (
    id_historial        SERIAL PRIMARY KEY,
    id_pedido           INT          NOT NULL REFERENCES pedido(id_pedido),
    estado_anterior     VARCHAR(30),
    estado_nuevo        VARCHAR(30)  NOT NULL,
    fecha_cambio        TIMESTAMP    NOT NULL DEFAULT NOW(),
    id_usuario_cambio   INT          NOT NULL REFERENCES usuario(id_usuario),
    observacion         TEXT
);

INSERT INTO historial_estado_pedido (id_pedido, estado_anterior, estado_nuevo, fecha_cambio, id_usuario_cambio) VALUES
    (1, NULL,         'pendiente',  '2026-03-01 09:00', 2),
    (1, 'pendiente',  'procesando', '2026-03-01 10:30', 4),
    (1, 'procesando', 'enviado',    '2026-03-02 08:00', 4),
    (1, 'enviado',    'entregado',  '2026-03-04 15:00', 4),
    (2, NULL,         'pendiente',  '2026-03-05 11:00', 3),
    (2, 'pendiente',  'procesando', '2026-03-05 12:30', 4),
    (3, NULL,         'pendiente',  '2026-03-08 13:00', 5),
    (3, 'pendiente',  'procesando', '2026-03-08 15:00', 4),
    (3, 'procesando', 'enviado',    '2026-03-09 08:00', 4),
    (4, NULL,         'pendiente',  '2026-03-10 09:00', 6);


-- ============================================================
--  VISTAS ÚTILES
-- ============================================================

-- Stock disponible por producto y color
CREATE OR REPLACE VIEW v_stock_por_color AS
SELECT
    p.id_producto,
    p.nombre_producto,
    c.nombre_color,
    c.hex_code,
    ic.stock_actual,
    i.stock_minimo,
    i.stock_maximo,
    CASE WHEN ic.stock_actual <= i.stock_minimo THEN 'BAJO' ELSE 'OK' END AS alerta_stock
FROM inventario_color ic
JOIN producto_color pc ON pc.id_producto_color = ic.id_producto_color
JOIN producto p         ON p.id_producto        = pc.id_producto
JOIN color c            ON c.id_color           = pc.id_color
JOIN inventario i       ON i.id_producto        = p.id_producto
ORDER BY p.nombre_producto, c.nombre_color;

-- Imágenes de un producto con su color
CREATE OR REPLACE VIEW v_imagenes_producto AS
SELECT
    p.id_producto,
    p.nombre_producto,
    img.id_imagen,
    img.url_imagen,
    img.orden,
    img.es_principal,
    img.alt_text,
    COALESCE(c.nombre_color, 'Genérica') AS color,
    c.hex_code
FROM imagen_producto img
JOIN producto p      ON p.id_producto = img.id_producto
LEFT JOIN color c    ON c.id_color    = img.id_color
ORDER BY p.nombre_producto, img.orden;

-- Resumen de pedidos con detalle de color
CREATE OR REPLACE VIEW v_detalle_pedidos AS
SELECT
    ped.id_pedido,
    u.primer_nombre || ' ' || u.primer_apellido AS cliente,
    p.nombre_producto,
    co.nombre_color,
    dp.cantidad,
    dp.precio_vendido,
    dp.subtotal,
    ped.estado_pedido,
    ped.fecha_pedido
FROM detalle_pedido dp
JOIN pedido ped         ON ped.id_pedido          = dp.id_pedido
JOIN usuario u          ON u.id_usuario            = ped.id_cliente
JOIN producto_color pc  ON pc.id_producto_color    = dp.id_producto_color
JOIN producto p         ON p.id_producto           = pc.id_producto
JOIN color co           ON co.id_color             = pc.id_color
ORDER BY ped.id_pedido;
