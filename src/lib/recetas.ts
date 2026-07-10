// ─── RECETAS (guiones de video multi-paso) ───────────────────────────────────
// Reemplaza el concepto viejo de "Ángulo" — cada Receta es una estructura narrativa
// con instrucciones explícitas de cómo debe escribir la IA, no solo un ejemplo suelto.
// Contenido 100% original, escrito para Flowi AI/ROAS Academy (ninguna de estas 23
// reutiliza texto de ninguna fuente externa — solo la técnica narrativa genérica,
// que es de dominio público, se redactó todo el instructivo y el ejemplo de cero).
import type { Receta } from "@/types";

export const RECETAS: Receta[] = [
  { id: "gv_autoridad_venta", nombre: "Construcción de autoridad para venta", categoria: "Venta",
    descripcion: "Guion de 5 pasos para posicionarte como autoridad y cerrar con una oferta blanda.",
    instrucciones: "Estructura: Gancho que menciona un deseo o meta → Prueba social → Tips accionables fáciles de aplicar → Promesa de cambio → CTA.",
    ejemplo: "Así es como podés bajar tu costo por lead a la mitad sin subir el presupuesto. Una alumna nuestra pasó de pagar Bs. 40 por lead a Bs. 18 en tres semanas. Todo lo que cambió fue el objetivo de campaña — andá a Configuración, cambiá el objetivo a “Conversiones” en vez de “Tráfico”, y dejale 3 días al algoritmo para ajustar. Si aplicás esto vas a tener más leads de los que podés atender. Si querés que te ayudemos a implementarlo, escribí “QUIERO” en los comentarios." },

  { id: "gv_teoria_loco", nombre: "Teoría del loco", categoria: "Storytelling",
    descripcion: "Historias que desafían lo lógico y sorprenden con su explicación.",
    instrucciones: "Estructura: Gancho (presentar una teoría de forma extrema) → Evidencia inicial (pruebas que parecen confirmarla) → Duda razonable (un punto que la hace parecer falsa) → Explicación final (la verdad detrás) → CTA (invitar a opinar).",
    ejemplo: "¿Y si te dijera que la mayoría de los anuncios fallan antes de publicarse? Los que arrancan con el algoritmo en modo aprendizaje pierden hasta el 60% del presupuesto inicial sin que te des cuenta. Pero esperá — algunos anuncios sí funcionan desde el día uno. La clave no es magia: es cómo estructurás la campaña antes de lanzarla. Te cuento exactamente qué mirar." },

  { id: "gv_secreto_perdido", nombre: "Secreto perdido", categoria: "Storytelling",
    descripcion: "Historias ocultas, misteriosas o poco conocidas dentro de tu nicho.",
    instrucciones: "Estructura: Gancho (algo que la mayoría desconoce) → Revelación (qué fue ocultado o pasado por alto) → Impacto (por qué importa) → Teoría o especulación (por qué casi nadie lo usa) → CTA (invitar a debatir).",
    ejemplo: "Hay una métrica de Meta Ads que casi nadie revisa — y decide si tu campaña escala o se estanca. Es la retención del video en el segundo 3. La mayoría solo mira el CTR. Y esa sola métrica separa a las cuentas que escalan de las que se quedan en el mismo presupuesto por meses. ¿Por qué Meta no la muestra más fácil? Contame qué pensás." },

  { id: "gv_efecto_mariposa", nombre: "Efecto mariposa", categoria: "Storytelling",
    descripcion: "Pequeños eventos que cambiaron el resultado de forma inesperada.",
    instrucciones: "Estructura: Gancho (evento pequeño y aparentemente irrelevante) → Reacción en cadena (cómo se desarrolló sin que nadie lo notara) → Punto de cambio (el momento crucial) → Impacto final (cómo cambió todo) → CTA (invitar a reflexionar).",
    ejemplo: "Cambié un solo emoji en el hook de un anuncio. Nada más. Al principio no pasó nada — mismo CTR, misma gente scrolleando de largo. Pero a la semana, el algoritmo empezó a mostrárselo a una audiencia distinta, una que sí convertía. Ese anuncio terminó sosteniendo la cuenta entera los siguientes dos meses. ¿Los detalles chicos cambian todo, o fue solo suerte? Contame abajo." },

  { id: "gv_caida_doble", nombre: "Caída doble (intriga y satisfacción)", categoria: "Storytelling",
    descripcion: "Una historia con dos grandes obstáculos antes de la solución final — genera retención con doble problema.",
    instrucciones: "Estructura: Gancho NEGATIVO → Primer problema → Primer intento de solución → Segundo problema (peor) → Solución definitiva → CTA.",
    ejemplo: "Te voy a contar por qué esa campaña casi nos hace perder la cuenta completa. Primero, el CPA se disparó de la nada. Probamos bajar el presupuesto — pero el algoritmo se resetea y el CPA empeora todavía más. Ahí estaba el verdadero error: tocar el presupuesto en medio del aprendizaje. Si querés aprender a manejar esto sin arruinarlo, comentá “quiero mejorar”." },

  { id: "gv_viaje_heroe", nombre: "Viaje del héroe", categoria: "Storytelling",
    descripcion: "La clásica historia de superación — el protagonista empieza en una situación difícil. Ideal para contenido inspirador y educativo.",
    instrucciones: "Estructura: Gancho RESUMEN → Inicio (punto de partida antes del cambio) → Conflicto (el reto que pone todo en riesgo) → Transformación (el aprendizaje o acción que cambia la historia) → CTA (invitar a reflexionar o actuar).",
    ejemplo: "Lo que nadie te cuenta sobre escalar una cuenta de ads te va a doler, pero es la verdad. Arrancó gastando Bs. 300 al mes sin saber leer ni una métrica. Intentó subir el presupuesto de golpe, y perdió la mitad en una semana. Aprendió a escalar de a poco, revisando el ROAS día por día, y hoy maneja Bs. 15.000 mensuales con el mismo método. Si querés dejar de gastar a ciegas, comentá “quiero cambiar”." },

  { id: "gv_efecto_boomerang", nombre: "Efecto boomerang", categoria: "Viralidad",
    descripcion: "Empezar con un resultado impactante y volver al inicio para explicar cómo se logró.",
    instrucciones: "Estructura: Gancho (mostrar el resultado antes de explicar cómo) → Primer intento fallido → Segundo intento fallido (empeora la situación) → Revelación final (la clave real, vuelve al momento inicial) → CTA (pedir que comenten si se identifican).",
    ejemplo: "Bajé mi costo por resultado un 70% en un mes. Te explico cómo. Primero probé subir el presupuesto — el CPA solo empeoró. Después probé cambiar la audiencia — tampoco. La clave real no era ni el presupuesto ni la audiencia: era el horario en que publicaba el anuncio. Ahora publico distinto y el CPA se mantiene bajo. Si querés la plantilla exacta que usé, comentá “quiero crecer” y te la mando." },

  { id: "gv_desafio_contracorriente", nombre: "Desafío contracorriente", categoria: "Viralidad",
    descripcion: "Decir lo contrario a lo que la gente cree, pero respaldado con pruebas.",
    instrucciones: "Estructura: Frase provocadora (rompe una creencia popular) → Explicación inicial (por qué la idea común está equivocada) → Prueba o caso real → Nueva perspectiva (por qué tu planteamiento tiene más sentido) → CTA (pregunta para generar conversación).",
    ejemplo: "No deberías subir el presupuesto de tu campaña cada vez que funciona bien. Te explico por qué. Nos vendieron la idea de que más presupuesto es igual a más resultados. Pero varias cuentas que analizamos perdieron ROAS justo después de subir el gasto de golpe. Si en vez de subir de golpe subís gradual, el algoritmo mantiene la calidad de la audiencia. ¿Vos qué opinás — de golpe o gradual?" },

  { id: "gv_momento_wtf", nombre: "El momento WTF", categoria: "Viralidad",
    descripcion: "Historias que dejan a la audiencia en shock y la obligan a seguir viendo.",
    instrucciones: "Estructura: Gancho impactante (frase que genera confusión o sorpresa extrema) → Planteamiento (explicación breve de la situación) → Escalada (se complica el problema o aumenta la tensión) → Resolución inesperada (se explica el giro sorprendente) → CTA (pregunta para generar comentarios).",
    ejemplo: "Casi perdimos una cuenta de $50.000 en gasto mensual por un solo checkbox. Acá la historia. Configuramos una campaña nueva para un cliente grande. Todo parecía andar bien... hasta que notamos que la campaña estaba optimizando para el evento equivocado. Pausamos todo a tiempo, y el cliente ni se enteró del susto. ¿Qué habrías hecho en nuestro lugar?" },

  { id: "gv_roba_audiencia", nombre: "El roba audiencia", categoria: "Viralidad",
    descripcion: "Te subís a un tema o figura conocida del momento para atraer una audiencia que no te conoce todavía.",
    instrucciones: "Estructura: Gancho relacionado a algo/alguien conocido → Contexto sobre el tema + insight propio → Moraleja → CTA.",
    ejemplo: "Elon Musk pagó $44.000 millones por Twitter, y lo primero que cambió fue el algoritmo de recomendación. Te cuento qué tiene que ver eso con cómo Meta decide a quién le muestra tu anuncio. El principio es el mismo: la plataforma prioriza lo que genera más tiempo de pantalla, no lo que vos querés que vea la gente. Si entendés eso, diseñás el anuncio para ganarle al algoritmo en vez de pelear contra él. Si querés que te guíe, comentá “guía”." },

  { id: "gv_vacio_informacion", nombre: "Vacío de información", categoria: "Educación",
    descripcion: "La gente odia sentir que no sabe algo en lo que se cree experta — abrí ese vacío y cerralo con valor real.",
    instrucciones: "Estructura: Gancho con vacío de información → Pico de interés → Valor inmediato → Paso a paso → CTA.",
    ejemplo: "Hay una función de Meta Ads que el 90% de los que manejan su propia cuenta ni sabe que existe. Cada actualización del Administrador de Anuncios puede subirte o bajarte el costo por resultado sin que lo notes. La de este mes cambió cómo se calcula la ventana de atribución. Te enseño a aplicarlo en 3 pasos: primero revisá tu ventana actual, segundo compará resultados de 7 vs. 1 día, tercero ajustá según tu ciclo de venta. Todos los días compartimos esto, no te olvides de seguirnos." },

  { id: "gv_video_viral", nombre: "Video 100% viral", categoria: "Educación",
    descripcion: "Corregís un error común de tu audiencia con pasos accionables y una promesa concreta.",
    instrucciones: "Estructura: Gancho negativo (algo que tu audiencia está haciendo mal) → Oportunidad → Pasos accionables → Promesa → CTA.",
    ejemplo: "Dejá de pausar tu campaña apenas ves que sube el CPA — es literalmente lo peor que podés hacer. En vez de eso, hacé estos 3 ajustes en tu día 3 de campaña. Te prometo que si los aplicás vas a tener el ROAS que buscás sin tocar el presupuesto. Primero, revisá la frecuencia. Segundo, mirá el desglose por edad. Tercero, esperá 48 horas antes de decidir. Guardá este post para que no vuelvas a pausar una campaña que en realidad estaba por despegar." },

  { id: "gv_espejo", nombre: "El espejo", categoria: "Educación",
    descripcion: "Decís algo que tu audiencia sintió pero nunca pudo poner en palabras.",
    instrucciones: "Estructura: Gancho (pregunta o afirmación con la que la mayoría se identifica) → Validación → Causa o explicación → Reflexión → CTA.",
    ejemplo: "Mientras más gastás en ads sin medir nada, menos control real tenés. Es frustrante. Creemos que gastar más presupuesto es sinónimo de más resultados, pero a veces es al revés. El algoritmo de Meta necesita datos limpios para optimizar — si tocás la campaña todo el tiempo, nunca aprende. No se trata de gastar menos, sino de dejar que el sistema aprenda antes de tocarlo. ¿Te pasó? Comentá “me pasó” si alguna vez tocaste una campaña demasiado rápido y la arruinaste." },

  { id: "gv_historia_inesperada", nombre: "La historia inesperada", categoria: "Educación",
    descripcion: "Una experiencia cotidiana con un giro de aprendizaje profundo.",
    instrucciones: "Estructura: Gancho (historia cotidiana con frase intrigante) → Desarrollo → Giro → Lección final → CTA.",
    ejemplo: "Un alumno de 60 años me enseñó algo que me cambió la forma de dar clases. Lo vi armando su primera campaña, más metódico que alumnos de 25 años. Le pregunté su secreto. Me dijo: “no apuro nada, primero entiendo cada botón antes de tocarlo”. Ahí entendí que el problema no es la edad ni la experiencia previa — es la paciencia para entender antes de ejecutar. ¿Qué te motiva a seguir aprendiendo? Contá tu razón." },

  { id: "gv_paradoja_personal", nombre: "La paradoja personal", categoria: "Educación",
    descripcion: "Una creencia que sostuviste toda tu vida, hasta que un momento concreto te hizo cambiar de opinión.",
    instrucciones: "Estructura: Declaración contradictoria → Contexto personal → Momento de revelación → Explicación de la paradoja → CTA.",
    ejemplo: "Toda mi vida pensé que gastar más presupuesto me haría escalar más rápido. Estaba equivocado. Solía subir el gasto apenas veía un buen ROAS, pensando que así crecía más rápido. Hasta que me di cuenta de que las cuentas que más duraban eran las que escalaban de a poco, no las que subían de golpe. El verdadero crecimiento viene de ir gradual, no de apostar fuerte de una. ¿Sentiste alguna vez que cuanto más apurás el crecimiento, menos control tenés?" },

  { id: "gv_gancho_controversial", nombre: "Gancho controversial", categoria: "Educación",
    descripcion: "Una afirmación que va contra el sentido común, respaldada con una razón lógica y prueba real.",
    instrucciones: "Estructura: Gancho controversial → Una razón lógica y clara de por qué pensás eso → Prueba social → CTA.",
    ejemplo: "Subir el presupuesto de tu campaña apenas ves buenos resultados es el peor error que podés cometer. La razón es simple: el algoritmo de Meta necesita tiempo para aprender con el presupuesto actual — si lo subís de golpe, resetea el aprendizaje y el CPA se dispara. Analizamos más de 50 cuentas de alumnos y el 80% de las que subieron el presupuesto más del 20% de una vez perdieron ROAS la semana siguiente. Si tenés dudas sobre cómo escalar bien tu cuenta, escribí “escalar” y te ayudo." },

  { id: "gv_regla_de_3", nombre: "La regla de 3", categoria: "Educación",
    descripcion: "Un método propio en 3 pasos accionables, con prueba social y una promesa de resultado.",
    instrucciones: "Estructura: Gancho con deseo o dolor (una meta a la que quieran llegar) → Prueba social → 3 tips accionables → Una promesa → CTA.",
    ejemplo: "Esta es la estrategia que ayudó a una alumna a pasar de gastar Bs. 500 sin resultados a facturar Bs. 8.000 en un mes. Tiene 3 pasos y la llamamos el Método de las 3 Capas. Primero, segmentás por interés amplio la primera semana. Segundo, creás una audiencia similar con tus compradores reales. Y tercero, excluís a quienes ya compraron para no desperdiciar presupuesto. Vas a ver resultados reales desde la primera semana que la apliques. Si querés que te ayude a implementarla, escribí “quiero” en los comentarios." },

  { id: "gv_respuesta_polemica", nombre: "Respondiendo a un comentario polémico", categoria: "Educación",
    descripcion: "Tomás una pregunta o comentario llamativo de tu audiencia y la respondés con valor real.",
    instrucciones: "Estructura: Comentario/pregunta polémica planteada de forma llamativa → Prueba social → Dar la opinión junto a algo aplicable → CTA e invitación a opinar.",
    ejemplo: "¿Cómo bajar el costo por resultado sin tocar el presupuesto? Hay dos cosas que podés aplicar desde ya, y que a mí me ayudaron a bajar el CPA un 35% el mes pasado. Primero, revisá la frecuencia del anuncio — a partir de 3, empezás a pagar de más por la misma gente. Y segundo, rotá el creativo cada 10-14 días, no esperes a que se “queme” del todo. Si querés ayuda con estos temas, no te olvides de seguirme." },

  { id: "gv_escalera_autoridad", nombre: "La escalera de autoridad", categoria: "Venta",
    descripcion: "Mostrás una evolución progresiva en la que tu método es la clave del éxito.",
    instrucciones: "Estructura: Gancho antes/después → Primer paso (punto de partida con dificultades reales) → Segundo paso (primer cambio/aprendizaje) → Tercer paso (cómo llegó al éxito con una estrategia clave) → Resultado final → CTA.",
    ejemplo: "Así pasé de manejar Bs. 500 al mes en ads a manejar Bs. 40.000 mensuales para clientes reales. Al principio ni sabía leer el Administrador de Anuncios y perdía presupuesto en audiencias mal armadas. Aprendí a leer las métricas que de verdad importan — no el alcance, el costo por resultado real. Después empecé a escalar gradual con revisión cada 3 días, y ahí las cuentas empezaron a crecer sin volverse inestables. Hoy vivo 100% de gestionar cuentas de ads y tengo lista de espera de clientes. Comentá “quiero aprender” y te cuento la estrategia exacta que usé." },

  { id: "gv_problema_invisible", nombre: "El problema invisible", categoria: "Educación",
    descripcion: "Presentás un problema que la audiencia no sabía que tenía, y le vendés la solución.",
    instrucciones: "Estructura: Gancho (afirmación que haga dudar al espectador sobre su propia situación) → Problema invisible → Evidencia o síntomas → Solución → CTA.",
    ejemplo: "Si tu campaña “funciona bien” pero no escala, este es el motivo real (y no es el presupuesto). Tener buen ROAS en un público chico no garantiza que puedas escalarlo — si tu audiencia ya está casi agotada, cada peso extra sube el costo sin sumar resultados. Si notás que al subir presupuesto el CPA se dispara aunque el anuncio “funcionaba bien”, es exactamente esto. La clave no es gastar más, es abrir audiencias nuevas antes de escalar la que ya tenés. Comentá “quiero escalar” y te cuento cómo hacerlo bien." },

  { id: "gv_historias_venden", nombre: "Historias que venden", categoria: "Venta",
    descripcion: "Las personas compran cuando entienden el sentimiento y la transformación que les va a dar tu producto.",
    instrucciones: "Estructura: Gancho que resuma lo más fuerte que sentiste en tu historia → Qué problemática tenías al inicio → Qué te hizo dar cuenta de la problemática (punto de quiebre) → Qué te ayudó a resolverlo → Qué lección te dejó → CTA.",
    ejemplo: "Estuve a punto de cerrar mi agencia de ads. Manejaba 6 cuentas de clientes y ninguna escalaba más allá de Bs. 2.000 de gasto mensual sin que el ROAS se desplomara. Busqué de todos lados: cursos gratis, foros, probar y errar durante meses. Lo que me cambió la forma de trabajar fue entender que cada cuenta tiene su propia curva de aprendizaje del algoritmo — no hay una fórmula única para todas. Apliqué eso y hoy esas mismas 6 cuentas manejan en conjunto más de Bs. 60.000 mensuales. Si querés esto para tu negocio, contame en qué etapa estás." },

  { id: "gv_reaccion_video", nombre: "Reacción a video o comentario", categoria: "Educación",
    descripcion: "Reaccionás a un consejo de otro creador, señalás el problema, y das tu propia solución práctica.",
    instrucciones: "Estructura: Respuesta a comentario/reacción a video de otro creador → Señalar el problema → Presentar solución práctica → Invitar a que dejen más dudas o sugerencias.",
    ejemplo: "Vi un video que decía que subir el presupuesto todos los días es la mejor forma de escalar rápido. Eso no es del todo cierto — subir todos los días sin dejar que el algoritmo se estabilice reinicia el aprendizaje y te sube el CPA. Si vas a escalar, hacelo cada 3-4 días como máximo, y en incrementos del 20%, no de golpe. Si querés que siga analizando videos de este tipo, dejá un comentario." },

  { id: "gv_pitch_perfecto", nombre: "Pitch de venta perfecto", categoria: "Venta",
    descripcion: "Presentás un problema (el “villano”) y tu solución (el “héroe”) en una estructura de pitch clásica.",
    instrucciones: "Estructura: Problema (crea un villano) → Oportunidad (crea un héroe) → Pasos prácticos → Promesa → CTA.",
    ejemplo: "Estás perdiendo plata por no revisar la frecuencia de tus anuncios. Un anuncio que se repite demasiado a la misma persona deja de convertir y solo te sube el costo. Para evitarlo, necesitás rotar el creativo antes de que la frecuencia pase de 3. Primero, revisá la frecuencia en el desglose de tu campaña. Segundo, preparate 2-3 variantes del mismo anuncio desde el día uno. Tercero, alternalas cada semana. Con esto el costo por resultado se mantiene estable en vez de subir con el tiempo. Escribí una palabra en los comentarios si querés ayuda para armar tus variantes." },
];

export const RECETA_CATEGORIAS: string[] = Array.from(new Set(RECETAS.map(r => r.categoria)));

export function recetaById(id?: string): Receta | undefined {
  return id ? RECETAS.find(r => r.id === id) : undefined;
}
