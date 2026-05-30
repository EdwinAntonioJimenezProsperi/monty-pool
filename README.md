# Monty Pool 🎱

Sistema web para la gestión de un negocio de billar. Control de inventario, ventas y mesas de juego. Moneda: Bolivianos (Bs).

## Funcionalidades

### Encargado
- **Control de Mesas**: Iniciar/detener tiempo de juego en cada mesa con cálculo automático del costo
- **Punto de Venta**: Vender productos con descuento automático del inventario
- **Inventario**: Ver estado actual del inventario y stock
- **Dashboard**: Resumen general del negocio

### Administrador
- Todo lo del encargado, más:
- **Gestión de Productos**: Crear, editar, desactivar productos con imagen y precio
- **Configuración de Mesas**: Modificar tarifas, agregar o eliminar mesas
- **Gestión de Usuarios**: Crear y administrar cuentas de encargados y administradores
- **Reportes**: Ver resumen de ventas, ingresos por mesas y productos más vendidos

## Tarifas por Defecto
- **Hora**: Bs 20
- **Media hora**: Bs 10

## Tecnologías
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Base de datos**: PostgreSQL (vía `pg`). Datos permanentes en proveedores gratuitos como Neon o Supabase.
- **Autenticación**: JWT

## Instalación

Requiere una base de datos PostgreSQL. Define la variable de entorno `DATABASE_URL` con la cadena de conexión (por ejemplo, la de Neon: `postgresql://usuario:clave@host/db?sslmode=require`).

```bash
# Instalar dependencias
npm install

# Base de datos Postgres (ejemplo con la URL de Neon)
export DATABASE_URL="postgresql://usuario:clave@host/db?sslmode=require"

# Crear tablas y datos de ejemplo
npm run seed --workspace=server

# Desarrollo (el servidor también crea tablas y siembra datos al iniciar)
npm run dev
```

Los datos (ventas, sesiones de mesas, etc.) **persisten** en la base de datos y no se borran al redesplegar.

## Credenciales por Defecto
- **Admin**: usuario `admin`, contraseña `admin123`
- **Encargado**: usuario `encargado`, contraseña `encargado123`

## Estructura
```
billar-system/
├── server/          # Backend (Express + PostgreSQL)
│   └── src/
│       ├── index.js       # Entry point
│       ├── database.js    # Conexión y helpers de PostgreSQL
│       ├── seed.js        # Datos iniciales
│       ├── middleware/     # Auth middleware
│       └── routes/        # API routes
├── client/          # Frontend (React + Vite)
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       ├── context/       # Auth context
│       ├── components/    # Layout
│       └── pages/         # Views
└── package.json
```
