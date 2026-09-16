# Sistema Municipalización UNEFM

Sistema web moderno para la **Dirección de Planificación y Desarrollo Universitario** de la **Universidad Nacional Experimental "Francisco de Miranda" (UNEFM)**, recreado con tecnologías actuales.

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Base de datos (datos) | PostgreSQL (solo lectura) |
| Autenticación | JWT + SQLite |
| Contenedores | Docker + Docker Compose |
| Gráficos | Recharts |

## Estructura

```
.
├── docker-compose.yml        # Orquestación de servicios
├── backend/                  # API Node.js + Express
│   ├── server.js
│   ├── config/               # Conexiones a PostgreSQL y SQLite
│   ├── controllers/          # Lógica de negocio
│   ├── middleware/           # Autenticación JWT
│   ├── routes/               # Endpoints API
│   └── data/                 # SQLite de usuarios (auth)
└── frontend/                 # React + Vite + Tailwind
    └── src/
        ├── components/       # Layout y componentes de UI
        ├── pages/            # Login, Dashboard, Datos, Usuarios, Reportes, Configuración
        ├── context/          # AuthContext (JWT)
        └── services/         # Cliente Axios
```

## Configuración

1. Copia `.env.example` a `.env` y configura las credenciales:

```bash
cp .env.example .env
```

2. Variables importantes:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — conexión a la base PostgreSQL existente
   - `JWT_SECRET` — secreto para firmar tokens

## Puesta en marcha

```bash
docker compose up --build
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001/api |
| Nginx (producción) | http://localhost:9000 |

## Usuarios por defecto

Al iniciar por primera vez se crea automáticamente:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | admin |

## Importante: Solo lectura

Este sistema se conecta a la base de datos `municipalizacion` (PostgreSQL) **únicamente para consultar información (SELECT)**. **No modifica, crea ni elimina datos** en la base de datos existente. La información de usuarios del sistema se almacena en una base SQLite local independiente.

## Uso

1. Ingresar con las credenciales del usuario administrador
2. **Dashboard**: resumen de tablas y registros de la base de datos
3. **Datos PostgreSQL**: explorar tablas, buscar y navegar registros (solo lectura)
4. **Usuarios**: crear y gestionar usuarios del sistema (admin)
5. **Reportes**: estadísticas por tabla y análisis por columna con gráficos
6. **Configuración**: información del sistema y perfil del usuario

## Desarrollo

```bash
cd backend && npm install && npm run dev   # API en :3001
cd frontend && npm install && npm run dev  # Frontend en :5173
```