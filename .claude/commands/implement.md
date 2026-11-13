---
description: Implementa un spec aprobado
argument-hint: <número del spec, ej. 002>
---

Implementa `specs/$ARGUMENTS-*.md`.

1. Verifica que el estado sea `aprobado`. Si no, detente y avisa.
2. Sigue el plan del spec y las reglas de `CLAUDE.md` (atomic design, tokens, mobile-first, sin IA). No hagas nada fuera del alcance.
3. Escribe tests para la lógica nueva. Ejecuta `npm test`, `npm run lint` y `npm run build`; corrige hasta que pasen.
4. Marca los criterios de aceptación cumplidos y cambia el estado del spec a `implementado`.
5. Resume qué cambió y sugiere correr `/ship`. No hagas commit.
