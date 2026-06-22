--
-- PostgreSQL database dump
--

\restrict IwbHS0sChyfcmj7tVvYSTAlrp3EGrs0m61mXmCTkjLXeD6LECHh9wZPZelhYyTQ

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: fn_update_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_update_timestamp() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categoria_producto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categoria_producto (
    id_categoria integer NOT NULL,
    nombre_categoria character varying(100) NOT NULL,
    descripcion character varying(255) NOT NULL,
    estado character varying(20) DEFAULT 'activo'::character varying NOT NULL,
    CONSTRAINT categoria_producto_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying])::text[])))
);


ALTER TABLE public.categoria_producto OWNER TO postgres;

--
-- Name: categoria_producto_id_categoria_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categoria_producto_id_categoria_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categoria_producto_id_categoria_seq OWNER TO postgres;

--
-- Name: categoria_producto_id_categoria_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categoria_producto_id_categoria_seq OWNED BY public.categoria_producto.id_categoria;


--
-- Name: color; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.color (
    id_color integer NOT NULL,
    nombre_color character varying(50) NOT NULL,
    hex_code character(7)
);


ALTER TABLE public.color OWNER TO postgres;

--
-- Name: color_id_color_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.color_id_color_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.color_id_color_seq OWNER TO postgres;

--
-- Name: color_id_color_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.color_id_color_seq OWNED BY public.color.id_color;


--
-- Name: descuentos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.descuentos (
    id_descuento integer NOT NULL,
    codigo character varying(50) NOT NULL,
    descripcion text NOT NULL,
    valor_descuento numeric(5,2) NOT NULL,
    limite_usos integer NOT NULL,
    usos_actuales integer DEFAULT 0 NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_cierre date NOT NULL,
    estado character varying(10) DEFAULT 'activo'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    prendas_ids integer[] DEFAULT '{}'::integer[],
    CONSTRAINT chk_fechas CHECK ((fecha_cierre >= fecha_inicio)),
    CONSTRAINT chk_usos_limite CHECK ((usos_actuales <= limite_usos)),
    CONSTRAINT descuentos_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying, 'vencido'::character varying])::text[]))),
    CONSTRAINT descuentos_limite_usos_check CHECK ((limite_usos > 0)),
    CONSTRAINT descuentos_usos_actuales_check CHECK ((usos_actuales >= 0)),
    CONSTRAINT descuentos_valor_descuento_check CHECK (((valor_descuento >= (1)::numeric) AND (valor_descuento <= (25)::numeric)))
);


ALTER TABLE public.descuentos OWNER TO postgres;

--
-- Name: descuentos_id_descuento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.descuentos_id_descuento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.descuentos_id_descuento_seq OWNER TO postgres;

--
-- Name: descuentos_id_descuento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.descuentos_id_descuento_seq OWNED BY public.descuentos.id_descuento;


--
-- Name: descuentos_usos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.descuentos_usos (
    id integer NOT NULL,
    id_descuento integer NOT NULL,
    id_usuario integer NOT NULL,
    fecha_uso timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.descuentos_usos OWNER TO postgres;

--
-- Name: descuentos_usos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.descuentos_usos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.descuentos_usos_id_seq OWNER TO postgres;

--
-- Name: descuentos_usos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.descuentos_usos_id_seq OWNED BY public.descuentos_usos.id;


--
-- Name: detalle_pedido; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_pedido (
    id_detalle integer NOT NULL,
    id_pedido integer NOT NULL,
    id_producto_color integer NOT NULL,
    cantidad integer NOT NULL,
    precio_vendido numeric(12,2) NOT NULL,
    subtotal numeric(12,2) GENERATED ALWAYS AS (((cantidad)::numeric * precio_vendido)) STORED,
    CONSTRAINT detalle_pedido_cantidad_check CHECK ((cantidad > 0))
);


ALTER TABLE public.detalle_pedido OWNER TO postgres;

--
-- Name: detalle_pedido_id_detalle_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalle_pedido_id_detalle_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalle_pedido_id_detalle_seq OWNER TO postgres;

--
-- Name: detalle_pedido_id_detalle_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_pedido_id_detalle_seq OWNED BY public.detalle_pedido.id_detalle;


--
-- Name: direccion_envio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.direccion_envio (
    id_direccion integer NOT NULL,
    id_usuario integer NOT NULL,
    direccion character varying(200) NOT NULL,
    codigo_postal character varying(20),
    es_predeterminada smallint DEFAULT 0 NOT NULL,
    activa smallint DEFAULT 1 NOT NULL,
    CONSTRAINT direccion_envio_activa_check CHECK ((activa = ANY (ARRAY[0, 1]))),
    CONSTRAINT direccion_envio_es_predeterminada_check CHECK ((es_predeterminada = ANY (ARRAY[0, 1])))
);


ALTER TABLE public.direccion_envio OWNER TO postgres;

--
-- Name: direccion_envio_id_direccion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.direccion_envio_id_direccion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.direccion_envio_id_direccion_seq OWNER TO postgres;

--
-- Name: direccion_envio_id_direccion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.direccion_envio_id_direccion_seq OWNED BY public.direccion_envio.id_direccion;


--
-- Name: historial_estado_pedido; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historial_estado_pedido (
    id_historial integer NOT NULL,
    id_pedido integer NOT NULL,
    estado_anterior character varying(30),
    estado_nuevo character varying(30) NOT NULL,
    fecha_cambio timestamp without time zone DEFAULT now() NOT NULL,
    id_usuario_cambio integer NOT NULL,
    observacion text
);


ALTER TABLE public.historial_estado_pedido OWNER TO postgres;

--
-- Name: historial_estado_pedido_id_historial_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.historial_estado_pedido_id_historial_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historial_estado_pedido_id_historial_seq OWNER TO postgres;

--
-- Name: historial_estado_pedido_id_historial_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.historial_estado_pedido_id_historial_seq OWNED BY public.historial_estado_pedido.id_historial;


--
-- Name: imagen_producto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.imagen_producto (
    id_imagen integer NOT NULL,
    id_producto integer NOT NULL,
    id_color integer,
    url_imagen character varying(500) NOT NULL,
    nombre_archivo character varying(200),
    orden smallint DEFAULT 1 NOT NULL,
    es_principal smallint DEFAULT 0 NOT NULL,
    alt_text character varying(200),
    fecha_carga timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT imagen_producto_es_principal_check CHECK ((es_principal = ANY (ARRAY[0, 1])))
);


ALTER TABLE public.imagen_producto OWNER TO postgres;

--
-- Name: imagen_producto_id_imagen_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.imagen_producto_id_imagen_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.imagen_producto_id_imagen_seq OWNER TO postgres;

--
-- Name: imagen_producto_id_imagen_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.imagen_producto_id_imagen_seq OWNED BY public.imagen_producto.id_imagen;


--
-- Name: inventario_color; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventario_color (
    id_inv_color integer NOT NULL,
    id_producto_color integer NOT NULL,
    stock_actual integer DEFAULT 0 NOT NULL,
    ultima_actualizacion timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT inventario_color_stock_actual_check CHECK ((stock_actual >= 0))
);


ALTER TABLE public.inventario_color OWNER TO postgres;

--
-- Name: inventario_color_id_inv_color_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventario_color_id_inv_color_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventario_color_id_inv_color_seq OWNER TO postgres;

--
-- Name: inventario_color_id_inv_color_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventario_color_id_inv_color_seq OWNED BY public.inventario_color.id_inv_color;


--
-- Name: inventario_color_talla; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventario_color_talla (
    id integer NOT NULL,
    id_producto_color integer NOT NULL,
    id_talla integer NOT NULL,
    stock_actual integer DEFAULT 0 NOT NULL,
    ultima_actualizacion timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT inventario_color_talla_stock_actual_check CHECK ((stock_actual >= 0))
);


ALTER TABLE public.inventario_color_talla OWNER TO postgres;

--
-- Name: inventario_color_talla_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventario_color_talla_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventario_color_talla_id_seq OWNER TO postgres;

--
-- Name: inventario_color_talla_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventario_color_talla_id_seq OWNED BY public.inventario_color_talla.id;


--
-- Name: movimiento_inventario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movimiento_inventario (
    id_movimiento integer NOT NULL,
    id_producto_color integer NOT NULL,
    tipo character varying(20) NOT NULL,
    cantidad integer NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    id_pedido integer,
    motivo character varying(200) NOT NULL,
    id_usuario integer NOT NULL,
    CONSTRAINT movimiento_inventario_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['entrada'::character varying, 'salida'::character varying, 'ajuste'::character varying])::text[])))
);


ALTER TABLE public.movimiento_inventario OWNER TO postgres;

--
-- Name: movimiento_inventario_id_movimiento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.movimiento_inventario_id_movimiento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.movimiento_inventario_id_movimiento_seq OWNER TO postgres;

--
-- Name: movimiento_inventario_id_movimiento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.movimiento_inventario_id_movimiento_seq OWNED BY public.movimiento_inventario.id_movimiento;


--
-- Name: pedido; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedido (
    id_pedido integer NOT NULL,
    id_cliente integer NOT NULL,
    id_direccion integer NOT NULL,
    fecha_pedido timestamp without time zone DEFAULT now() NOT NULL,
    estado_pedido character varying(30) DEFAULT 'pendiente'::character varying NOT NULL,
    id_descuento integer,
    descuento_aplicado numeric(12,2) DEFAULT 0 NOT NULL,
    total_pedido numeric(12,2) NOT NULL,
    total_final numeric(12,2) NOT NULL,
    estado_pago character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    metodo_pago character varying(30),
    referencia_pago character varying(100),
    preference_id character varying(100),
    CONSTRAINT pedido_estado_pago_check CHECK (((estado_pago)::text = ANY ((ARRAY['pendiente'::character varying, 'en_proceso'::character varying, 'aprobado'::character varying, 'rechazado'::character varying])::text[]))),
    CONSTRAINT pedido_estado_pedido_check CHECK (((estado_pedido)::text = ANY ((ARRAY['pendiente'::character varying, 'procesando'::character varying, 'enviado'::character varying, 'entregado'::character varying, 'cancelado'::character varying])::text[])))
);


ALTER TABLE public.pedido OWNER TO postgres;

--
-- Name: pedido_id_pedido_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pedido_id_pedido_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pedido_id_pedido_seq OWNER TO postgres;

--
-- Name: pedido_id_pedido_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pedido_id_pedido_seq OWNED BY public.pedido.id_pedido;


--
-- Name: producto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.producto (
    id_producto integer NOT NULL,
    nombre_producto character varying(150) NOT NULL,
    descripcion text,
    precio_unitario numeric(12,2) NOT NULL,
    estado character varying(20) DEFAULT 'activo'::character varying NOT NULL,
    CONSTRAINT producto_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying, 'agotado'::character varying])::text[]))),
    CONSTRAINT producto_precio_unitario_check CHECK ((precio_unitario >= (0)::numeric))
);


ALTER TABLE public.producto OWNER TO postgres;

--
-- Name: producto_categoria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.producto_categoria (
    id_producto integer NOT NULL,
    id_categoria integer NOT NULL
);


ALTER TABLE public.producto_categoria OWNER TO postgres;

--
-- Name: producto_color; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.producto_color (
    id_producto_color integer NOT NULL,
    id_producto integer NOT NULL,
    id_color integer NOT NULL
);


ALTER TABLE public.producto_color OWNER TO postgres;

--
-- Name: producto_color_id_producto_color_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.producto_color_id_producto_color_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.producto_color_id_producto_color_seq OWNER TO postgres;

--
-- Name: producto_color_id_producto_color_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.producto_color_id_producto_color_seq OWNED BY public.producto_color.id_producto_color;


--
-- Name: producto_id_producto_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.producto_id_producto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.producto_id_producto_seq OWNER TO postgres;

--
-- Name: producto_id_producto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.producto_id_producto_seq OWNED BY public.producto.id_producto;


--
-- Name: reserva_stock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reserva_stock (
    id_reserva integer NOT NULL,
    session_id character varying(100) NOT NULL,
    id_producto_color integer NOT NULL,
    id_talla integer NOT NULL,
    cantidad integer NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    expira_en timestamp without time zone NOT NULL,
    CONSTRAINT reserva_stock_cantidad_check CHECK ((cantidad > 0))
);


ALTER TABLE public.reserva_stock OWNER TO postgres;

--
-- Name: reserva_stock_id_reserva_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reserva_stock_id_reserva_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reserva_stock_id_reserva_seq OWNER TO postgres;

--
-- Name: reserva_stock_id_reserva_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reserva_stock_id_reserva_seq OWNED BY public.reserva_stock.id_reserva;


--
-- Name: talla; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.talla (
    id_talla integer NOT NULL,
    nombre_talla character varying(20) NOT NULL,
    grupo character varying(50)
);


ALTER TABLE public.talla OWNER TO postgres;

--
-- Name: talla_id_talla_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.talla_id_talla_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.talla_id_talla_seq OWNER TO postgres;

--
-- Name: talla_id_talla_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.talla_id_talla_seq OWNED BY public.talla.id_talla;


--
-- Name: usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuario (
    id_usuario integer NOT NULL,
    primer_nombre character varying(80) NOT NULL,
    segundo_nombre character varying(80),
    primer_apellido character varying(80) NOT NULL,
    segundo_apellido character varying(80),
    correo character varying(150) NOT NULL,
    telefono character varying(20) NOT NULL,
    contrasena character varying(255) NOT NULL,
    id_rol integer NOT NULL,
    estado character varying(20) DEFAULT 'activo'::character varying NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT now() NOT NULL,
    direccion character varying(255),
    fecha_nacimiento date,
    verify_code character varying(6),
    recovery_token character varying(255),
    CONSTRAINT usuario_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying])::text[]))),
    CONSTRAINT usuario_id_rol_check CHECK ((id_rol = ANY (ARRAY[1, 2, 3, 4, 5])))
);


ALTER TABLE public.usuario OWNER TO postgres;

--
-- Name: usuario_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuario_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuario_id_usuario_seq OWNER TO postgres;

--
-- Name: usuario_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuario_id_usuario_seq OWNED BY public.usuario.id_usuario;


--
-- Name: v_detalle_pedidos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_detalle_pedidos AS
 SELECT ped.id_pedido,
    (((u.primer_nombre)::text || ' '::text) || (u.primer_apellido)::text) AS cliente,
    p.nombre_producto,
    co.nombre_color,
    dp.cantidad,
    dp.precio_vendido,
    dp.subtotal,
    ped.estado_pedido,
    ped.fecha_pedido
   FROM (((((public.detalle_pedido dp
     JOIN public.pedido ped ON ((ped.id_pedido = dp.id_pedido)))
     JOIN public.usuario u ON ((u.id_usuario = ped.id_cliente)))
     JOIN public.producto_color pc ON ((pc.id_producto_color = dp.id_producto_color)))
     JOIN public.producto p ON ((p.id_producto = pc.id_producto)))
     JOIN public.color co ON ((co.id_color = pc.id_color)))
  ORDER BY ped.id_pedido;


ALTER VIEW public.v_detalle_pedidos OWNER TO postgres;

--
-- Name: v_producto_categorias; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_producto_categorias AS
 SELECT p.id_producto,
    p.nombre_producto,
    string_agg((c.nombre_categoria)::text, ', '::text ORDER BY (c.nombre_categoria)::text) AS categorias
   FROM ((public.producto p
     JOIN public.producto_categoria pc ON ((pc.id_producto = p.id_producto)))
     JOIN public.categoria_producto c ON ((c.id_categoria = pc.id_categoria)))
  GROUP BY p.id_producto, p.nombre_producto
  ORDER BY p.nombre_producto;


ALTER VIEW public.v_producto_categorias OWNER TO postgres;

--
-- Name: v_stock_completo; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_stock_completo AS
 SELECT p.id_producto,
    p.nombre_producto,
    c.nombre_color,
    c.hex_code,
    t.nombre_talla,
    ict.stock_actual,
        CASE
            WHEN (ict.stock_actual = 0) THEN 'AGOTADO'::text
            WHEN (ict.stock_actual < 5) THEN 'BAJO'::text
            ELSE 'OK'::text
        END AS alerta_stock
   FROM ((((public.inventario_color_talla ict
     JOIN public.producto_color pc ON ((pc.id_producto_color = ict.id_producto_color)))
     JOIN public.producto p ON ((p.id_producto = pc.id_producto)))
     JOIN public.color c ON ((c.id_color = pc.id_color)))
     JOIN public.talla t ON ((t.id_talla = ict.id_talla)))
  ORDER BY p.nombre_producto, c.nombre_color, t.id_talla;


ALTER VIEW public.v_stock_completo OWNER TO postgres;

--
-- Name: categoria_producto id_categoria; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categoria_producto ALTER COLUMN id_categoria SET DEFAULT nextval('public.categoria_producto_id_categoria_seq'::regclass);


--
-- Name: color id_color; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.color ALTER COLUMN id_color SET DEFAULT nextval('public.color_id_color_seq'::regclass);


--
-- Name: descuentos id_descuento; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.descuentos ALTER COLUMN id_descuento SET DEFAULT nextval('public.descuentos_id_descuento_seq'::regclass);


--
-- Name: descuentos_usos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.descuentos_usos ALTER COLUMN id SET DEFAULT nextval('public.descuentos_usos_id_seq'::regclass);


--
-- Name: detalle_pedido id_detalle; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido ALTER COLUMN id_detalle SET DEFAULT nextval('public.detalle_pedido_id_detalle_seq'::regclass);


--
-- Name: direccion_envio id_direccion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direccion_envio ALTER COLUMN id_direccion SET DEFAULT nextval('public.direccion_envio_id_direccion_seq'::regclass);


--
-- Name: historial_estado_pedido id_historial; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_estado_pedido ALTER COLUMN id_historial SET DEFAULT nextval('public.historial_estado_pedido_id_historial_seq'::regclass);


--
-- Name: imagen_producto id_imagen; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagen_producto ALTER COLUMN id_imagen SET DEFAULT nextval('public.imagen_producto_id_imagen_seq'::regclass);


--
-- Name: inventario_color id_inv_color; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario_color ALTER COLUMN id_inv_color SET DEFAULT nextval('public.inventario_color_id_inv_color_seq'::regclass);


--
-- Name: inventario_color_talla id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario_color_talla ALTER COLUMN id SET DEFAULT nextval('public.inventario_color_talla_id_seq'::regclass);


--
-- Name: movimiento_inventario id_movimiento; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimiento_inventario ALTER COLUMN id_movimiento SET DEFAULT nextval('public.movimiento_inventario_id_movimiento_seq'::regclass);


--
-- Name: pedido id_pedido; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido ALTER COLUMN id_pedido SET DEFAULT nextval('public.pedido_id_pedido_seq'::regclass);


--
-- Name: producto id_producto; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto ALTER COLUMN id_producto SET DEFAULT nextval('public.producto_id_producto_seq'::regclass);


--
-- Name: producto_color id_producto_color; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_color ALTER COLUMN id_producto_color SET DEFAULT nextval('public.producto_color_id_producto_color_seq'::regclass);


--
-- Name: reserva_stock id_reserva; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reserva_stock ALTER COLUMN id_reserva SET DEFAULT nextval('public.reserva_stock_id_reserva_seq'::regclass);


--
-- Name: talla id_talla; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.talla ALTER COLUMN id_talla SET DEFAULT nextval('public.talla_id_talla_seq'::regclass);


--
-- Name: usuario id_usuario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuario_id_usuario_seq'::regclass);


--
-- Data for Name: categoria_producto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categoria_producto (id_categoria, nombre_categoria, descripcion, estado) FROM stdin;
2	Accesorios	Accesorios de moda y uso diario	activo
3	Hogar y Cocina	Artículos para el hogar y la cocina	activo
4	Tecnología	Dispositivos electrónicos y gadgets	activo
5	Textiles Hogar	Sábanas, cobijas, tendidos y ropa de cama	activo
6	Calzado	Calzado deportivo y casual	activo
7	Joyería	Bisutería y joyería de moda	activo
8	Camisas	Camisas formales e informales	activo
9	Pantalones	Pantalones jeans, tela y casuales	activo
10	Hoodies	Sudaderas con capucha	activo
1	Ropa Deportiva	Prendas para deporte y actividad física	inactivo
11	pepino	cabeza	activo
12	mujer	cosas de mujeres	activo
13	joijo	rico	activo
15	retret	retet	activo
16	fdfd	fdfdfdf	activo
17	coca	ewfghuirghuier	activo
\.


--
-- Data for Name: color; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.color (id_color, nombre_color, hex_code) FROM stdin;
1	Negro	#000000
2	Blanco	#FFFFFF
3	Rojo	#FF0000
4	Azul	#0000FF
5	Verde	#008000
6	Amarillo	#FFFF00
7	Gris	#808080
8	Rosa	#FFC0CB
9	Naranja	#FFA500
10	Morado	#800080
11	Café	#6F4E37
12	Beige	#F5F5DC
13	Turquesa	#40E0D0
14	Plateado	#C0C0C0
15	Dorado	#FFD700
16	ef	#611919
17	azul cielo	#79ace2
18	cafe oscuro	#7a4d4d
\.


--
-- Data for Name: descuentos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.descuentos (id_descuento, codigo, descripcion, valor_descuento, limite_usos, usos_actuales, fecha_inicio, fecha_cierre, estado, created_at, updated_at, prendas_ids) FROM stdin;
8	VERANO	gartis en vernano	20.00	100	0	2026-07-24	2026-07-30	activo	2026-06-09 11:27:43.731209	2026-06-09 11:27:43.731209	{}
5	YUSEFFDESCUENTO	pepodiscount	25.00	1	0	2026-06-18	2026-06-22	activo	2026-06-09 10:09:41.183696	2026-06-10 08:58:44.426405	{}
3	BLACKFRI50	Black Friday — Descuento especial	25.00	204	200	2025-11-28	2030-10-30	activo	2026-05-24 19:52:13.615816	2026-06-17 21:42:13.612922	{3}
\.


--
-- Data for Name: descuentos_usos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.descuentos_usos (id, id_descuento, id_usuario, fecha_uso) FROM stdin;
\.


--
-- Data for Name: detalle_pedido; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalle_pedido (id_detalle, id_pedido, id_producto_color, cantidad, precio_vendido) FROM stdin;
11	6	34	2	70000.00
46	41	33	3	35000.00
47	42	33	1	35000.00
48	43	33	1	35000.00
\.


--
-- Data for Name: direccion_envio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.direccion_envio (id_direccion, id_usuario, direccion, codigo_postal, es_predeterminada, activa) FROM stdin;
5	5	Cra 46 # 79-50, Casa 12	080001	1	1
7	11	calle39 bc 37	\N	0	1
8	11	jgakjgjkgajhfs	lhkkudguikd	0	1
41	19	werwrwerwe	\N	0	1
42	19	ddefjerojf	\N	1	1
43	11	rgrtrt	\N	1	1
\.


--
-- Data for Name: historial_estado_pedido; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.historial_estado_pedido (id_historial, id_pedido, estado_anterior, estado_nuevo, fecha_cambio, id_usuario_cambio, observacion) FROM stdin;
18	6	\N	pendiente	2026-06-08 21:21:24.763424	11	\N
19	7	\N	pendiente	2026-06-09 11:26:31.446965	11	\N
20	8	\N	pendiente	2026-06-09 11:29:02.042561	11	\N
53	8	pendiente	procesando	2026-06-19 16:53:29.676074	11	\N
54	8	procesando	enviado	2026-06-19 16:53:31.555742	11	\N
55	8	enviado	entregado	2026-06-19 16:53:32.658415	11	\N
56	8	entregado	cancelado	2026-06-19 16:53:33.622854	11	\N
57	8	cancelado	entregado	2026-06-19 16:53:34.506552	11	\N
58	8	entregado	enviado	2026-06-19 16:53:35.251996	11	\N
59	8	enviado	entregado	2026-06-19 16:53:35.931268	11	\N
60	8	entregado	enviado	2026-06-19 16:53:36.927947	11	\N
61	8	enviado	entregado	2026-06-19 16:53:37.534172	11	\N
62	41	\N	pendiente	2026-06-19 18:00:45.919535	19	\N
63	42	\N	pendiente	2026-06-19 19:53:20.002911	19	\N
64	43	\N	pendiente	2026-06-19 20:00:07.907826	11	\N
\.


--
-- Data for Name: imagen_producto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.imagen_producto (id_imagen, id_producto, id_color, url_imagen, nombre_archivo, orden, es_principal, alt_text, fecha_carga) FROM stdin;
8	3	\N	/uploads/productos/producto_1781749001081_1.jpg	producto_1781749001081_1.jpg	1	1	84efe75d-e2e3-4ff2-8eff-712e97c412e1.jpg	2026-06-17 21:16:41.088932
\.


--
-- Data for Name: inventario_color; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventario_color (id_inv_color, id_producto_color, stock_actual, ultima_actualizacion) FROM stdin;
34	34	2	2026-05-27 17:18:02.565035
35	35	9	2026-06-09 10:02:32.82698
33	33	10	2026-05-25 14:23:51.583805
\.


--
-- Data for Name: inventario_color_talla; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventario_color_talla (id, id_producto_color, id_talla, stock_actual, ultima_actualizacion) FROM stdin;
27	33	4	10	2026-05-25 14:23:51.583805
28	34	9	2	2026-05-27 17:18:02.565035
29	35	13	9	2026-06-09 10:02:32.82698
26	33	3	0	2026-05-25 14:23:51.583805
\.


--
-- Data for Name: movimiento_inventario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.movimiento_inventario (id_movimiento, id_producto_color, tipo, cantidad, fecha, id_pedido, motivo, id_usuario) FROM stdin;
9	34	salida	2	2026-06-08 21:21:24.763424	6	Venta pedido	11
44	33	salida	3	2026-06-19 18:00:45.919535	41	Venta pedido	19
45	33	salida	1	2026-06-19 19:53:20.002911	42	Venta pedido	19
46	33	salida	1	2026-06-19 20:00:07.907826	43	Venta pedido	11
\.


--
-- Data for Name: pedido; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pedido (id_pedido, id_cliente, id_direccion, fecha_pedido, estado_pedido, id_descuento, descuento_aplicado, total_pedido, total_final, estado_pago, metodo_pago, referencia_pago, preference_id) FROM stdin;
6	11	7	2026-06-08 21:21:24.763424	pendiente	\N	0.00	170000.00	170000.00	pendiente	\N	\N	\N
7	11	7	2026-06-09 11:26:31.446965	pendiente	\N	0.00	60000.00	60000.00	pendiente	\N	\N	\N
8	11	8	2026-06-09 11:29:02.042561	entregado	\N	0.00	60000.00	60000.00	pendiente	\N	\N	\N
41	19	41	2026-06-19 18:00:45.919535	pendiente	\N	0.00	105000.00	105000.00	pendiente	\N	\N	\N
42	19	42	2026-06-19 19:53:20.002911	pendiente	\N	0.00	35000.00	35000.00	pendiente	\N	\N	\N
43	11	43	2026-06-19 20:00:07.907826	pendiente	\N	0.00	35000.00	35000.00	pendiente	\N	\N	\N
\.


--
-- Data for Name: producto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.producto (id_producto, nombre_producto, descripcion, precio_unitario, estado) FROM stdin;
3	falda	ropa para mujeress	35000.00	activo
4	zapatos	zapatos para el deporte	70000.00	inactivo
5	panataquebrada	se arregla sola	130.00	inactivo
\.


--
-- Data for Name: producto_categoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.producto_categoria (id_producto, id_categoria) FROM stdin;
3	2
4	4
5	4
\.


--
-- Data for Name: producto_color; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.producto_color (id_producto_color, id_producto, id_color) FROM stdin;
33	3	18
34	4	17
35	5	9
\.


--
-- Data for Name: reserva_stock; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reserva_stock (id_reserva, session_id, id_producto_color, id_talla, cantidad, creado_en, expira_en) FROM stdin;
\.


--
-- Data for Name: talla; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.talla (id_talla, nombre_talla, grupo) FROM stdin;
1	XS	\N
2	S	\N
3	M	\N
4	L	\N
5	XL	\N
6	XXL	\N
7	28	\N
8	30	\N
9	32	\N
10	34	\N
11	36	\N
12	38	\N
13	Única	\N
20	XXXL	\N
21	XXXXL	\N
22	XXXXXL	\N
23	0-3	\N
24	3-6	\N
25	6-9	\N
26	9-12	\N
27	12-18	\N
28	18-24	\N
29	2	\N
30	4	\N
31	6	\N
32	8	\N
33	10	\N
34	12	\N
35	14	\N
36	16	\N
37	18	\N
38	21	\N
39	22	\N
40	23	\N
41	24	\N
42	25	\N
43	26	\N
44	27	\N
46	29	\N
48	31	\N
50	33	\N
52	35	\N
54	37	\N
56	39	\N
57	40	\N
58	41	\N
59	42	\N
60	43	\N
61	44	\N
62	45	\N
63	20	\N
73	46	\N
74	48	\N
75	50	\N
76	52	\N
77	54	\N
78	SM	\N
79	ML	\N
80	LXL	\N
82	100x190	\N
83	120x190	\N
84	140x190	\N
85	160x190	\N
86	200x200	\N
87	40x70	\N
88	70x130	\N
89	90x160	\N
90	Unica	ropa
\.


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuario (id_usuario, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, telefono, contrasena, id_rol, estado, fecha_creacion, direccion, fecha_nacimiento, verify_code, recovery_token) FROM stdin;
11	luis	\N	gomez	\N	santi.arts2009@gmail.com	123456078	$2b$10$alEOiW8kIny/yIkvJnI1Yu7P/cPqGBq56OMrDCrtEBxkn1RBnqP92	1	activo	2026-06-03 10:22:06.279992	rgrtrt	2001-01-17	439159	\N
20	elberd	\N	gomez	\N	arangoalejandro457+1@gmail.com	6876887	$2b$10$.TYc6s5yNiBtoo/Zi5IB4OKoBBmpPdosFJVXBi6zi0VItsNeoU6pi	3	activo	2026-06-19 17:27:42.46445	iodfshjfiosh	2004-06-01	\N	\N
14	dylan	\N	yusef	\N	andre.m@mail.com	2332323232323	$2b$10$nFGSwbSWBYypm/G/.d/u6.MZ92xD5cmSc1RoXM4P5VT.7SZO.3WvS	3	inactivo	2026-06-09 20:50:50.452915	ferfgrgrtgrtghrg	\N	265309	\N
5	Diego	\N	Ramírezs	Vega	diego.ramirez@mail.com	3013456789	$2b$10$KOWkZGUizJoNKA0j750Lo.o4zfPqsWKr1m6Zkxb73wAf8i1HXFVZu	3	inactivo	2025-03-05 00:00:00	san antonio	2006-01-11	\N	\N
16	santi	\N	giraldo	\N	vivianaandrearodriguezmoeno@gmail.com	3222014637	$2b$10$B9/8U1PG6cYLaqRQRY/w/eYbS.blKFOFiOMVz7m2386UXo2qy0Dge	3	inactivo	2026-06-18 21:48:45.345349	prado	\N	242773	\N
19	dylan	\N	gomez	\N	modamagica81@gmail.com	2323232323	$2b$10$qVxYbRz9PPbekT9O/wVv2eKQuEuMKIgqVGACR.5pFC0j6OkSwWpDi	3	activo	2026-06-19 17:19:25.014545	prado montaña	2004-04-12	\N	\N
\.


--
-- Name: categoria_producto_id_categoria_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categoria_producto_id_categoria_seq', 19, true);


--
-- Name: color_id_color_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.color_id_color_seq', 18, true);


--
-- Name: descuentos_id_descuento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.descuentos_id_descuento_seq', 40, true);


--
-- Name: descuentos_usos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.descuentos_usos_id_seq', 1, false);


--
-- Name: detalle_pedido_id_detalle_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalle_pedido_id_detalle_seq', 48, true);


--
-- Name: direccion_envio_id_direccion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.direccion_envio_id_direccion_seq', 43, true);


--
-- Name: historial_estado_pedido_id_historial_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.historial_estado_pedido_id_historial_seq', 64, true);


--
-- Name: imagen_producto_id_imagen_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.imagen_producto_id_imagen_seq', 8, true);


--
-- Name: inventario_color_id_inv_color_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventario_color_id_inv_color_seq', 36, true);


--
-- Name: inventario_color_talla_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventario_color_talla_id_seq', 30, true);


--
-- Name: movimiento_inventario_id_movimiento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.movimiento_inventario_id_movimiento_seq', 46, true);


--
-- Name: pedido_id_pedido_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedido_id_pedido_seq', 43, true);


--
-- Name: producto_color_id_producto_color_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.producto_color_id_producto_color_seq', 36, true);


--
-- Name: producto_id_producto_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.producto_id_producto_seq', 6, true);


--
-- Name: reserva_stock_id_reserva_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reserva_stock_id_reserva_seq', 21, true);


--
-- Name: talla_id_talla_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.talla_id_talla_seq', 90, true);


--
-- Name: usuario_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuario_id_usuario_seq', 20, true);


--
-- Name: categoria_producto categoria_producto_nombre_categoria_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categoria_producto
    ADD CONSTRAINT categoria_producto_nombre_categoria_key UNIQUE (nombre_categoria);


--
-- Name: categoria_producto categoria_producto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categoria_producto
    ADD CONSTRAINT categoria_producto_pkey PRIMARY KEY (id_categoria);


--
-- Name: color color_nombre_color_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.color
    ADD CONSTRAINT color_nombre_color_key UNIQUE (nombre_color);


--
-- Name: color color_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.color
    ADD CONSTRAINT color_pkey PRIMARY KEY (id_color);


--
-- Name: descuentos descuentos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.descuentos
    ADD CONSTRAINT descuentos_codigo_key UNIQUE (codigo);


--
-- Name: descuentos descuentos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.descuentos
    ADD CONSTRAINT descuentos_pkey PRIMARY KEY (id_descuento);


--
-- Name: descuentos_usos descuentos_usos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.descuentos_usos
    ADD CONSTRAINT descuentos_usos_pkey PRIMARY KEY (id);


--
-- Name: detalle_pedido detalle_pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_pkey PRIMARY KEY (id_detalle);


--
-- Name: direccion_envio direccion_envio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direccion_envio
    ADD CONSTRAINT direccion_envio_pkey PRIMARY KEY (id_direccion);


--
-- Name: historial_estado_pedido historial_estado_pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_estado_pedido
    ADD CONSTRAINT historial_estado_pedido_pkey PRIMARY KEY (id_historial);


--
-- Name: imagen_producto imagen_producto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagen_producto
    ADD CONSTRAINT imagen_producto_pkey PRIMARY KEY (id_imagen);


--
-- Name: inventario_color inventario_color_id_producto_color_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario_color
    ADD CONSTRAINT inventario_color_id_producto_color_key UNIQUE (id_producto_color);


--
-- Name: inventario_color inventario_color_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario_color
    ADD CONSTRAINT inventario_color_pkey PRIMARY KEY (id_inv_color);


--
-- Name: inventario_color_talla inventario_color_talla_id_producto_color_id_talla_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario_color_talla
    ADD CONSTRAINT inventario_color_talla_id_producto_color_id_talla_key UNIQUE (id_producto_color, id_talla);


--
-- Name: inventario_color_talla inventario_color_talla_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario_color_talla
    ADD CONSTRAINT inventario_color_talla_pkey PRIMARY KEY (id);


--
-- Name: movimiento_inventario movimiento_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimiento_inventario
    ADD CONSTRAINT movimiento_inventario_pkey PRIMARY KEY (id_movimiento);


--
-- Name: pedido pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido
    ADD CONSTRAINT pedido_pkey PRIMARY KEY (id_pedido);


--
-- Name: producto_categoria producto_categoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_categoria
    ADD CONSTRAINT producto_categoria_pkey PRIMARY KEY (id_producto, id_categoria);


--
-- Name: producto_color producto_color_id_producto_id_color_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_color
    ADD CONSTRAINT producto_color_id_producto_id_color_key UNIQUE (id_producto, id_color);


--
-- Name: producto_color producto_color_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_color
    ADD CONSTRAINT producto_color_pkey PRIMARY KEY (id_producto_color);


--
-- Name: producto producto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_pkey PRIMARY KEY (id_producto);


--
-- Name: reserva_stock reserva_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reserva_stock
    ADD CONSTRAINT reserva_stock_pkey PRIMARY KEY (id_reserva);


--
-- Name: reserva_stock reserva_stock_session_id_id_producto_color_id_talla_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reserva_stock
    ADD CONSTRAINT reserva_stock_session_id_id_producto_color_id_talla_key UNIQUE (session_id, id_producto_color, id_talla);


--
-- Name: talla talla_nombre_talla_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.talla
    ADD CONSTRAINT talla_nombre_talla_key UNIQUE (nombre_talla);


--
-- Name: talla talla_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.talla
    ADD CONSTRAINT talla_pkey PRIMARY KEY (id_talla);


--
-- Name: descuentos_usos uq_descuento_usuario; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.descuentos_usos
    ADD CONSTRAINT uq_descuento_usuario UNIQUE (id_descuento, id_usuario);


--
-- Name: usuario usuario_correo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_correo_key UNIQUE (correo);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id_usuario);


--
-- Name: usuario usuario_telefono_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_telefono_key UNIQUE (telefono);


--
-- Name: idx_desc_usos_descuento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_desc_usos_descuento ON public.descuentos_usos USING btree (id_descuento);


--
-- Name: idx_desc_usos_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_desc_usos_usuario ON public.descuentos_usos USING btree (id_usuario);


--
-- Name: idx_descuentos_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_descuentos_codigo ON public.descuentos USING btree (codigo);


--
-- Name: idx_descuentos_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_descuentos_estado ON public.descuentos USING btree (estado);


--
-- Name: idx_descuentos_fechas; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_descuentos_fechas ON public.descuentos USING btree (fecha_inicio, fecha_cierre);


--
-- Name: idx_reserva_stock_expira; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reserva_stock_expira ON public.reserva_stock USING btree (expira_en);


--
-- Name: idx_reserva_stock_session; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reserva_stock_session ON public.reserva_stock USING btree (session_id);


--
-- Name: idx_reserva_stock_variante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reserva_stock_variante ON public.reserva_stock USING btree (id_producto_color, id_talla);


--
-- Name: descuentos trg_descuentos_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_descuentos_updated BEFORE UPDATE ON public.descuentos FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp();


--
-- Name: descuentos_usos descuentos_usos_id_descuento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.descuentos_usos
    ADD CONSTRAINT descuentos_usos_id_descuento_fkey FOREIGN KEY (id_descuento) REFERENCES public.descuentos(id_descuento) ON DELETE CASCADE;


--
-- Name: descuentos_usos descuentos_usos_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.descuentos_usos
    ADD CONSTRAINT descuentos_usos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;


--
-- Name: detalle_pedido detalle_pedido_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.pedido(id_pedido);


--
-- Name: detalle_pedido detalle_pedido_id_producto_color_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido
    ADD CONSTRAINT detalle_pedido_id_producto_color_fkey FOREIGN KEY (id_producto_color) REFERENCES public.producto_color(id_producto_color);


--
-- Name: direccion_envio direccion_envio_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direccion_envio
    ADD CONSTRAINT direccion_envio_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);


--
-- Name: historial_estado_pedido historial_estado_pedido_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_estado_pedido
    ADD CONSTRAINT historial_estado_pedido_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.pedido(id_pedido);


--
-- Name: historial_estado_pedido historial_estado_pedido_id_usuario_cambio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_estado_pedido
    ADD CONSTRAINT historial_estado_pedido_id_usuario_cambio_fkey FOREIGN KEY (id_usuario_cambio) REFERENCES public.usuario(id_usuario);


--
-- Name: imagen_producto imagen_producto_id_color_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagen_producto
    ADD CONSTRAINT imagen_producto_id_color_fkey FOREIGN KEY (id_color) REFERENCES public.color(id_color);


--
-- Name: imagen_producto imagen_producto_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagen_producto
    ADD CONSTRAINT imagen_producto_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto) ON DELETE CASCADE;


--
-- Name: inventario_color inventario_color_id_producto_color_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario_color
    ADD CONSTRAINT inventario_color_id_producto_color_fkey FOREIGN KEY (id_producto_color) REFERENCES public.producto_color(id_producto_color);


--
-- Name: inventario_color_talla inventario_color_talla_id_producto_color_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario_color_talla
    ADD CONSTRAINT inventario_color_talla_id_producto_color_fkey FOREIGN KEY (id_producto_color) REFERENCES public.producto_color(id_producto_color) ON DELETE CASCADE;


--
-- Name: inventario_color_talla inventario_color_talla_id_talla_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario_color_talla
    ADD CONSTRAINT inventario_color_talla_id_talla_fkey FOREIGN KEY (id_talla) REFERENCES public.talla(id_talla);


--
-- Name: movimiento_inventario movimiento_inventario_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimiento_inventario
    ADD CONSTRAINT movimiento_inventario_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.pedido(id_pedido);


--
-- Name: movimiento_inventario movimiento_inventario_id_producto_color_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimiento_inventario
    ADD CONSTRAINT movimiento_inventario_id_producto_color_fkey FOREIGN KEY (id_producto_color) REFERENCES public.producto_color(id_producto_color);


--
-- Name: movimiento_inventario movimiento_inventario_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimiento_inventario
    ADD CONSTRAINT movimiento_inventario_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);


--
-- Name: pedido pedido_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido
    ADD CONSTRAINT pedido_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.usuario(id_usuario);


--
-- Name: pedido pedido_id_descuento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido
    ADD CONSTRAINT pedido_id_descuento_fkey FOREIGN KEY (id_descuento) REFERENCES public.descuentos(id_descuento);


--
-- Name: pedido pedido_id_direccion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido
    ADD CONSTRAINT pedido_id_direccion_fkey FOREIGN KEY (id_direccion) REFERENCES public.direccion_envio(id_direccion);


--
-- Name: producto_categoria producto_categoria_id_categoria_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_categoria
    ADD CONSTRAINT producto_categoria_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES public.categoria_producto(id_categoria) ON DELETE CASCADE;


--
-- Name: producto_categoria producto_categoria_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_categoria
    ADD CONSTRAINT producto_categoria_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto) ON DELETE CASCADE;


--
-- Name: producto_color producto_color_id_color_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_color
    ADD CONSTRAINT producto_color_id_color_fkey FOREIGN KEY (id_color) REFERENCES public.color(id_color);


--
-- Name: producto_color producto_color_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_color
    ADD CONSTRAINT producto_color_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto) ON DELETE CASCADE;


--
-- Name: reserva_stock reserva_stock_id_producto_color_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reserva_stock
    ADD CONSTRAINT reserva_stock_id_producto_color_fkey FOREIGN KEY (id_producto_color) REFERENCES public.producto_color(id_producto_color) ON DELETE CASCADE;


--
-- Name: reserva_stock reserva_stock_id_talla_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reserva_stock
    ADD CONSTRAINT reserva_stock_id_talla_fkey FOREIGN KEY (id_talla) REFERENCES public.talla(id_talla);


--
-- PostgreSQL database dump complete
--

\unrestrict IwbHS0sChyfcmj7tVvYSTAlrp3EGrs0m61mXmCTkjLXeD6LECHh9wZPZelhYyTQ

