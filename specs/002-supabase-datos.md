# 002 — Base de datos en Supabase

- **Estado:** implementado (código); falta ejecutar la migración y verificar contra Supabase real
- **Fecha:** 2026-11-13

## Objetivo
Persistir las pinturas del usuario y las recetas de color guardadas en Supabase, aisladas por usuario mediante RLS. La identidad viene del login por email (spec 003).

## Decisión (revisada)
Se descarta la sesión anónima: la app tendrá cuentas con email. Los datos se asocian a `auth.uid()`, así que el usuario los conserva al cambiar de dispositivo o limpiar el navegador. Las tablas y políticas RLS no cambian respecto a la versión anterior; solo cambia de dónde sale la sesión.

## Alcance
- Incluye: migración SQL (tablas, RLS, índices), helper `requireUser()`, módulo `features/storage` con funciones CRUD, tests de las funciones con el cliente mockeado, `.env` documentado.
- No incluye: UI de pinturas/biblioteca (hitos 4 y 7), subida de fotos, login real, sincronización offline.

## Plan
1. Requiere el spec 003 (login) para tener sesión. En el panel de Supabase el proveedor Email viene activo por defecto.
2. Crear `supabase/migrations/0001_init.sql` y ejecutarla en el SQL Editor (el usuario pega el SQL; no hay CLI local).
3. Completar `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (el usuario, sin compartir la key).
4. Extender `src/features/storage/supabase.js` con `requireUser()` (devuelve el usuario de la sesión actual o un error claro).
5. Crear `paintsRepo.js` y `recipesRepo.js` con `list`, `create`, `update`, `remove`. Cada función exige sesión activa y devuelve `{ data, error }` normalizado.
6. Tests con el cliente mockeado; `npm test`, `lint` y `build`.

## Archivos a crear/modificar
- `supabase/migrations/0001_init.sql`
- `src/features/storage/supabase.js` — helper `requireUser()`
- `src/features/storage/paintsRepo.js`, `recipesRepo.js`, `index.js` y tests
- `.env.example` y `CLAUDE.md` (solo si cambia algo de la convención)

## Atomic design
No aplica.

## Datos (Supabase)
**`paints`** — pinturas del usuario
| columna | tipo | notas |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `owner_id` | uuid | `default auth.uid()`, no nulo |
| `name` | text | 1–40 caracteres |
| `hex` | text | formato `#RRGGBB` (check con regex) |
| `created_at` | timestamptz | `now()` |

**`recipes`** — colores guardados
| columna | tipo | notas |
|---|---|---|
| `id` | uuid PK | |
| `owner_id` | uuid | `default auth.uid()` |
| `name` | text | 1–60 caracteres |
| `target_hex` | text | color que se quería lograr |
| `result_hex` | text | color que da la mezcla calculada |
| `mix` | jsonb | copia de la receta: `[{ "name": "rojo", "hex": "#E63946", "parts": 2 }, ...]` |
| `created_at` | timestamptz | |

La receta guarda una **copia** de nombre y hex de cada pintura para que editar o borrar una pintura después no cambie las recetas ya guardadas.

**RLS:** activada en ambas tablas. Una política por operación (select, insert, update, delete) con `owner_id = auth.uid()` y `to authenticated`. Sin políticas para `anon`: sin sesión no se accede a nada. Índices en `(owner_id, created_at desc)`.

Las fotos **no** se guardan en esta versión: solo el color resultante, lo que mantiene la base chica y la privacidad simple.

## Criterios de aceptación
- [ ] Con sesión iniciada, las operaciones funcionan (pendiente: requiere login, spec 003). Sin sesión devuelven un error claro (probado con tests).
- [ ] Un usuario puede crear, listar, editar y borrar sus pinturas y recetas.
- [ ] Un segundo navegador (otra cuenta) no ve ni modifica los datos del primero.
- [ ] Las restricciones rechazan hex inválidos y nombres vacíos.
- [x] Sin `.env`, la app no se rompe: los repos devuelven un error claro.
- [x] `.env` no está versionado y no hay claves en el código.
- [x] `npm test`, `npm run lint` y `npm run build` pasan.

## Riesgos y preguntas abiertas
- **Abuso de registros**: cualquiera puede crear cuentas con la anon key. Mitigación: confirmación de email, rate limits de Supabase y constraints de tamaño.
- **Sin internet**: esta versión necesita conexión para guardar; el modo offline se evalúa en el hito de PWA.
