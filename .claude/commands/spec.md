---
description: Crea un spec con plan para una tarea y espera aprobación (no toca código)
argument-hint: <descripción de la tarea>
---

Tarea: $ARGUMENTS

1. Lee `CLAUDE.md` y explora el código relevante.
2. Calcula el siguiente número libre en `specs/` y crea `specs/NNN-nombre-corto.md` copiando `specs/_template.md`, con estado `borrador`.
3. Completa todas las secciones: objetivo, alcance, plan, archivos, atomic design, datos (Supabase), criterios de aceptación y riesgos. Sé concreto.
4. **No modifiques código ni instales nada.** Solo crear el archivo del spec.
5. Resume el spec en pocas líneas y pregunta al usuario si lo aprueba o qué cambiar. Al aprobar, cambia el estado a `aprobado`.
