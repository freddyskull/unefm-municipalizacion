# Reglas del proyecto

## Tablas (obligatorio)
- TODAS las tablas del sistema deben construirse con **TanStack Table** (`@tanstack/react-table`) + **TanStack Virtual** (`@tanstack/react-virtual`).
- Cuando una tabla tenga MÁS de 1 página de datos, debe activar:
  - **Paginación** (server-side, con `limit`/`offset`/`total`, respetando los rastros del backend).
  - **Virtualización** de filas (render solo de las filas visibles).
  - **Filtro de búsqueda** y **ordenamiento** por columnas.
- No crear tablas con `<table>` manual, `.map()` de filas o componentes propios como sustituto de TanStack Table.