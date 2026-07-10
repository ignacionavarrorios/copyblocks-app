# `store.json` — esquema de datos

Este archivo es la base de datos local de Flowi AI. La UI y el agente del CLI lo leen y
escriben. Editá con cuidado: **no borres datos existentes** y usá `id` únicos (string corto).
La UI toma los cambios al recargar.

## Forma

```json
{
  "brands": [
    {
      "id": "string",
      "name": "Nombre de la marca",
      "industry": "rubro",
      "perfil": {
        "produto": "qué vende",
        "oferta": "la oferta principal",
        "diferenciador": "qué la hace distinta",
        "voz": "tono de voz (ej. 'tutea, cercana y directa')",
        "mercado": "país + variante de español",
        "ubicacion": "ciudad/zona",
        "mecanismo_nombrado": "SOLO si la marca nombró un método propio; si no, dejar vacío",
        "extra": "notas"
      },
      "avatars": [
        { "id": "string", "name": "...", "desc": "...", "pains": "...", "objection": "...", "language": "..." }
      ],
      "assets": [
        { "id": "string", "tipo": "<tipo>", "funcs": ["<func>"], "tags": ["..."], "text": "el copy del bloque" }
      ],
      "conceptos": [
        { "id": "string", "concepto": "...", "angulo": "...", "estilo": "...", "hook": "..." }
      ],
      "copies": [
        { "id": "string", "type": "facebook|video", "text": "...", "tag": "...", "rating": "winner|testing|lost", "conceptoId": "string|null", "conceptoLabel": "...", "fecha": "YYYY-MM-DD", "blockIds": [] }
      ],
      "hormoziOffers": [],
      "customAngles": [],
      "customStyles": []
    }
  ]
}
```

## Valores válidos

- **`tipo`** (tipo de bloque): `pain` (Dolor), `promise` (Promesa), `proof` (Prueba),
  `curiosity` (Curiosidad/mecanismo), `constraints` (Frenos/objeción), `conditions`
  (Condiciones/urgencia), `offer` (Oferta).
- **`funcs`** (función en el anuncio): `hook`, `body`, `headline`, `cta`, `offer`.
- **`tags`**: libres. Recomendado incluir el `tipo`, las `funcs`, y `generated` si lo creó la IA.

## Al inyectar bloques (ej. desde copies importados o un MCP)

1. Convertí cada copy en uno o más `assets`, eligiendo el `tipo` y `funcs` más relevantes.
2. Generá `id` único por bloque.
3. Agregálos al array `assets` de la marca correcta (no reemplaces el array).
4. Aplicá las reglas de copy: español, segunda persona (tú/vos), específico, sin inventar
   mecanismos ni prueba social (usá `[corchetes]` si falta un dato real).
