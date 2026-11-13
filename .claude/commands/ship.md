---
description: Revisa el diff, hace commit y push
---

1. Ejecuta `git status` y `git diff`; verifica que no haya `.env`, claves ni archivos no deseados.
2. Ejecuta `npm test` y `npm run build`. Si fallan, detente.
3. Muestra al usuario un resumen del diff y el mensaje de commit propuesto (imperativo, claro, referenciando el spec).
4. Con su confirmación: `git add` de los archivos relevantes y `git commit`.
5. Si hay remoto (`git remote -v`), pregunta y luego `git push`. Si no hay remoto, indícalo y pide la URL.
