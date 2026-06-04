import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  purple:      "#7A5AF6",
  purpleDark:  "#5B3FD4",
  purpleLight: "#BDC0EF",
  purpleBg:    "#F0EEFE",
  navy:        "#181349",
  navyMid:     "#252060",
  slate:       "#545F66",
  gray:        "#E4E6EA",
  grayLight:   "#F4F3FB",
  white:       "#FFFFFF",
  pain:        { color:"#D94F4F", bg:"#FFF2F2", border:"#F5BCBC" },
  promise:     { color:"#1A9E6E", bg:"#EDFAF4", border:"#9EE0C6" },
  proof:       { color:"#2878D4", bg:"#EEF5FF", border:"#A8CCFA" },
  constraints: { color:"#C07C10", bg:"#FFF8EA", border:"#F0D080" },
  curiosity:   { color:"#7A5AF6", bg:"#F0EEFE", border:"#BDC0EF" },
  conditions:  { color:"#C44F82", bg:"#FEF0F5", border:"#F0B4D0" },
  offer:       { color:"#0E7F8C", bg:"#EAFAFA", border:"#8ED8DE" },
};
const font = `'DM Sans', 'Helvetica Neue', sans-serif`;

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TIPOS = [
  { id:"pain",        label:"Pain",        ...T.pain },
  { id:"promise",     label:"Promise",     ...T.promise },
  { id:"proof",       label:"Proof",       ...T.proof },
  { id:"constraints", label:"Constraints", ...T.constraints },
  { id:"curiosity",   label:"Curiosity",   ...T.curiosity },
  { id:"conditions",  label:"Conditions",  ...T.conditions },
  { id:"offer",       label:"Offer",       ...T.offer },
];
const FUNCIONES = ["hook","body","headline","cta","offer"];
const FL = { hook:"Hook", body:"Body", headline:"Headline", cta:"CTA", offer:"Offer" };
const FC = { hook:T.purple, body:T.slate, headline:T.proof.color, cta:T.conditions.color, offer:T.offer.color };
const ANGULOS = [
  { id:"contrarian",    label:"Contraintuitivo",
    desc:"Contradice algo que todos dan por sentado. Crea disonancia cognitiva inmediata.",
    example:"Stopping saved audiences was the best thing I did for my campaigns.",
    adExample:"Dejé de usar audiencias guardadas y mis costos bajaron un 40%.\n\nTodos los expertos dicen que son esenciales.\nYo digo que estaban destruyendo mi ROAS.\n\nAquí exactamente qué hice en cambio →" },
  { id:"whistleblower", label:"Denunciante",
    desc:"Expone una verdad incómoda que la industria no quiere que sepas.",
    example:"The real reason your agency isn't showing you the full picture.",
    adExample:"La razón real por la que tu agencia no te muestra el costo por resultado.\n\nNo es incompetencia. Es un incentivo.\n\nTe explico cómo leer las métricas que de verdad importan →" },
  { id:"story",         label:"Historia",
    desc:"Momento específico en el tiempo. El cerebro necesita saber qué pasó — vívido, tiempo presente.",
    example:"6 months ago my business spent $2k/month with zero results.",
    adExample:"Hace 6 meses gastaba Bs. 800 al mes en ads sin ver un solo domicilio nuevo.\n\nHoy tenemos 47 pedidos diarios.\n\nLa diferencia no fue el presupuesto — fue saber exactamente qué medir." },
  { id:"howto",         label:"Cómo hacerlo",
    desc:"Enseña algo específico y accionable. Autoridad por demostración — muestra el método.",
    example:"How to cut your CPL in half without changing your budget.",
    adExample:"Cómo conseguir domicilios a Bs. 8 sin subir el presupuesto.\n\n3 cambios en tu campaña de Meta Ads:\n✓ Cambiar el objetivo de campaña\n✓ Ajustar la ventana de atribución\n✓ Reemplazar el hook del anuncio\n\nCosto por pedido cayó de Bs. 22 a Bs. 8 en 11 días." },
  { id:"comparison",    label:"Comparación",
    desc:"Nosotros vs ellos, método viejo vs nuevo, antes vs después. El contraste crea claridad.",
    example:"Most agencies take 90 days to show results. We show them in 7.",
    adExample:"La mayoría de dueños de restaurante espera 3 meses para ver resultados en ads.\nNosotros los vemos en 7 días.\n\nNo es magia — es saber qué indicadores seguir desde el día 1.\n\nTe mostramos cómo →" },
  { id:"confession",    label:"Confesión",
    desc:"El experto admite algo inesperado o vergonzoso. Alta credibilidad por la vulnerabilidad.",
    example:"I spent $8,000 on Meta Ads before understanding why it wasn't working.",
    adExample:"Gasté $8,000 en Meta Ads antes de entender por qué nada funcionaba.\n\nEl error era tan obvio que me da vergüenza.\n\nHoy enseño a mis alumnos exactamente lo que aprendí — para que no pasen por lo mismo." },
  { id:"dayinlife",     label:"Un día en mi vida",
    desc:"Documenta tu proceso real o la transformación de un cliente. 'Documenta, no crees' — Garyvee.",
    example:"What my Monday looks like managing $200k/month in ad spend.",
    adExample:"Lunes 7am. Abro Ads Manager.\n3 campañas activas. ROAS: 4.2x, 3.8x, y una que pausaré hoy.\n\nAsí empieza mi semana gestionando ads para restaurantes locales en Bolivia.\nDocumento todo para que puedas hacer lo mismo." },
  { id:"analyzer",      label:"Analizador",
    desc:"Estudiaste algo externo y compartes los patrones. No necesitas ser experto — solo observador.",
    example:"I analysed 50 ads that spent over $100k. They all had one thing in common.",
    adExample:"Analicé los 50 ads de restaurantes en Bolivia que más gastaron el año pasado.\n\nEl 94% tenía algo en común.\nEl 89% de los que no funcionaron también — pero diferente.\n\nTe explico ambas cosas." },
  { id:"fear",          label:"Miedo / Consecuencias",
    desc:"Qué pasa si NO actúan — consecuencias específicas, vívidas, que se acumulan con el tiempo.",
    example:"Every day you delay is another day your competitor takes your customers.",
    adExample:"Cada semana sin domicilios propios = Bs. 500 que van a la app de delivery.\n\nY el 30% de comisión que pagas no te deja a ti los clientes — te los deja a ellos.\n\n¿Cuándo fue la última vez que un cliente de PedidosYa volvió y te pidió directo?" },
  { id:"aspiration",    label:"Aspiración",
    desc:"Pinta la transformación a nivel identidad que tu avatar quiere. No características — su yo futuro.",
    example:"What life looks like when your ads print money while you sleep.",
    adExample:"Imagina abrir Ads Manager el lunes y ver 23 pedidos llegaron mientras dormías.\n\nSin llamadas. Sin coordinar.\nSolo pedidos listos para entregar.\n\nEso es lo que pasa cuando tienes el sistema correcto." },
  { id:"socialproof",   label:"Prueba social",
    desc:"Lidera con resultados que otros han logrado. Deja que los números y nombres hablen.",
    example:"300 students. Average 3x ROAS improvement in the first 30 days.",
    adExample:"Restaurante Don Beto: 3 domicilios diarios en enero. 47 en marzo.\n\nUn solo cambio en su estrategia de Meta Ads.\nMisma zona. Mismo presupuesto. Diferente sistema." },
  { id:"mythbusting",   label:"Desmitificador",
    desc:"Destruye una creencia común que tiene tu avatar y lo frena de encontrar la solución correcta.",
    example:"More budget doesn't mean better results. Here's what actually does.",
    adExample:"El error: creer que más presupuesto = más clientes.\n\nLa realidad: el 80% de restaurantes que conozco gasta de más en las audiencias equivocadas.\n\nEl presupuesto no es el problema. El sistema sí." },
  { id:"challenge",     label:"Desafío",
    desc:"Call-out directo o reto. Alto engagement, polarizante — filtra a la audiencia correcta.",
    example:"If you can't answer these 3 questions about your campaigns, we need to talk.",
    adExample:"3 preguntas que todo dueño de restaurante debería responder antes de gastar en ads:\n\n1. ¿Cuánto te cuesta conseguir un cliente nuevo?\n2. ¿Cuánto vale ese cliente en 6 meses?\n3. ¿Qué % de tus clientes repiten?\n\nSi no sabes las 3, hay algo importante que resolver primero." },
];
const ESTILOS = [
  { id:"ugc",         label:"UGC",              desc:"Estilo generado por el usuario. Crudo, auténtico, filmado con celular.", example:"Cámara temblorosa, luz natural, hablando directo a cámara como un amigo." },
  { id:"talkinghead", label:"Talking head",     desc:"Limpio, directo a cámara. Profesional pero personal.", example:"Persona habla a cámara, fondo simple, audio claro." },
  { id:"founderfled", label:"Fundador a cámara",desc:"El fundador cuenta la historia. Autoridad + autenticidad combinadas.", example:"'Empecé esto porque estaba frustrado con…'" },
  { id:"testimonial", label:"Testimonio",       desc:"Cliente real comparte su resultado. Mejor con números específicos.", example:"'En 30 días pasé de ROAS 1.2x a 3.8x usando este método.'" },
  { id:"voiceover",   label:"Voz en off + B-roll",desc:"Narración sobre imágenes relevantes. Cinematográfico, escalable.", example:"Voz o texto sobre tomas del producto, footage de clientes, o screen recordings." },
  { id:"textonscreen",label:"Texto en pantalla", desc:"Subtítulos en negrita llevan el mensaje. Funciona sin sonido.", example:"Texto superpuesto a ritmo rápido sincronizado con música." },
  { id:"documentary", label:"Documental",       desc:"Basado en historia, multi-toma. Detrás de cámaras o recorrido del cliente.", example:"Seguir a un cliente a través de su transformación en el tiempo." },
  { id:"beforeafter", label:"Antes y después",  desc:"Contraste visual. Muestra la transformación claramente.", example:"Pantalla dividida o tomas secuenciales mostrando el cambio claro." },
  { id:"tutorial",    label:"Tutorial",         desc:"Enseña algo útil. Valor primero, CTA al final.", example:"'Aquí exactamente cómo configuro mi campaña de Meta en 10 minutos.'" },
  { id:"skit",        label:"Sketch / comedia", desc:"Humor y identificación. Alta viralidad.", example:"Dramatiza el problema o el contraste de forma graciosa y exagerada." },
];

// ─── SUBCOMPONENTS REPOSITORY ─────────────────────────────────────────────────
// ─── BLOCK FORMATS ────────────────────────────────────────────────────────────
const CUSTOM_FORMAT = { id:"custom", label:"✏️ Formato personalizado…" };
const BLOCK_FORMATS = {
  // 16 hook frameworks — agrupados por categoría para la UI
  hook: [
    { id:"pain_curiosity",   cat:"Estructura",          label:"Dolor + Curiosidad",              hint:"Nombra el dolor exacto y añade un mecanismo que genera intriga. '¿Por qué [problema] (y cómo [mecanismo] lo resuelve)?'" },
    { id:"promise_curiosity",cat:"Estructura",          label:"Promesa + Curiosidad",             hint:"Promete un resultado ligado a algo contraintuitivo. 'Cómo [resultado] haciendo solo [mecanismo inesperado]'" },
    { id:"contrarian",       cat:"Estructura",          label:"Contraintuitivo",                  hint:"Contradice algo que todos dan por sentado. '[Lo que todos hacen] está destruyendo tu [X]. Por qué.'" },
    { id:"stakes",           cat:"Estructura",          label:"Consecuencias / Stakes",           hint:"Muestra qué pasa si NO actúan. 'Cada [período] sin [acción] = [consecuencia que se acumula]'" },
    { id:"teacher",          cat:"Posicionamiento",     label:"Maestro (experto)",                hint:"Enseña algo específico desde experiencia propia. 'Las [N] cosas que siempre hago para [resultado]'" },
    { id:"analyzer",         cat:"Posicionamiento",     label:"Analizador",                       hint:"Sintetiza algo que estudiaste externamente. 'Analicé [N] [cosas]. Esto tienen en común los que funcionaron.'" },
    { id:"journey",          cat:"Posicionamiento",     label:"Documentando el camino",           hint:"Documenta tu proceso en tiempo real. 'Día/Semana [N] de [proceso]. Esto pasó.'" },
    { id:"confessional",     cat:"Posicionamiento",     label:"Confesión",                        hint:"Admite algo inesperado o incómodo. 'Gasté [cantidad] en [cosa] antes de entender [verdad].'" },
    { id:"cant_believe",     cat:"Plantillas probadas", label:"No puedo creer que existe esto",   hint:"FOMO inmediato. 'No puedo creer que [descubrimiento valioso] esté [disponible/funcionando así]'" },
    { id:"controversial",    cat:"Plantillas probadas", label:"Esto puede ser controversial…",    hint:"Abre un bucle de tensión. Polariza. 'Esto puede ser controversial: [verdad que genera fricción]'" },
    { id:"never_again",      cat:"Plantillas probadas", label:"Por qué nunca volvería a X",       hint:"Confesional + contraintuitivo. 'Por qué nunca volvería a [práctica común] después de [descubrimiento]'" },
    { id:"illegal",          cat:"Plantillas probadas", label:"Se siente ilegal de saber",        hint:"Acceso privilegiado. VARÍA el inicio — nunca repitas la misma frase: 'Nadie te va a contar esto:', 'Si los del gremio me escuchan, me odian.', 'El dato que todos esconden:', 'Lo que callamos en la industria:', 'Llevo años sabiendo esto y nunca lo dije.' El insight en sí debe ser específico al negocio." },
    { id:"unpopular",        cat:"Plantillas probadas", label:"Opinión impopular",                hint:"Postura firme contra algo ampliamente aceptado. 'Opinión impopular: [creencia contraria a tu mercado]'" },
    { id:"kept_for_me",      cat:"Plantillas probadas", label:"Lo iba a guardar para mí pero…",  hint:"Exclusividad. 'Lo iba a guardar para mí, pero [insight, estrategia, o recurso valioso]'" },
    { id:"stop_doing",       cat:"Plantillas probadas", label:"Para de hacer X",                  hint:"Interrumpe un comportamiento contraproducente. 'Para de [acción dañina] antes de [condición previa]'" },
    { id:"real_result",      cat:"Plantillas probadas", label:"Resultado de alguien real",        hint:"La más creíble. 'Cómo [persona específica] logró [resultado con número] en [tiempo] con [mecanismo]'" },
    { id:"enthusiasm",       cat:"Emoción",             label:"Entusiasmo personal",               hint:"'Acabo de conseguir [X] y estoy súper emocionado/a.' Energía genuina que contagia." },
    { id:"myth_reveal",      cat:"Emoción",             label:"Mito revelado",                     hint:"'[N] mitos sobre [X] que te están costando plata.' Destruye creencias falsas del avatar." },
    { id:"frustration_hook", cat:"Emoción",             label:"Frustración cotidiana",             hint:"'[Situación frustrante] es una lucha constante.' El avatar siente que alguien por fin lo entiende." },
    { id:"obsession",        cat:"Emoción",             label:"Obsesión / Adicción positiva",      hint:"'Estoy completamente obsesionado/a con [X].' Genera FOMO y curiosidad inmediata." },
    { id:"age_identity",     cat:"Emoción",             label:"Identidad por edad o grupo",        hint:"'Tengo [edad/rol]. Así es cómo [X] me ayudó con [problema].' Identificación inmediata con el avatar." },
    { id:"honest_review",    cat:"Emoción",             label:"Opinión honesta",                   hint:"'Mi opinión honesta sobre [X] después de [tiempo].' Alta credibilidad por transparencia percibida." },
    { id:"tutorial_steps",   cat:"Paso a paso", label:"X pasos para [resultado]",      hint:"'[N] pasos para [resultado específico con número].' Enuncia el resultado primero, muestra los pasos, implica la simplicidad." },
    { id:"howto_journey",    cat:"Paso a paso", label:"Cómo fui de A a B en [tiempo]", hint:"'Cómo fui de [situación mala] a [resultado] en solo [tiempo].' Proceso concreto, tiempo específico." },
    { id:"formula_steps",    cat:"Paso a paso", label:"La fórmula de [X]",             hint:"'La [NOMBRE DE FÓRMULA]: [resultado] en [poco tiempo].' Dale un nombre memorable al proceso." },
    { id:"authority_steal",  cat:"Autoridad",   label:"Roba mi estrategia exacta",     hint:"'Roba mi estrategia exacta para [resultado].' Implica que el oyente obtiene algo probado y funcional." },
    { id:"authority_years",  cat:"Autoridad",   label:"Pasé X años dominando esto",    hint:"'Pasé [N] años dominando [tema], pero puedo simplificarlo en [tiempo corto].' Experiencia + accesibilidad." },
    { id:"authority_helped", cat:"Autoridad",   label:"[N] personas lograron [X]",     hint:"'Esta estrategia ayudó a [N] de mis [clientes/alumnos] a lograr [resultado].' Prueba de escala." },
    { id:"before_after",     cat:"Transformación", label:"De [malo] a [bueno] en [tiempo]",  hint:"'De [situación mala] a [situación buena] en [tiempo].' Sin contexto extra — el contraste habla solo." },
    { id:"before_after_date",cat:"Transformación", label:"Hace X meses: [dolor]. Hoy: [ganancia].", hint:"Usa líneas separadas. 'Hace 6 meses: [dolor vivido]. Hoy: [ganancia con número].' Visual y específico." },
    { id:"direct_question",  cat:"Pregunta directa", label:"¿Alguna vez has [frustración]?", hint:"'¿Alguna vez te preguntaste por qué [punto de dolor]? Aquí está la razón real.' Reconocimiento inmediato." },
    { id:"comparison_gap",   cat:"Comparación", label:"La diferencia entre promedio y excepcional", hint:"'La diferencia entre [resultado promedio] y [resultado excepcional] es solo una cosa. Aquí está:'" },
    { id:"trend_change",     cat:"Tendencia",   label:"[X] está cambiando en [año]",   hint:"'[Plataforma/industria] está cambiando en [año] — y esto significa [impacto concreto para el avatar].'" },
    { id:"fear_costing",     cat:"Advertencia", label:"Este error te está costando [X]",hint:"'Este simple error podría estar costándote [dinero/tiempo/clientes].' Amenaza específica, no genérica." },
    { id:"fear_warning",     cat:"Advertencia", label:"Para de hacer X antes de que empeore", hint:"'Para de [acción dañina] ahora, antes de [consecuencia que se acumula].' Urgencia concreta." },
    CUSTOM_FORMAT,
  ],
  // Pain — 6 dimensiones Luke Eha
  pain: [
    { id:"moment",       label:"Momento específico",          hint:"Nombra el dolor con hora y lugar exactos. 'Son las 12:30 y hay 8 mesas vacías. Otra vez.'" },
    { id:"daily",        label:"Dolor cotidiano",             hint:"Síntoma → dolor real subyacente. Más específico y visual = más identificación." },
    { id:"agitation",    label:"Agitación (PAS)",             hint:"Consecuencias de no actuar. Máx 2-3 líneas — no seas manipulador." },
    { id:"identity",     label:"Dolor de identidad",          hint:"'No soy el tipo de persona que…' — trabájalo alrededor, no intentes cambiar la identidad." },
    { id:"resources",    label:"Tiempo / dinero perdido",     hint:"Cuantifica lo que pierden. '3 meses pagando 30% de comisión y los clientes siguen siendo de la app, no tuyos.'" },
    { id:"past_failure", label:"Intentos fallidos antes",     hint:"Ya lo intentaron y no funcionó. Reconoce la herida, luego diferénciate con prueba específica." },
    CUSTOM_FORMAT,
  ],
  // Promise — transformación y deseo
  promise: [
    { id:"transformation",label:"Transformación + número",   hint:"Siempre número + tiempo. '47 domicilios/día en vez de 3. Sin depender de apps.'" },
    { id:"future_pace",   label:"Futuro Visualizado",        hint:"Lleva al lector al futuro deseado como si ya lo tuviera. Activa la identidad futura." },
    { id:"benefits",      label:"Lista de beneficios",       hint:"Beneficios concretos con números. Elimina adjetivos vacíos, añade especificidad." },
    { id:"bab",           label:"Antes / Después (BAB)",     hint:"Antes: estado actual con número. Después: estado deseado con número. Puente: qué cambió." },
    { id:"identity",      label:"Transformación de identidad",hint:"'El restaurante que no depende de apps.' Nueva identidad, no solo un resultado." },
    CUSTOM_FORMAT,
  ],
  // Proof — jerarquía de efectividad
  proof: [
    { id:"specific_result",label:"Resultado + nombre + número", hint:"El más efectivo. 'De 3 a 47 domicilios — Don Beto, Cochabamba.' Persona real + número real." },
    { id:"case_study",     label:"Caso de estudio detallado",   hint:"Historia de transformación con contexto. Antes → proceso → después." },
    { id:"testimonial",    label:"Testimonio de cliente",       hint:"Cita real o paráfrasis. Máxima credibilidad cuando incluye nombre + resultado específico." },
    { id:"stats",          label:"Estadísticas / Datos",        hint:"Datos externos verificables con fuente. Específico, no redondeado. '47%' supera a '50%'." },
    { id:"credentials",    label:"Credenciales del fundador",   hint:"Experiencia, trayectoria, contexto. Por qué eres la persona correcta para esto." },
    { id:"volume",         label:"Volumen de clientes / escala",hint:"'+400 pedidos entregados en junio.' Cantidad con contexto normaliza la compra." },
    CUSTOM_FORMAT,
  ],
  // Curiosity — el mecanismo nombrado
  curiosity: [
    { id:"mechanism",   label:"Mecanismo nombrado",       hint:"NECESITA su propio nombre. 'El Sistema Local-First', 'El Triángulo ROAS'. Sin nombre = sin recall." },
    { id:"open_loop",   label:"Bucle abierto",            hint:"Abre una pregunta sin responderla todavía. Hace que el lector NECESITE seguir leyendo." },
    { id:"curious_q",   label:"Pregunta intrigante",      hint:"Genera '¿qué es eso?' en la mente del lector. No retórica — genuinamente intrigante." },
    { id:"contrarian",  label:"Método contraintuitivo",   hint:"El cómo va contra lo que todos hacen. Contradice la solución obvia." },
    { id:"how_to",      label:"Proceso paso a paso",      hint:"El mecanismo explicado en pasos. Específico y accionable. Educación que vende." },
    { id:"insider",     label:"Secreto de la industria",  hint:"Insight que la mayoría no tiene. 'Lo que las apps de delivery no quieren que sepas.'" },
    CUSTOM_FORMAT,
  ],
  cta: [
    { id:"direct",     label:"Acción directa",         hint:"Di exactamente qué hacer: 'Haz clic abajo + [resultado inmediato en tiempo concreto]'" },
    { id:"low_risk",   label:"CTA de bajo riesgo",      hint:"Elimina fricción: 'Es gratis', 'Sin compromiso', 'Solo toma 2 minutos'. Borra la razón para no actuar." },
    { id:"benefit",    label:"Beneficio + acción",      hint:"Resultado primero: 'Consigue [resultado específico] — haz clic abajo para [acción].'" },
    { id:"urgency",    label:"Urgencia + acción",       hint:"'Quedan [N] cupos / hasta [fecha]. Si [condición del avatar], actúa ahora.'" },
    { id:"callout",    label:"Call-out de audiencia",   hint:"Filtra: 'Si eres [descripción exacta del avatar], este link es para ti.'" },
    CUSTOM_FORMAT,
  ],
  // Constraints — 5 dimensiones Luke Eha
  constraints: [
    { id:"identity",    label:"Objeción de identidad",     hint:"'No soy el tipo de persona que…' — trabájalo alrededor. Nunca intentes cambiar la identidad." },
    { id:"belief",      label:"Creencia limitante",        hint:"Las creencias son maleables. Usa prueba + reframing. 'Creías que necesitabas X — esto cambia todo.'" },
    { id:"time",        label:"Recurso: Tiempo",           hint:"Reencuadra el tiempo. No son 30 min — son los 30 min que ya pierdes haciendo X a la mala." },
    { id:"money",       label:"Recurso: Dinero",           hint:"Costo de NO actuar vs costo de actuar. 'Bs. 35 ahora vs Bs. 2.000 en comisiones mensuales.'" },
    { id:"past_fail",   label:"Fracaso pasado",            hint:"'Ya intenté algo así y no funcionó.' Reconoce, luego diferénciate con prueba." },
    { id:"direct_obj",  label:"Respuesta directa a objeción",hint:"'Sí, pero…' — el copy nombra la objeción y la responde directamente con evidencia." },
    CUSTOM_FORMAT,
  ],
  // Conditions — urgencia y escasez legítimas
  conditions: [
    { id:"urgency",     label:"Urgencia temporal",         hint:"Real y verificable. 'Menú de hoy solo hasta las 2pm.' NUNCA urgencia falsa." },
    { id:"scarcity",    label:"Escasez real",              hint:"'Solo 20 cupos.' Debe ser verificable. La escasez falsa destruye la confianza a largo plazo." },
    { id:"deadline",    label:"Fecha límite específica",   hint:"Fecha concreta, no vaga. 'Hasta el viernes 6' supera a 'por tiempo limitado'." },
    { id:"callout",     label:"Call-out de audiencia",     hint:"Llama al avatar por su descripción. 'Si tienes un restaurante en el norte de Cochabamba…' Filtra y califica." },
    { id:"eligibility", label:"Condición de elegibilidad", hint:"'Solo para negocios con delivery propio.' Hace que el avatar calificado sienta que es para él." },
    { id:"bonus",       label:"Bonus por tiempo limitado", hint:"'Postre gratis si pedís antes del viernes.' El bonus amplifica el valor de actuar ahora." },
    CUSTOM_FORMAT,
  ],
  // Offer — presentando la oferta
  offer: [
    { id:"main",        label:"Oferta principal",          hint:"Exactamente qué es + el precio. Específico. '3 módulos + comunidad + 2 calls en vivo = Bs. 350 pago único.'" },
    { id:"bonus",       label:"Stack de bonos",            hint:"Todo lo incluido + su valor percibido por separado. Hace que el precio sea una decisión obvia." },
    { id:"guarantee",   label:"Garantía / Reversión de riesgo",hint:"Elimina el riesgo de la decisión. 'Si no ves resultados en 30 días, devolvemos el 100%.'" },
    { id:"anchor",      label:"Ancla de precio",           hint:"Compara contra el costo de no actuar o alternativas más caras. Hace tu precio parecer obvio." },
    { id:"ease",        label:"Facilidad de inicio",       hint:"Reductor de fricción. 'Sin tarjeta. Sin contrato. 5 minutos.' El siguiente paso es obvio y seguro." },
    CUSTOM_FORMAT,
  ],
};

// ─── HOOK BLOCK TYPES (what angle this hook amplifies) ───────────────────────
const HOOK_BLOCK_TYPES = [
  { id:"pain",        label:"Pain",        emoji:"💔", color:T.pain.color,        bg:T.pain.bg,        desc:"Lidera con la lucha del avatar — se reconocen inmediatamente." },
  { id:"promise",     label:"Promise",     emoji:"✨", color:T.promise.color,     bg:T.promise.bg,     desc:"Lidera con la transformación o resultado — los atrae hacia el futuro que quieren." },
  { id:"proof",       label:"Proof",       emoji:"⭐", color:T.proof.color,       bg:T.proof.bg,       desc:"Lidera con un resultado real o testimonio — credibilidad instantánea detiene el scroll." },
  { id:"curiosity",   label:"Curiosity",   emoji:"🔮", color:T.curiosity.color,   bg:T.curiosity.bg,   desc:"Insinúa el mecanismo — crea un bucle abierto que necesitan resolver." },
  { id:"contrarian",  label:"Contrarian",  emoji:"⚡", color:T.constraints.color, bg:T.constraints.bg, desc:"Desafía una creencia ampliamente aceptada — la disonancia cognitiva congela el pulgar." },
  { id:"offer",       label:"Offer",       emoji:"🎁", color:T.offer.color,       bg:T.offer.bg,       desc:"Lidera con el valor de la oferta — funciona bien para audiencias tibias y calientes." },
  { id:"conditions",  label:"Conditions",  emoji:"⏰", color:T.conditions.color,  bg:T.conditions.bg,  desc:"Abre con urgencia o call-out directo — filtra a la audiencia correcta de inmediato." },
];
// Recommended hook formats per hook block type
const HOOK_TYPE_FORMATS = {
  pain:       ["pain_curiosity","stakes","confessional","never_again","controversial"],
  promise:    ["promise_curiosity","real_result","cant_believe","kept_for_me","teacher"],
  proof:      ["real_result","analyzer","teacher","cant_believe","journey"],
  curiosity:  ["illegal","kept_for_me","controversial","contrarian","stop_doing"],
  contrarian: ["contrarian","unpopular","controversial","never_again","stop_doing"],
  offer:      ["promise_curiosity","real_result","cant_believe","kept_for_me","illegal"],
  conditions: ["stakes","stop_doing","controversial","never_again","cant_believe"],
};

// ─── PERSONA CONSTANTS ────────────────────────────────────────────────────────
const AWARENESS_LEVELS = [
  { id:"unaware",  label:"Sin conciencia",           short:"Sin coc.",  color:"#64748B", bg:"#F1F5F9", desc:"No saben que tienen un problema" },
  { id:"problem",  label:"Consciente del problema",  short:"Problema",  color:"#D97706", bg:"#FFFBEB", desc:"Conocen el problema, no la solución" },
  { id:"solution", label:"Consciente de la solución",short:"Solución",  color:"#7A5AF6", bg:"#F0EEFE", desc:"Buscando activamente una solución" },
  { id:"product",  label:"Consciente del producto",  short:"Producto",  color:"#2878D4", bg:"#EEF5FF", desc:"Te conocen, evaluando opciones" },
  { id:"most",     label:"Muy consciente",           short:"Listo",     color:"#1A9E6E", bg:"#EDFAF4", desc:"Listo para comprar" },
];
const TRAFFIC_TEMPS = [
  { id:"cold", label:"Frío ❄️",      color:"#3B82F6", bg:"#EFF6FF", border:"#93C5FD" },
  { id:"warm", label:"Tibio 🌤",     color:"#D97706", bg:"#FFFBEB", border:"#FCD34D" },
  { id:"hot",  label:"Caliente 🔥",  color:"#DC2626", bg:"#FEF2F2", border:"#FCA5A5" },
];

const SUBCOMPONENTS = {
  facebook_ad: [
    { id:"hook",        name:"Hook",              def:"Pattern interrupt. First 2-3 lines. Must stop the scroll before 'see more'.", when:"Always first.", example:"Your ads are spending but ROAS won't move — and you have no idea why." },
    { id:"open_loop",   name:"Open Loop",         def:"A question or incomplete idea that creates tension the reader must resolve.", when:"When your avatar is curious but skeptical.", example:"There's one thing top media buyers check before launching any campaign…" },
    { id:"pain_amp",    name:"Pain Amplifier",    def:"Vivid, specific description of the pain. Makes the reader feel seen.", when:"After the hook, when you need emotional connection.", example:"Every morning you open Ads Manager hoping something changed. It hasn't." },
    { id:"agitation",   name:"Agitation",         def:"Escalates the pain. Shows what happens if nothing changes.", when:"After pain amplifier to increase urgency.", example:"At this rate, you'll spend another $3k next month with the same results." },
    { id:"desire",      name:"Desire Statement",  def:"The transformation they want. Identity-level outcome, not features.", when:"After establishing pain, before the solution.", example:"Imagine knowing exactly which ad to scale, which to kill, every single time." },
    { id:"mechanism",   name:"Mechanism Reveal",  def:"The named 'how' — your unique method or insight that makes the solution different.", when:"Introducing your solution. Gives it a memorable name.", example:"We call it the ROAS Triangle — the three levers every profitable campaign shares." },
    { id:"proof",       name:"Proof Block",       def:"Stats, testimonials, case study, or credentials. Backs up the claim.", when:"After desire or mechanism, to build belief.", example:"300+ students. Average 3x ROAS improvement in the first 30 days." },
    { id:"obj_crush",   name:"Objection Crusher", def:"Preemptively handles the #1 reason they'd say no.", when:"Before the CTA, when you know what stops them.", example:"No experience needed — you'll be working with real campaigns from day 1." },
    { id:"future_pace", name:"Future Pace",       def:"Vivid picture of life after the solution. Aspirational and specific.", when:"Before CTA, after proof.", example:"Picture opening Ads Manager on Monday knowing every campaign is dialled in." },
    { id:"social_proof",name:"Social Proof",      def:"Short quote or stat. Borrowed credibility.", when:"Anywhere to reinforce belief.", example:"'Best investment I've made in my business this year.' — Maria, La Paz" },
    { id:"before_after",name:"Before / After",    def:"Contrast state: where they are vs. where they'll be.", when:"Strong visual contrast moment.", example:"Before: $3k/month, 0.8x ROAS. After: $3k/month, 4.2x ROAS." },
    { id:"price_anchor",name:"Price Anchor",      def:"Makes the price feel small vs. the value or vs. alternatives.", when:"Just before the offer or CTA.", example:"One extra qualified call covers the entire cost of the program." },
    { id:"risk_rev",    name:"Risk Reversal",     def:"Guarantee. Removes the fear of being wrong.", when:"Just before CTA, when price is high.", example:"If you don't see improvement in 30 days, we refund everything. No questions." },
    { id:"identity",    name:"Identity Statement",def:"'For people who [identity]…' — makes the avatar self-select.", when:"Hook or opening when targeting a specific persona.", example:"For business owners who are tired of guessing with their ad budget." },
    { id:"cta_fb",      name:"CTA",               def:"Single, specific, frictionless action with a clear reason to act now.", when:"Always last.", example:"Click below and reserve your spot before Friday — 12 left." },
    { id:"headline",    name:"Headline",          def:"40 chars max. The promise in one line. Works completely standalone.", when:"Below the creative image/video.", example:"Master Meta Ads from zero" },
  ],
  video_script: [
    { id:"vid_hook",    name:"Video Hook (0-3s)", def:"Visual + verbal pattern interrupt. Must work without sound. Paired with visual direction and sound suggestion.", when:"Always first 3 seconds.", example:"POV: you just checked Ads Manager and ROAS is 4.2x for the third week straight." },
    { id:"empathy_open",name:"Empathy Open",      def:"'If you're like most [avatar]…' — makes the viewer feel immediately seen.", when:"After hook, to build connection fast.", example:"If you're like most business owners running ads, you're probably guessing more than you'd admit." },
    { id:"story_open",  name:"Story Open",        def:"Specific moment in time. Creates narrative engagement.", when:"When you want a cinematic, personal feel.", example:"6 months ago I was about to shut down my ad account. Today it's our best channel." },
    { id:"prob_walk",   name:"Problem Walkthrough",def:"Step-by-step of the problem. Shows deep understanding of their world.", when:"Middle section, to build credibility.", example:"First you try changing the creative. Doesn't work. Then you try the audience. Still nothing." },
    { id:"turning_pt",  name:"Turning Point",     def:"The moment everything changed. Narrative tension release.", when:"After problem walkthrough.", example:"Then I realised I'd been optimising the wrong metric the whole time." },
    { id:"solution_ts", name:"Solution Tease",    def:"Hints at the solution without revealing all. Keeps watching.", when:"Before the reveal to maintain attention.", example:"And when I found this one thing, my entire approach changed overnight." },
    { id:"benefits_list",name:"List of Benefits", def:"Quick-fire 'You'll get: X, Y, Z' — momentum building, fast.", when:"Mid-video, after solution tease.", example:"You'll know which ad to scale. Which to kill. And exactly when to do it." },
    { id:"comparison_v",name:"Comparison",        def:"Old way vs. new way. Creates clear contrast.", when:"After problem, before solution.", example:"Instead of guessing and hoping — you'll be making decisions from data." },
    { id:"demo",        name:"Demonstration",     def:"Show, don't tell. 'Watch what happens when…'", when:"When you have a tangible thing to show.", example:"[Screen recording of campaign dashboard going from 1.2x to 4.2x ROAS]" },
    { id:"cred_moment", name:"Credibility Moment",def:"Quick credential drop. Establishes authority fast.", when:"Early, before the main pitch.", example:"After managing over $2M in ad spend across 30 accounts, I can tell you…" },
    { id:"testimonial_v",name:"Testimonial Clip", def:"Real customer, specific result. Ideally in their own words.", when:"After your main claim, to back it up.", example:"[Cut to Maria]: 'Within 3 weeks, my ROAS went from 0.9 to 3.4.'" },
    { id:"vid_cta",     name:"CTA (Video)",       def:"Last 5-10 sec. One action only. Repeat it twice.", when:"Always last.", example:"Click the link below. Reserve your spot now. Link is below — don't wait." },
    { id:"sound_sug",   name:"Sound Suggestion",  def:"Trending or mood-matched audio that amplifies the hook's energy.", when:"Specified with the video hook.", example:"Use a confident, punchy beat — something like a trending sound with momentum." },
    { id:"visual_dir",  name:"Visual Direction",  def:"What's on screen: text overlay, b-roll, talking head directions.", when:"Throughout the script.", example:"[Tight crop on face, direct eye contact, good ring light, minimal background]" },
    { id:"mid_interrupt",name:"Mid Pattern Interrupt",def:"Unexpected cut, zoom, or bold statement mid-video to re-engage drifting attention.", when:"Around the 15-20 second mark.", example:"[Zoom in] Wait — I need to show you something." },
    { id:"cliffhanger", name:"Cliffhanger",       def:"Hooks them to stay until the end.", when:"First 5-10 seconds for longer videos.", example:"Stay until the end — I'm going to show you the exact setup we use." },
  ],
};

const STORAGE_KEY = "copyblocks_beta_v2";

// ─── HOOK FRAMEWORKS EXPANDIDOS ──────────────────────────────────────────────
// Basado en: Luke Eha CASH Method, 50 Hook Examples, What Makes A Good Hook
const HOOK_FRAMEWORKS = [
  // ── POR ESTRUCTURA (Pain+Curiosity formula) ──
  { id:"pain_curiosity", cat:"Estructura", label:"Dolor + Curiosidad",
    desc:"Nombra el dolor exacto del avatar y añade un mecanismo nombrado que genera intriga.",
    when:"Cold traffic. Cuando el dolor es claro y urgente.",
    example:"Por qué tus ads gastan pero el ROAS no sube (y el ajuste que lo arregla en 48h)",
    starter:"Por qué [problema exacto] (y cómo [mecanismo] lo resuelve)" },
  { id:"promise_curiosity", cat:"Estructura", label:"Promesa + Curiosidad",
    desc:"Promete un resultado específico ligado a algo contraintuitivo o sorprendente.",
    when:"Cuando tienes resultados concretos que demostrar.",
    example:"Cómo pasé de 0.8x a 4.2x ROAS cambiando solo una métrica que nadie mide",
    starter:"Cómo [resultado específico] haciendo solo [mecanismo inesperado]" },
  { id:"contrarian", cat:"Estructura", label:"Contraintuitivo",
    desc:"Contradice algo que todos dan por sentado. Crea disonancia cognitiva inmediata.",
    when:"Cuando tienes una perspectiva única o datos que van contra la creencia común.",
    example:"Dejar de usar audiencias guardadas fue lo mejor que hice para mis campañas",
    starter:"[Acción que todos hacen] está destruyendo tu [resultado]. Aquí por qué." },
  { id:"stakes", cat:"Estructura", label:"Consecuencias / Stakes",
    desc:"Muestra qué pasa si NO actúan. Incertidumbre sobre el outcome.",
    when:"Para agitar el dolor y crear urgencia real.",
    example:"Cada semana sin arreglar esto = Bs. 500 más que no vuelven",
    starter:"Cada día que [no haces X] = [consecuencia específica que se acumula]" },
  // ── POR POSICIONAMIENTO ──
  { id:"teacher", cat:"Posicionamiento", label:"Maestro (experto)",
    desc:"Hablas desde experiencia propia. Enseñas algo específico y accionable.",
    when:"Si tienes credenciales, resultados, o experiencia demostrable.",
    example:"Las 3 configuraciones que uso en cada cuenta para mantener ROAS sobre 3x",
    starter:"Las [N] cosas que hago siempre para [resultado]. Las que casi nadie hace." },
  { id:"analyzer", cat:"Posicionamiento", label:"Analizador (no necesitas ser experto)",
    desc:"Estudiaste algo externo y compartes los patrones. Cualquiera puede usarlo.",
    when:"No necesitas experiencia propia — solo analizar y sintetizar.",
    example:"Analicé 50 ads que gastaron +$100k cada uno. Todos tenían estas 3 cosas.",
    starter:"Analicé [N] [cosa externa]. Esto tienen en común los que funcionaron." },
  { id:"journey", cat:"Posicionamiento", label:"Documentando el camino",
    desc:"No eres experto — documentas tu proceso. Garyvee: 'document don't create'.",
    when:"Estás aprendiendo o probando algo. Máxima autenticidad.",
    example:"Día 1 de aprender Meta Ads desde cero — Bs. 200 de presupuesto, cero experiencia",
    starter:"Día [N] de [proceso]. Aquí lo que pasó." },
  { id:"confessional", cat:"Posicionamiento", label:"Confesión (experto + externo)",
    desc:"Experto que admite algo inesperado. Alta credibilidad por la vulnerabilidad.",
    when:"Tienes experiencia y quieres romper la expectativa del lector.",
    example:"Gasté $8,000 en Meta Ads antes de entender por qué nada funcionaba",
    starter:"Gasté [cantidad/tiempo] en [cosa] antes de entender [verdad incómoda]." },
  // ── POR FORMATO PROBADO (50 Hook Examples) ──
  { id:"cant_believe", cat:"Formato", label:"No puedo creer que encontré esto",
    desc:"Genera FOMO inmediato. El lector quiere saber qué encontraste.",
    when:"Cuando tienes un recurso, hack, o insight que genuinamente sorprende.",
    example:"No puedo creer que esto esté disponible gratis para restaurantes locales",
    starter:"No puedo creer que [descubrimiento valioso] esté [disponible/funcionando así]" },
  { id:"controversial", cat:"Formato", label:"Esto puede ser controversial pero…",
    desc:"Abre un bucle de curiosidad con tensión. Polariza para activar engagement.",
    when:"Tienes una opinión que va contra el consenso del mercado.",
    example:"Esto puede ser controversial: los mejores restaurantes de Cochabamba no necesitan delivery apps",
    starter:"Esto puede ser controversial, pero [verdad que genera fricción en tu mercado]" },
  { id:"never_going_back", cat:"Formato", label:"Por qué nunca volvería a X",
    desc:"Confessional + contraintuitivo. Funciona cuando abandonaste algo que todos hacen.",
    when:"Dejaste una práctica común y encontraste algo mejor.",
    example:"Por qué nunca volvería a abrir mi restaurante sin una lista de clientes propia",
    starter:"Por qué nunca volvería a [práctica común] después de [descubrimiento]" },
  { id:"feels_illegal", cat:"Formato", label:"Esto se siente ilegal de saber",
    desc:"Curiosidad extrema. El lector siente que accede a información privilegiada.",
    when:"Tienes un dato, estrategia, o insight que la mayoría desconoce.",
    example:"Esto se siente ilegal de saber: cómo llenar tu local cualquier día de semana",
    starter:"Esto se siente ilegal de saber: [insight de alto valor que la mayoría no conoce]" },
  { id:"unpopular_opinion", cat:"Formato", label:"Opinión impopular",
    desc:"Toma una postura firme contra algo aceptado. Alta polarización = alto engagement.",
    when:"Tienes una creencia contraria a la norma del mercado que puedes defender.",
    example:"Opinión impopular: la mayoría de negocios locales gasta en ads sin necesitarlo",
    starter:"Opinión impopular: [creencia contraria a lo que tu audiencia acepta como verdad]" },
  { id:"gatekeep", cat:"Formato", label:"Lo iba a guardar para mí pero…",
    desc:"Crea sensación de exclusividad. El lector siente que recibe algo especial.",
    when:"Tienes una estrategia, recurso, o insight que normalmente no compartes.",
    example:"Lo iba a guardar para mí pero: la razón real por la que algunos locales siempre están llenos",
    starter:"Lo iba a guardar para mí, pero [insight, estrategia, o recurso valioso]" },
  { id:"stop_doing", cat:"Formato", label:"Para de hacer X",
    desc:"Directo, imperativo. Interrumpe un comportamiento del avatar.",
    when:"Tu avatar está haciendo algo contraproducente que puedes identificar claramente.",
    example:"Para de pagar por delivery apps si no tienes lista de clientes propia primero",
    starter:"Para de [comportamiento común y contraproducente] antes de [condición previa]" },
  { id:"proof_of_work", cat:"Formato", label:"Resultado específico de alguien real",
    desc:"Especificidad máxima: persona + resultado + tiempo. La más creíble.",
    when:"Tienes un caso real — tuyo o de un cliente — con números verificables.",
    example:"Cómo Don Beto pasó de 3 a 47 domicilios diarios cambiando una sola cosa",
    starter:"Cómo [persona específica] logró [resultado con número] en [tiempo] con [mecanismo]" },
  // ── NUEVOS FRAMEWORKS (Winning Ad Templates) ──
  { id:"enthusiasm", cat:"Emoción", label:"Entusiasmo personal",
    desc:"Energía genuina sobre un producto o resultado. Contagia la emoción al espectador.",
    when:"Tienes un resultado real o producto que usas — la autenticidad es clave.",
    example:"Acabo de implementar esto en mi restaurante y estoy súper emocionado",
    starter:"Acabo de [descubrir/conseguir/implementar] [X] y estoy emocionado/a" },
  { id:"myth_reveal", cat:"Emoción", label:"Mito revelado",
    desc:"Expone 3-4 creencias falsas que tiene el avatar sobre su problema o solución.",
    when:"Tu avatar tiene misconceptions que lo frenan — destruirlas genera confianza.",
    example:"3 mitos sobre Meta Ads que están destruyendo el ROAS de restaurantes locales",
    starter:"[N] mitos sobre [X] que te están costando [consecuencia]" },
  { id:"frustration", cat:"Emoción", label:"Frustración / Problema cotidiano",
    desc:"Nombra directamente una frustración recurrente del avatar. 'Por fin alguien lo dice.'",
    when:"El avatar vive algo molesto a diario — lo escucha y se siente comprendido.",
    example:"Llevar la contabilidad del restaurante es un problema constante y nadie lo resuelve bien",
    starter:"[Situación frustrante del avatar] es una lucha constante" },
  { id:"obsession", cat:"Emoción", label:"Obsesión / Adicción positiva",
    desc:"Cuenta algo que no puedes dejar de usar o hacer. Genera FOMO y curiosidad.",
    when:"Tienes experiencia real con el producto — la primera persona funciona bien.",
    example:"Estoy completamente obsesionado con esta forma de conseguir domicilios sin apps",
    starter:"Estoy completamente obsesionado/a con [X] — y por eso" },
  { id:"age_identity", cat:"Prueba social", label:"Identidad por edad / grupo",
    desc:"Habla desde una identidad específica: edad, profesión, situación. Crea identificación inmediata.",
    when:"Tu avatar se identifica fuertemente con una categoría (edad, rol, situación).",
    example:"Tengo 42 años y soy dueño de restaurante. Así es cómo [X] cambió mis números este año.",
    starter:"Tengo [edad/rol]. Así es cómo [X] me ayudó con [problema específico]" },
  { id:"honest_review", cat:"Prueba social", label:"Opinión honesta",
    desc:"Review personal franca. 'Te cuento la verdad, no lo que quieres escuchar.' Alta credibilidad.",
    when:"Tienes experiencia real con algo que el avatar está evaluando comprar o hacer.",
    example:"Mi opinión honesta sobre las apps de delivery después de 8 meses usándolas",
    starter:"Mi opinión honesta sobre [X] después de [tiempo/experiencia]" },
  { id:"tutorial_steps", cat:"Paso a paso",
    label:"X pasos para [resultado]",
    desc:"Enuncia el resultado, muestra el número de pasos, implica la simplicidad del proceso.",
    when:"Tienes un proceso claro que puedes simplificar en pasos contables.",
    example:"3 pasos para conseguir domicilios propios sin pagar comisión a ninguna app",
    starter:"[N] pasos para [resultado específico con número]" },
  { id:"authority_steal", cat:"Autoridad",
    label:"Roba mi estrategia exacta",
    desc:"Reclama resultados, ofrece el proceso exacto. Alta credibilidad por la especificidad.",
    when:"Tienes un proceso probado con resultados reales que puedes mostrar.",
    example:"Roba mi estrategia exacta para duplicar pedidos sin bajar precios — la que usé con 12 restaurantes este año",
    starter:"Roba mi estrategia exacta para [resultado]. Aquí está:" },
  { id:"before_after", cat:"Transformación",
    label:"De [malo] a [bueno] en [tiempo]",
    desc:"Contraste máximo en mínimas palabras. El tiempo le da credibilidad — específico siempre.",
    when:"Tienes una transformación real con antes/después y tiempo específico.",
    example:"De Bs. 200 a Bs. 2.800 en domicilios por mes. En 47 días.",
    starter:"De [situación pasada] a [resultado con número] en [tiempo exacto]." },
  { id:"direct_question", cat:"Pregunta directa",
    label:"¿Alguna vez has [frustración relatable]?",
    desc:"Crea reconocimiento inmediato. El avatar siente que le leen la mente.",
    when:"Conoces una frustración muy específica que tu avatar vive regularmente.",
    example:"¿Alguna vez checaste las estadísticas de tu anuncio y no entendiste qué significaban?",
    starter:"¿Alguna vez [frustrante situación cotidiana de tu avatar]? Aquí está la razón real:" },
  { id:"comparison_gap", cat:"Comparación",
    label:"La diferencia entre promedio y excepcional",
    desc:"El gap crea intriga. Convierte al lector en alguien que quiere estar en el 1%.",
    when:"Puedes identificar la variable que separa resultados mediocres de excepcionales.",
    example:"La diferencia entre un restaurante con 30 domicilios al mes y uno con 300 es una sola cosa. Aquí está.",
    starter:"La diferencia entre [resultado promedio] y [resultado excepcional] es una sola cosa:" },
  { id:"trend_change", cat:"Tendencia",
    label:"[X] está cambiando en [año]",
    desc:"Los algoritmos aman el contenido en tiempo real. El FOMO impulsa el engagement.",
    when:"Hay un cambio real en tu industria que afecta directamente a tu avatar ahora.",
    example:"Meta Ads está cambiando en 2026 — y si no ajustas esto, tus campañas van a costar el doble",
    starter:"[Plataforma/industria] está cambiando en [año] — aquí lo que significa para [avatar]:" },
  { id:"fear_costing", cat:"Advertencia",
    label:"Este error te está costando [X]",
    desc:"Amenaza específica con costo cuantificable. Más efectivo cuando el error es no obvio.",
    when:"Puedes identificar un error específico y no obvio que tiene un costo cuantificable.",
    example:"Este simple ajuste (que el 94% omite) podría estar costándote Bs. 500 en comisiones cada semana",
    starter:"Este [error específico] podría estar costándote [pérdida cuantificable]. Aquí está la prueba:" },
];

// ─── BLOQUE TYPES (alineados con Copy Blocks de Luke Eha) ────────────────────
const TIPOS_BLOQUE = [
  { id:"pain",       label:"Pain",        color:"#D94F4F", bg:"#FFF2F2", border:"#F5BCBC",
    def:"El lugar donde está tu avatar ahora. Dolor vivido, específico, cotidiano.",
    subtypes:["Pain cotidiano","Pain de identidad","Pain de recursos (tiempo/dinero)","Pain de experiencia pasada","Pain de creencias bloqueantes"],
    tip:"Cuanto más específico y visual sea el dolor, más se sentirá identificado. Evita 'quiero crecer' — di exactamente qué no está funcionando." },
  { id:"promise",    label:"Promise",     color:"#1A9E6E", bg:"#EDFAF4", border:"#9EE0C6",
    def:"Adónde quiere llegar tu avatar. La tierra prometida. Siempre con número o resultado concreto.",
    subtypes:["Resultado concreto (número)","Transformación de identidad","Beneficio emocional","Beneficio práctico","Libertad / autonomía"],
    tip:"Una buena promesa tiene número + tiempo + sin X obstáculo. Ej: 3x más domicilios en 30 días sin bajar precios." },
  { id:"proof",      label:"Proof",       color:"#2878D4", bg:"#EEF5FF", border:"#A8CCFA",
    def:"El piloto que da credibilidad. Resultado real de alguien específico > número de clientes > rating.",
    subtypes:["Testimonio con resultado específico","Número de clientes/casos","Credencial del fundador","Dato externo verificable","Demostración visual"],
    tip:"Orden de efectividad: resultado específico (nombre+número) > cantidad de usuarios > autoridad externa > estrellas sin contexto." },
  { id:"curiosity",  label:"Curiosity",   color:"#7A5AF6", bg:"#F0EEFE", border:"#BDC0EF",
    def:"El mecanismo nombrado — el helicóptero que lleva del Pain al Promise. Debe ser nuevo y único.",
    subtypes:["Mecanismo nombrado (Named Mechanism)","Insight contraintuitivo","Proceso único","Framework propio","Dato que cambia perspectiva"],
    tip:"El mecanismo necesita un nombre. 'El Triángulo ROAS'. 'El Método 3-30'. Un nombre hace que sea memorable y percibido como exclusivo." },
  { id:"constraints",label:"Constraints", color:"#C07C10", bg:"#FFF8EA", border:"#F0D080",
    def:"Todo lo que frena a tu avatar de actuar. Más profundo que las objeciones — incluye identidad y creencias.",
    subtypes:["Constraints de identidad ('yo no soy el tipo de persona que...')","Constraints de valores","Constraints de creencias (maleables)","Constraints de recursos (tiempo/dinero/energía)","Constraints de experiencias pasadas"],
    tip:"Identidad y valores son casi imposibles de cambiar — trabájalos alrededor. Creencias son maleables — usa proof y reframing. Recursos — muestra que es más rápido/barato que la alternativa." },
  { id:"conditions",  label:"Conditions", color:"#C44F82", bg:"#FEF0F5", border:"#F0B4D0",
    def:"La dinamita con cuenta regresiva. Urgencia, escasez, y el call-out de audiencia específica.",
    subtypes:["Urgencia temporal (fecha real)","Escasez real (plazas/stock)","Call-out de avatar específico ('si tienes un restaurante...')","Condición de elegibilidad","Bonus temporal"],
    tip:"Urgencia FALSA destruye la confianza a largo plazo. Solo usa condiciones reales y verificables. El call-out de avatar es el más subutilizado y más efectivo." },
];

// ─── DEMO BRAND (Restaurante local — ejemplo relevante para LATAM) ────────────
const DEMO_BRAND = {
  id:"roas1", name:"Restaurante Don Beto", industry:"Restaurante / Comida local",
  perfil:{
    produto:"Restaurante de comida tradicional en Cochabamba, Bolivia",
    oferta:"Almuerzo ejecutivo a Bs. 35 (lunes-viernes). Cenas familiares. Domicilio gratis en 3km.",
    diferenciador:"Recetas de la abuela, ingredientes del mercado local, sin franquicias. El 80% de clientes son habituales.",
    voz:"Cálido, cercano, orgulloso de lo local. Nada de 'foodie'. Habla como habla la gente del barrio.",
    ubicacion:"Cochabamba, Bolivia. Zona norte.",
    extra:"Abierto lun-sáb 11am-9pm. Platos estrella: sopa de maní, silpancho, chicharrón. Máx 25 domicilios/día actualmente. Meta: llegar a 60."
  },
  avatars:[
    { id:"av1", name:"Carlos — trabajador de oficina", desc:"35 años, trabaja a 10 min del local. Almuerza afuera lunes-viernes. Presupuesto: Bs. 30-45.",
      pains:"Pierde 20-30 min buscando dónde comer. La mayoría de opciones son mediocres o caras. A veces regresa con hambre.",
      objection:"¿Llegará a tiempo? ¿Vale la pena el precio o termino comiendo menos?",
      language:"'¿Dónde comemos hoy?', 'que no sea caro ni tarde', 'algo que llene de verdad'" },
    { id:"av2", name:"María — mamá que organiza reuniones", desc:"42 años, organiza cumpleaños y reuniones familiares. Busca lugar cómodo, rico y que 'se vea bien para la foto'.",
      pains:"Las cadenas se sienten frías e impersonales. Difícil encontrar lugar que tenga buena comida Y buen ambiente familiar.",
      objection:"¿Habrá espacio para 8-10 personas? ¿Qué tan tarde atienden?",
      language:"'algo familiar y acogedor', 'que la gente quede contenta', 'que no sea caro para el grupo'" },
  ],
  competitors:[
    { id:"comp1", name:"Pollos Copacabana", url:"", notes:"Cadena. Ventaja: precio y reconocimiento. Desventaja: industrial, sin alma, experiencia genérica." },
    { id:"comp2", name:"Apps de delivery (PedidosYa etc)", url:"", notes:"Conveniencia. Desventaja: comisión del 30%, comida llega fría, cliente no es tuyo." },
  ],
  assets:[
    { id:"a1", tipo:"pain", funcs:["hook"], tags:["hook","concepto:c1"],
      text:"Son las 12:30 y todavía no sabes dónde almorzar. Otra vez." },
    { id:"a2", tipo:"pain", funcs:["body"], tags:["body","concepto:c1"],
      text:"Pagar Bs. 50 por comida mediocre que te dejó con hambre es el peor tipo de desperdicio." },
    { id:"a3", tipo:"promise", funcs:["body"], tags:["body","concepto:c1"],
      text:"Almuerzo en mesa en menos de 15 minutos. Plato completo que de verdad llena. Bs. 35." },
    { id:"a4", tipo:"proof", funcs:["body"], tags:["body","concepto:c1"],
      text:"\"Ya no salgo a buscar — pido siempre aquí\" — Carlos M., cliente desde hace 8 meses." },
    { id:"a5", tipo:"conditions", funcs:["cta"], tags:["cta","concepto:c1"],
      text:"Menú de hoy disponible hasta las 2pm. Pedí ahora y llega en 25 min o el postre va por la casa." },
  ],
  conceptos:[
    { id:"c1", concepto:"La mayoría de trabajadores pierde 30 minutos buscando dónde almorzar — sin encontrar nada bueno", angulo:"pain_curiosity", estilo:"ugc", hook:"Son las 12:30 y todavía no sabes dónde almorzar. Otra vez." },
  ],
  customAngles:[], customStyles:[],
  copies:[], offers:[],
};

// ─── STORAGE (artifact API) ───────────────────────────────────────────────────
// ─── STORAGE (Supabase for logged-in users, localStorage fallback) ───────────
const storage = {
  get: async (key) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.from("brands_data").select("data").eq("user_id", user.id).single();
        if (!error && data) return data.data;
      }
    } catch {}
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; }
  },
  set: async (key, value) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("brands_data").upsert({ user_id: user.id, data: value, updated_at: new Date().toISOString() });
      }
    } catch {}
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
};

// ─── AI CALL — routes to Anthropic, OpenAI, or Gemini ───────────────────────
async function callClaude(prompt, _apiKey, max = 1400) {
  const provider = window.__cbProvider || "anthropic";
  const apiKey   = window.__cbApiKey   || "";

  if (provider === "openai") {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-4o", max_tokens: max, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e?.error?.message || `HTTP ${r.status}`); }
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "";
  }

  if (provider === "gemini") {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: max } }),
    });
    if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e?.error?.message || `HTTP ${r.status}`); }
    const d = await r.json();
    return d.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  // Default: Anthropic — uses prompt caching for COPY_BRAIN when present
  const CB_TAG = "Eres un copywriter de respuesta directa de nivel";
  let reqBody;
  if (prompt.startsWith(CB_TAG)) {
    const cbEnd = prompt.indexOf("\n\n");
    const systemText = cbEnd > -1 ? prompt.slice(0, cbEnd) : COPY_BRAIN;
    const userContent = cbEnd > -1 ? prompt.slice(cbEnd + 2) : prompt;
    reqBody = {
      model: "claude-sonnet-4-5",
      max_tokens: max,
      system: [{ type: "text", text: systemText, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userContent }],
    };
  } else {
    reqBody = { model: "claude-sonnet-4-5", max_tokens: max, messages: [{ role: "user", content: prompt }] };
  }
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01", "x-api-key": apiKey, "anthropic-dangerous-direct-browser-access": "true", "anthropic-beta": "prompt-caching-2024-07-31" },
    body: JSON.stringify(reqBody),
  });
  if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e?.error?.message || `HTTP ${r.status}`); }
  const d = await r.json();
  return d.content?.[0]?.text || "";
}

function perfilCtx(p, avatars) {
  if (!p) return "";
  const avatarCtx = avatars?.length ? `\n- Avatars: ${avatars.map(a=>`${a.name}: ${a.desc}. Dolor: ${a.pains}. Lenguaje: ${a.language}`).join(" | ")}` : (p.avatar ? `\n- Avatar: ${p.avatar}` : "");
  return `CONTEXTO DE MARCA:\n- Producto: ${p.produto||p.producto||""}\n- Oferta: ${p.oferta||""}\n- Diferenciador: ${p.diferenciador||""}\n- Voz de marca: ${p.voz||""}${p.mecanismo_nombrado?`\n- Mecanismo nombrado: ${p.mecanismo_nombrado}`:""}${avatarCtx}${p.extra?`\n- Extra: ${p.extra}`:""}`;
}

// ─── COPY BRAIN — injected into every generation prompt ──────────────────────
// Sources: Luke Eha CASH Method, 50 Hook Examples, What Makes A Good Hook,
//          Meta Ads Frameworks Repository, Eugene Schwartz, Gary Bencivenga
const COPY_BRAIN = `Eres un copywriter de respuesta directa de nivel mundial especializado en Meta/Facebook Ads.
Aplicas el método Copy Blocks (Pain→Promise→Proof→Curiosity→Constraints→Conditions) en todo lo que escribes.
Escribes en español natural y conversacional, como habla la gente real — no como un folleto corporativo.

═══ LOS 6 BLOQUES DE COPY (aplica siempre) ═══
PAIN — Dónde está el avatar AHORA. Dolor específico, visual, cotidiano. No "quiero crecer" — di QUÉ no funciona exactamente.
PROMISE — A dónde quiere LLEGAR. Siempre con número o resultado concreto + tiempo. Ej: "3x más domicilios en 30 días".
PROOF — El piloto que da credibilidad. Orden: resultado específico (nombre+número) > cantidad de usuarios > autoridad > rating sin contexto.
CURIOSITY — El mecanismo nombrado. El "helicóptero" entre pain y promise. Necesita un nombre propio. Debe sentirse nuevo y exclusivo.
CONSTRAINTS — Todo lo que frena al avatar: identidad ("yo no soy..."), valores, creencias, recursos (tiempo/dinero), experiencias pasadas.
CONDITIONS — La dinamita. Urgencia real, escasez real, call-out de audiencia, condición de elegibilidad. Nunca urgencia falsa.

COPY VELOCITY: Cada frase debe ser un bloque. Elimina relleno. Más bloques por oración = mejor copy.

═══ REGLAS DE HOOKS ═══
- Máx 1-2 líneas. Nunca un párrafo. Específico, disruptivo, scroll-stopping.
- 4 elementos de un gran hook (necesitas al menos 3):
  1. ABRE BUCLE DE CURIOSIDAD: Presenta pregunta, retiene la respuesta
  2. TIENE STAKES: Incertidumbre sobre el outcome — "¿qué pasará?"
  3. DA CLARIDAD: El concepto se entiende en 2 segundos
  4. VISUALMENTE IMPACTANTE: Para video hooks — grande, obvio, buena luz
- Tipos de posicionamiento (elige uno):
  TEACHER: Hablas desde experiencia propia. "Las 3 cosas que hago para X"
  ANALYZER: Estudiaste algo externo. "Analicé 50 ads que gastaron +$100k..."
  JOURNEY: Documentas el proceso. "Día 1 de X — sin experiencia, con Y presupuesto"
  CONFESSIONAL: Experto admite algo inesperado. "Gasté $X antes de entender..."
- NUNCA: "¿Quieres...?", "¿Te imaginas si...?", "¿Alguna vez has...?" — hooks muertos.
- La especificidad es credibilidad: "ahorra tiempo" es débil. "ahorra 2.3 horas/semana" es fuerte.

═══ REGLAS DE BODY COPY ═══
- Habla AL lector (tú/tu). Nunca SOBRE el producto (nosotros/nuestro).
- PAS para cold: Problema vivido → Agitación (máx 2-3 líneas, sin manipulación) → Solución.
- BAB para transformación: Antes (dolor actual) → Después (estado deseado) → Puente (tu producto).
- Los primeros 125 caracteres funcionan solos como mini-anuncio (visible antes del "ver más").
- Al menos UN dato específico: número, nombre, resultado, timeframe.
- Prohibido: "increíble", "revolucionario", "simplemente", "fácil", "rápido" sin número.

═══ REGLAS DE HEADLINES ═══
- Máx 40 caracteres — límite duro, Meta trunca después.
- Fórmulas probadas: "Cómo [resultado] sin [obstáculo]" | "[N] formas de [resultado] en [tiempo]" | "El secreto de [grupo] para [resultado]"
- Reemplaza cada adjetivo con un número o hecho verificable.

═══ REGLAS DE CTA ═══
- Fórmula: Verbo específico + Beneficio inmediato + Reductor de fricción.
- Débil: "Haz click aquí" | Fuerte: "Descarga la guía gratis — sin spam"
- Cold = compromiso bajo (leer, ver, descargar) | Warm = prueba/demo | Hot = comprar/reservar.

═══ REGLAS DE VIDEO HOOKS ═══
- 0-3 segundos hablados. Funciona SIN sonido. Interrupción en la primera palabra.
- Dirección visual: grande, obvio, buena luz, algo que no se ve todos los días.
- Sonido que amplifica la energía del hook.

═══ NUNCA HAGAS ═══
- Hooks genéricos que no interrumpen el scroll
- Más de 1 trigger emocional por pieza (elige UNO)
- Urgencia falsa, CTAs vagos, copy centrado en features no en beneficios
- "Para todos los emprendedores" = para nadie
- Adjetivos vacíos sin número que los respalde

═══ BANCO DE HOOKS PROBADOS — FÓRMULAS GANADORAS ═══
(Referencia: 60+ Winning Ad Templates — adaptados al mercado LATAM en español)
La fórmula es el esqueleto: rellena SIEMPRE con especificidad real del avatar. "[N] semanas" > "poco tiempo". "[Bs. 1.200]" > "mucho dinero". "[nombre real]" > "un cliente".

ENTUSIASMO / EMOCIÓN:
"Acabo de conseguir [X] y estoy súper emocionado/a" | "Estoy completamente obsesionado/a con [X]" | "Compré tres [X] este mes — no exagero"

MITOS / VERDAD OCULTA:
"4 mitos sobre [X] que te están costando plata" | "Todo lo que creías sobre [X] está mal" | "No vas a creer estos 3 mitos sobre [X]" | "Es un secreto que mucha gente perdió por años" | "Cada padre/dueño/emprendedor necesita saber esta verdad sobre [X]"

FRUSTRACIÓN / PROBLEMA:
"3 razones por las que [X] no está funcionando" | "Llevar/tener [X] es una lucha constante" | "Llevo [N] años odiando [X] hasta que encontré esto" | "Harto/a de despertar con [mismo problema de siempre]" | "[X] que te hace difícil salir/avanzar/crecer"

TRANSFORMACIÓN / RESULTADO:
"Nunca más voy a volver a [X]" | "Cómo eliminé [X] sin [obstáculo típico]" | "Así pasé de [estado A] a [estado B]" | "En [N] semanas no te vas a reconocer" | "Piel/ventas/resultados [problema] ELIMINADOS así nomás" | "He decidido decirle adiós a [X] y hola a [solución]"

CURIOSIDAD / INTRIGA:
"Esto me hizo repensar todo sobre [X]" | "¿Podría ser este el [mejor/más fácil/único] [X]?" | "Necesito hablarles de algo que está generando olas en redes" | "[X] que están en todos lados en redes sociales" | "¿Quién [hace X rara] en el baño?" | "¿Soy adicto/a a [X]?"

PRUEBA SOCIAL / RELATO PERSONAL:
"Mi opinión honesta sobre [X]" | "Mi [X] era tan [problema]" | "Mi piel/negocio/vida es tan [resultado] que [alguien cercano] notó algo" | "Tengo [N] años, así es cómo [X] me ayudó con [problema específico]" | "Todo lo que me ayudó a lograr mi objetivo de [X] este año"

BENEFICIO DIRECTO / PROPUESTA:
"Así de fácil es [resultado deseado]" | "Mi truco para [resultado]" | "3 razones por las que necesitas [X]" | "Gasté [cantidad real] en [X] para que vos no tengas que hacerlo" | "Estos [X] son como Photoshop en la vida real" | "Dile hola a tu nuevo ritual para [beneficio]"

DESAFÍO / PROVOCACIÓN:
"Si todavía estás haciendo [X], es hora de escuchar la verdad" | "Por qué los [grupo] están cambiando a [X]" | "3 señales de que tenés un problema con [X]" | "Salí conmigo ahora mismo si hacés [X]" | "Estos son [X]" (mostrar algo sorprendente)

CONVERSACIONAL / AMIGA A AMIGA:
"Oye, te quiero compartir un tip que personalmente me encantó" | "Todas mis amigas me preguntan por [X]" | "Respondo sus preguntas sobre [X]"

REGLA DE ORO: El primer 1 segundo decide todo. Si el primer WORD no genera curiosidad, replantea desde cero.

═══ TAXONOMÍA DE HOOKS — 8 CATEGORÍAS + REGLAS CLAVE ═══

CATEGORÍA 1 — CURIOSIDAD: Abre loop → promete payoff → retrasa la explicación.
Templates: "¿Sabías que [hecho sorprendente]?", "Esto es por qué [acción] no te funciona.", "Todo lo que sabes sobre [tema] está mal.", "Número [X] me cambió la vida."

CATEGORÍA 2 — PUNTO DE DOLOR: Identifica el dolor → amplifica la frustración → insinúa la solución.
Templates: "Para de hacer [X] ahora.", "[X] errores que matan tu [resultado].", "¿Luchas con [problema]? Aquí está la solución.", "Nadie te dice que [verdad dolorosa]."

CATEGORÍA 3 — PASO A PASO: Enuncia el resultado → número de pasos → implica simplicidad o secreto.
Templates: "[N] pasos para [resultado].", "Cómo fui de [A] a [B] en [tiempo].", "La fórmula exacta: [resultado] en [poco tiempo]."

CATEGORÍA 4 — CONTRAINTUITIVO: Afirmación audaz → desafía sabiduría convencional → insinúa la prueba.
Templates: "Todo lo que sabías sobre [tema] está MAL.", "Opinión impopular: [afirmación audaz].", "Para de [X] si quieres [resultado]."

CATEGORÍA 5 — AUTORIDAD: Reclama experiencia → muestra resultado específico → ofrece el takeaway.
Templates: "Roba mi estrategia exacta para [resultado].", "Esta táctica le funcionó a [N] de mis clientes.", "Pasé [N] años en [tema] — aquí lo que aprendí:"

CATEGORÍA 6 — LISTAS Y NÚMEROS: Número específico → anticipa el valor → implica unicidad.
REGLA CLAVE: Números impares (3, 5, 7) superan en engagement a los números pares.
Templates: "[N] cosas que desearía saber antes de [X].", "Solo [N] [estrategias/herramientas] que realmente importan.", "[N] errores que matan tu [resultado]."

CATEGORÍA 7 — MIEDO / ADVERTENCIA: Destaca amenaza → crea urgencia → insinúa solución.
Templates: "Este error te cuesta [X] cada [período].", "Para de [X] ahora antes de que empeore.", "¿Y si estás perdiendo [resultado] por UN detalle ignorado?"

CATEGORÍA 8 — TENDENCIA / URGENCIA: Referencia la tendencia → implica relevancia → muestra beneficio.
Templates: "[Plataforma] está cambiando en [año] — lo que significa para ti:", "Te perdiste [X] en [año]. No pierdas [Y] ahora."

REGLAS AVANZADAS DE HOOK:
- STORY HOOK: Empieza en medio de la acción, no al principio. "Hace 6 meses decidí empezar un negocio" = débil. "El día que mi cliente más grande me disparó" = fuerte.
- TRANSFORMACIÓN: "De [malo] a [bueno] en [tiempo]" — el tiempo específico da credibilidad. "Hace 6 meses: [dolor]. Hoy: [ganancia]." usa líneas separadas para impacto visual.
- PATTERN INTERRUPT: Primera línea o acción que rompe lo que el usuario espera ver. Luego el tema. "Para. [Tema crítico] acaba de cambiar."
- PREGUNTA DIRECTA: Crea reconocimiento inmediato. "¿Alguna vez [frustración específica]? Aquí está la razón real."`;


const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const tp  = (id) => TIPOS.find(t => t.id === id) || TIPOS[0];

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
function Btn({ variant="default", onClick, children, disabled, full, small, style={} }) {
  const base = { display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, padding:small?"7px 13px":"10px 18px", fontSize:small?12:13, fontWeight:600, borderRadius:9, cursor:disabled?"not-allowed":"pointer", border:"1.5px solid", fontFamily:font, opacity:disabled?0.5:1, transition:"all 0.15s", whiteSpace:"nowrap", width:full?"100%":"auto", boxSizing:"border-box", ...style };
  const vs = { primary:{background:T.purple,color:"#fff",borderColor:T.purple}, navy:{background:T.navy,color:"#fff",borderColor:T.navy}, ghost:{background:"transparent",color:T.slate,borderColor:T.gray}, outline:{background:"transparent",color:T.purple,borderColor:T.purpleLight}, soft:{background:T.purpleBg,color:T.purple,borderColor:T.purpleLight}, danger:{background:"transparent",color:"#D94F4F",borderColor:"#F5BCBC"}, default:{background:T.grayLight,color:T.navy,borderColor:T.gray} };
  return <button style={{...base,...(vs[variant]||vs.default)}} onClick={disabled?undefined:onClick}>{children}</button>;
}

function Card({ children, style={} }) {
  return <div style={{ background:T.white, borderRadius:12, border:`1px solid ${T.gray}`, padding:20, ...style }}>{children}</div>;
}

function Inp({ placeholder, value, onChange, label, hint, type="text", multiline, rows=3, autoFocus }) {
  const s = { width:"100%", boxSizing:"border-box", padding:"10px 14px", fontSize:13, border:`1.5px solid ${T.gray}`, borderRadius:9, background:T.white, color:T.navy, fontFamily:font, outline:"none", resize:multiline?"vertical":"none", lineHeight:1.6 };
  return (
    <div style={{ marginBottom:16 }}>
      {label && <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:6 }}>{label}</div>}
      {multiline ? <textarea style={s} placeholder={placeholder} value={value} onChange={onChange} rows={rows} autoFocus={autoFocus}/> : <input style={s} type={type} placeholder={placeholder} value={value} onChange={onChange} autoFocus={autoFocus}/>}
      {hint && <div style={{ fontSize:11, color:T.slate, marginTop:5 }}>{hint}</div>}
    </div>
  );
}

function Toast({ msg }) {
  return msg ? <div style={{ position:"fixed", bottom:24, right:24, background:T.navy, color:"#fff", padding:"12px 20px", borderRadius:10, fontSize:13, fontFamily:font, fontWeight:500, boxShadow:"0 8px 32px rgba(0,0,0,0.18)", zIndex:9999 }}>{msg}</div> : null;
}

function Modal({ title, onClose, children, width=520 }) {
  return (
    <div onMouseDown={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(11,16,32,0.72)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9000, padding:16 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ background:T.white, borderRadius:16, padding:28, width, maxWidth:"96vw", maxHeight:"90vh", overflowY:"auto", border:`1.5px solid ${T.purpleLight}`, boxSizing:"border-box", boxShadow:"0 24px 60px rgba(24,19,73,0.22)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, paddingBottom:14, borderBottom:`1px solid ${T.gray}` }}>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy }}>{title}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:T.slate, fontSize:24, lineHeight:1, padding:0 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const TIPO_LABELS_ES = { pain:"Dolor", promise:"Promesa", proof:"Prueba", curiosity:"Curiosidad", constraints:"Frenos", conditions:"Condiciones", offer:"Oferta" };
function BlockBadge({ type, size="sm" }) {
  const t = T[type] || T.curiosity;
  return <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:size==="lg"?"4px 12px":"2px 8px", borderRadius:20, fontSize:size==="lg"?12:10, fontWeight:700, letterSpacing:"0.04em", background:t.bg, color:t.color, border:`1px solid ${t.border}`, whiteSpace:"nowrap", flexShrink:0 }}><span style={{ width:6, height:6, borderRadius:"50%", background:t.color, flexShrink:0 }}/>{TIPO_LABELS_ES[type] || type.charAt(0).toUpperCase()+type.slice(1)}</span>;
}

function FuncTag({ f }) {
  const c = FC[f] || T.slate;
  return <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:8, background:`${c}15`, color:c, border:`1px solid ${c}28`, whiteSpace:"nowrap" }}>{FL[f]||f}</span>;
}

function NavItem({ icon, label, badge, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", padding:"9px 12px", marginBottom:2, border:"none", borderRadius:9, cursor:"pointer", background:active?T.purple:"transparent", color:active?"#fff":"rgba(255,255,255,0.5)", fontFamily:font, fontSize:13, fontWeight:active?600:400, textAlign:"left", transition:"all 0.15s" }}>
      <span style={{ display:"flex", alignItems:"center", gap:9 }}><span style={{ fontSize:16 }}>{icon}</span>{label}</span>
      {badge!=null && badge>0 && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:"rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.7)" }}>{badge}</span>}
    </button>
  );
}

function ProgressBar({ value, max=100, color=T.purple }) {
  return <div style={{ height:6, borderRadius:3, background:T.gray, overflow:"hidden" }}><div style={{ height:"100%", width:`${(value/max)*100}%`, background:color, borderRadius:3, transition:"width 0.4s" }}/></div>;
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
      <div>
        <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:T.navy, letterSpacing:"-0.02em" }}>{title}</h2>
        {subtitle && <p style={{ margin:"4px 0 0", fontSize:13, color:T.slate }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function StatPill({ label, value, color=T.purple }) {
  return <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:20, background:`${color}12`, border:`1px solid ${color}30` }}><span style={{ fontSize:15, fontWeight:700, color }}>{value}</span><span style={{ fontSize:11, color:T.slate }}>{label}</span></div>;
}

function CopyBtn({ text, small }) {
  const [copied, setCopied] = useState(false);
  return <Btn variant="ghost" small={small} onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); }}>{copied?"✓ Copied":"Copiar"}</Btn>;
}



// ─── BLOCK CARD ───────────────────────────────────────────────────────────────
function BlockCard({ asset, onEdit, onDelete }) {
  const [hov, setHov] = useState(false);
  const t = tp(asset.tipo);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{ background:T.white, border:`1.5px solid ${hov?t.color+"60":t.border}`, borderLeft:`4px solid ${t.color}`, borderRadius:10, padding:"12px 14px", marginBottom:7, transition:"border-color 0.15s" }}>
      <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:7 }}>
            <BlockBadge type={asset.tipo}/>
            {(asset.funcs||[]).map(f=><FuncTag key={f} f={f}/>)}
          </div>
          <p style={{ margin:0, fontSize:13, lineHeight:1.65, color:T.navy }}>{asset.text}</p>
        </div>
        <div style={{ display:"flex", gap:4, flexShrink:0, opacity:hov?1:0.2, transition:"opacity 0.15s" }}>
          <Btn variant="ghost" small onClick={onEdit}>Edit</Btn>
          <Btn variant="danger" small onClick={onDelete}>✕</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── ASSET FORM ───────────────────────────────────────────────────────────────
function AssetForm({ initial={}, onSave, onClose }) {
  const [form, setForm] = useState({ tipo:"pain", funcs:[], tags:[], text:"", ...initial });
  const toggleFunc = id => setForm(p=>({ ...p, funcs:p.funcs.includes(id)?p.funcs.filter(x=>x!==id):[...p.funcs,id] }));
  return (
    <div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:8 }}>Tipo de bloque</div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {TIPOS.map(t=><button key={t.id} onClick={()=>setForm(p=>({...p,tipo:t.id}))} style={{ padding:"6px 12px", fontSize:12, borderRadius:20, cursor:"pointer", fontFamily:font, fontWeight:form.tipo===t.id?700:400, border:`1.5px solid ${form.tipo===t.id?t.color:t.border}`, background:form.tipo===t.id?t.bg:"transparent", color:form.tipo===t.id?t.color:T.slate }}>{t.label}</button>)}
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:8 }}>Función en el anuncio</div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {FUNCIONES.map(f=><button key={f} onClick={()=>toggleFunc(f)} style={{ padding:"6px 12px", fontSize:12, borderRadius:20, cursor:"pointer", fontFamily:font, border:`1.5px solid ${form.funcs.includes(f)?FC[f]:T.gray}`, background:form.funcs.includes(f)?`${FC[f]}15`:"transparent", color:form.funcs.includes(f)?FC[f]:T.slate, fontWeight:form.funcs.includes(f)?700:400 }}>{FL[f]}</button>)}
        </div>
      </div>
      <Inp label="Texto del bloque" multiline rows={4} placeholder="Escribe tu bloque de copy…" value={form.text} onChange={e=>setForm(p=>({...p,text:e.target.value}))} autoFocus />
      {form.funcs.includes("headline") && <div style={{ fontSize:11, marginTop:-10, marginBottom:14, color:form.text.length>40?"#D94F4F":T.slate }}>{form.text.length} chars {form.text.length>40?"— Meta truncates headlines over ~40 chars":""}</div>}
      <div style={{ display:"flex", gap:8 }}>
        <Btn variant="primary" onClick={()=>onSave(form)} disabled={!form.text.trim()}>Save</Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </div>
  );
}

// ─── CONCEPT FORM ─────────────────────────────────────────────────────────────
function ConceptWizard({ initial={}, brand, onSave, onClose, updateBrand }) {
  const allAngles = [...ANGULOS, ...(brand?.customAngles||[])];
  const avatars = brand?.avatars || [];
  const isEditing = !!initial.id;

  const [step, setStep] = useState(isEditing ? 3 : 1);
  const [personaId, setPersonaId] = useState(initial.personaId || (avatars.length ? avatars[0].id : "custom"));
  const [personaDesc, setPersonaDesc] = useState(initial.personaDesc || "");
  const [angulo, setAngulo] = useState(initial.angulo || "");
  const [concepto, setConcepto] = useState(initial.concepto || "");
  const [showCustomAngle, setShowCustomAngle] = useState(false);
  const [customAngle, setCustomAngle] = useState({ label:"", desc:"", example:"" });

  const selAngle = allAngles.find(a=>(a.id||a.label)===angulo);
  const selAvatar = avatars.find(a=>a.id===personaId);
  const isCustomPersona = personaId === "custom";
  const personaLabel = isCustomPersona
    ? (personaDesc.trim() ? personaDesc.trim().slice(0,38) : "Custom persona")
    : (selAvatar?.name || "Selected avatar");

  function saveCustomAngle() {
    if (!customAngle.label.trim()) return;
    const newA = { id:uid(), ...customAngle };
    updateBrand(b=>({...b, customAngles:[...(b.customAngles||[]), newA]}));
    setAngulo(newA.id);
    setShowCustomAngle(false);
    setCustomAngle({ label:"", desc:"", example:"" });
  }

  function handleSave() {
    if (!concepto.trim()) return;
    onSave({
      concepto: concepto.trim(),
      angulo,
      personaId: isCustomPersona ? null : personaId,
      personaDesc: isCustomPersona ? personaDesc : (selAvatar?.name || ""),
      estilo: initial.estilo || "",
      hook: "",
    }, null, null);
  }

  const STEPS = [
    { n:1, label:"Persona" },
    { n:2, label:"Ángulo" },
    { n:3, label:"Idea" },
  ];

  const canNext1 = !isCustomPersona || personaDesc.trim().length > 5;
  const canNext2 = !!angulo;

  return (
    <div style={{ position:"fixed", inset:0, background:T.white, zIndex:9000, display:"flex", flexDirection:"column", fontFamily:font }}>
      {/* ── Top bar ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 28px", borderBottom:`1.5px solid ${T.gray}`, background:T.white, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          {STEPS.map((s,i)=>(
            <div key={s.n} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700,
                  background: step>s.n ? T.promise.color : step===s.n ? T.purple : T.gray,
                  color: step>=s.n ? "#fff" : T.slate, flexShrink:0 }}>
                  {step>s.n ? "✓" : s.n}
                </div>
                <span style={{ fontSize:12, fontWeight:step===s.n?700:400, color:step===s.n?T.navy:T.slate }}>{s.label}</span>
              </div>
              {i < STEPS.length-1 && <div style={{ width:28, height:1.5, background:step>s.n?T.promise.border:T.gray, margin:"0 2px" }}/>}
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:T.slate, fontSize:22, lineHeight:1, padding:"2px 8px", borderRadius:6 }}>×</button>
      </div>

      {/* ── Content ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"36px 28px 120px" }}>
        <div style={{ maxWidth:640, margin:"0 auto" }}>

          {/* Context pills shown on steps 2 & 3 */}
          {step > 1 && (
            <div style={{ display:"flex", gap:6, marginBottom:22, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, padding:"4px 12px", borderRadius:20, background:T.purpleBg, color:T.purple, border:`1px solid ${T.purpleLight}`, fontWeight:600 }}>
                👤 {personaLabel}
              </span>
              {step > 2 && angulo && selAngle && (
                <span style={{ fontSize:11, padding:"4px 12px", borderRadius:20, background:T.grayLight, color:T.slate, border:`1px solid ${T.gray}`, fontWeight:600 }}>
                  📐 {selAngle.label}
                </span>
              )}
            </div>
          )}

          {/* ── STEP 1: PERSONA ── */}
          {step===1 && (
            <div>
              <div style={{ fontSize:24, fontWeight:800, color:T.navy, letterSpacing:"-0.03em", marginBottom:8 }}>¿Para quién es este anuncio?</div>
              <div style={{ fontSize:13, color:T.slate, marginBottom:28, lineHeight:1.6, maxWidth:500 }}>
                Cada anuncio habla a <strong>una persona</strong>. Cuanto más específico seas sobre quién es, más efectivo será el copy que generes.
              </div>

              {avatars.length > 0 && (
                <div style={{ marginBottom:24 }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:12 }}>Tus personas guardadas</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:10 }}>
                    {avatars.map(av=>{
                      const sel = personaId===av.id;
                      return (
                        <div key={av.id} onClick={()=>{ setPersonaId(av.id); setPersonaDesc(""); }}
                          style={{ padding:"16px", borderRadius:12, cursor:"pointer", border:`2px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.white, transition:"all 0.12s" }}>
                          <div style={{ fontSize:13, fontWeight:700, color:sel?T.purple:T.navy, marginBottom:5 }}>{av.name}</div>
                          <div style={{ fontSize:11, color:T.slate, lineHeight:1.5, marginBottom:av.pains?8:0 }}>{av.desc}</div>
                          {av.pains && <div style={{ fontSize:11, color:T.pain.color, padding:"5px 8px", borderRadius:6, background:T.pain.bg, lineHeight:1.45 }}>💔 {av.pains.slice(0,100)}{av.pains.length>100?"…":""}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:10 }}>
                  {avatars.length > 0 ? "O describe una persona rápida" : "Describe tu persona objetivo"}
                </div>
                <div onClick={()=>setPersonaId("custom")}
                  style={{ padding:"12px 16px", borderRadius:10, cursor:"pointer", border:`2px solid ${isCustomPersona?T.purple:T.gray}`, background:isCustomPersona?T.purpleBg:T.white, marginBottom:8, transition:"all 0.12s" }}>
                  <span style={{ fontSize:12, fontWeight:600, color:isCustomPersona?T.purple:T.slate }}>✎ Persona personalizada para este concepto</span>
                </div>
                {isCustomPersona && (
                  <textarea value={personaDesc} onChange={e=>setPersonaDesc(e.target.value)} autoFocus
                    placeholder="ej. Dueño de restaurante local en Cochabamba, 35-50 años, frustrado porque paga 30% de comisión a apps de delivery y los clientes no son suyos…"
                    style={{ width:"100%", boxSizing:"border-box", padding:"12px 14px", fontSize:13, border:`1.5px solid ${T.purple}`, borderRadius:9, fontFamily:font, color:T.navy, lineHeight:1.65, resize:"vertical", minHeight:90, outline:"none" }}
                  />
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: ANGLE ── */}
          {step===2 && (
            <div>
              <div style={{ fontSize:24, fontWeight:800, color:T.navy, letterSpacing:"-0.03em", marginBottom:8 }}>¿Desde qué ángulo vas a contar esta historia?</div>
              <div style={{ fontSize:13, color:T.slate, marginBottom:28, lineHeight:1.6, maxWidth:500 }}>
                El ángulo es el lente con el que cuentas la idea. <strong>Mismo producto, diferente ángulo = anuncio completamente diferente.</strong>
              </div>

              <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:16 }}>
                {allAngles.map(a=>{
                  const id=a.id||a.label; const sel=angulo===id;
                  return (
                    <button key={id} onClick={()=>setAngulo(sel?"":id)}
                      style={{ padding:"8px 16px", fontSize:13, borderRadius:20, cursor:"pointer", fontFamily:font,
                        border:`1.5px solid ${sel?T.purple:T.gray}`,
                        background:sel?T.purple:"transparent",
                        color:sel?"#fff":T.slate,
                        fontWeight:sel?700:400, transition:"all 0.12s" }}>
                      {a.label}
                    </button>
                  );
                })}
                <button onClick={()=>setShowCustomAngle(v=>!v)}
                  style={{ padding:"8px 16px", fontSize:13, borderRadius:20, cursor:"pointer", fontFamily:font, border:`1.5px dashed ${T.gray}`, background:"transparent", color:T.slate }}>+ Personalizado</button>
              </div>

              {selAngle && (
                <div style={{ padding:"20px 22px", background:T.purpleBg, borderRadius:14, border:`1.5px solid ${T.purpleLight}`, marginBottom:16 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:T.purple, marginBottom:8 }}>{selAngle.label}</div>
                  <div style={{ fontSize:13, color:T.navy, lineHeight:1.65, marginBottom:14 }}>{selAngle.desc}</div>
                  {selAngle.example && (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.purple, opacity:0.7, marginBottom:5 }}>Ejemplo de hook</div>
                      <div style={{ fontSize:12, color:T.navy, fontStyle:"italic", padding:"8px 12px", background:"rgba(255,255,255,0.75)", borderRadius:8, lineHeight:1.6 }}>"{selAngle.example}"</div>
                    </div>
                  )}
                  {selAngle.adExample && (
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.purple, opacity:0.7, marginBottom:5 }}>Ejemplo de anuncio con este ángulo</div>
                      <div style={{ fontSize:12, color:T.navy, lineHeight:1.75, padding:"10px 14px", background:"rgba(255,255,255,0.75)", borderRadius:8, whiteSpace:"pre-wrap" }}>{selAngle.adExample}</div>
                    </div>
                  )}
                </div>
              )}

              {showCustomAngle && (
                <div style={{ padding:"18px", border:`1.5px solid ${T.gray}`, borderRadius:12, background:T.white, marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:14 }}>Crear ángulo personalizado</div>
                  <Inp label="Nombre" placeholder="ej. Revelación interna" value={customAngle.label} onChange={e=>setCustomAngle(p=>({...p,label:e.target.value}))}/>
                  <Inp label="Definición" placeholder="¿Qué es este ángulo?" value={customAngle.desc} onChange={e=>setCustomAngle(p=>({...p,desc:e.target.value}))}/>
                  <Inp label="Ejemplo de hook" placeholder="Una línea de ejemplo" value={customAngle.example} onChange={e=>setCustomAngle(p=>({...p,example:e.target.value}))}/>
                  <div style={{ display:"flex", gap:6 }}>
                    <Btn variant="soft" small onClick={saveCustomAngle} disabled={!customAngle.label.trim()}>Guardar y seleccionar</Btn>
                    <Btn variant="ghost" small onClick={()=>setShowCustomAngle(false)}>Cancelar</Btn>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: IDEA ── */}
          {step===3 && (
            <div>
              <div style={{ fontSize:24, fontWeight:800, color:T.navy, letterSpacing:"-0.03em", marginBottom:8 }}>¿Cuál es la única idea de este anuncio?</div>
              <div style={{ fontSize:13, color:T.slate, marginBottom:28, lineHeight:1.6, maxWidth:500 }}>
                Un concepto = una sola idea. Todo lo demás — hook, cuerpo, CTA — sirve a esta idea. Si no cabe en una oración, es más de uno.
              </div>
              <textarea value={concepto} onChange={e=>setConcepto(e.target.value)} autoFocus
                placeholder={`ej. La mayoría de ${brand?.industry||"negocios"} pierde clientes sin un sistema de pedidos propio — y ni siquiera lo sabe`}
                style={{ width:"100%", boxSizing:"border-box", padding:"16px", fontSize:14, border:`1.5px solid ${concepto.trim()?T.purple:T.gray}`, borderRadius:12, fontFamily:font, color:T.navy, lineHeight:1.75, resize:"vertical", minHeight:130, outline:"none", background:T.white, transition:"border-color 0.15s" }}
              />
              <div style={{ fontSize:11, color:T.slate, marginTop:8, lineHeight:1.5 }}>
                Tip: lo específico gana. "El 80% de clientes que pide por apps no vuelve a pedir directo" es mejor que "la fidelidad importa".
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, padding:"16px 28px", background:T.white, borderTop:`1.5px solid ${T.gray}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div>
          {step > 1 && <Btn variant="ghost" onClick={()=>setStep(s=>s-1)}>← Atrás</Btn>}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          {step < 3 && (
            <Btn variant="primary" onClick={()=>setStep(s=>s+1)} disabled={step===1?!canNext1:!canNext2}>
              Siguiente →
            </Btn>
          )}
          {step===3 && (
            <Btn variant="primary" onClick={handleSave} disabled={!concepto.trim()}>
              {isEditing ? "Guardar cambios" : "Crear concepto"} ✓
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardScreen({ brand, assets, conceptos, onNavigate }) {
  const tCounts = TIPOS.reduce((a,t)=>({...a,[t.id]:assets.filter(x=>x.tipo===t.id).length}),{});
  const hookCount = assets.filter(a=>(a.funcs||[]).includes("hook")).length;
  const headlineCount = assets.filter(a=>(a.funcs||[]).includes("headline")).length;
  const completion = brand?.perfil ? Math.round(Object.values(brand.perfil).filter(Boolean).length / 7 * 100) : 0;

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ margin:"0 0 6px", fontSize:24, fontWeight:700, color:T.navy, letterSpacing:"-0.03em" }}>Hola ✦</h1>
        <p style={{ margin:0, fontSize:14, color:T.slate }}>Tu sistema de copy está listo. ¿Qué estamos construyendo hoy?</p>
      </div>

      {completion < 80 && (
        <Card style={{ marginBottom:20, padding:"16px 20px", borderLeft:`4px solid ${T.purple}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div><div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:3 }}>Completa tu perfil de marca</div><div style={{ fontSize:12, color:T.slate }}>Más contexto = generaciones de IA más precisas.</div></div>
            <Btn variant="soft" small onClick={()=>onNavigate("perfil")}>Completar →</Btn>
          </div>
          <ProgressBar value={completion}/><div style={{ fontSize:11, color:T.slate, marginTop:5 }}>{completion}% completado</div>
        </Card>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:24 }}>
        {[
          {icon:"💡", label:"Nuevo concepto", desc:"Empieza desde una sola idea", screen:"conceptos"},
          {icon:"✍️", label:"Compositor",     desc:"Construye bloque por bloque", screen:"meta-ad"},
          {icon:"📦", label:"Banco de bloques",desc:"Añade al banco de bloques",  screen:"banco"},
          {icon:"⚡", label:"Generación rápida",desc:"Un bloque específico rápido",screen:"oferta"},
        ].map(a=>(
          <div key={a.label} onClick={()=>onNavigate(a.screen)} style={{ background:T.white, borderRadius:12, border:`1px solid ${T.gray}`, padding:18, cursor:"pointer", transition:"all 0.15s" }} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.purpleLight;e.currentTarget.style.boxShadow=`0 4px 24px rgba(122,90,246,0.1)`;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.gray;e.currentTarget.style.boxShadow="none";}}>
            <div style={{ fontSize:28, marginBottom:10 }}>{a.icon}</div>
            <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:3 }}>{a.label}</div>
            <div style={{ fontSize:12, color:T.slate }}>{a.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:24 }}>
        <StatPill label="bloques" value={assets.length} color={T.purple}/>
        <StatPill label="hooks" value={hookCount} color={T.pain.color}/>
        <StatPill label="headlines" value={headlineCount} color={T.proof.color}/>
        <StatPill label="conceptos" value={conceptos.length} color={T.promise.color}/>
      </div>

      {conceptos.length > 0 && (
        <div>
          <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:12 }}>Conceptos recientes</div>
          {conceptos.slice(0,3).map((c,i)=>(
            <Card key={i} style={{ marginBottom:8, padding:"12px 16px", cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:5 }}>"{c.hook||c.concepto}"</div>
                  <div style={{ display:"flex", gap:6 }}>
                    {c.angulo && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:T.purpleBg, color:T.purple, border:`1px solid ${T.purpleLight}` }}>{c.angulo}</span>}
                  </div>
                </div>
                <Btn variant="ghost" small onClick={()=>onNavigate("conceptos")}>Abrir →</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── BLOCK BANK ───────────────────────────────────────────────────────────────
function BankScreen({ assets, busy, setBusy, apiKey, perfil, brand, notify, updateBrand, onAdd, onEdit, onDelete, onAiSuggest }) {
  const [fTipo, setFTipo] = useState("all");
  const [fFunc, setFFunc] = useState("all");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("bank");
  const [genBusy, setGenBusy] = useState(false);
  const [genResults, setGenResults] = useState([]);
  const [genSaved, setGenSaved] = useState({});
  const [editing, setEditing] = useState(null);

  const tCounts = TIPOS.reduce((a,t)=>({...a,[t.id]:assets.filter(x=>x.tipo===t.id).length}),{});
  const fCounts = FUNCIONES.reduce((a,f)=>({...a,[f]:assets.filter(x=>(x.funcs||[]).includes(f)).length}),{});
  const filtered = assets.filter(a => {
    if (fTipo!=="all" && a.tipo!==fTipo) return false;
    if (fFunc!=="all" && !(a.funcs||[]).includes(fFunc)) return false;
    if (search && !a.text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const GEN_TIPOS = [
    { id:"hook",       label:"Hook",        color:T.curiosity.color, bg:T.curiosity.bg, border:T.curiosity.border, funcs:["hook"], tipo:"curiosity" },
    { id:"pain",       label:"Pain",        color:T.pain.color,      bg:T.pain.bg,      border:T.pain.border,      funcs:["body"], tipo:"pain" },
    { id:"promise",    label:"Promise",     color:T.promise.color,   bg:T.promise.bg,   border:T.promise.border,   funcs:["body"], tipo:"promise" },
    { id:"proof",      label:"Proof",       color:T.proof.color,     bg:T.proof.bg,     border:T.proof.border,     funcs:["body"], tipo:"proof" },
    { id:"curiosity",  label:"Curiosity",   color:T.curiosity.color, bg:T.curiosity.bg, border:T.curiosity.border, funcs:["body"], tipo:"curiosity" },
    { id:"constraints",label:"Constraints", color:T.constraints.color,bg:T.constraints.bg,border:T.constraints.border,funcs:["body"],tipo:"constraints"},
    { id:"conditions", label:"Conditions",  color:T.conditions.color, bg:T.conditions.bg, border:T.conditions.border, funcs:["cta"], tipo:"conditions" },
    { id:"offer",      label:"Offer",       color:T.offer.color,     bg:T.offer.bg,     border:T.offer.border,     funcs:["cta","headline"], tipo:"offer" },
  ];

  const [genTipo, setGenTipo] = useState("hook");
  const [genFormat, setGenFormat] = useState((BLOCK_FORMATS["hook"]||[])[0]?.id || "");
  const [genPersonaId, setGenPersonaId] = useState("all");
  const [genOfferId, setGenOfferId] = useState("");

  const selTipo = GEN_TIPOS.find(t=>t.id===genTipo) || GEN_TIPOS[0];
  const formats = BLOCK_FORMATS[genTipo] || [];

  function switchTipo(id) {
    setGenTipo(id);
    setGenFormat((BLOCK_FORMATS[id]||[])[0]?.id || "");
    if (id !== "offer") setGenOfferId("");
  }

  async function generate() {
    setGenBusy(true); setGenResults([]);
    const avatars = brand?.avatars || [];
    const selPersona = avatars.find(a=>a.id===genPersonaId);
    const selOffer = (brand?.offers||[]).find(o=>o.id===genOfferId);
    const ctx = perfilCtx(brand?.perfil||{}, brand?.avatars);
    const personaCtx = selPersona ? `\nTARGET PERSONA: ${selPersona.nombre||selPersona.name} — ${selPersona.descripcion||selPersona.desc||""}. Main problem: ${selPersona.problema_principal||selPersona.pains||""}. Language: ${selPersona.lenguaje||selPersona.language||""}` : "";
    const offerCtx = selOffer ? `\nOFFER: ${selOffer.nombre} — ${selOffer.descripcion||""} — Price: ${selOffer.precio||""}. Includes: ${selOffer.incluye||""}. Guarantee: ${selOffer.garantia||""}` : "";
    const tipoDef = TIPOS_BLOQUE.find(t=>t.id===selTipo.tipo);
    const formatLabel = formats.find(f=>f.id===genFormat)?.label || genFormat;
    try {
      let instruccion = "";
      if (genTipo==="hook") {
        instruccion = `Generate 5 HOOKS. Format: ${formatLabel}. Apply HOOK RULES strictly. Each is 1-2 lines max, scroll-stopping, specific to this brand.`;
      } else if (genTipo==="offer") {
        instruccion = `Generate 4 OFFER blocks. Format: ${formatLabel}. ${selOffer?`Based on this offer: ${selOffer.nombre}.`:""} Each block is specific (prices, what's included, deadline if any). Apply BODY COPY RULES.`;
      } else {
        instruccion = `Generate 5 ${selTipo.label.toUpperCase()} blocks. Format: ${formatLabel}. Type definition: "${tipoDef?.def||""}". Tip: "${tipoDef?.tip||""}". Apply BODY COPY RULES. Each is standalone, specific (numbers not adjectives).`;
      }
      const prompt = `${COPY_BRAIN}\n\n${ctx}${personaCtx}${offerCtx}\n\n${instruccion}\n\nIMPORTANTE: Genera TODO en español. JSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}]`;
      const raw = await callClaude(prompt, apiKey, 1600);
      const arr = JSON.parse(raw.replace(/```json|```/g,"").trim());
      setGenResults(arr.map(r=>({...r,_id:uid(),tipo:selTipo.tipo,funcs:selTipo.funcs,genTipo,genFormat})));
    } catch(e) { notify(`Error: ${e.message||"please try again"}`); }
    setGenBusy(false);
  }

  function saveBlock(block) {
    if (genSaved[block._id]) return;
    setGenSaved(p=>({...p,[block._id]:true}));
    updateBrand(b=>({...b, assets:[...(b.assets||[]),{id:uid(),tipo:block.tipo,funcs:block.funcs,tags:[...block.funcs,block.genTipo,"generated"],text:block.text}]}));
    notify("Saved ✓");
  }

  return (
    <div>
      <SectionHeader title="Banco de bloques" subtitle="Genera bloques por tipo o añade los tuyos."
        action={<div style={{ display:"flex", gap:8 }}>
          {tab==="bank" && <Btn variant="ghost" onClick={onAiSuggest} disabled={busy}>{busy?"Pensando…":"✨ Sugerir"}</Btn>}
          <Btn variant="primary" onClick={()=>onAdd()}>+ Manual</Btn>
        </div>}
      />

      {/* Tabs */}
      <div style={{ display:"flex", gap:0, marginBottom:20, borderBottom:`2px solid ${T.gray}` }}>
        {[{id:"bank",label:`📦 Todos los bloques (${assets.length})`},{id:"generate",label:"✨ Generar bloques"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"9px 18px", fontSize:13, fontWeight:tab===t.id?700:400, color:tab===t.id?T.purple:T.slate, background:"transparent", border:"none", borderBottom:`2px solid ${tab===t.id?T.purple:"transparent"}`, cursor:"pointer", fontFamily:font, marginBottom:-2 }}>{t.label}</button>
        ))}
      </div>

      {/* Generate tab */}
      {tab==="generate" && (
        <div>
          {/* Step 1: Tipo de bloque */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:10 }}>1 · Tipo de bloque</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {GEN_TIPOS.map(t=>{
                const sel = genTipo===t.id;
                return (
                  <button key={t.id} onClick={()=>switchTipo(t.id)}
                    style={{ padding:"8px 16px", fontSize:13, borderRadius:20, cursor:"pointer", fontFamily:font,
                      border:`1.5px solid ${sel?t.color:T.gray}`,
                      background:sel?t.bg:"transparent",
                      color:sel?t.color:T.slate,
                      fontWeight:sel?700:400, transition:"all 0.12s" }}>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Formato */}
          {formats.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:10 }}>2 · Formato</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {formats.map(f=>{
                  const sel = genFormat===f.id;
                  return (
                    <button key={f.id} onClick={()=>setGenFormat(f.id)}
                      style={{ padding:"7px 14px", fontSize:12, borderRadius:20, cursor:"pointer", fontFamily:font,
                        border:`1.5px solid ${sel?selTipo.color:T.gray}`,
                        background:sel?selTipo.bg:"transparent",
                        color:sel?selTipo.color:T.slate,
                        fontWeight:sel?600:400 }}>
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Persona (optional) */}
          {(brand?.avatars||[]).length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:10 }}>3 · Persona objetivo (opcional)</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <button onClick={()=>setGenPersonaId("all")} style={{ padding:"7px 14px", fontSize:12, borderRadius:20, cursor:"pointer", fontFamily:font, border:`1.5px solid ${genPersonaId==="all"?T.navy:T.gray}`, background:genPersonaId==="all"?T.navy:"transparent", color:genPersonaId==="all"?"#fff":T.slate, fontWeight:genPersonaId==="all"?600:400 }}>All</button>
                {(brand?.avatars||[]).map(av=>{
                  const sel = genPersonaId===av.id;
                  return <button key={av.id} onClick={()=>setGenPersonaId(av.id)} style={{ padding:"7px 14px", fontSize:12, borderRadius:20, cursor:"pointer", fontFamily:font, border:`1.5px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:"transparent", color:sel?T.purple:T.slate, fontWeight:sel?600:400 }}>{av.nombre||av.name}</button>;
                })}
              </div>
            </div>
          )}

          {/* Step 4: Oferta (only for offer type) */}
          {genTipo==="offer" && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:10 }}>4 · Oferta a usar</div>
              {(brand?.offers||[]).length === 0 ? (
                <div style={{ fontSize:12, color:T.slate, padding:"10px 14px", borderRadius:9, background:T.grayLight, border:`1px dashed ${T.gray}` }}>
                  No hay ofertas guardadas. <button onClick={()=>{}} style={{ color:T.purple, background:"none", border:"none", cursor:"pointer", fontFamily:font, fontSize:12, fontWeight:600 }}>Crea una en Marca →</button>
                </div>
              ) : (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  <button onClick={()=>setGenOfferId("")} style={{ padding:"7px 14px", fontSize:12, borderRadius:20, cursor:"pointer", fontFamily:font, border:`1.5px solid ${!genOfferId?T.offer.color:T.gray}`, background:!genOfferId?T.offer.bg:"transparent", color:!genOfferId?T.offer.color:T.slate }}>Genérica</button>
                  {(brand?.offers||[]).map(o=>{
                    const sel = genOfferId===o.id;
                    return <button key={o.id} onClick={()=>setGenOfferId(o.id)} style={{ padding:"7px 14px", fontSize:12, borderRadius:20, cursor:"pointer", fontFamily:font, border:`1.5px solid ${sel?T.offer.color:T.gray}`, background:sel?T.offer.bg:"transparent", color:sel?T.offer.color:T.slate, fontWeight:sel?600:400 }}>{o.nombre}</button>;
                  })}
                </div>
              )}
            </div>
          )}

          <Btn variant="primary" onClick={generate} disabled={genBusy} style={{ background:selTipo.color, borderColor:selTipo.color }}>{genBusy?"Generando…":`✨ Generar bloques ${selTipo.label}`}</Btn>

          {genResults.length>0 && (
            <div style={{ marginTop:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.06em" }}>{genResults.length} generados</div>
                <Btn variant="soft" small onClick={()=>genResults.forEach(saveBlock)}>Guardar todos</Btn>
              </div>
              {genResults.map(block=>{
                const saved = genSaved[block._id];
                return (
                  <div key={block._id} style={{ background:saved?"#EDFAF4":T.white, border:`1.5px solid ${saved?"#9EE0C6":T.gray}`, borderLeft:`4px solid ${tp(block.tipo).color}`, borderRadius:10, padding:"12px 14px", marginBottom:8, display:"flex", gap:10, alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      {editing?.id===block._id ? (
                        <textarea value={editing.text} onChange={e=>setEditing({...editing,text:e.target.value})}
                          style={{ width:"100%", boxSizing:"border-box", padding:"8px", fontSize:13, border:`1.5px solid ${T.purple}`, borderRadius:8, fontFamily:font, color:T.navy, lineHeight:1.65, resize:"vertical", minHeight:70 }}
                          autoFocus onBlur={()=>{ setGenResults(genResults.map(b=>b._id===block._id?{...b,text:editing.text}:b)); setEditing(null); }}
                        />
                      ) : (
                        <div style={{ fontSize:13, color:T.navy, lineHeight:1.65 }}>{block.text}</div>
                      )}
                      {block.visual && <div style={{ fontSize:11, color:T.slate, marginTop:5 }}>📷 {block.visual}</div>}
                      {block.sound  && <div style={{ fontSize:11, color:T.slate, marginTop:2 }}>🎵 {block.sound}</div>}
                    </div>
                    <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                      {!saved && <button onClick={()=>setEditing({id:block._id,text:block.text})} style={{ padding:"5px 9px", fontSize:11, borderRadius:16, border:`1px solid ${T.gray}`, background:"transparent", color:T.slate, cursor:"pointer", fontFamily:font }}>Editar</button>}
                      <button onClick={()=>saveBlock(block)} disabled={saved} style={{ padding:"5px 12px", fontSize:11, borderRadius:16, cursor:saved?"default":"pointer", fontFamily:font, border:`1px solid ${saved?"#1A9E6E":T.purple}`, background:saved?"#EDFAF4":T.purpleBg, color:saved?"#1A9E6E":T.purple, fontWeight:600 }}>{saved?"✓":"Guardar"}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bank tab */}
      {tab==="bank" && (
        <div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
            {FUNCIONES.map(f=><StatPill key={f} label={FL[f]} value={fCounts[f]||0} color={FC[f]}/>)}
          </div>
          <input placeholder="Buscar bloques…" value={search} onChange={e=>setSearch(e.target.value)} style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", fontSize:13, border:`1.5px solid ${T.gray}`, borderRadius:9, background:T.white, color:T.navy, fontFamily:font, outline:"none", marginBottom:12 }}/>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
            <button onClick={()=>setFTipo("all")} style={{ padding:"5px 11px", fontSize:11, borderRadius:20, border:`1px solid ${T.gray}`, background:fTipo==="all"?T.navy:"transparent", color:fTipo==="all"?"#fff":T.slate, cursor:"pointer", fontFamily:font }}>Todos {assets.length}</button>
            {TIPOS.map(t=><button key={t.id} onClick={()=>setFTipo(fTipo===t.id?"all":t.id)} style={{ padding:"5px 11px", fontSize:11, borderRadius:20, cursor:"pointer", fontFamily:font, border:`1px solid ${fTipo===t.id?t.color:t.border}`, background:fTipo===t.id?t.bg:"transparent", color:fTipo===t.id?t.color:T.slate }}>{t.label} {tCounts[t.id]||0}</button>)}
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:20 }}>
            <button onClick={()=>setFFunc("all")} style={{ padding:"4px 10px", fontSize:11, borderRadius:20, border:`1px solid ${T.gray}`, background:fFunc==="all"?T.navy:"transparent", color:fFunc==="all"?"#fff":T.slate, cursor:"pointer", fontFamily:font }}>Todas las funciones</button>
            {FUNCIONES.map(f=><button key={f} onClick={()=>setFFunc(fFunc===f?"all":f)} style={{ padding:"4px 10px", fontSize:11, borderRadius:20, cursor:"pointer", fontFamily:font, border:`1px solid ${fFunc===f?FC[f]:T.gray}`, background:fFunc===f?`${FC[f]}15`:"transparent", color:fFunc===f?FC[f]:T.slate }}>{FL[f]} {fCounts[f]||0}</button>)}
          </div>
          {filtered.length===0 && <div style={{ textAlign:"center", padding:50, color:T.slate, border:`1px dashed ${T.gray}`, borderRadius:10 }}>Sin bloques — usa la pestaña Generar para crear algunos.</div>}
          {filtered.map(a=><BlockCard key={a.id} asset={a} onEdit={()=>onEdit(a)} onDelete={()=>onDelete(a.id)}/>)}
        </div>
      )}
    </div>
  );
}

// ─── CONCEPTS SCREEN ──────────────────────────────────────────────────────────
function ConceptsScreen({ conceptos, brand, assets, busy, setBusy, apiKey, perfil, onAdd, onEdit, onDelete, onAiSuggest, onGoCompose, notify, updateBrand, perfCompletion }) {
  const locked = perfCompletion < 80;
  const [expandedId, setExpandedId] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroAngulo, setFiltroAngulo] = useState("all");
  const [genType, setGenType] = useState("hook"); // what block type to generate
  const [genBusy, setGenBusy] = useState(false);
  const [genResults, setGenResults] = useState({}); // conceptId → [{text, tipo, funcs}]
  const [savedMap, setSavedMap] = useState({});

  const BLOCK_TYPES = [
    { id:"hook",     label:"Hooks",           funcs:["hook"],      tipo:"curiosity", icon:"🎣", desc:"Pattern interrupts that stop the scroll" },
    { id:"body",     label:"Cuerpo / Historia",    funcs:["body"],      tipo:"pain",      icon:"📖", desc:"Pain amplifiers, story blocks, mechanism reveals" },
    { id:"benefits", label:"Lista de beneficios",   funcs:["body"],      tipo:"promise",   icon:"✅", desc:"Quick-fire value statements" },
    { id:"proof",    label:"Prueba social",    funcs:["body"],      tipo:"proof",     icon:"⭐", desc:"Testimonials, stats, social proof" },
    { id:"objection",label:"Objeciones",funcs:["body"],   tipo:"constraints",icon:"🛡", desc:"Preemptive answers to their #1 reason not to buy" },
    { id:"cta",      label:"CTAs",            funcs:["cta"],       tipo:"conditions",icon:"👆", desc:"Urgent, specific calls to action" },
    { id:"headline", label:"Headlines",       funcs:["headline"],  tipo:"offer",     icon:"📰", desc:"40-char max punchy headlines" },
    { id:"video_hook",label:"Hooks de video",    funcs:["hook"],      tipo:"curiosity", icon:"🎬", desc:"Hook + visual direction + sound suggestion" },
  ];

  async function generateBlocks(concept) {
    if (genBusy) return;
    setGenBusy(true);
    const bt = BLOCK_TYPES.find(b=>b.id===genType);
    const ctx = perfilCtx(perfil, brand?.avatars);
    const conceptCtx = `\nCONCEPT: "${concept.concepto}"${concept.angulo?`\nAngle: ${concept.angulo}`:""}${concept.estilo?`\nStyle: ${concept.estilo}`:""}`;
    try {
      let prompt = "";
      if (genType === "video_hook") {
        prompt = `${COPY_BRAIN}\n\n${ctx}${conceptCtx}\n\nGenerate 5 VIDEO HOOKS for this concept. Apply VIDEO HOOK RULES. One punchy spoken line each (0-3 sec). Include visual direction and sound suggestion.\n\nJSON only:\n[{"text":"...","visual":"...","sound":"..."}]`;
      } else if (genType === "hook") {
        prompt = `${COPY_BRAIN}\n\n${ctx}${conceptCtx}\n\nGenerate 5 HOOKS for this concept. Apply HOOK RULES strictly. Each 1-2 lines max. Use a different hook type per variation. Specific numbers and names when possible.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (genType === "headline") {
        prompt = `${COPY_BRAIN}\n\n${ctx}${conceptCtx}\n\nGenerate 5 HEADLINES for this concept. Apply HEADLINE RULES. Max 40 chars each. Different formula per variation.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (genType === "benefits") {
        prompt = `${COPY_BRAIN}\n\n${ctx}${conceptCtx}\n\nGenerate 3 BENEFITS LIST blocks for this concept. Apply BODY COPY RULES. Quick-fire lists of 3-5 specific benefits (concrete numbers, not adjectives). Ready to paste.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else {
        prompt = `${COPY_BRAIN}\n\n${ctx}${conceptCtx}\n\nGenerate 4 ${bt.label} blocks for this concept. Apply BODY COPY RULES. Each standalone, specific, talks TO the reader. No vague adjectives.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}]`;
      }
      const raw = await callClaude(prompt, apiKey, 1600);
      const arr = JSON.parse(raw.replace(/```json|```/g,"").trim());
      setGenResults(p=>({...p,[concept.id]:arr.map(r=>({...r,_id:uid(),tipo:bt.tipo,funcs:bt.funcs,conceptId:concept.id,conceptLabel:concept.concepto.slice(0,40)}))}));
    } catch { notify("Generation error — try again"); }
    setGenBusy(false);
  }

  function saveBlock(block, conceptId) {
    const key = block._id;
    setSavedMap(p=>({...p,[key]:true}));
    const extra = block.visual ? ` | Visual: ${block.visual} | Sound: ${block.sound}` : "";
    updateBrand(b=>({...b, assets:[...(b.assets||[]),{id:uid(),tipo:block.tipo,funcs:block.funcs,tags:[...block.funcs,"concept:"+conceptId,"ai-generated"],text:block.text+extra}]}));
    notify("Guardado en banco ✓");
  }

  function saveAll(conceptId) {
    const results = genResults[conceptId]||[];
    results.forEach(block => { if (!savedMap[block._id]) saveBlock(block, conceptId); });
    notify(`All ${results.length} blocks saved ✓`);
  }

  return (
    <div>
      <SectionHeader title="Conceptos" subtitle="Crea un concepto → genera bloques de copy → envía al Compositor."
        action={<div style={{ display:"flex", gap:8 }}>
          <Btn variant="ghost" onClick={onAiSuggest} disabled={busy}>{busy?"Procesando…":"✨ Sugerir"}</Btn>
          <Btn variant="primary" onClick={()=>onAdd()}>+ Nuevo concepto</Btn>
        </div>}
      />

      {/* Concept list */}
      {/* Búsqueda y filtros */}
      {conceptos.length>0 && (
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          <input placeholder="Buscar conceptos…" value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{ flex:1, minWidth:160, padding:"9px 14px", fontSize:13, border:`1.5px solid ${T.gray}`, borderRadius:9, background:T.white, color:T.navy, fontFamily:font, outline:"none" }}/>
          <select value={filtroAngulo} onChange={e=>setFiltroAngulo(e.target.value)} style={{ padding:"9px 12px", fontSize:12, border:`1.5px solid ${T.gray}`, borderRadius:9, background:T.white, fontFamily:font, color:T.navy }}>
            <option value="all">Todos los ángulos</option>
            {[...ANGULOS,...(brand?.customAngles||[])].map(a=><option key={a.id||a.label} value={a.id||a.label}>{a.label}</option>)}
          </select>
        </div>
      )}

      {conceptos.length===0 && (
        <div style={{ textAlign:"center", padding:60, color:T.slate, border:`1px dashed ${T.gray}`, borderRadius:12 }}>
          <div style={{ fontSize:32, marginBottom:10 }}>💡</div>
          <div style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:6 }}>No concepts yet</div>
          <div style={{ fontSize:12, color:T.slate, marginBottom:20 }}>A concept is one clear idea. Every ad revolves around one concept.</div>
          <Btn variant="primary" onClick={()=>onAdd()}>+ Create first concept</Btn>
        </div>
      )}

      {conceptos.filter(c=>(!busqueda||c.concepto.toLowerCase().includes(busqueda.toLowerCase())||(c.hook&&c.hook.toLowerCase().includes(busqueda.toLowerCase())))&&(filtroAngulo==="all"||c.angulo===filtroAngulo)).map(c=>{
        const isOpen = expandedId===c.id;
        const results = genResults[c.id]||[];
        const conceptBlocks = assets.filter(a=>(a.tags||[]).includes("concept:"+c.id));

        return (
          <Card key={c.id} style={{ marginBottom:12, padding:0, overflow:"hidden" }}>
            {/* Concept header */}
            <div style={{ padding:"14px 18px", display:"flex", gap:12, alignItems:"flex-start", cursor:"pointer" }} onClick={()=>setExpandedId(isOpen?null:c.id)}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontSize:16 }}>{isOpen?"▾":"▸"}</span>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{c.concepto}</div>
                </div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap", paddingLeft:24 }}>
                  {c.personaDesc && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:T.grayLight, color:T.slate, border:`1px solid ${T.gray}` }}>👤 {c.personaDesc.slice(0,32)}{c.personaDesc.length>32?"…":""}</span>}
                  {c.angulo && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:T.purpleBg, color:T.purple, border:`1px solid ${T.purpleLight}` }}>{[...ANGULOS,...(brand?.customAngles||[])].find(a=>(a.id||a.label)===c.angulo)?.label||c.angulo}</span>}
                  {conceptBlocks.length>0 && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:"#EDFAF4", color:"#1A9E6E", border:"1px solid #9EE0C6" }}>📦 {conceptBlocks.length} blocks</span>}
                </div>
              </div>
              <div style={{ display:"flex", gap:5, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                <Btn variant="primary" small onClick={()=>onGoCompose(c)}>→ Compositor</Btn>
                <Btn variant="ghost" small onClick={()=>onEdit(c)}>Editar</Btn>
                <Btn variant="danger" small onClick={()=>onDelete(c.id)}>✕</Btn>
              </div>
            </div>

            {/* Expanded: block generator */}
            {isOpen && (
              <div style={{ borderTop:`1px solid ${T.gray}`, padding:"16px 18px", background:T.grayLight }}>
                {c.hook && <div style={{ padding:"8px 12px", background:T.white, borderRadius:8, border:`1px solid ${T.purpleLight}`, fontSize:13, fontStyle:"italic", color:T.navy, marginBottom:14 }}>"{c.hook}"</div>}

                <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:10 }}>Generar bloques de copy para este concepto</div>

                {/* Block type picker */}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                  {BLOCK_TYPES.map(bt=>(
                    <button key={bt.id} onClick={()=>setGenType(bt.id)} style={{ padding:"7px 12px", fontSize:12, borderRadius:20, cursor:"pointer", fontFamily:font, border:`1.5px solid ${genType===bt.id?T.purple:T.gray}`, background:genType===bt.id?T.purpleBg:T.white, color:genType===bt.id?T.purple:T.slate, fontWeight:genType===bt.id?700:400 }}>
                      {bt.icon} {bt.label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize:11, color:T.slate, marginBottom:12 }}>{BLOCK_TYPES.find(b=>b.id===genType)?.desc}</div>

                <Btn variant="primary" small onClick={()=>generateBlocks(c)} disabled={genBusy}>{genBusy?"Generando…":"✨ Generate"}</Btn>

                {/* Generated results */}
                {results.length>0 && (
                  <div style={{ marginTop:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.06em" }}>{results.length} generated — select to save</div>
                      <Btn variant="soft" small onClick={()=>saveAll(c.id)}>Save all to bank</Btn>
                    </div>
                    {results.map(block=>{
                      const saved = savedMap[block._id];
                      return (
                        <div key={block._id} style={{ background:saved?"#EDFAF4":T.white, border:`1.5px solid ${saved?"#9EE0C6":T.gray}`, borderRadius:10, padding:"12px 14px", marginBottom:8, display:"flex", gap:10, alignItems:"flex-start" }}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, color:T.navy, lineHeight:1.65 }}>{block.text}</div>
                            {block.visual && <div style={{ fontSize:11, color:T.slate, marginTop:6 }}>📷 {block.visual}</div>}
                            {block.sound && <div style={{ fontSize:11, color:T.slate, marginTop:2 }}>🎵 {block.sound}</div>}
                          </div>
                          <button onClick={()=>!saved&&saveBlock(block,c.id)} style={{ padding:"5px 12px", fontSize:11, borderRadius:20, cursor:saved?"default":"pointer", fontFamily:font, border:`1px solid ${saved?"#1A9E6E":T.purple}`, background:saved?"#EDFAF4":T.purpleBg, color:saved?"#1A9E6E":T.purple, fontWeight:600, flexShrink:0, whiteSpace:"nowrap" }}>{saved?"✓ Saved":"Guardar"}</button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Already saved blocks for this concept */}
                {conceptBlocks.length>0 && results.length===0 && (
                  <div style={{ marginTop:16 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Saved blocks for this concept</div>
                    {conceptBlocks.slice(0,4).map(b=>(
                      <div key={b.id} style={{ background:T.white, border:`1px solid ${T.gray}`, borderRadius:8, padding:"10px 12px", marginBottom:6, fontSize:12, color:T.navy, lineHeight:1.6 }}>{b.text.slice(0,120)}{b.text.length>120?"…":""}</div>
                    ))}
                    {conceptBlocks.length>4 && <div style={{ fontSize:11, color:T.slate }}>+{conceptBlocks.length-4} more in the Block Bank</div>}
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {/* Go to composer CTA */}
      {conceptos.length>0 && (
        <div style={{ marginTop:20, padding:"16px 20px", borderRadius:12, border:`1.5px solid ${T.purple}`, background:T.purpleBg, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div><div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:3 }}>¿Listo para construir tu anuncio?</div><div style={{ fontSize:12, color:T.slate }}>Ve al Compositor — elige tu concepto y bloques, genera el output final.</div></div>
          <Btn variant="primary" onClick={()=>onGoCompose(null)}>→ Compositor</Btn>
        </div>
      )}
    </div>
  );
}

// ─── COMPOSITOR — block order using the 7 AdBlock types ──────────────────────
const HOOK_TYPE_TO_STEP = { pain:"pain", promise:"promise", proof:"proof", curiosity:"curiosity", contrarian:"curiosity", offer:"offer", conditions:"conditions" };
const BLOCK_ORDER = [
  { id:"hook",        label:"Hook",        emoji:"🎣", tipo:"curiosity", funcs:["hook"],
    hint:"Primera línea. Detiene el scroll antes del 'ver más'. Máx 1-2 líneas. Una sola idea.",
    formats: BLOCK_FORMATS.hook },
  { id:"pain",        label:"Pain",        emoji:"💔", tipo:"pain",      funcs:["body"],
    hint:"Dónde está tu avatar AHORA MISMO. Dolor vivido, específico, cotidiano. Más visual = más identificación.",
    formats: BLOCK_FORMATS.pain },
  { id:"promise",     label:"Promise",     emoji:"✨", tipo:"promise",   funcs:["body"],
    hint:"A dónde quiere LLEGAR tu avatar. La tierra prometida. Siempre con número o resultado concreto.",
    formats: BLOCK_FORMATS.promise },
  { id:"proof",       label:"Proof",       emoji:"⭐", tipo:"proof",     funcs:["body"],
    hint:"El piloto que hace creíble la promesa. Resultado real específico > volumen de clientes > rating.",
    formats: BLOCK_FORMATS.proof },
  { id:"offer",       label:"Offer",       emoji:"🎁", tipo:"offer",     funcs:["offer"],
    hint:"Tu oferta presentada con claridad. Qué es, qué incluye y por qué el precio es una decisión obvia.",
    formats: BLOCK_FORMATS.offer },
  { id:"curiosity",   label:"Curiosity",   emoji:"🔮", tipo:"curiosity", funcs:["body"],
    hint:"El mecanismo nombrado — el helicóptero del Pain al Promise. Debe ser único y tener su propio nombre.",
    formats: BLOCK_FORMATS.curiosity },
  { id:"constraints", label:"Constraints", emoji:"🛡", tipo:"constraints",funcs:["body"],
    hint:"Todo lo que frena a tu avatar de actuar. Más profundo que las objeciones — identidad, creencias, recursos.",
    formats: BLOCK_FORMATS.constraints },
  { id:"conditions",  label:"Conditions",  emoji:"⏰", tipo:"conditions", funcs:["cta"],
    hint:"Urgencia real, escasez real, o call-out de audiencia. La urgencia falsa destruye la confianza — nunca usarla.",
    formats: BLOCK_FORMATS.conditions },
  { id:"cta",        label:"CTA",         emoji:"🎯", tipo:"conditions", funcs:["cta"],
    hint:"Llama a la acción. Exactamente qué hacer, por qué ahora, qué pasa después. Específico > genérico.",
    formats: BLOCK_FORMATS.cta },
  { id:"headline",    label:"Headline",    emoji:"📰", tipo:"offer",      funcs:["headline"],
    hint:"Máx 40 caracteres. Funciona solo bajo la imagen. UVP comprimido.",
    formats:[
      { id:"how_without",   label:"Cómo [resultado] sin [obstáculo]",        hint:"'Come bien sin salir de la oficina'" },
      { id:"for_who",       label:"Para [avatar específico]",                hint:"'Para los que almuerzan en la zona norte'" },
      { id:"number",        label:"[N] [resultado] en [tiempo]",             hint:"'47 domicilios en 1 mes'" },
      { id:"why_q",         label:"¿Por qué [situación intrigante]?",        hint:"'¿Por qué siempre hay cola aquí?'" },
      { id:"secret",        label:"El secreto de [grupo] para [resultado]",  hint:"'El secreto de los locales siempre llenos'" },
      { id:"self_interest", label:"Interés propio directo",                  hint:"Beneficio inmediato. 'Almuerzo listo en 15 min'" },
      { id:"pure_curiosity",label:"Pura curiosidad",                         hint:"Genera una pregunta. Ideal para tráfico frío." },
      { id:"news",          label:"Novedad / Lanzamiento",                   hint:"Algo nuevo. 'Nuevo menú de temporada'" },
      CUSTOM_FORMAT,
    ]
  },
  { id:"hook_video",  label:"Hook Video",  emoji:"🎬", tipo:"curiosity", funcs:["hook"],
    hint:"0-3 segundos hablados. Funciona sin sonido. La primera palabra decide si siguen viendo.",
    formats:[
      { id:"pov",           label:"POV — perspectiva del avatar",            hint:"Cámara subjetiva en el momento del beneficio. 'POV: son las 12:30 y ya sabes dónde almorzas'" },
      { id:"dato",          label:"Directo a cámara + dato impactante",      hint:"Cara a cámara, primer plano. 'Este restaurante pasó de 3 a 47 domicilios. Sin apps.'" },
      { id:"interrupt",     label:"Pattern interrupt",                        hint:"Primera palabra rompe el patrón. 'Para. Antes de pagar otro mes a la app, mira esto.'" },
      { id:"stakes",        label:"Stakes — consecuencia con número",        hint:"'Cada mes con apps = Bs. 1.200 en comisiones que no vuelven.'" },
      { id:"before_after",  label:"Visual antes/después",                    hint:"Pantalla dividida o secuencia rápida. 'Antes: Bs. 2.000 en comisiones. Después: Bs. 0.'" },
      { id:"confessional",  label:"Confesión a cámara",                      hint:"Experto admite algo inesperado. Alta credibilidad por la vulnerabilidad." },
      { id:"tutorial",      label:"Tutorial (valor primero)",                 hint:"'Paso 1 gratis.' Valor inmediato, CTA al final. Muy alta tasa de retención." },
      { id:"split_screen",  label:"Pantalla dividida",                        hint:"Dos clips simultáneos en pantalla partida. Rompe el patrón visual del feed." },
      { id:"asmr_closeup",  label:"Primer plano ASMR del producto",           hint:"Primer plano muy cerrado del producto. Genera curiosidad: '¿qué es eso?' Detiene el scroll por rareza o satisfacción visual." },
      { id:"result_first",  label:"Resultado → Producto",                     hint:"Muestra primero el resultado final, luego el producto. Aumenta tiempo de visualización — el usuario quiere saber cómo lograrlo." },
      { id:"comment_reply", label:"Respuesta a comentario (overlay)",         hint:"Overlay estilo TikTok de respuesta a un comentario. Usa un testimonio, objeción, o anuncio de oferta como texto del comentario." },
      CUSTOM_FORMAT,
    ]
  },
];


function CompositorScreen({ assets, conceptos, perfil, brand, busy, setBusy, apiKey, notify, updateBrand, initialConcept }) {
  const [formato, setFormato] = useState("facebook");
  const [concepto, setConcepto] = useState(initialConcept||null);
  const [pasoActual, setPasoActual] = useState(0);
  const [bloques, setBloques] = useState({});
  const [resultados, setResultados] = useState([]);
  const [genBusy, setGenBusy] = useState(false);
  const [formatSel, setFormatSel] = useState(null);
  const [formatCustom, setFormatCustom] = useState("");
  const [hookBlockType, setHookBlockType] = useState(null);
  const [videoHookCopyFmt, setVideoHookCopyFmt] = useState(null);
  const [proofData, setProofData] = useState("");
  const [offerSel, setOfferSel] = useState(null);
  const [editando, setEditando] = useState(null);
  const [ctaContext,    setCtaContext]    = useState("");
  const [editandoOutput, setEditandoOutput] = useState(false);
  const [outputEditado,  setOutputEditado]  = useState("");
  const [output, setOutput] = useState(null);
  const [outputEmoji, setOutputEmoji] = useState("");
  const [fase, setFase] = useState("setup");

  const PASOS_FB_BASE    = ["hook","pain","promise","proof","offer","curiosity","constraints","conditions","cta","headline"];
  const PASOS_VIDEO_BASE = ["hook_video","pain","promise","proof","curiosity","conditions","cta"];
  const hookSkipStep = hookBlockType ? (HOOK_TYPE_TO_STEP[hookBlockType]||null) : null;
  const pasos = (formato==="facebook" ? PASOS_FB_BASE : PASOS_VIDEO_BASE).filter(p=>p!==hookSkipStep);
  const pasoInfo = BLOCK_ORDER.find(b=>b.id===pasos[pasoActual]);
  const bloquesSeleccionados = pasos.filter(p=>bloques[p]);
  const progreso = Math.round(bloquesSeleccionados.length / pasos.length * 100);
  const offers = brand?.offers || [];
  const isHookStep  = pasoInfo?.id==="hook" || pasoInfo?.id==="hook_video";
  const isProofStep = pasoInfo?.id==="proof";
  const isOfferStep = pasoInfo?.id==="offer";
  const isCTAStep   = pasoInfo?.id==="cta";

  function resetStep() { setResultados([]); setFormatSel(null); setFormatCustom(""); setHookBlockType(null); setVideoHookCopyFmt(null); setProofData(""); setOfferSel(null); setEditando(null); setCtaContext(""); }
  function goToStep(i) { setPasoActual(i); resetStep(); }

  async function generarBloque() {
    if (!pasoInfo) return;
    setGenBusy(true); setResultados([]);
    const ctx = perfilCtx(perfil, brand?.avatars);
    const conceptCtx = concepto ? `\nCONCEPT: "${concepto.concepto}"${concepto.angulo?`\nAngle: ${concepto.angulo}`:""}` : "";
    const fmt = pasoInfo.formats.find(f=>f.id===formatSel) || pasoInfo.formats[0];
    const fmtLabel = fmt.id==="custom" ? (formatCustom.trim()||"Free format") : fmt.label;
    try {
      let prompt;
      const lang = `IMPORTANTE: Genera TODO en español. Directo, natural, copy conversacional.\n`;
      if (pasoInfo.id==="hook" || pasoInfo.id==="hook_video") {
        const esVideo = pasoInfo.id==="hook_video";
        const ht = hookBlockType ? HOOK_BLOCK_TYPES.find(h=>h.id===hookBlockType) : null;
        const hookTypeCtx = ht ? `\nHOOK TYPE: ${ht.label} — ${ht.desc}` : "";
        let videoCopyCtx = "";
        if (esVideo && videoHookCopyFmt) {
          const vcf = BLOCK_FORMATS.hook.find(f=>f.id===videoHookCopyFmt);
          videoCopyCtx = vcf ? `\nCOPY FORMAT: "${vcf.label}" — ${vcf.hint}` : "";
        }
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}${hookTypeCtx}${videoCopyCtx}\n\nFormat: "${fmtLabel}"${fmt.hint?`\nFormat guide: ${fmt.hint}`:""}\n\nGenerate 5 ${esVideo?"VIDEO HOOKS (1 spoken line, 0-3 sec)":"HOOKS"} using this format. Apply HOOK RULES. Max 1-2 lines, specific. No empty adjectives. Use numbers when possible.${esVideo?" For each include visual direction (what's on screen) and sound suggestion.":""}\n\nJSON only:\n${esVideo?'[{"text":"...","visual":"...","sound":"..."}]':'[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}]'}`;
      } else if (pasoInfo.id==="headline") {
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}\n\nFormat: "${fmtLabel}"${fmt.hint?`\nGuide: ${fmt.hint}`:""}\n\nGenerate 6 HEADLINES. HARD RULE: max 40 characters each. Meta truncates after that. Works standalone without the main text.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (pasoInfo.id==="pain") {
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}\n\nBlock: PAIN — Format: "${fmtLabel}"${fmt.hint?`\nGuide: ${fmt.hint}`:""}\n\nGenerate 4 PAIN blocks. Describe where the avatar IS RIGHT NOW: their situation, frustration, moment of pain. The more specific and visual, the more they identify. Speak to the reader (you/your). No empty adjectives.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (pasoInfo.id==="promise") {
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}\n\nBlock: PROMISE — Format: "${fmtLabel}"${fmt.hint?`\nGuide: ${fmt.hint}`:""}\n\nGenerate 4 PROMISE blocks. The promised land: where the avatar WANTS TO GO. Always with a number + time if applicable. Identity transformation or concrete result. Speak to the reader (you/your).\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (pasoInfo.id==="proof") {
        const proofCtx = proofData.trim() ? `\n\nREAL PROOF DATA FROM THE OWNER (use this to generate accurate proof blocks):\n${proofData.trim()}` : "";
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}${proofCtx}\n\nBlock: PROOF — Format: "${fmtLabel}"${fmt.hint?`\nGuide: ${fmt.hint}`:""}\n\nGenerate 4 PROOF blocks. Hierarchy: specific result+name+number > case study > testimonial > data > credentials. Always specific. No unsupported claims.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (pasoInfo.id==="offer") {
        const selOffer = offerSel || offers[0];
        const offerCtx = selOffer ? `\n\nOFFER:\n${selOffer.name?`Name: ${selOffer.name}`:""}${selOffer.desc?`\nDescription: ${selOffer.desc}`:""}${selOffer.price?`\nPrice: ${selOffer.price}`:""}` : "";
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}${offerCtx}\n\nBlock: OFFER — Format: "${fmtLabel}"${fmt.hint?`\nGuide: ${fmt.hint}`:""}\n\nGenerate 4 OFFER blocks. Present the offer clearly: what it is, what's included, and why the price is an obvious decision. Apply COPY VELOCITY.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (pasoInfo.id==="curiosity") {
        const mecCtx = perfil?.mecanismo_nombrado ? `\n\nMECANISMO NOMBRADO DE LA MARCA: "${perfil.mecanismo_nombrado}" — usa este nombre exacto al generarlo.` : "";
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}${mecCtx}\n\nBlock: CURIOSITY — Format: "${fmtLabel}"${fmt.hint?`\nGuide: ${fmt.hint}`:""}\n\nGenera 4 bloques CURIOSITY. El mecanismo nombrado (NECESITA su propio nombre si no hay uno definido), bucle abierto, o método único que lleva del Pain al Promise. Cada uno debe crear la pregunta '¿qué es eso?' en la mente del lector. Usa los detalles específicos del producto/servicio.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (pasoInfo.id==="constraints") {
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}\n\nBlock: CONSTRAINTS — Format: "${fmtLabel}"${fmt.hint?`\nGuide: ${fmt.hint}`:""}\n\nGenerate 4 CONSTRAINTS blocks. The 5 dimensions: identity, values, beliefs, resources (time/money/energy), past experiences. Name the avatar's real friction and reframe it. Speak to the reader (you/your).\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (pasoInfo.id==="conditions") {
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}\n\nBlock: CONDITIONS — Format: "${fmtLabel}"${fmt.hint?`\nGuide: ${fmt.hint}`:""}\n\nGenerate 4 CONDITIONS blocks. REAL urgency, REAL scarcity, specific deadline, audience call-out. NEVER fake urgency ('Only today!' that appears every week). Without legitimate urgency, write a specific audience call-out instead.\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else if (pasoInfo.id==="cta") {
        const ctaGoalCtx = ctaContext.trim() ? `\n\nACCIÓN DESEADA: "${ctaContext.trim()}"` : "";
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}${ctaGoalCtx}\n\nBlock: CTA — Format: "${fmtLabel}"${fmt.hint?`\nGuide: ${fmt.hint}`:""}\n\nGenera 4 CTAs. Deben decir exactamente: QUÉ hacer + POR QUÉ ahora + QUÉ pasa después. Sin 'Haz clic aquí' genérico — acción específica con resultado específico. Máx 2-3 líneas.\n\nIMPORTANTE: Genera TODO en español.\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}]`;
      } else {
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}\n\nFormat: "${fmtLabel}"\n\nGenerate 4 blocks of type "${pasoInfo.label}" using this format. Apply BODY COPY RULES. Specific, speak to the reader (you/your).\n\nJSON only:\n[{"text":"..."},{"text":"..."},{"text":"..."},{"text":"..."}]`;
      }
      const raw = await callClaude(prompt, apiKey, 1600);
      const arr = JSON.parse(raw.replace(/```json|```/g,"").trim());
      setResultados(arr.map(r=>({...r,_id:uid(),tipo:pasoInfo.tipo,funcs:pasoInfo.funcs})));
    } catch(e) { console.error("gen error:", e); notify("Error: " + (e?.message || "intenta de nuevo")); }
    setGenBusy(false);
  }

  function seleccionarBloque(r) {
    const fmt = pasoInfo.formats.find(f=>f.id===formatSel)||pasoInfo.formats[0];
    const fLabel = fmt.id==="custom" ? (formatCustom.trim()||"Free format") : fmt.label;
    setBloques(p=>({...p,[pasoInfo.id]:{...r,formatId:fmt.id,formatLabel:fLabel}}));
    notify(`${pasoInfo.label} elegido ✓`);
  }

  function guardarEnBanco(r) {
    const extra = r.visual ? ` | 📷 ${r.visual} | 🎵 ${r.sound}` : "";
    const tags = [...(r.funcs||[]),"generated"];
    if (concepto) tags.push("concept:"+concepto.id);
    updateBrand(b=>({...b,assets:[...(b.assets||[]),{id:uid(),tipo:r.tipo,funcs:r.funcs,tags,text:r.text+extra}]}));
    notify("Guardado en banco ✓");
  }

  async function ensamblar() {
    setBusy(true); setOutput(null); setOutputEmoji("");
    const ctx = perfilCtx(perfil, brand?.avatars);
    const conceptCtx = concepto ? `\nCONCEPT: "${concepto.concepto}"${concepto.angulo?`\nAngle: ${concepto.angulo}`:""}` : "";
    const bloquesList = pasos.filter(p=>bloques[p]).map((p,i)=>{
      const b=bloques[p]; const info=BLOCK_ORDER.find(x=>x.id===p);
      return `${i+1}. [${info?.label||p}] ${b.text}`;
    }).join("\n");
    const tag = `[Concept: ${concepto?.concepto?.slice(0,30)||"—"} | Format: ${formato==="facebook"?"Facebook Ad":"Video Script"} | Angle: ${concepto?.angulo||"—"}]`;
    try {
      let prompt;
      const lang = "IMPORTANTE: Genera TODO en español. Natural, conversacional, directo.\n";
      if (formato==="facebook") {
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}\n\nCombina estos bloques en un Facebook Ad completo y pulido. Únelos con gramática fluida — no los listes. Listo para pegar en Ads Manager.\n\nBLOQUES:\n${bloquesList}\n\nFORMATO EXACTO:\nTEXTO PRINCIPAL:\n[copy completo — primera línea es el hook, ~125 chars visibles antes de "ver más"]\n\nTÍTULO:\n[máx 40 caracteres]\n\nETIQUETA DE PRODUCCIÓN:\n${tag}`;
      } else {
        prompt = `${COPY_BRAIN}\n\n${lang}${ctx}${conceptCtx}\n\nCombina estos bloques en un script de video completo (20-45 seg), listo para producción. Aplica las REGLAS DE VIDEO HOOK al inicio.\n\nBLOQUES:\n${bloquesList}\n\nFORMATO EXACTO:\nHOOK (0-3s):\n[1 línea hablada]\n\nDIRECCIÓN VISUAL:\n[qué se ve en pantalla]\n\nSUGERENCIA DE SONIDO:\n[audio/música]\n\nSCRIPT:\n[script completo hablado]\n\nETIQUETA DE PRODUCCIÓN:\n${tag}`;
      }
      const raw = await callClaude(prompt, apiKey, 2000);
      setOutput({ type:formato, raw, tag });
      setFase("output");
    } catch(e) { console.error("assemble error:", e); notify("Error: " + (e?.message || "intenta de nuevo")); }
    setBusy(false);
  }

  async function agregarEmojis() {
    if (!output) return; setBusy(true);
    try {
      const raw = await callClaude(`Add emojis strategically to this Facebook Ad copy. Max 6 emojis total. Only where they add visual value — not decorative. Return only the text with emojis, no comments.\n\n${output.raw}`, apiKey, 1200);
      setOutputEmoji(raw);
    } catch(e) { console.error("emoji error:", e); notify("Error al agregar emojis"); }
    setBusy(false);
  }

  // ── Setup fase ──
  if (fase==="setup") return (
    <div style={{ maxWidth:700 }}>
      <SectionHeader title="Compositor" subtitle="Construye tu anuncio bloque por bloque, guiado paso a paso."/>
      <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:12 }}>¿Qué concepto estás comunicando? <span style={{ color:"#D94F4F" }}>*</span></div>
      {conceptos.length===0 ? (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, color:T.slate, marginBottom:10 }}>Todavía no tienes conceptos guardados. Escribe el concepto de este anuncio aquí:</div>
          <textarea
            value={concepto?.concepto||""}
            onChange={e=>setConcepto(e.target.value ? { id:"tmp_"+Date.now(), concepto:e.target.value, angulo:"", estilo:"" } : null)}
            placeholder="ej. La mayoría de dueños de restaurante pierde 30 min al día buscando dónde conseguir clientes nuevos…"
            rows={3}
            style={{ width:"100%", boxSizing:"border-box", padding:"12px 14px", fontSize:13, border:`1.5px solid ${concepto?.concepto?T.purple:T.gray}`, borderRadius:10, fontFamily:font, color:T.navy, lineHeight:1.65, resize:"vertical", outline:"none" }}
          />
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
          {conceptos.map(c=>{
            const sel=concepto?.id===c.id; const nb=assets.filter(a=>(a.tags||[]).includes("concept:"+c.id)).length;
            return <div key={c.id} onClick={()=>setConcepto(sel?null:c)} style={{ padding:"12px 16px", borderRadius:10, border:`2px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.white, cursor:"pointer", display:"flex", gap:12, alignItems:"center" }}>
              <span style={{ width:16,height:16,borderRadius:"50%",border:`2px solid ${sel?T.purple:"#ddd"}`,background:sel?T.purple:"transparent",flexShrink:0 }}/>
              <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600, color:T.navy }}>{c.concepto}</div><div style={{ display:"flex", gap:6, marginTop:3 }}>{c.angulo&&<span style={{ fontSize:11,padding:"1px 7px",borderRadius:8,background:T.purpleBg,color:T.purple }}>{c.angulo}</span>}{nb>0&&<span style={{ fontSize:11,color:T.slate }}>📦 {nb} bloques</span>}</div></div>
            </div>;
          })}
        </div>
      )}
      {!concepto?.concepto && <div style={{ fontSize:11, color:"#D94F4F", marginBottom:16 }}>Elige o escribe un concepto para continuar.</div>}
      <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:12, marginTop:8 }}>¿Qué formato vas a crear? <span style={{ color:"#D94F4F" }}>*</span></div>
      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        {[{id:"facebook",emoji:"📘",label:"Facebook Ad Copy",desc:"Texto + titular para Ads Manager."},{id:"video",emoji:"🎬",label:"Script de Video",desc:"Hook, dirección visual y script."}].map(f=>{
          const sel=formato===f.id;
          return <div key={f.id} onClick={()=>setFormato(f.id)} style={{ flex:1, padding:"12px 14px", borderRadius:10, border:`2px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.white, cursor:"pointer" }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{f.emoji}</div>
            <div style={{ fontSize:13, fontWeight:700, color:sel?T.purple:T.navy }}>{f.label}</div>
            <div style={{ fontSize:11, color:T.slate, marginTop:2, lineHeight:1.5 }}>{f.desc}</div>
          </div>;
        })}
      </div>
      <Btn variant="primary" onClick={()=>setFase("build")} disabled={!concepto?.concepto}>Empezar a construir →</Btn>
    </div>
  );

  // ── Build fase ──
  if (fase==="build") return (
    <div style={{ position:"fixed", inset:0, zIndex:8000, background:"#F5F7FF", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Top bar */}
      <div style={{ background:T.white, borderBottom:`1px solid ${T.gray}`, padding:"0 20px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, height:52 }}>
          <button onClick={()=>setFase("setup")} style={{ padding:"5px 12px", border:`1px solid ${T.gray}`, borderRadius:8, background:"transparent", cursor:"pointer", fontSize:12, fontFamily:font, color:T.slate, flexShrink:0 }}>← Configurar</button>
          <div style={{ flex:1, overflowX:"auto", display:"flex", gap:6, alignItems:"center", scrollbarWidth:"none", msOverflowStyle:"none" }}>
            {pasos.map((p,i)=>{
              const info=BLOCK_ORDER.find(x=>x.id===p); const done=!!bloques[p]; const active=pasoActual===i;
              return <button key={p} onClick={()=>goToStep(i)} style={{ flexShrink:0, padding:"4px 11px", fontSize:11, borderRadius:20, cursor:"pointer", fontFamily:font, border:`1.5px solid ${active?T.purple:done?"#1A9E6E":T.gray}`, background:active?T.purpleBg:done?"#EDFAF4":"transparent", color:active?T.purple:done?"#1A9E6E":T.slate, fontWeight:active||done?700:400, whiteSpace:"nowrap" }}>
                {done?"✓ ":""}{info?.emoji} {info?.label}
              </button>;
            })}
          </div>
          <div style={{ flexShrink:0, fontSize:11, color:T.slate, fontWeight:600 }}>{bloquesSeleccionados.length}/{pasos.length}</div>
        </div>
      </div>

      {/* Two-column content */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* Left: generator */}
        <div style={{ flex:1, overflowY:"auto", padding:"28px 24px 100px" }}>
          <div style={{ maxWidth:580 }}>
            {pasoInfo && (
              <>
                {/* Block header */}
                <div style={{ textAlign:"center", marginBottom:24 }}>
                  <div style={{ fontSize:46, marginBottom:8, lineHeight:1 }}>{pasoInfo.emoji}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:T.navy, marginBottom:6 }}>{pasoInfo.label}</div>
                  <div style={{ fontSize:13, color:T.slate, lineHeight:1.65, maxWidth:480, margin:"0 auto" }}>{pasoInfo.hint}</div>
                </div>

                {/* Concept context pill */}
                {concepto && <div style={{ padding:"7px 14px", background:T.purpleBg, borderRadius:10, fontSize:12, color:T.purple, fontWeight:600, marginBottom:22, textAlign:"center" }}>💡 {concepto.concepto.slice(0,70)}{concepto.concepto.length>70?"…":""}</div>}

                {/* HOOK STEP: selector tipo de bloque */}
                {isHookStep && (
                  <div style={{ marginBottom:24 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>¿Qué tipo de bloque lidera tu hook?</div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:8 }}>
                      {HOOK_BLOCK_TYPES.map(ht=>{
                        const sel=hookBlockType===ht.id;
                        return <div key={ht.id} onClick={()=>setHookBlockType(sel?null:ht.id)} style={{ padding:"11px 13px", borderRadius:12, border:`2px solid ${sel?ht.color:"#E5E7F0"}`, background:sel?ht.bg:T.white, cursor:"pointer", transition:"all 0.15s" }}>
                          <div style={{ fontSize:18, marginBottom:5 }}>{ht.emoji}</div>
                          <div style={{ fontSize:12, fontWeight:700, color:sel?ht.color:T.navy, marginBottom:3 }}>{ht.label}</div>
                          <div style={{ fontSize:10, color:T.slate, lineHeight:1.45 }}>{ht.desc}</div>
                        </div>;
                      })}
                    </div>
                    {hookBlockType && <div style={{ marginTop:8, fontSize:11, color:T.purple, fontWeight:600 }}>★ Los formatos recomendados para este tipo están marcados abajo</div>}
                  </div>
                )}

                {/* VIDEO HOOK: selector de formato de copy */}
                {pasoInfo?.id==="hook_video" && (
                  <div style={{ marginBottom:24 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>Formato de copy (opcional)</div>
                    <div style={{ fontSize:11, color:T.slate, marginBottom:10 }}>El ángulo de redacción que usará la IA para escribir el hook hablado</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {["pain_curiosity","promise_curiosity","contrarian","stakes","real_result","illegal","confessional","cant_believe"].map(fid=>{
                        const fmtDef = BLOCK_FORMATS.hook.find(f=>f.id===fid);
                        if (!fmtDef) return null;
                        const sel = videoHookCopyFmt===fid;
                        return <div key={fid} onClick={()=>setVideoHookCopyFmt(sel?null:fid)} style={{ padding:"6px 12px", borderRadius:20, border:`1.5px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.white, cursor:"pointer", fontSize:11, fontWeight:sel?700:400, color:sel?T.purple:T.navy }}>
                          {fmtDef.label}
                        </div>;
                      })}
                    </div>
                  </div>
                )}

                {/* PROOF STEP: datos de prueba reales */}
                {isProofStep && (
                  <div style={{ marginBottom:24 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>Ingresa tus datos de prueba reales (hace la IA mucho más precisa)</div>
                    <div style={{ fontSize:11, color:T.slate, marginBottom:10, lineHeight:1.55 }}>Ejemplos: "127 pedidos el mes pasado", "4.9 estrellas en Google (284 reseñas)", "Nutricionista certificada desde 2018", "Ana M. bajó 12 kg en 8 semanas"</div>
                    <textarea value={proofData} onChange={e=>setProofData(e.target.value)} placeholder="Ingresa tus números reales, reseñas, certificaciones, o resultados de clientes específicos…" rows={4} style={{ width:"100%", boxSizing:"border-box", padding:"12px 14px", fontSize:13, border:`1.5px solid ${proofData.trim()?T.purple:T.gray}`, borderRadius:10, fontFamily:font, color:T.navy, lineHeight:1.6, resize:"vertical", outline:"none", background:T.white }}/>
                  </div>
                )}

                {/* OFFER STEP: selector de oferta */}
                {isOfferStep && (
                  <div style={{ marginBottom:24 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>Selecciona la oferta de tu marca</div>
                    {offers.length===0
                      ? <div style={{ padding:"14px 16px", border:`1px dashed ${T.gray}`, borderRadius:10, fontSize:12, color:T.slate }}>Sin ofertas guardadas — agrégalas en tu Perfil de Marca para activar esta función.</div>
                      : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          {offers.map(o=>{
                            const sel=offerSel?.id===o.id;
                            return <div key={o.id} onClick={()=>setOfferSel(sel?null:o)} style={{ padding:"12px 16px", borderRadius:10, border:`2px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.white, cursor:"pointer", display:"flex", gap:12, alignItems:"center" }}>
                              <span style={{ width:16,height:16,borderRadius:"50%",border:`2px solid ${sel?T.purple:"#ddd"}`,background:sel?T.purple:"transparent",flexShrink:0 }}/>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:13, fontWeight:600, color:T.navy }}>{o.nombre||o.name||"Oferta sin nombre"}</div>
                                {(o.descripcion||o.desc)&&<div style={{ fontSize:11, color:T.slate, marginTop:2 }}>{(o.descripcion||o.desc).slice(0,80)}{(o.descripcion||o.desc).length>80?"…":""}</div>}
                                {(o.precio||o.price)&&<div style={{ fontSize:11, color:T.purple, fontWeight:600, marginTop:2 }}>{o.precio||o.price}</div>}
                              </div>
                            </div>;
                          })}
                        </div>
                    }
                  </div>
                )}

                {/* CTA STEP: contexto de acción deseada */}
                {isCTAStep && (
                  <div style={{ marginBottom:24 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>¿Qué acción quieres que tome el usuario?</div>
                    <div style={{ fontSize:11, color:T.slate, marginBottom:10, lineHeight:1.55 }}>Ej: "Que agenden una consulta gratis", "Que hagan clic para pedir", "Que descarguen la guía", "Que envíen mensaje por WhatsApp"</div>
                    <textarea value={ctaContext} onChange={e=>setCtaContext(e.target.value)} placeholder="Describe la acción que quieres que realice el usuario…" rows={2} style={{ width:"100%", boxSizing:"border-box", padding:"12px 14px", fontSize:13, border:`1.5px solid ${ctaContext.trim()?T.purple:T.gray}`, borderRadius:10, fontFamily:font, color:T.navy, lineHeight:1.6, resize:"vertical", outline:"none", background:T.white }}/>
                  </div>
                )}

                {/* Selector de formato */}
                <div style={{ marginBottom:22 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:12 }}>Elige un formato</div>
                  {(() => {
                    const recommended = isHookStep && hookBlockType ? (HOOK_TYPE_FORMATS[hookBlockType]||[]) : [];
                    if (isHookStep) {
                      const cats = [...new Set(pasoInfo.formats.filter(f=>f.cat).map(f=>f.cat))];
                      return <>
                        {cats.map(cat=>(
                          <div key={cat} style={{ marginBottom:14 }}>
                            <div style={{ fontSize:10, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:7, paddingLeft:2 }}>{cat}</div>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                              {pasoInfo.formats.filter(f=>f.cat===cat).map(fmt=>{
                                const sel=formatSel===fmt.id; const rec=recommended.includes(fmt.id);
                                return <div key={fmt.id} onClick={()=>{setFormatSel(sel?null:fmt.id);if(fmt.id!=="custom")setFormatCustom("");}} style={{ padding:"7px 12px", borderRadius:20, border:`1.5px solid ${sel?T.purple:rec?"#E6A817":T.gray}`, background:sel?T.purpleBg:rec?"#FFFBEE":T.white, cursor:"pointer", fontSize:12, fontWeight:sel?700:400, color:sel?T.purple:T.navy, display:"flex", alignItems:"center", gap:4, transition:"all 0.15s" }}>
                                  {rec&&!sel&&<span style={{ color:"#E6A817", fontSize:10, fontWeight:700 }}>★</span>}
                                  {fmt.label}
                                </div>;
                              })}
                            </div>
                          </div>
                        ))}
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                          {pasoInfo.formats.filter(f=>!f.cat).map(fmt=>{
                            const sel=formatSel===fmt.id;
                            return <div key={fmt.id} onClick={()=>{setFormatSel(sel?null:fmt.id);if(fmt.id!=="custom")setFormatCustom("");}} style={{ padding:"7px 12px", borderRadius:20, border:`1.5px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.white, cursor:"pointer", fontSize:12, fontWeight:sel?700:400, color:sel?T.purple:T.navy, transition:"all 0.15s" }}>
                              {fmt.label}
                            </div>;
                          })}
                        </div>
                      </>;
                    } else {
                      return <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                        {pasoInfo.formats.map(fmt=>{
                          const sel=formatSel===fmt.id;
                          return <div key={fmt.id} onClick={()=>{setFormatSel(sel?null:fmt.id);if(fmt.id!=="custom")setFormatCustom("");}} style={{ padding:"7px 12px", borderRadius:20, border:`1.5px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.white, cursor:"pointer", fontSize:12, fontWeight:sel?700:400, color:sel?T.purple:T.navy, transition:"all 0.15s" }}>
                            {fmt.label}
                          </div>;
                        })}
                      </div>;
                    }
                  })()}
                  {formatSel && formatSel!=="custom" && (() => { const f=pasoInfo.formats.find(x=>x.id===formatSel); return f?.hint ? <div style={{ fontSize:11,color:T.slate,background:"#F8F9FF",border:`1px solid ${T.purpleLight}`,borderRadius:8,padding:"9px 13px",marginTop:8,lineHeight:1.6 }}>💡 {f.hint}</div> : null; })()}
                  {formatSel==="custom" && (
                    <div style={{ marginTop:8 }}>
                      <input value={formatCustom} onChange={e=>setFormatCustom(e.target.value)} placeholder='Describe tu formato, ej. "Lista de 3 puntos con emoji, cada uno empezando con un número de impacto"' style={{ width:"100%",boxSizing:"border-box",padding:"10px 14px",fontSize:13,border:`1.5px solid ${T.purple}`,borderRadius:10,fontFamily:font,color:T.navy,outline:"none" }}/>
                    </div>
                  )}
                </div>

                {/* Botón generar */}
                <div style={{ marginBottom:22 }}>
                  <Btn variant="primary" onClick={generarBloque} disabled={genBusy||(formatSel==="custom"&&!formatCustom.trim())} full>{genBusy?"Generando…":"✨ Generar opciones"}</Btn>
                </div>

                {/* Resultados */}
                {resultados.length>0 && (
                  <div>
                    <div style={{ fontSize:11,fontWeight:700,color:T.slate,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12 }}>{resultados.length} opciones — elige la mejor</div>
                    {resultados.map(r=>{
                      const selected=bloques[pasoInfo.id]?._id===r._id;
                      return <div key={r._id} style={{ background:selected?"#EDFAF4":T.white,border:`1.5px solid ${selected?"#1A9E6E":T.gray}`,borderLeft:`4px solid ${tp(r.tipo).color}`,borderRadius:12,padding:"14px 16px",marginBottom:10 }}>
                        <div style={{ display:"flex",gap:10,alignItems:"flex-start" }}>
                          <div style={{ flex:1 }}>
                            {editando===r._id
                              ? <textarea value={r.text} onChange={e=>setResultados(resultados.map(x=>x._id===r._id?{...x,text:e.target.value}:x))} style={{ width:"100%",boxSizing:"border-box",padding:"8px",fontSize:13,border:`1.5px solid ${T.purple}`,borderRadius:8,fontFamily:font,color:T.navy,lineHeight:1.65,resize:"vertical",minHeight:70 }} autoFocus onBlur={()=>setEditando(null)}/>
                              : <div style={{ fontSize:14,color:T.navy,lineHeight:1.7 }}>{r.text}</div>}
                            {r.visual&&<div style={{ fontSize:11,color:T.slate,marginTop:5 }}>📷 {r.visual}</div>}
                            {r.sound&&<div style={{ fontSize:11,color:T.slate,marginTop:2 }}>🎵 {r.sound}</div>}
                            {pasoInfo.id==="headline"&&<div style={{ fontSize:10,color:r.text.length>40?"#D94F4F":T.slate,marginTop:4 }}>{r.text.length} caracteres {r.text.length>40?"⚠ muy largo":""}</div>}
                          </div>
                          <div style={{ display:"flex",flexDirection:"column",gap:5,flexShrink:0 }}>
                            <button onClick={()=>seleccionarBloque(r)} style={{ padding:"7px 14px",fontSize:11,borderRadius:16,cursor:"pointer",fontFamily:font,border:`1px solid ${selected?"#1A9E6E":T.purple}`,background:selected?"#EDFAF4":T.purpleBg,color:selected?"#1A9E6E":T.purple,fontWeight:700,whiteSpace:"nowrap" }}>{selected?"✓ Elegido":"Usar este"}</button>
                            <button onClick={()=>setEditando(r._id)} style={{ padding:"5px 10px",fontSize:11,borderRadius:16,border:`1px solid ${T.gray}`,background:"transparent",color:T.slate,cursor:"pointer",fontFamily:font }}>Editar</button>
                            <button onClick={()=>guardarEnBanco(r)} style={{ padding:"5px 10px",fontSize:11,borderRadius:16,border:`1px solid ${T.gray}`,background:"transparent",color:T.slate,cursor:"pointer",fontFamily:font }}>Al banco</button>
                          </div>
                        </div>
                      </div>;
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: preview en tiempo real */}
        <div style={{ width:300, borderLeft:`1px solid ${T.gray}`, background:T.white, display:"flex", flexDirection:"column", flexShrink:0 }}>
          <div style={{ padding:"14px 18px 12px", borderBottom:`1px solid ${T.gray}`, flexShrink:0 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:2 }}>Tu anuncio</div>
            <div style={{ fontSize:11, color:T.slate }}>{bloquesSeleccionados.length} de {pasos.length} bloques elegidos</div>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"16px 18px 20px" }}>
            {bloquesSeleccionados.length === 0 ? (
              <div style={{ textAlign:"center", paddingTop:50, color:T.slate }}>
                <div style={{ fontSize:32, marginBottom:10 }}>✦</div>
                <div style={{ fontSize:12, lineHeight:1.6 }}>Los bloques que elijas irán apareciendo aquí, formando tu anuncio</div>
              </div>
            ) : (
              <div>
                {pasos.filter(p=>bloques[p]).map(p=>{
                  const info=BLOCK_ORDER.find(x=>x.id===p);
                  const b=bloques[p]; const tc=tp(b.tipo);
                  return (
                    <div key={p} style={{ marginBottom:16 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:5 }}>
                        <span style={{ fontSize:14 }}>{info?.emoji}</span>
                        <span style={{ fontSize:9, fontWeight:700, color:tc.color, textTransform:"uppercase", letterSpacing:"0.08em" }}>{info?.label||p}</span>
                      </div>
                      <div style={{ fontSize:12, color:T.navy, lineHeight:1.65, padding:"9px 12px", background:tc.bg, borderRadius:8, border:`1px solid ${tc.border}` }}>{b.text}</div>
                      {b.visual&&<div style={{ fontSize:10, color:T.slate, marginTop:3 }}>📷 {b.visual}</div>}
                    </div>
                  );
                })}
                {bloquesSeleccionados.length >= 2 && (
                  <div style={{ borderTop:`1px dashed ${T.gray}`, paddingTop:14, marginTop:4 }}>
                    <Btn variant="soft" small onClick={()=>setFase("assemble")}>Ensamblar copy →</Btn>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Barra de navegación inferior */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, background:T.white, borderTop:`1px solid ${T.gray}`, padding:"12px 20px", display:"flex", gap:10, alignItems:"center" }}>
        <Btn variant="ghost" onClick={()=>{ if(pasoActual>0) goToStep(pasoActual-1); else setFase("setup"); }}>← Atrás</Btn>
        <div style={{ flex:1 }}/>
        {bloquesSeleccionados.length>=2 && <Btn variant="soft" onClick={()=>setFase("assemble")}>Ver todos →</Btn>}
        {bloques[pasoInfo?.id]
          ? <Btn variant="primary" onClick={()=>{ const nxt=pasoActual+1; if(nxt<pasos.length) goToStep(nxt); else setFase("assemble"); }}>Siguiente →</Btn>
          : <Btn variant="ghost" onClick={()=>{ const nxt=pasoActual+1; if(nxt<pasos.length) goToStep(nxt); else setFase("assemble"); }}>Saltar →</Btn>
        }
      </div>
    </div>
  );

  // ── Assemble fase ──
  if (fase==="assemble"&&!output) return (
    <div style={{ position:"fixed", inset:0, zIndex:8000, background:"#F5F7FF", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Top bar */}
      <div style={{ background:T.white, borderBottom:`1px solid ${T.gray}`, padding:"0 20px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, height:52 }}>
          <button onClick={()=>setFase("build")} style={{ padding:"5px 12px", border:`1px solid ${T.gray}`, borderRadius:8, background:"transparent", cursor:"pointer", fontSize:12, fontFamily:font, color:T.slate, flexShrink:0 }}>← Seguir construyendo</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>Ensamblar copy</div>
            {concepto&&<div style={{ fontSize:11, color:T.purple, marginTop:1 }}>💡 {concepto.concepto}</div>}
          </div>
        </div>
      </div>
      {/* Two-column content */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        {/* Left: blocks list */}
        <div style={{ flex:1, overflowY:"auto", padding:"24px 24px 80px" }}>
          <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:14 }}>Tus bloques ({bloquesSeleccionados.length})</div>
          {pasos.filter(p=>bloques[p]).map((p,i)=>{
            const info=BLOCK_ORDER.find(x=>x.id===p); const b=bloques[p];
            return <div key={p} style={{ padding:"12px 14px", borderRadius:10, border:`1.5px solid ${tp(b.tipo).border}`, borderLeft:`4px solid ${tp(b.tipo).color}`, background:T.white, marginBottom:8, display:"flex", gap:10, alignItems:"flex-start" }}>
              <div style={{ minWidth:22, fontSize:11, fontWeight:700, color:T.slate, paddingTop:2 }}>{i+1}.</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:5, marginBottom:5 }}><BlockBadge type={b.tipo}/><FuncTag f={b.funcs?.[0]||"body"}/></div>
                <div style={{ fontSize:13, color:T.navy, lineHeight:1.65 }}>{b.text}</div>
              </div>
              <button onClick={()=>{setPasoActual(pasos.indexOf(p));setFase("build");setResultados([]);setFormatSel(null);setFormatCustom("");}} style={{ fontSize:11, padding:"4px 9px", border:`1px solid ${T.gray}`, borderRadius:8, background:"transparent", color:T.slate, cursor:"pointer", fontFamily:font, flexShrink:0 }}>Editar</button>
            </div>;
          })}
          {pasos.filter(p=>!bloques[p]).length>0&&<div style={{ padding:"10px 14px", background:"#FFF8EA", borderRadius:8, border:"1px solid #F0D080", fontSize:12, color:"#C07C10" }}>Pasos incompletos: {pasos.filter(p=>!bloques[p]).map(p=>BLOCK_ORDER.find(x=>x.id===p)?.label).join(", ")}</div>}
        </div>
        {/* Right: format selector + generate */}
        <div style={{ width:300, borderLeft:`1px solid ${T.gray}`, background:T.white, display:"flex", flexDirection:"column", flexShrink:0, overflowY:"auto" }}>
          <div style={{ padding:"20px 18px", borderBottom:`1px solid ${T.gray}` }}>
            <div style={{ padding:"10px 14px", borderRadius:8, background:T.purpleBg, border:`1px solid ${T.purpleLight}`, fontSize:12, color:T.purple, fontWeight:600 }}>
              {formato==="facebook"?"📘 Facebook Ad Copy":"🎬 Script de Video"}
            </div>
          </div>
          <div style={{ padding:"18px" }}>
            <Btn variant="primary" onClick={ensamblar} disabled={busy||bloquesSeleccionados.length<2} style={{ width:"100%" }}>{busy?"Ensamblando…":"✨ Generar copy final"}</Btn>
            {bloquesSeleccionados.length<2&&<div style={{ fontSize:11, color:T.slate, marginTop:8, textAlign:"center" }}>Necesitas al menos 2 bloques para generar.</div>}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Output fase ──
  if (output) return (
    <div style={{ maxWidth:720 }}>
      <SectionHeader title="Copy final" subtitle="Listo para copiar y usar."/>
      <div style={{ fontSize:11, fontFamily:"monospace", color:T.slate, marginBottom:14, padding:"6px 12px", background:T.grayLight, borderRadius:7, display:"inline-block" }}>{output.tag}</div>
      <div style={{ background:T.white, borderRadius:14, border:`1.5px solid ${T.gray}`, overflow:"hidden", marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ padding:"13px 18px", borderBottom:`1px solid ${T.gray}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:output.type==="facebook"?"#EEF4FF":"#F0F8FF" }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.navy, textTransform:"uppercase", letterSpacing:"0.08em" }}>{output.type==="facebook"?"📘 Facebook Ad Copy":"🎬 Script de Video"}</div>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={()=>{ setEditandoOutput(v=>!v); if(!outputEditado) setOutputEditado(outputEmoji||output.raw); }} style={{ padding:"5px 12px", fontSize:11, border:`1px solid ${T.gray}`, borderRadius:8, background:"transparent", cursor:"pointer", fontFamily:font, color:T.slate }}>Editar</button>
            <CopyBtn text={outputEditado||outputEmoji||output.raw} small/>
          </div>
        </div>
        <div style={{ padding:"22px 24px" }}>
          {editandoOutput
            ? <textarea value={outputEditado} onChange={e=>setOutputEditado(e.target.value)} style={{ width:"100%", boxSizing:"border-box", fontSize:14, lineHeight:1.9, border:`1.5px solid ${T.purple}`, borderRadius:10, padding:"14px 16px", fontFamily:font, color:T.navy, resize:"vertical", minHeight:300, outline:"none" }} autoFocus/>
            : <div style={{ fontSize:14, lineHeight:1.95, color:T.navy, whiteSpace:"pre-wrap" }}>{outputEditado||outputEmoji||output.raw}</div>
          }
        </div>
      </div>
      {output.type==="facebook"&&!outputEmoji&&!outputEditado&&(
        <div style={{ marginBottom:16 }}>
          <Btn variant="ghost" onClick={agregarEmojis} disabled={busy}>{busy?"Agregando emojis…":"✨ Agregar emojis"}</Btn>
        </div>
      )}
      {outputEmoji&&!outputEditado&&<div style={{ marginBottom:16,padding:"10px 14px",background:"#EDFAF4",borderRadius:10,border:"1px solid #9EE0C6",fontSize:12,color:"#1A9E6E" }}>✓ Versión con emojis lista</div>}
      {/* Source blocks */}
      <div style={{ background:T.white, borderRadius:12, border:`1px solid ${T.gray}`, padding:"14px 16px", marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>Bloques usados ({bloquesSeleccionados.length})</div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {pasos.filter(p=>bloques[p]).map(p=>{
            const info=BLOCK_ORDER.find(x=>x.id===p); const b=bloques[p]; const tc=tp(b.tipo);
            return <div key={p} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"9px 12px", borderRadius:8, background:tc.bg, border:`1px solid ${tc.border}` }}>
              <span style={{ fontSize:13, flexShrink:0 }}>{info?.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:9, fontWeight:700, color:tc.color, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:3 }}>{info?.label}</div>
                <div style={{ fontSize:12, color:T.navy, lineHeight:1.6 }}>{b.text}</div>
              </div>
            </div>;
          })}
        </div>
      </div>
      <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
        <Btn variant="primary" onClick={()=>{setOutput(null);setBloques({});setPasoActual(0);setResultados([]);setConcepto(null);setFase("setup");setOutputEditado("");setEditandoOutput(false);}}>Crear otro</Btn>
        <Btn variant="ghost" onClick={()=>{setOutput(null);setFase("assemble");setOutputEditado("");setEditandoOutput(false);}}>← Editar bloques</Btn>
        <Btn variant="ghost" onClick={ensamblar} disabled={busy}>{busy?"Regenerando…":"↻ Regenerar"}</Btn>
      </div>
    </div>
  );

  return null;
}

// ─── OFFER GENERATOR ──────────────────────────────────────────────────────────
function OfferScreen({ assets, perfil, busy, setBusy, apiKey, notify, updateBrand }) {
  const [ofText, setOfText] = useState("");
  const [ofFw,   setOfFw]   = useState("pain_curiosity");
  const [ofRes,  setOfRes]  = useState(null);
  const [ofSel,  setOfSel]  = useState([]);

  async function generate(more=false) {
    if (!ofText.trim()) { notify("Describe your offer first"); return; }
    setBusy(true); if (!more) { setOfRes(null); setOfSel([]); }
    try {
      const fw = HOOK_FRAMEWORKS.find(f=>f.id===ofFw);
      const ctx = perfilCtx(perfil, brand?.avatars);
      const raw = await callClaude(`${COPY_BRAIN}\n\n${ctx}\n\nOffer: "${ofText}"\n\nFramework to apply: ${fw?.label} — ${fw?.desc}\nExample: "${fw?.example}"\n\nGenerate ${more?"NEW (different from before)":"variations"} applying this framework + HOOK RULES:\n- 3 HEADLINES (max 40 chars, apply HEADLINE RULES)\n- 3 HOOKS (1-2 lines max, specific, punchy)\n\nJSON only:\n{"headlines":["..."],"hooks":["..."]}`, apiKey);
      const parsed = JSON.parse(raw.replace(/```json|```/g,"").trim());
      setOfRes(parsed); if (!more) setOfSel([]);
    } catch(e) { console.error("offer error:", e); notify("Error: " + (e?.message || "intenta de nuevo")); }
    setBusy(false);
  }

  function saveSel() {
    if (!ofSel.length||!ofRes) return;
    const toSave = ofSel.map(key=>{
      const [type,i] = key.split("-");
      const text = type==="h"?ofRes.headlines[i]:ofRes.hooks[i];
      return { id:uid(), tipo:type==="h"?"offer":"curiosity", funcs:type==="h"?["headline"]:["hook"], tags:type==="h"?["headline","offer-generated"]:["hook","offer-generated"], text };
    });
    updateBrand(b=>({...b, assets:[...(b.assets||[]),...toSave]}));
    notify(`${toSave.length} block(s) saved to bank`); setOfSel([]);
  }

  return (
    <div style={{ maxWidth:780 }}>
      <SectionHeader title="Generador rápido" subtitle="Describe tu oferta → elige un framework → genera hooks y headlines → guarda los mejores."/>
      <Inp label="Tu oferta" multiline rows={3} placeholder="e.g. 6-week Meta Ads bootcamp, 1:1 mentorship, real projects, verifiable portfolio. For LATAM entrepreneurs." value={ofText} onChange={e=>setOfText(e.target.value)}/>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:10 }}>Hook framework</div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {HOOK_FRAMEWORKS.map(fw=>(
            <div key={fw.id} onClick={()=>setOfFw(fw.id)} style={{ padding:"10px 14px", borderRadius:9, border:`1.5px solid ${ofFw===fw.id?T.purple:T.gray}`, background:ofFw===fw.id?T.purpleBg:T.white, cursor:"pointer" }}>
              <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                <span style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${ofFw===fw.id?T.purple:T.gray}`, background:ofFw===fw.id?T.purple:"transparent", flexShrink:0, marginTop:2 }}/>
                <div><div style={{ fontSize:12, fontWeight:700, color:ofFw===fw.id?T.purple:T.navy, marginBottom:2 }}>{fw.label}</div><div style={{ fontSize:11, color:T.slate }}>{fw.desc}</div>{ofFw===fw.id && <div style={{ fontSize:11, color:T.purple, marginTop:3, fontStyle:"italic" }}>"{fw.example}"</div>}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        <Btn variant="primary" onClick={()=>generate(false)} disabled={busy}>{busy?"Generando…":"✨ Generate 3+3"}</Btn>
        {ofRes && <Btn variant="ghost" onClick={()=>generate(true)} disabled={busy}>3 more variations</Btn>}
      </div>
      {ofRes && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:FC.headline, marginBottom:8 }}>Headlines</div>
              {ofRes.headlines.map((h,i)=>{const key=`h-${i}`;const sel=ofSel.includes(key);return(
                <div key={key} onClick={()=>setOfSel(p=>sel?p.filter(x=>x!==key):[...p,key])} style={{ padding:"10px 12px", marginBottom:6, borderRadius:9, border:`1.5px solid ${sel?"#2878D4":T.gray}`, background:sel?"#EEF5FF":T.white, cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${sel?"#2878D4":T.gray}`, background:sel?"#2878D4":"transparent", flexShrink:0, marginTop:1 }}/>
                  <div><div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{h}</div><div style={{ fontSize:10, color:h.length>40?"#D94F4F":T.slate, marginTop:2 }}>{h.length} chars {h.length>40?"⚠ demasiado largo":""}</div></div>
                </div>
              );})}
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:FC.hook, marginBottom:8 }}>Hooks</div>
              {ofRes.hooks.map((h,i)=>{const key=`k-${i}`;const sel=ofSel.includes(key);return(
                <div key={key} onClick={()=>setOfSel(p=>sel?p.filter(x=>x!==key):[...p,key])} style={{ padding:"10px 12px", marginBottom:6, borderRadius:9, border:`1.5px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:T.white, cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${sel?T.purple:T.gray}`, background:sel?T.purple:"transparent", flexShrink:0, marginTop:1 }}/>
                  <div style={{ fontSize:13, color:T.navy, lineHeight:1.5 }}>{h}</div>
                </div>
              );})}
            </div>
          </div>
          {ofSel.length>0 && <div style={{ marginTop:14 }}><Btn variant="primary" onClick={saveSel}>💾 Save {ofSel.length} to block bank</Btn></div>}
        </div>
      )}
    </div>
  );
}

// ─── TRANSCRIPT ───────────────────────────────────────────────────────────────
function TranscriptScreen({ busy, setBusy, apiKey, notify, updateBrand }) {
  const [trText, setTrText] = useState("");
  const [trRes,  setTrRes]  = useState([]);
  const [trSel,  setTrSel]  = useState([]);

  async function importTranscript() {
    if (!trText.trim()) return; setBusy(true); setTrRes([]); setTrSel([]);
    try {
      const raw = await callClaude(`${COPY_BRAIN}\n\nAnaliza esta transcripción y extrae bloques de copy reutilizables para Meta Ads en español.\n\nREGLAS:\n- Cada bloque: COMPLETO y autocontenido, mínimo 15 palabras, 1-3 oraciones con contexto\n- Preserva el lenguaje real y detalles específicos del hablante (fechas, números, nombres)\n- Prioriza: dolores específicos, transformaciones con datos, objeciones reales, prueba social\n- 6-10 bloques — pocos y buenos, no fragmentos sueltos\n- TIPOS: pain (situación actual), promise (transformación), proof (resultado real+dato), curiosity (mecanismo único), constraints (freno/objeción), conditions (urgencia)\n- FUNCS: hook (primera línea), body (desarrollo), headline (<40 chars)\n\nIMPORTANTE: Responde SOLO JSON, sin markdown:\n[{"tipo":"pain","funcs":["hook"],"tags":["pain"],"text":"bloque completo listo para usar en copy"}]\n\nTRANSCRIPCIÓN:\n${trText.slice(0,4000)}`, apiKey);
      const arr = JSON.parse(raw.replace(/```json|```/g,"").trim());
      setTrRes(arr);
    } catch { notify("Error extracting blocks"); }
    setBusy(false);
  }

  function saveSel() {
    if (!trSel.length) return;
    const toSave = trRes.filter((_,i)=>trSel.includes(i)).map(a=>({...a, id:uid(), tags:[...(a.funcs||[]),...(a.tags||[])].filter((v,i2,arr)=>arr.indexOf(v)===i2)}));
    updateBrand(b=>({...b, assets:[...(b.assets||[]),...toSave]}));
    notify(`${toSave.length} block(s) saved`); setTrRes([]); setTrSel([]); setTrText("");
  }

  return (
    <div style={{ maxWidth:780 }}>
      <SectionHeader title="Importar transcripción" subtitle="Pega un testimonio o tu propio video → la IA extrae bloques → tú eliges cuáles guardar."/>
      <Inp label="Transcripción" multiline rows={8} placeholder="Pega aquí…" value={trText} onChange={e=>setTrText(e.target.value)}/>
      <Btn variant="primary" onClick={importTranscript} disabled={busy||!trText.trim()}>{busy?"Analizando…":"✨ Extraer bloques"}</Btn>
      {trRes.length>0 && (
        <div style={{ marginTop:20 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:10 }}>Selecciona los que quieres guardar:</div>
          {trRes.map((a,i)=>(
            <div key={i} onClick={()=>setTrSel(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i])} style={{ padding:"10px 12px", marginBottom:6, borderRadius:9, border:`1.5px solid ${trSel.includes(i)?T.purple:tp(a.tipo).border}`, background:trSel.includes(i)?T.purpleBg:T.white, cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start", borderLeft:`4px solid ${tp(a.tipo).color}` }}>
              <span style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${trSel.includes(i)?T.purple:T.gray}`, background:trSel.includes(i)?T.purple:"transparent", flexShrink:0, marginTop:2 }}/>
              <div style={{ flex:1 }}><div style={{ display:"flex", gap:4, marginBottom:5 }}><BlockBadge type={a.tipo}/>{(a.funcs||[]).map(f=><FuncTag key={f} f={f}/>)}</div><div style={{ fontSize:13, color:T.navy, lineHeight:1.6 }}>{a.text}</div></div>
            </div>
          ))}
          {trSel.length>0 && <div style={{ marginTop:12 }}><Btn variant="primary" onClick={saveSel}>💾 Guardar {trSel.length} bloque(s)</Btn></div>}
        </div>
      )}
    </div>
  );
}

// ─── PERSONAS SCREEN ─────────────────────────────────────────────────────────
function PersonasScreen({ brand, updateBrand, notify }) {
  const personas = brand?.avatars || [];
  const [editing, setEditing] = useState(null); // null | "new" | persona object
  const [form, setForm] = useState({});

  const awarInfo = (id) => AWARENESS_LEVELS.find(a=>a.id===id) || AWARENESS_LEVELS[1];

  function openNew() {
    setForm({ id:uid(), nombre:"", edad:"", rol:"", descripcion:"", problema_principal:"", dolores:"", intentos_fallidos:"", objeciones:"", deseo_final:"", lenguaje:"", nivel_conciencia:"problem" });
    setEditing("new");
  }

  function openEdit(p) {
    setForm({ nivel_conciencia:"problem", ...p });
    setEditing(p.id);
  }

  function savePersona() {
    if (!form.nombre?.trim()) { notify("Dale un nombre a la persona"); return; }
    if (editing==="new") {
      updateBrand(b=>({...b, avatars:[...(b.avatars||[]), form]}));
      notify("Persona creada ✓");
    } else {
      updateBrand(b=>({...b, avatars:(b.avatars||[]).map(a=>a.id===form.id?form:a)}));
      notify("Persona actualizada ✓");
    }
    setEditing(null);
  }

  function deletePersona(id) {
    updateBrand(b=>({...b, avatars:(b.avatars||[]).filter(a=>a.id!==id)}));
    notify("Persona eliminada");
  }

  function F(key, label, ph, multi=false) {
    return <Inp key={key} label={label} placeholder={ph} multiline={multi} rows={multi?3:1} value={form[key]||""} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}/>;
  }

  if (editing) {
    const awar = awarInfo(form.nivel_conciencia);
    return (
      <div style={{ maxWidth:660 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <button onClick={()=>setEditing(null)} style={{ background:"none", border:"none", cursor:"pointer", color:T.slate, fontSize:14, fontFamily:font, padding:0 }}>← Volver</button>
          <span style={{ color:T.gray }}>|</span>
          <span style={{ fontSize:16, fontWeight:700, color:T.navy }}>{editing==="new"?"Nueva persona":form.nombre||"Editar persona"}</span>
        </div>

        <Card style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:14 }}>Quién es</div>
          {F("nombre","Nombre de la persona *","ej. Carlos — dueño de restaurante local")}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Inp label="Edad / rango" placeholder="ej. 35-50" value={form.edad||""} onChange={e=>setForm(p=>({...p,edad:e.target.value}))}/>
            <Inp label="Rol / situación" placeholder="ej. Dueño de restaurante, 8 años en el negocio" value={form.rol||""} onChange={e=>setForm(p=>({...p,rol:e.target.value}))}/>
          </div>
          {F("descripcion","Descripción breve","Contexto, situación de vida, dónde está ahora…",true)}
        </Card>

        <Card style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:14 }}>Psicología</div>
          {F("problema_principal","Problema principal","Lo que más le frustra. Específico, no genérico.",true)}
          {F("dolores","Dolores específicos","Lista sus dolores diarios — los que siente en el estómago",true)}
          {F("intentos_fallidos","Intentos fallidos","Lo que ya intentó y no funcionó",true)}
          {F("deseo_final","Deseo final / Transformación","En quién quiere convertirse, no qué quiere tener",true)}
          {F("objeciones","Principales objeciones","Por qué diría que no. La razón #1 que lo frena.",true)}
        </Card>

        <Card style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:T.slate, marginBottom:14 }}>Lenguaje y estrategia</div>
          {F("lenguaje","Cómo habla de su problema","Las palabras EXACTAS que usa — no jerga de marketing",true)}

          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:600, color:T.navy, marginBottom:10 }}>Nivel de conciencia</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {AWARENESS_LEVELS.map(a=>{
                const sel = form.nivel_conciencia===a.id;
                return (
                  <button key={a.id} onClick={()=>setForm(p=>({...p,nivel_conciencia:a.id}))}
                    style={{ padding:"8px 14px", fontSize:12, borderRadius:20, cursor:"pointer", fontFamily:font, border:`2px solid ${sel?a.color:T.gray}`, background:sel?a.bg:"transparent", color:sel?a.color:T.slate, fontWeight:sel?700:400 }}>
                    {a.label}
                  </button>
                );
              })}
            </div>
            {form.nivel_conciencia && <div style={{ fontSize:11, color:awarInfo(form.nivel_conciencia).color, marginTop:8, padding:"5px 10px", borderRadius:6, background:awarInfo(form.nivel_conciencia).bg }}>{awarInfo(form.nivel_conciencia).desc}</div>}
          </div>

        </Card>

        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="primary" onClick={savePersona} disabled={!form.nombre?.trim()}>{editing==="new"?"Crear persona":"Guardar cambios"} ✓</Btn>
          <Btn variant="ghost" onClick={()=>setEditing(null)}>Cancelar</Btn>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Personas" subtitle="Define a quién le estás hablando. Cada persona = un avatar para el que puedes generar copy específico."
        action={<Btn variant="primary" onClick={openNew}>+ Nueva persona</Btn>}
      />

      {personas.length === 0 && (
        <div style={{ textAlign:"center", padding:60, border:`1px dashed ${T.gray}`, borderRadius:14 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>👤</div>
          <div style={{ fontSize:16, fontWeight:700, color:T.navy, marginBottom:6 }}>Sin personas todavía</div>
          <div style={{ fontSize:13, color:T.slate, marginBottom:20, maxWidth:360, margin:"0 auto 20px" }}>Crea avatares detallados para que la IA genere copy que realmente le hable a cada persona.</div>
          <Btn variant="primary" onClick={openNew}>+ Crear primera persona</Btn>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
        {personas.map(p=>{
          const awar = awarInfo(p.nivel_conciencia);
          return (
            <div key={p.id} style={{ background:T.white, borderRadius:14, border:`1px solid ${T.gray}`, overflow:"hidden", cursor:"pointer", transition:"all 0.15s", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}
              onClick={()=>openEdit(p)}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.purpleLight;e.currentTarget.style.boxShadow=`0 4px 20px rgba(122,90,246,0.1)`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.gray;e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.04)";}}>
              {/* Card header — colored by awareness level */}
              <div style={{ background:`linear-gradient(135deg, ${awar.color}20, ${awar.bg})`, padding:"14px 16px 12px", borderBottom:`1px solid ${awar.color}30` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:3 }}>{p.nombre||"Sin nombre"}</div>
                    <div style={{ fontSize:11, color:T.slate }}>{[p.edad,p.rol].filter(Boolean).join(" · ")}</div>
                  </div>
                  <span style={{ fontSize:10, padding:"3px 9px", borderRadius:20, background:awar.bg, color:awar.color, border:`1px solid ${awar.color}40`, fontWeight:700 }}>{awar.short}</span>
                </div>
              </div>
              <div style={{ padding:"12px 16px 14px" }}>
                {p.problema_principal && <div style={{ fontSize:12, color:T.slate, lineHeight:1.55, marginBottom:10 }}>"{p.problema_principal.slice(0,100)}{p.problema_principal.length>100?"…":""}"</div>}
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  <span style={{ fontSize:10, padding:"3px 8px", borderRadius:20, background:awar.bg, color:awar.color, border:`1px solid ${awar.color}40`, fontWeight:600 }}>{awar.label}</span>
                </div>
                <div style={{ marginTop:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:11, color:T.purple, fontWeight:600 }}>Editar →</span>
                  <button onClick={e=>{e.stopPropagation();deletePersona(p.id);}} style={{ fontSize:11, color:T.slate, background:"none", border:`1px solid ${T.gray}`, borderRadius:6, cursor:"pointer", padding:"3px 8px", fontFamily:font }}>✕</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BRAND PROFILE (Launchpad) ────────────────────────────────────────────────
function BrandProfileScreen({ brand, onSave, notify, apiKey, updateBrand }) {
  const [p, setP] = useState({ produto:"", oferta:"", diferenciador:"", voz:"", ubicacion:"", extra:"", ...(brand?.perfil||{}) });
  const [competitors, setCompetitors] = useState(brand?.competitors||[]);
  const [offers, setOffers] = useState(brand?.offers||[]);
  const [website, setWebsite] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [filling, setFilling] = useState(false);
  const [tab, setTab] = useState("profile"); // profile | offers | competitors

  const profileFields = [
    { k:"produto",           l:"Producto o servicio",           ph:"ej. Bootcamp intensivo de Meta Ads", req:true },
    { k:"oferta",            l:"Oferta completa",                ph:"Qué incluye, duración, formato, rango de precio…", multi:true, req:true },
    { k:"diferenciador",     l:"Diferenciador principal",       ph:"Por qué eres diferente a la competencia…", req:true },
    { k:"mecanismo_nombrado",l:"Mecanismo nombrado (opcional)", ph:"El nombre único de tu método o sistema, ej. 'Sistema Local-First', 'Triángulo ROAS', 'Método 3C'…" },
    { k:"voz",               l:"Voz y tono de marca",           ph:"ej. Directo, experto, sin clichés, sin promesas de ingresos…", req:true },
    { k:"ubicacion",         l:"Ubicación / área de servicio",  ph:"ej. Bolivia — o en blanco si es global" },
    { k:"extra",             l:"Contexto extra para la IA",     ph:"Precios, objeciones, cualquier cosa que la IA deba saber…", multi:true },
  ];

  const completion = Math.round(profileFields.filter(f=>p[f.k]?.trim()).length / profileFields.filter(f=>f.req).length * 100);
  const clampedCompletion = Math.min(completion, 100);

  async function aiFill() {
    if (!website.trim() && !extraInfo.trim()) { notify("Agrega tu web o info de marca primero"); return; }
    setFilling(true); notify("Leyendo tu negocio…");
    try {
      const raw = await callClaude(`You are a brand strategist. Based on the info below, fill out a brand profile JSON.\n\nWebsite: ${website}\nExtra info: ${extraInfo}\n\nReturn ONLY valid JSON matching this shape exactly:\n{"produto":"","oferta":"","diferenciador":"","voz":"","ubicacion":"","extra":""}\n\nBe specific and concise. Infer from context. If you don't know something, leave it blank.`, apiKey, 800);
      const parsed = JSON.parse(raw.replace(/```json|```/g,"").trim());
      setP(prev => ({ ...prev, ...Object.fromEntries(Object.entries(parsed).filter(([,v])=>v)) }));
      notify("¡Perfil rellenado! Revisa y ajusta lo que necesites ✓");
    } catch { notify("No se pudo auto-rellenar — agrega más info e intenta de nuevo"); }
    setFilling(false);
  }

  function saveAll() {
    onSave(p, brand?.avatars||[], competitors, offers);
  }

  const completionColor = clampedCompletion >= 80 ? "#1A9E6E" : clampedCompletion >= 50 ? T.purple : "#C07C10";
  const milestones = [
    { pct:25, label:"Sugerencias de bloques IA", icon:"📦" },
    { pct:50, label:"Generación de conceptos IA", icon:"💡" },
    { pct:80, label:"Investigación de mercado IA", icon:"🔬" },
    { pct:100, label:"Perfil completo desbloqueado", icon:"🏆" },
  ];

  return (
    <div style={{ maxWidth:700 }}>
      <SectionHeader title="Perfil de marca" subtitle="Cuanto más completo, mejores serán todos los outputs de IA."
        action={<Btn variant="primary" onClick={saveAll}>Guardar perfil</Btn>}
      />

      {/* Gamification progress */}
      <Card style={{ marginBottom:24, padding:"18px 22px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ fontSize:14, fontWeight:700, color:T.navy }}>Fuerza del perfil</span>
          <span style={{ fontSize:20, fontWeight:700, color:completionColor }}>{clampedCompletion}%</span>
        </div>
        <div style={{ height:10, borderRadius:5, background:T.gray, overflow:"hidden", marginBottom:14 }}>
          <div style={{ height:"100%", width:`${clampedCompletion}%`, background:`linear-gradient(90deg, ${T.purple}, ${completionColor})`, borderRadius:5, transition:"width 0.5s" }}/>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {milestones.map(m=>{
            const unlocked = clampedCompletion >= m.pct;
            return (
              <div key={m.pct} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 11px", borderRadius:20, background:unlocked?`${completionColor}15`:T.grayLight, border:`1px solid ${unlocked?completionColor:T.gray}` }}>
                <span style={{ fontSize:13 }}>{m.icon}</span>
                <span style={{ fontSize:11, fontWeight:600, color:unlocked?completionColor:T.slate }}>{unlocked?"✓ ":""}{m.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* AI Launchpad */}
      <Card style={{ marginBottom:20, background:`linear-gradient(135deg, ${T.purpleBg}, #fff)`, border:`1.5px solid ${T.purpleLight}` }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.purple, marginBottom:4 }}>⚡ AI Launchpad — rellena tu perfil en segundos</div>
        <div style={{ fontSize:12, color:T.slate, marginBottom:14 }}>Pega tu URL o info de tu marca. Claude rellenará todo lo que pueda — tú solo revisas y ajustas.</div>
        <Inp placeholder="https://tuweb.com" value={website} onChange={e=>setWebsite(e.target.value)} label="URL de tu web"/>
        <Inp label="Info adicional (pega lo que tengas — copy web, bio, descripción del negocio…)" multiline rows={3} placeholder="Pega el copy de tu página de ventas, una bio, o simplemente describe tu negocio…" value={extraInfo} onChange={e=>setExtraInfo(e.target.value)}/>
        <Btn variant="primary" onClick={aiFill} disabled={filling||(!website.trim()&&!extraInfo.trim())}>
          {filling ? "⏳ Rellenando…" : "✨ Rellenar perfil con IA"}
        </Btn>
      </Card>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:20, borderBottom:`2px solid ${T.gray}`, paddingBottom:0 }}>
        {[{id:"profile",label:"Info del negocio"},{id:"offers",label:`Ofertas (${offers.length})`},{id:"competitors",label:`Competidores (${competitors.length})`}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"9px 16px", fontSize:13, fontWeight:tab===t.id?700:400, color:tab===t.id?T.purple:T.slate, background:"transparent", border:"none", borderBottom:`2px solid ${tab===t.id?T.purple:"transparent"}`, cursor:"pointer", fontFamily:font, marginBottom:-2 }}>{t.label}</button>
        ))}
      </div>

      {/* Profile tab */}
      {tab==="profile" && (
        <Card>
          {profileFields.map(x=>(
            <Inp key={x.k} label={x.l+(x.req?" *":"")} placeholder={x.ph} multiline={x.multi} value={p[x.k]||""} onChange={e=>setP(prev=>({...prev,[x.k]:e.target.value}))}/>
          ))}
          <Btn variant="primary" onClick={saveAll}>Guardar perfil</Btn>
        </Card>
      )}

      {/* Offers tab */}
      {tab==="offers" && (
        <div>
          <div style={{ fontSize:12, color:T.slate, marginBottom:16 }}>Define tus ofertas. Puedes seleccionarlas al generar bloques Offer para que la IA tenga contexto específico.</div>
          {offers.map((o,i)=>(
            <Card key={o.id} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>Oferta {i+1}</div>
                <Btn variant="danger" small onClick={()=>setOffers(offers.filter(x=>x.id!==o.id))}>Eliminar</Btn>
              </div>
              <Inp label="Nombre de la oferta *" placeholder="ej. Bootcamp Meta Ads 6 semanas" value={o.nombre||""} onChange={e=>setOffers(offers.map((x,j)=>j===i?{...x,nombre:e.target.value}:x))}/>
              <Inp label="Descripción / qué incluye" multiline placeholder="Qué reciben, duración, cómo funciona…" value={o.descripcion||""} onChange={e=>setOffers(offers.map((x,j)=>j===i?{...x,descripcion:e.target.value}:x))}/>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Inp label="Precio" placeholder="ej. $297 o Bs. 1.800" value={o.precio||""} onChange={e=>setOffers(offers.map((x,j)=>j===i?{...x,precio:e.target.value}:x))}/>
                <Inp label="Urgencia / escasez" placeholder="ej. Solo 20 cupos disponibles" value={o.urgencia||""} onChange={e=>setOffers(offers.map((x,j)=>j===i?{...x,urgencia:e.target.value}:x))}/>
              </div>
              <Inp label="Garantía" placeholder="ej. 30 días de devolución sin preguntas" value={o.garantia||""} onChange={e=>setOffers(offers.map((x,j)=>j===i?{...x,garantia:e.target.value}:x))}/>
            </Card>
          ))}
          <Btn variant="outline" onClick={()=>setOffers([...offers,{id:uid(),nombre:"",descripcion:"",precio:"",urgencia:"",garantia:""}])}>+ Agregar oferta</Btn>
          <div style={{ marginTop:16 }}><Btn variant="primary" onClick={saveAll}>Guardar ofertas</Btn></div>
        </div>
      )}

      {/* Competitors tab */}
      {tab==="competitors" && (
        <div>
          <div style={{ fontSize:12, color:T.slate, marginBottom:16 }}>Agrega competidores o soluciones alternativas. Se usan en Investigación de Mercado y ángulos de comparación.</div>
          {competitors.map((c,i)=>(
            <Card key={c.id} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>Competidor {i+1}</div>
                <Btn variant="danger" small onClick={()=>setCompetitors(competitors.filter(x=>x.id!==c.id))}>Eliminar</Btn>
              </div>
              <Inp label="Nombre" placeholder="ej. Agencia de Marketing Genérica" value={c.name||""} onChange={e=>setCompetitors(competitors.map((x,j)=>j===i?{...x,name:e.target.value}:x))}/>
              <Inp label="Web (opcional)" placeholder="https://competidor.com" value={c.url||""} onChange={e=>setCompetitors(competitors.map((x,j)=>j===i?{...x,url:e.target.value}:x))}/>
              <Inp label="Por qué los clientes los eligen (y por qué tú eres mejor)" multiline placeholder="Su atractivo principal, donde se quedan cortos…" value={c.notes||""} onChange={e=>setCompetitors(competitors.map((x,j)=>j===i?{...x,notes:e.target.value}:x))}/>
            </Card>
          ))}
          <Btn variant="outline" onClick={()=>setCompetitors([...competitors,{id:uid(),name:"",url:"",notes:""}])}>+ Agregar competidor</Btn>
          <div style={{ marginTop:16 }}><Btn variant="primary" onClick={saveAll}>Guardar competidores</Btn></div>
        </div>
      )}
    </div>
  );
}

// ─── SCRIPT COMPOSER ──────────────────────────────────────────────────────────
// ─── GENERADOR DE COPIES ─────────────────────────────────────────────────────
// Seleccionas bloques del banco → tipo de output → Claude los une → output listo
function GeneradorCopiesScreen({ assets, conceptos, perfil, brand, busy, setBusy, apiKey, notify, updateBrand }) {
  const [outputType, setOutputType] = useState("facebook");
  const [conceptoSel, setConceptoSel] = useState(null);
  const [blocksSeleccionados, setBlocksSel] = useState([]);
  const [fFunc, setFFunc] = useState("all");
  const [output, setOutput] = useState(null);
  const [conEmojis, setConEmojis] = useState(false);
  const [outputEmoji, setOutputEmoji] = useState("");
  const [guardadoEnBanco, setGuardadoEnBanco] = useState(false);
  const [editandoOutput, setEditandoOutput] = useState(false);
  const [outputEditado, setOutputEditado] = useState("");

  const conceptBlocks = assets.filter(a =>
    conceptoSel ? (a.tags||[]).includes("concept:"+conceptoSel.id) : true
  );
  const filteredBlocks = fFunc==="all" ? conceptBlocks : conceptBlocks.filter(a=>(a.funcs||[]).includes(fFunc));

  async function generar() {
    if (!blocksSeleccionados.length) { notify("Select at least one block"); return; }
    setBusy(true); setOutput(null); setOutputEmoji(""); setGuardadoEnBanco(false);
    const ctx = perfilCtx(perfil, brand?.avatars);
    const conceptCtx = conceptoSel ? `\nCONCEPT: "${conceptoSel.concepto}"${conceptoSel.angulo?`\nAngle: ${conceptoSel.angulo}`:""}` : "";
    const bloquesList = blocksSeleccionados.map((b,i)=>{
      const tipoInfo = TIPOS_BLOQUE.find(t=>t.id===b.tipo);
      return `${i+1}. [${tipoInfo?.label||b.tipo}] ${b.text}`;
    }).join("\n");
    const tag = `[Concept: ${conceptoSel?.concepto?.slice(0,30)||"No concept"} | Format: ${outputType==="facebook"?"Facebook Ad Copy":"Video Script"} | ${new Date().toLocaleDateString("en-US")}]`;
    try {
      let prompt;
      if (outputType==="facebook") {
        prompt = `${COPY_BRAIN}\n\nIMPORTANTE: Genera TODO en español. Natural, directo.\n${ctx}${conceptCtx}\n\nCombina estos bloques en un Facebook Ad completo y pulido. Únelos con gramática fluida — no los listes. Listo para pegar en Ads Manager.\n\nBLOQUES:\n${bloquesList}\n\nFORMATO EXACTO:\nTEXTO PRINCIPAL:\n[copy completo — primera línea es el hook, ~125 chars visibles antes de "ver más"]\n\nTÍTULO:\n[máx 40 caracteres]\n\nETIQUETA:\n${tag}`;
      } else {
        prompt = `${COPY_BRAIN}\n\nIMPORTANTE: Genera TODO en español. Natural, directo.\n${ctx}${conceptCtx}\n\nCombina estos bloques en un Script de Video completo (20-45 seg), listo para producción.\n\nBLOQUES:\n${bloquesList}\n\nFORMATO EXACTO:\nHOOK (0-3s):\n[1 línea hablada — aplica REGLAS DE VIDEO HOOK]\n\nDIRECCIÓN VISUAL:\n[qué se ve en pantalla, específico]\n\nSUGERENCIA DE SONIDO:\n[audio/música que amplifica el hook]\n\nSCRIPT:\n[script completo hablado, natural]\n\nETIQUETA:\n${tag}`;
      }
      const raw = await callClaude(prompt, apiKey, 2000);
      setOutput({ type:outputType, raw, tag, blocks:blocksSeleccionados, conceptoId:conceptoSel?.id });
    } catch(e) { console.error("gen copy error:", e); notify("Error: " + (e?.message || "intenta de nuevo")); }
    setBusy(false);
  }

  async function agregarEmojis() {
    if (!output) return; setBusy(true);
    try {
      const raw = await callClaude(`Add emojis strategically to this Facebook Ad copy. Max 6 emojis. Only where they add real visual value — not decorative. Return only the text with emojis.\n\n${output.raw}`, apiKey, 1200);
      setOutputEmoji(raw);
    } catch(e) { console.error("emoji error:", e); notify("Error al agregar emojis"); }
    setBusy(false);
  }

  function guardarCopy(resultado, rating) {
    const textFinal = editandoOutput ? outputEditado : (outputEmoji || output.raw);
    updateBrand(b=>({
      ...b,
      copies:[...(b.copies||[]),{
        id:uid(), type:output.type, text:textFinal, tag:output.tag,
        rating, conceptoId:output.conceptoId,
        conceptoLabel:conceptos.find(c=>c.id===output.conceptoId)?.concepto?.slice(0,40)||"No concept",
        fecha:new Date().toISOString().split("T")[0],
        blockIds:(output.blocks||[]).map(b=>b.id),
      }]
    }));
    setGuardadoEnBanco(true);
    notify(rating==="winner"?"🏆 Saved as winner":"📝 Saved to bank");
  }

  return (
    <div style={{ maxWidth:860 }}>
      <SectionHeader title="Armar copy" subtitle="Selecciona bloques → elige formato → Claude ensambla → guarda en tu banco."/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
        {[{id:"facebook",icon:"✍️",label:"Facebook Ad Copy",desc:"Texto principal + headline listo para Ads Manager"},{id:"video",icon:"🎬",label:"Script de Video",desc:"Hook + dirección visual + script listo para grabar"}].map(t=>(
          <div key={t.id} onClick={()=>setOutputType(t.id)} style={{ padding:"16px", borderRadius:12, border:`2px solid ${outputType===t.id?T.purple:T.gray}`, background:outputType===t.id?T.purpleBg:T.white, cursor:"pointer" }}>
            <span style={{ fontSize:22 }}>{t.icon}</span>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginTop:8, marginBottom:3 }}>{t.label}</div>
            <div style={{ fontSize:11, color:T.slate }}>{t.desc}</div>
          </div>
        ))}
      </div>

      {/* Concepto filter */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.slate, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Filtrar por concepto (opcional)</div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          <button onClick={()=>setConceptoSel(null)} style={{ padding:"6px 12px", fontSize:12, borderRadius:20, cursor:"pointer", fontFamily:font, border:`1.5px solid ${!conceptoSel?T.navy:T.gray}`, background:!conceptoSel?T.navy:"transparent", color:!conceptoSel?"#fff":T.slate }}>Todos los bloques</button>
          {conceptos.map(c=>{
            const sel=conceptoSel?.id===c.id;
            return <button key={c.id} onClick={()=>setConceptoSel(sel?null:c)} style={{ padding:"6px 12px", fontSize:12, borderRadius:20, cursor:"pointer", fontFamily:font, border:`1.5px solid ${sel?T.purple:T.gray}`, background:sel?T.purpleBg:"transparent", color:sel?T.purple:T.slate }}>{c.concepto.slice(0,35)}</button>;
          })}
        </div>
      </div>

      {/* Block picker */}
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>
        {["all",...FUNCIONES].map(f=>(
          <button key={f} onClick={()=>setFFunc(f)} style={{ padding:"4px 10px", fontSize:11, borderRadius:20, cursor:"pointer", fontFamily:font, border:`1px solid ${fFunc===f?(f==="all"?T.navy:FC[f]):T.gray}`, background:fFunc===f?(f==="all"?T.navy:`${FC[f]}15`):"transparent", color:fFunc===f?(f==="all"?"#fff":(FC[f]||T.navy)):T.slate }}>{f==="all"?"Todos":FL[f]}</button>
        ))}
        {blocksSeleccionados.length>0 && <span style={{ fontSize:12, fontWeight:700, color:T.purple, marginLeft:8, alignSelf:"center" }}>{blocksSeleccionados.length} seleccionados</span>}
      </div>

      {filteredBlocks.length===0 ? (
        <div style={{ padding:"24px", textAlign:"center", border:`1px dashed ${T.gray}`, borderRadius:10, color:T.slate, marginBottom:16 }}>
          {conceptoSel?"Sin bloques para este concepto — crea algunos en el Compositor.":"Sin bloques todavía — crea algunos en el Compositor o el Banco de bloques."}
        </div>
      ) : (
        <div style={{ maxHeight:360, overflowY:"auto", marginBottom:16, border:`1px solid ${T.gray}`, borderRadius:10, padding:8 }}>
          {filteredBlocks.map(a=>{
            const sel=blocksSeleccionados.some(b=>b.id===a.id);
            const tInfo = TIPOS_BLOQUE.find(t=>t.id===a.tipo)||{color:T.slate,label:a.tipo};
            return (
              <div key={a.id} onClick={()=>setBlocksSel(sel?blocksSeleccionados.filter(b=>b.id!==a.id):[...blocksSeleccionados,a])}
                style={{ padding:"9px 12px", marginBottom:5, borderRadius:9, border:`1.5px solid ${sel?T.purple:tInfo.border||T.gray}`, borderLeft:`4px solid ${tInfo.color}`, background:sel?T.purpleBg:T.white, cursor:"pointer", display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ width:14,height:14,borderRadius:"50%",border:`2px solid ${sel?T.purple:"#ddd"}`,background:sel?T.purple:"transparent",flexShrink:0,marginTop:2 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",gap:4,marginBottom:4 }}><BlockBadge type={a.tipo}/>{(a.funcs||[]).map(f=><FuncTag key={f} f={f}/>)}</div>
                  <div style={{ fontSize:12, color:T.navy, lineHeight:1.55 }}>{a.text.slice(0,120)}{a.text.length>120?"…":""}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Btn variant="primary" onClick={generar} disabled={busy||!blocksSeleccionados.length} style={{ marginBottom:20 }}>
        {busy?"Generando…":"✨ Generar "+(outputType==="facebook"?"Facebook Ad Copy":"Script de Video")}
      </Btn>

      {/* Output */}
      {output && (
        <div>
          <div style={{ padding:"8px 14px", background:T.navy, borderRadius:8, fontSize:11, color:"rgba(255,255,255,0.5)", fontFamily:"monospace", marginBottom:12 }}>{output.tag}</div>
          <div style={{ background:"#1a1f36", borderRadius:14, padding:"22px 24px", marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.4)", fontWeight:700 }}>{output.type==="facebook"?"Facebook Ad Copy":"Video Script"}</div>
              <div style={{ display:"flex", gap:6 }}>
                {outputEmoji && <CopyBtn text={outputEmoji} small/>}
                <CopyBtn text={editandoOutput?outputEditado:(outputEmoji||output.raw)} small/>
                <button onClick={()=>{ setEditandoOutput(!editandoOutput); setOutputEditado(outputEmoji||output.raw); }} style={{ padding:"5px 10px",fontSize:11,borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:"transparent",color:"#ccc",cursor:"pointer",fontFamily:font }}>
                  {editandoOutput?"Listo":"Editar"}
                </button>
              </div>
            </div>
            {editandoOutput
              ? <textarea value={outputEditado} onChange={e=>setOutputEditado(e.target.value)} style={{ width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"12px",fontSize:13,color:"#f0f0f0",lineHeight:1.9,fontFamily:font,resize:"vertical",minHeight:200 }}/>
              : <div style={{ fontSize:13, lineHeight:1.95, whiteSpace:"pre-wrap", color:outputEmoji?"#fff":"#e0e0e0" }}>{outputEmoji||output.raw}</div>
            }
          </div>

          {output.type==="facebook" && !outputEmoji && (
            <Btn variant="ghost" onClick={agregarEmojis} disabled={busy} style={{ marginBottom:12 }}>{busy?"Agregando emojis…":"✨ Agregar emojis"}</Btn>
          )}

          {/* Save to copy bank */}
          {!guardadoEnBanco ? (
            <div style={{ padding:"16px 20px", background:T.grayLight, borderRadius:12, border:`1px solid ${T.gray}` }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:12 }}>¿Cómo calificarías este copy?</div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>guardarCopy(output,"winner")} style={{ padding:"9px 18px", fontSize:12, borderRadius:9, cursor:"pointer", fontFamily:font, border:"2px solid #1A9E6E", background:"#EDFAF4", color:"#1A9E6E", fontWeight:700 }}>🏆 Ganador — guardar</button>
                <button onClick={()=>guardarCopy(output,"testing")} style={{ padding:"9px 18px", fontSize:12, borderRadius:9, cursor:"pointer", fontFamily:font, border:`1.5px solid ${T.gray}`, background:T.white, color:T.slate }}>📋 Guardar para testing</button>
                <button onClick={()=>guardarCopy(output,"lost")} style={{ padding:"9px 18px", fontSize:12, borderRadius:9, cursor:"pointer", fontFamily:font, border:"1.5px solid #F5BCBC", background:"#FFF2F2", color:"#D94F4F" }}>✗ No funcionó</button>
              </div>
            </div>
          ) : (
            <div style={{ padding:"12px 16px", background:"#EDFAF4", borderRadius:10, border:"1px solid #9EE0C6", fontSize:12, color:"#1A9E6E", fontWeight:600 }}>✓ Guardado en tu banco de copies</div>
          )}

          <div style={{ display:"flex", gap:8, marginTop:16, flexWrap:"wrap" }}>
            <Btn variant="primary" onClick={()=>{ setOutput(null); setBlocksSel([]); setOutputEmoji(""); setGuardadoEnBanco(false); setEditandoOutput(false); }}>Crear otro</Btn>
            <Btn variant="ghost" onClick={generar} disabled={busy}>{busy?"Regenerando…":"↻ Regenerar"}</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BANCO DE COPIES ──────────────────────────────────────────────────────────
function BancoCopiesScreen({ copies, conceptos, onDelete, onUpdateRating }) {
  const [filtroRating, setFiltroRating] = useState("all");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [busqueda, setBusqueda] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const RATINGS = [
    { id:"all", label:"Todos", color:T.slate },
    { id:"winner", label:"🏆 Ganadores", color:"#1A9E6E" },
    { id:"testing", label:"📋 Testing", color:T.purple },
    { id:"lost", label:"✗ No funcionó", color:"#D94F4F" },
  ];

  const filtered = (copies||[]).filter(c=>{
    if (filtroRating!=="all" && c.rating!==filtroRating) return false;
    if (filtroTipo!=="all" && c.type!==filtroTipo) return false;
    if (busqueda && !c.text.toLowerCase().includes(busqueda.toLowerCase()) && !c.conceptoLabel?.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  }).sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));

  const stats = { winner:(copies||[]).filter(c=>c.rating==="winner").length, testing:(copies||[]).filter(c=>c.rating==="testing").length, lost:(copies||[]).filter(c=>c.rating==="lost").length };

  return (
    <div>
      <SectionHeader title="Banco de copies" subtitle="Historial de todos tus copies generados. Aprende de los ganadores."/>

      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <StatPill label="ganadores" value={stats.winner} color="#1A9E6E"/>
        <StatPill label="testing" value={stats.testing} color={T.purple}/>
        <StatPill label="no funcionó" value={stats.lost} color="#D94F4F"/>
        <StatPill label="total" value={(copies||[]).length} color={T.slate}/>
      </div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
        {RATINGS.map(r=>(
          <button key={r.id} onClick={()=>setFiltroRating(r.id)} style={{ padding:"6px 14px",fontSize:12,borderRadius:20,cursor:"pointer",fontFamily:font,border:`1.5px solid ${filtroRating===r.id?r.color:T.gray}`,background:filtroRating===r.id?`${r.color}15`:"transparent",color:filtroRating===r.id?r.color:T.slate,fontWeight:filtroRating===r.id?700:400 }}>{r.label}</button>
        ))}
        {["all","facebook","video"].map(t=>(
          <button key={t} onClick={()=>setFiltroTipo(t)} style={{ padding:"6px 14px",fontSize:12,borderRadius:20,cursor:"pointer",fontFamily:font,border:`1.5px solid ${filtroTipo===t?T.navy:T.gray}`,background:filtroTipo===t?T.navy:"transparent",color:filtroTipo===t?"#fff":T.slate }}>{t==="all"?"Todos":t==="facebook"?"✍️ FB Ads":"🎬 Scripts"}</button>
        ))}
      </div>
      <input placeholder="Buscar en copies o conceptos…" value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{ width:"100%",boxSizing:"border-box",padding:"10px 14px",fontSize:13,border:`1.5px solid ${T.gray}`,borderRadius:9,background:T.white,color:T.navy,fontFamily:font,outline:"none",marginBottom:16 }}/>

      {filtered.length===0 && <div style={{ textAlign:"center",padding:60,color:T.slate,border:`1px dashed ${T.gray}`,borderRadius:12 }}><div style={{ fontSize:28,marginBottom:10 }}>📭</div><div style={{ fontSize:13 }}>No copies match</div></div>}

      {filtered.map(copy=>{
        const isOpen=expandedId===copy.id;
        const ratingInfo={winner:{color:"#1A9E6E",bg:"#EDFAF4",border:"#9EE0C6",label:"🏆 Ganador"},testing:{color:T.purple,bg:T.purpleBg,border:T.purpleLight,label:"📋 Testing"},lost:{color:"#D94F4F",bg:"#FFF2F2",border:"#F5BCBC",label:"✗ No funcionó"}}[copy.rating]||{color:T.slate,bg:T.grayLight,border:T.gray,label:"Sin calificar"};
        return (
          <Card key={copy.id} style={{ marginBottom:10, padding:0, overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", display:"flex", gap:10, alignItems:"flex-start", cursor:"pointer" }} onClick={()=>setExpandedId(isOpen?null:copy.id)}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:5 }}>
                  <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:ratingInfo.bg, color:ratingInfo.color, border:`1px solid ${ratingInfo.border}`, fontWeight:700 }}>{ratingInfo.label}</span>
                  <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:T.grayLight, color:T.slate, border:`1px solid ${T.gray}` }}>{copy.type==="facebook"?"✍️ FB Ad":"🎬 Script"}</span>
                  {copy.conceptoLabel && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:T.purpleBg, color:T.purple, border:`1px solid ${T.purpleLight}` }}>💡 {copy.conceptoLabel}</span>}
                  <span style={{ fontSize:10, color:T.slate, alignSelf:"center" }}>{copy.fecha}</span>
                </div>
                <div style={{ fontSize:13, color:T.navy, lineHeight:1.5 }}>{copy.text.split("\n")[0].slice(0,100)}…</div>
              </div>
              <span style={{ color:T.slate, fontSize:16 }}>{isOpen?"▾":"▸"}</span>
            </div>
            {isOpen && (
              <div style={{ borderTop:`1px solid ${T.gray}`, padding:"16px 18px", background:T.grayLight }}>
                <div style={{ background:T.white, borderRadius:10, padding:"14px 16px", fontSize:13, lineHeight:1.9, whiteSpace:"pre-wrap", color:T.navy, marginBottom:14 }}>{copy.text}</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  <CopyBtn text={copy.text}/>
                  <button onClick={()=>onUpdateRating(copy.id,"winner")} style={{ padding:"5px 12px",fontSize:11,borderRadius:16,cursor:"pointer",fontFamily:font,border:"1px solid #1A9E6E",background:"#EDFAF4",color:"#1A9E6E" }}>🏆 Ganador</button>
                  <button onClick={()=>onUpdateRating(copy.id,"testing")} style={{ padding:"5px 12px",fontSize:11,borderRadius:16,cursor:"pointer",fontFamily:font,border:`1px solid ${T.gray}`,background:T.white,color:T.slate }}>📋 Testing</button>
                  <button onClick={()=>onUpdateRating(copy.id,"lost")} style={{ padding:"5px 12px",fontSize:11,borderRadius:16,cursor:"pointer",fontFamily:font,border:"1px solid #F5BCBC",background:"#FFF2F2",color:"#D94F4F" }}>✗ No funcionó</button>
                  <button onClick={()=>onDelete(copy.id)} style={{ padding:"5px 12px",fontSize:11,borderRadius:16,cursor:"pointer",fontFamily:font,border:"1px solid #F5BCBC",background:"transparent",color:"#D94F4F" }}>Eliminar</button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [tab,  setTab]  = useState("login");
  const [email,setEmail]= useState("");
  const [pass, setPass] = useState("");
  const [err,  setErr]  = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        setErr("✓ Check your email to confirm your account"); setBusy(false); return;
      }
      onAuth();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div style={{ minHeight:"100vh", background:T.grayLight, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:font }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet"/>
      <div style={{ background:T.white, borderRadius:16, border:`1px solid ${T.gray}`, padding:40, width:360 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:28 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:T.purple, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>✦</div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:T.navy }}>AdBlocks</div>
            <div style={{ fontSize:10, color:T.slate, letterSpacing:"0.08em", textTransform:"uppercase" }}>ROAS Academy</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:0, marginBottom:24, border:`1px solid ${T.gray}`, borderRadius:9, overflow:"hidden" }}>
          {["login","signup"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"9px 0", fontSize:12, fontWeight:tab===t?700:400, border:"none", background:tab===t?T.navy:"transparent", color:tab===t?"#fff":T.slate, cursor:"pointer", fontFamily:font }}>
              {t==="login"?"Iniciar sesión":"Registrarse"}
            </button>
          ))}
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:600, color:T.navy, marginBottom:5 }}>Email</div>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="tu@email.com" style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px", fontSize:13, border:`1.5px solid ${T.gray}`, borderRadius:8, fontFamily:font, outline:"none", color:T.navy }}/>
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:600, color:T.navy, marginBottom:5 }}>Contraseña</div>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} required minLength={6} placeholder="••••••••" style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px", fontSize:13, border:`1.5px solid ${T.gray}`, borderRadius:8, fontFamily:font, outline:"none", color:T.navy }}/>
          </div>
          {err && <div style={{ fontSize:12, color: err.startsWith("✓")?"#1A9E6E":"#D94F4F", marginBottom:14, padding:"8px 12px", background:err.startsWith("✓")?"#EDFAF4":"#FFF2F2", borderRadius:8 }}>{err}</div>}
          <Btn variant="primary" style={{ width:"100%" }} disabled={busy}>
            {busy?"Cargando…":tab==="login"?"Iniciar sesión":"Crear cuenta"}
          </Btn>
        </form>
      </div>
    </div>
  );
}

// ─── SETUP SCREEN — multi-provider AI picker ──────────────────────────────────
const AI_PROVIDERS = [
  {
    id: "anthropic",
    name: "Claude",
    logo: "✦",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FCD34D",
    placeholder: "sk-ant-api03-...",
    hint: "console.anthropic.com",
    hintUrl: "https://console.anthropic.com",
    validate: k => k.length > 10 || "Ingresa una API key válida",
    model: "claude-sonnet-4-5",
  },
  {
    id: "openai",
    name: "ChatGPT / OpenAI",
    logo: "⬡",
    color: "#10A37F",
    bg: "#F0FDF9",
    border: "#6EE7B7",
    placeholder: "sk-proj-...",
    hint: "platform.openai.com/api-keys",
    hintUrl: "https://platform.openai.com/api-keys",
    validate: k => k.length > 10 || "Ingresa una API key válida",
    model: "gpt-4o",
  },
  {
    id: "gemini",
    name: "Gemini",
    logo: "✦",
    color: "#4285F4",
    bg: "#EFF6FF",
    border: "#93C5FD",
    placeholder: "AIzaSy...",
    hint: "aistudio.google.com/app/apikey — tier gratuito disponible",
    hintUrl: "https://aistudio.google.com/app/apikey",
    validate: k => k.length > 10 || "Ingresa una API key válida",
    model: "gemini-1.5-pro",
  },
];

function SetupScreen({ onSave }) {
  const [provider, setProvider] = useState("anthropic");
  const [apiKey,   setApiKey]   = useState("");
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState("");
  const p = AI_PROVIDERS.find(x => x.id === provider);

  async function save() {
    setErr("");
    const valid = p.validate(apiKey);
    if (valid !== true) { setErr(valid); return; }
    localStorage.setItem("cb_api_key", apiKey);
    localStorage.setItem("cb_provider", provider);
    // Save to Supabase in background — don't block on it
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from("user_settings").upsert({ user_id: user.id, claude_mode: provider }).catch(() => {});
    }).catch(() => {});
    onSave({ provider, apiKey });
  }

  return (
    <div style={{ minHeight:"100vh", background:T.grayLight, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:font }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet"/>
      <div style={{ background:T.white, borderRadius:16, border:`1px solid ${T.gray}`, padding:40, width:460 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:T.purple, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>✦</div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:T.navy }}>Conecta tu IA</div>
            <div style={{ fontSize:11, color:T.slate }}>Elige el proveedor que ya tienes</div>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
          {AI_PROVIDERS.map(opt => (
            <div key={opt.id} onClick={() => { setProvider(opt.id); setApiKey(""); setErr(""); }}
              style={{ padding:"14px 16px", border:`2px solid ${provider===opt.id ? opt.border : T.gray}`, borderRadius:12, cursor:"pointer", background:provider===opt.id ? opt.bg : T.white, transition:"all 0.15s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:provider===opt.id ? opt.color : T.gray, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#fff", flexShrink:0, fontWeight:700 }}>{opt.logo}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.navy }}>{opt.name}</div>
                  {opt.id === "gemini" && <div style={{ fontSize:11, color:"#4285F4", fontWeight:600 }}>Tier gratuito disponible</div>}
                  {opt.id === "anthropic" && <div style={{ fontSize:11, color:T.slate }}>Mejor calidad de copy</div>}
                  {opt.id === "openai" && <div style={{ fontSize:11, color:T.slate }}>GPT-4o</div>}
                </div>
                <div style={{ marginLeft:"auto", width:16, height:16, borderRadius:"50%", border:`2px solid ${provider===opt.id ? opt.color : T.gray}`, background:provider===opt.id ? opt.color : "transparent", flexShrink:0 }}/>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:600, color:T.navy, marginBottom:5 }}>Tu API Key de {p.name}</div>
          <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={p.placeholder}
            style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px", fontSize:13, border:`1.5px solid ${T.gray}`, borderRadius:8, fontFamily:font, outline:"none", color:T.navy }}/>
          <div style={{ fontSize:11, color:T.slate, marginTop:5 }}>
            Consíguela en <a href={p.hintUrl} target="_blank" rel="noreferrer" style={{ color:T.purple }}>{p.hint}</a>
          </div>
        </div>

        {err && <div style={{ fontSize:12, color:"#D94F4F", marginBottom:14, padding:"8px 12px", background:"#FFF2F2", borderRadius:8 }}>{err}</div>}
        <Btn variant="primary" style={{ width:"100%" }} onClick={save} disabled={busy || !apiKey}>
          {busy ? "Guardando…" : "Continuar →"}
        </Btn>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [data,        setData]       = useState(null);
  const [brandId,     setBrandId]    = useState(null);
  const [view,        setView]       = useState("dashboard");
  const [modal,       setModal]      = useState(null);
  const [md,          setMd]         = useState({});
  const [toast,       setToast]      = useState("");
  const [busy,        setBusy]       = useState(false);
  const [claudeConf,  setClaudeConf] = useState(null);
  const [initialConcept, setInitialConcept] = useState(null);

  const apiKey = claudeConf?.apiKey || null;

  useEffect(() => {
    if (!claudeConf) return;
    window.__cbProvider = claudeConf.provider || "anthropic";
    window.__cbApiKey   = claudeConf.apiKey || "";
  }, [claudeConf]);

  useEffect(() => {
    // Load provider from localStorage
    const provider = localStorage.getItem("cb_provider");
    const key      = localStorage.getItem("cb_api_key");
    if (provider && key) setClaudeConf({ provider, apiKey: key });
    // Load brand data from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && saved.brands?.length) { setData(saved); setBrandId(saved.brands[0].id); }
      else { setData({ brands: [DEMO_BRAND] }); setBrandId(DEMO_BRAND.id); }
    } catch { setData({ brands: [DEMO_BRAND] }); setBrandId(DEMO_BRAND.id); }
  }, []);

  function handleClaudeConf(conf) {
    localStorage.setItem("cb_provider", conf.provider);
    localStorage.setItem("cb_api_key", conf.apiKey);
    setClaudeConf(conf);
  }

  const save = useCallback((next) => { setData(next); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {} }, []);
  const notify = (m) => { setToast(m); setTimeout(()=>setToast(""),2500); };
  const closeModal = () => { setModal(null); setMd({}); };

  const brand     = data?.brands?.find(b=>b.id===brandId)||null;
  const assets    = brand?.assets||[];
  const conceptos = brand?.conceptos||[];
  const perfil    = brand?.perfil||{};

  const updateBrand = useCallback((fn) => {
    setData(prev => {
      const next = {...prev, brands:prev.brands.map(b=>b.id===brandId?fn(b):b)};
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [brandId]);

  // Asset ops
  function saveAsset(form) {
    const a = { id:md.id||uid(), tipo:form.tipo, funcs:form.funcs, tags:[...form.funcs,...(form.tags||[])].filter((v,i,a)=>a.indexOf(v)===i), text:form.text.trim() };
    if (md.id) { updateBrand(b=>({...b, assets:b.assets.map(x=>x.id===md.id?a:x)})); notify("Saved"); }
    else { updateBrand(b=>({...b, assets:[...(b.assets||[]),a]})); notify("Bloque añadido"); }
    closeModal();
  }
  function deleteAsset(id) { updateBrand(b=>({...b, assets:b.assets.filter(a=>a.id!==id)})); notify("Eliminado"); }

  // Concept ops
  function saveConcepto(form, customAngle, customStyle) {
    if (customAngle?.label) { updateBrand(b=>({...b, customAngles:[...(b.customAngles||[]),{id:uid(),...customAngle}]})); notify("Ángulo guardado"); return; }
    if (customStyle?.label) { updateBrand(b=>({...b, customStyles:[...(b.customStyles||[]),{id:uid(),...customStyle}]})); notify("Estilo guardado"); return; }
    const c = { id:md.id||uid(), concepto:form.concepto, angulo:form.angulo,
      personaId:form.personaId||null, personaDesc:form.personaDesc||"",
      estilo:form.estilo||"", hook:"" };
    if (md.id) { updateBrand(b=>({...b, conceptos:(b.conceptos||[]).map(x=>x.id===md.id?c:x)})); notify("Concepto actualizado"); }
    else { updateBrand(b=>({...b, conceptos:[...(b.conceptos||[]),c]})); notify("Concepto creado ✓"); }
    closeModal();
  }
  function deleteConcepto(id) { updateBrand(b=>({...b, conceptos:(b.conceptos||[]).filter(c=>c.id!==id)})); notify("Eliminado"); }

  // Concept → Ad Composer flow
  function goCompose(concept) {
    setInitialConcept(concept);
    setView("meta-ad");
  }

  // AI ops
  async function aiSuggestAssets() {
    if (!brand||busy) return; setBusy(true); notify("IA procesando…");
    try {
      const ctx = perfilCtx(perfil, brand?.avatars);
      const existing = assets.slice(0,10).map(a=>`[${tp(a.tipo).label}][${(a.funcs||[]).join(",")}] ${a.text}`).join("\n");
      const raw = await callClaude(`${COPY_BRAIN}\n\n${ctx}\n\nExisting blocks for "${brand.name}":\n${existing}\n\nSuggest 8 NEW blocks that complement what's missing. Apply all rules above. Each block must be specific (numbers/facts, not adjectives). JSON only:\n[{"tipo":"pain","funcs":["hook"],"tags":["meta"],"text":"..."}]`, apiKey);
      const arr = JSON.parse(raw.replace(/```json|```/g,"").trim());
      updateBrand(b=>({...b, assets:[...b.assets,...arr.map(x=>({id:uid(),tipo:x.tipo,funcs:x.funcs||[],tags:[...(x.funcs||[]),...(x.tags||[])].filter((v,i,a)=>a.indexOf(v)===i),text:x.text}))]}));
      notify(`${arr.length} bloques añadidos`);
    } catch(e) { console.error("ai suggest error:", e); notify("Error: " + (e?.message || "intenta de nuevo")); }
    setBusy(false);
  }

  async function aiSuggestConceptos() {
    if (!brand||busy) return; setBusy(true); notify("IA procesando…");
    try {
      const ctx = perfilCtx(perfil, brand?.avatars);
      const blist = assets.slice(0,8).map(a=>`[${tp(a.tipo).label}] ${a.text}`).join("\n");
      const raw = await callClaude(`${COPY_BRAIN}\n\nIMPORTANTE: Genera TODO en español.\n\n${ctx}\n\nBloques para "${brand.name}":\n${blist}\n\nGenera 4 ideas de concepto para anuncios. Para cada concepto, encuentra una idea central clara y el ángulo que más resonará con el avatar. La línea de hook debe aplicar las REGLAS DE HOOK — específico, directo, máx 1-2 líneas.\nJSON only:\n[{"concepto":"","angulo":"","estilo":"","hook":""}]`, apiKey);
      const arr = JSON.parse(raw.replace(/```json|```/g,"").trim());
      updateBrand(b=>({...b, conceptos:[...(b.conceptos||[]),...arr.map(c=>({id:uid(),...c}))]}));
      notify(`${arr.length} conceptos añadidos`);
    } catch(e) { console.error("ai concepts error:", e); notify("Error: " + (e?.message || "intenta de nuevo")); }
    setBusy(false);
  }

  const perfFields = brand?.perfil ? Object.values(brand.perfil).filter(Boolean).length : 0;
  const perfCompletion = Math.min(Math.round(perfFields / 6 * 100), 100);

  const NAV = [
    { id:"dashboard",    icon:"🏠", label:"Inicio",            badge:null },
    { id:"personas",     icon:"👤", label:"Personas",          badge:(brand?.avatars||[]).length||null },
    { id:"banco",        icon:"📦", label:"Banco de bloques",  badge:assets.length||null },
    { id:"conceptos",    icon:"💡", label:"Conceptos",         badge:conceptos.length||null },
    { id:"meta-ad",      icon:"✏️", label:"Compositor",        badge:null },
    { id:"generador",    icon:"📋", label:"Armar copy",        badge:null },
    { id:"banco-copies", icon:"🏆", label:"Banco de copies",   badge:(brand?.copies||[]).length||null },
    { id:"transcript",   icon:"📥", label:"Importar",          badge:null },
    { id:"perfil",       icon:"🏢", label:"Marca",             badge:null },
  ];

  if (!claudeConf) return <SetupScreen onSave={handleClaudeConf} />;
  if (!data) return <div style={{ padding:40, color:T.slate, fontFamily:font }}>Loading…</div>;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.grayLight, fontFamily:font, fontSize:13 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet"/>
      <Toast msg={toast}/>

      {/* SIDEBAR */}
      <div style={{ width:220, flexShrink:0, background:T.navy, display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"20px 18px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:T.purple, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>✦</div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#fff", letterSpacing:"-0.02em" }}>AdBlocks</div>
              <div style={{ fontSize:9, color:T.purpleLight, marginTop:1, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:700 }}>Beta · ROAS Academy</div>
            </div>
          </div>
        </div>

        <div style={{ padding:"10px 10px", flex:1 }}>
          {NAV.map(n=><NavItem key={n.id} icon={n.icon} label={n.label} badge={n.badge} active={view===n.id} onClick={()=>setView(n.id)}/>)}
        </div>

        {/* Brand selector */}
        <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.3)", marginBottom:6 }}>Active brand</div>
          {(data.brands||[]).map(b=>(
            <button key={b.id} onClick={()=>setBrandId(b.id)} style={{ display:"block", width:"100%", padding:"6px 8px", marginBottom:2, border:"none", borderRadius:7, cursor:"pointer", background:brandId===b.id?"rgba(122,90,246,0.3)":"transparent", color:brandId===b.id?"#fff":"rgba(255,255,255,0.42)", fontFamily:font, fontSize:12, fontWeight:brandId===b.id?600:400, textAlign:"left", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.name}</button>
          ))}
          <button onClick={()=>{ setModal("addBrand"); setMd({}); }} style={{ display:"block", width:"100%", padding:"6px 8px", border:"none", borderRadius:7, cursor:"pointer", background:"transparent", color:"rgba(255,255,255,0.3)", fontFamily:font, fontSize:11, textAlign:"left" }}>+ Nueva marca</button>
        </div>

        {/* Profile bar */}
        <div style={{ padding:"10px 16px 16px" }}>
          <ProgressBar value={perfCompletion} color={T.purple}/>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:4 }}>Perfil {perfCompletion}% completo</div>
        </div>

        {/* AI provider indicator */}
        <div style={{ padding:"10px 16px 14px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={()=>setClaudeConf(null)} style={{ width:"100%", padding:"7px 0", fontSize:11, border:"none", borderRadius:7, cursor:"pointer", background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.5)", fontFamily:font }}>
            ⚙ {claudeConf?.provider==="openai"?"ChatGPT / GPT-4o":claudeConf?.provider==="gemini"?"Google Gemini":"Claude"} · Cambiar
          </button>
        </div>

        {/* Block type legend */}
        <div style={{ padding:"0 16px 16px" }}>
          <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.2)", marginBottom:7 }}>Tipos de bloque</div>
          {TIPOS.map(t=>(
            <div key={t.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{ width:7, height:7, borderRadius:"50%", background:t.color }}/><span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", textTransform:"capitalize" }}>{t.label}</span></span>
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.22)" }}>{assets.filter(a=>a.tipo===t.id).length}</span>
            </div>
          ))}
        </div>

      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Top bar */}
        <div style={{ padding:"13px 28px", background:T.white, borderBottom:`1px solid ${T.gray}`, display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <span style={{ fontSize:14, fontWeight:700, color:T.navy }}>{NAV.find(n=>n.id===view)?.label||"AdBlocks"}</span>
          {brand && <span style={{ fontSize:11, color:T.slate, padding:"2px 9px", border:`1px solid ${T.gray}`, borderRadius:10 }}>{brand.name}</span>}
          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            <Btn variant="primary" small onClick={()=>{ setModal("addAsset"); setMd({}); }}>+ Bloque</Btn>
          </div>
        </div>

        {/* Screen */}
        <div style={{ flex:1, overflow:"auto", padding:28 }}>
          {view==="dashboard"  && <DashboardScreen brand={brand} assets={assets} conceptos={conceptos} onNavigate={setView}/>}
          {view==="personas"   && brand && <PersonasScreen brand={brand} updateBrand={updateBrand} notify={notify}/>}
          {view==="banco"      && <BankScreen assets={assets} busy={busy} setBusy={setBusy} apiKey={apiKey} perfil={perfil} brand={brand} notify={notify} updateBrand={updateBrand} onAdd={()=>{setModal("addAsset");setMd({});}} onEdit={a=>{setModal("editAsset");setMd({...a});}} onDelete={deleteAsset} onAiSuggest={aiSuggestAssets}/>}
          {view==="conceptos"  && <ConceptsScreen conceptos={conceptos} brand={brand} assets={assets} busy={busy} setBusy={setBusy} apiKey={apiKey} perfil={perfil} onAdd={()=>{setModal("addConcepto");setMd({});}} onEdit={c=>{setModal("editConcepto");setMd({...c});}} onDelete={deleteConcepto} onAiSuggest={aiSuggestConceptos} onGoCompose={goCompose} notify={notify} updateBrand={updateBrand} perfCompletion={perfCompletion}/>}
          {view==="meta-ad"    && brand && <CompositorScreen assets={assets} conceptos={conceptos} perfil={perfil} brand={brand} busy={busy} setBusy={setBusy} apiKey={apiKey} notify={notify} updateBrand={updateBrand} initialConcept={initialConcept}/>}
          {view==="generador"  && brand && <GeneradorCopiesScreen assets={assets} conceptos={conceptos} perfil={perfil} brand={brand} busy={busy} setBusy={setBusy} apiKey={apiKey} notify={notify} updateBrand={updateBrand}/>}
          {view==="banco-copies" && brand && <BancoCopiesScreen copies={brand?.copies||[]} conceptos={conceptos} onDelete={id=>updateBrand(b=>({...b,copies:(b.copies||[]).filter(c=>c.id!==id)}))} onUpdateRating={(id,r)=>updateBrand(b=>({...b,copies:(b.copies||[]).map(c=>c.id===id?{...c,rating:r}:c)}))}/>}
          {view==="transcript" && brand && <TranscriptScreen busy={busy} setBusy={setBusy} apiKey={apiKey} notify={notify} updateBrand={updateBrand}/>}
          {view==="perfil"     && brand && <BrandProfileScreen brand={brand} notify={notify} apiKey={apiKey} updateBrand={updateBrand} onSave={(p,avatars,competitors,offers)=>{updateBrand(b=>({...b,perfil:p,avatars:avatars||b.avatars||[],competitors:competitors||b.competitors||[],offers:offers||b.offers||[]}));notify("Perfil guardado ✓");}}/>}
          {!brand && (
            <div style={{ textAlign:"center", padding:80, color:T.slate }}>
              <div style={{ fontSize:36, marginBottom:14 }}>+</div>
              <div style={{ fontSize:14, marginBottom:18 }}>Sin marca seleccionada</div>
              <Btn variant="primary" onClick={()=>{setModal("addBrand");setMd({});}}>Crear primera marca</Btn>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {modal==="addBrand" && (
        <Modal title="Nueva marca" onClose={closeModal}>
          <Inp label="Nombre" placeholder="e.g. ROAS Academy" value={md.name||""} onChange={e=>setMd(p=>({...p,name:e.target.value}))} autoFocus/>
          <Inp label="Industria" placeholder="e.g. Marketing Education" value={md.industry||""} onChange={e=>setMd(p=>({...p,industry:e.target.value}))}/>
          <div style={{ display:"flex", gap:8 }}>
            <Btn variant="primary" onClick={()=>{ if(!md.name?.trim()) return; const nb={id:uid(),name:md.name.trim(),industry:md.industry?.trim()||"",assets:[],conceptos:[],copies:[],customAngles:[],customStyles:[],perfil:{}}; save({...data,brands:[...(data.brands||[]),nb]}); setBrandId(nb.id); closeModal(); }} disabled={!md.name?.trim()}>Crear</Btn>
            <Btn variant="ghost" onClick={closeModal}>Cancelar</Btn>
          </div>
        </Modal>
      )}
      {(modal==="addAsset"||modal==="editAsset") && (
        <Modal title={modal==="addAsset"?"Nuevo bloque":"Editar bloque"} onClose={closeModal} width={540}>
          <AssetForm initial={md.id?md:{}} onSave={saveAsset} onClose={closeModal}/>
        </Modal>
      )}
      {(modal==="addConcepto"||modal==="editConcepto") && (
        <ConceptWizard initial={md.id?md:{}} brand={brand} onSave={saveConcepto} onClose={closeModal} updateBrand={updateBrand}/>
      )}
    </div>
  );
}
