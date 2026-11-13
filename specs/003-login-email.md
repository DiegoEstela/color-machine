# 003 — Login con email

- **Estado:** implementado (código); falta verificar el flujo real con Supabase y Vercel
- **Fecha:** 2026-11-13

## Objetivo
Que el usuario pueda crear una cuenta, iniciar y cerrar sesión con email en la app, y que sus datos (spec 002) queden ligados a esa cuenta. La sesión persiste al recargar y en la PWA instalada.

## Método de acceso (a decidir)
| Opción | Pros | Contras |
|---|---|---|
| **A. Email + contraseña** (recomendada) | Funciona igual en el navegador y en la PWA instalada; el login no depende de un correo | Hay que manejar "olvidé mi contraseña" |
| B. Código de 6 dígitos por email (OTP) | Sin contraseñas; se escribe dentro de la app, funciona bien en PWA | Cada ingreso depende de que llegue el correo |
| C. Magic link | Simplísimo | En el móvil el enlace suele abrirse en el navegador y no en la PWA instalada |

Nota: el SMTP que trae Supabase por defecto tiene un límite muy bajo de correos por hora, apto para pruebas. Con la opción A solo se envían correos al registrarse y al recuperar contraseña, así que es la más tolerante. Para producción conviene configurar un SMTP propio.

## Alcance
- Incluye: registro, login, logout, recuperar contraseña, sesión persistente, ruta protegida (sin sesión se muestra la pantalla de acceso), estado de auth en Zustand.
- No incluye: login social (Google), perfil de usuario, borrar cuenta.

## Plan
1. Configurar en Supabase (lo hace el usuario): **Authentication → URL Configuration**: *Site URL* = URL de Vercel; *Redirect URLs* = esa URL, `http://localhost:5173` y el patrón de previews de Vercel si se usan.
2. `src/features/auth/authService.js`: `signUp`, `signIn`, `signOut`, `resetPassword`, `updatePassword`, `onAuthChange`, todo vía el cliente de `features/storage/supabase.js`.
3. `src/features/auth/authStore.js` (Zustand): `user`, `status` (`loading`/`signedIn`/`signedOut`), suscripción a `onAuthStateChange`.
4. UI con atomic design (reutiliza los átomos del spec 001): molécula `AuthField`, organismo `AuthForm` (modos login/registro/recuperar), página `Auth`.
5. `App.jsx`: mientras `loading` muestra un splash pixel; sin sesión muestra `Auth`; con sesión, la app. Botón de cerrar sesión en la cabecera.
6. Mensajes de error en español y claros (credenciales inválidas, email sin confirmar, correo ya registrado).
7. Tests del servicio y del store con el cliente mockeado, y de `AuthForm` (validación y modos).

## Archivos a crear/modificar
- `src/features/auth/authService.js`, `authStore.js` y tests
- `src/components/molecules/AuthField/`, `src/components/organisms/AuthForm/`
- `src/pages/Auth/`
- `src/App.jsx`
- `src/features/storage/supabase.js` (solo si hace falta configurar `persistSession`/`autoRefreshToken`, que ya vienen activos por defecto)

## Atomic design
- Átomos reutilizados: `PixelInput`, `PixelButton`, `PixelText`, `PixelPanel`.
- Molécula nueva: `AuthField` (input con etiqueta y error).
- Organismo nuevo: `AuthForm`.
- Dependencia: **el spec 001 (átomos) debe implementarse antes.**

## Datos (Supabase)
Sin tablas nuevas: se usa Supabase Auth. Las políticas del spec 002 ya filtran por `auth.uid()`. Confirmar en el panel que **Confirm email** esté activado.

## Criterios de aceptación
- [ ] Se puede registrar una cuenta nueva y confirmar el email.
- [ ] Se puede iniciar sesión, recargar la página y seguir con la sesión abierta.
- [ ] Cerrar sesión devuelve a la pantalla de acceso y limpia el estado.
- [ ] "Olvidé mi contraseña" envía el correo y permite fijar una nueva.
- [x] Los errores se muestran en español y sin exponer detalles técnicos.
- [x] Los formularios son usables a 360 px (campos >= 16 px de fuente, botones >= 44 px).
- [x] No se guardan contraseñas ni tokens fuera del almacenamiento que gestiona Supabase.
- [x] `npm test`, `npm run lint` y `npm run build` pasan.

## Riesgos y preguntas abiertas
- **Redirects**: si la *Site URL* o las *Redirect URLs* no incluyen la URL de Vercel, los enlaces de confirmación y de recuperación fallan.
- **Límite de correos** del SMTP por defecto (ver arriba).
- **PWA instalada (iOS)**: los enlaces de correo abren Safari, no la app; por eso se recomienda email + contraseña.
- ¿Querés login con Google más adelante? No se incluye ahora.
