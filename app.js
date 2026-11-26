const STORAGE_KEY = 'true_fitness_app_v2';

const AVATARES_ESTANDAR = [
  { label: 'Logo TF', src: 'Logo.jpeg' },
  { label: 'Definición', src: 'definicionmuscular.jpeg' },
  { label: 'Full Body', src: 'fullbody.jpeg' },
  { label: 'Fuerza', src: 'fuerzapotencia.jpeg' },
  { label: 'Nutrición', src: 'nutricion.jpg' },
  { label: 'Snack Fit', src: 'comidasana.jpg' }
];

const DEFAULT_STATE = {
  nombre: 'Atleta',
  nivel: 'Intermedio',
  peso: 75,
  altura: 1.78,
  edad: 32,
  avatarSrc: 'Logo.jpeg',
  caloriasHoy: 650,
  caloriasComidas: 1100,
  metaCalorias: 2100,
  macros: { prot: 95, carb: 140, gras: 42 },
  vasosAgua: 5,
  diasCompletados: 4,
  racha: 4,
  notificacionesActivas: true,
  horaRecordatorio: '08:00 AM',
  planActivo: {
    titulo: 'Rutina de Pecho y Tríceps',
    meta: '45 Min. / Nivel Intermedio',
    duracion: '4 Semanas'
  },
  ejerciciosPorPlan: {
    'Rutina de Pecho y Tríceps': [
      { nombre: 'Flexiones en suelo', series: '4x12', hecho: true },
      { nombre: 'Press con mancuernas', series: '4x10', hecho: false },
      { nombre: 'Fondos de tríceps', series: '3x12', hecho: false }
    ],
    'Definición Muscular': [
      { nombre: 'Sentadilla goblet', series: '4x15', hecho: false },
      { nombre: 'Remo con mancuerna', series: '4x12', hecho: false },
      { nombre: 'Plancha abdominal', series: '3x40s', hecho: false }
    ],
    'Full Body QuemaGrasa': [
      { nombre: 'Jumping jacks', series: '4x30s', hecho: false },
      { nombre: 'Burpees controlados', series: '3x10', hecho: false },
      { nombre: 'Mountain climbers', series: '3x25s', hecho: false }
    ],
    'Fuerza y Potencia': [
      { nombre: 'Peso muerto rumano', series: '4x8', hecho: false },
      { nombre: 'Press militar', series: '4x8', hecho: false },
      { nombre: 'Zancadas con impulso', series: '3x10', hecho: false }
    ]
  },
  comidas: [
    { nombre: 'Desayuno de avena y chía', kcal: 420 },
    { nombre: 'Almuerzo pollo y arroz', kcal: 680 }
  ],
  historialPesoImc: [
    { fecha: 'Hace 2 sem.', peso: 76.4, imc: '24.1' },
    { fecha: 'Hace 1 sem.', peso: 75.7, imc: '23.9' },
    { fecha: 'Hoy', peso: 75.0, imc: '23.7' }
  ]
};

let state = cargarEstado();
let timerSegundos = 60;
let timerTotal = 60;
let timerInterval = null;

function cargarEstado() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      macros: { ...DEFAULT_STATE.macros, ...(parsed.macros || {}) }
    };
  } catch (e) {
    return structuredClone(DEFAULT_STATE);
  }
}

function guardarEstado() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Ignorar errores de cuota/privado
  }
}

function mostrarToast(texto) {
  const toast = document.getElementById('toast-msg');
  if (!toast) return;
  toast.textContent = texto;
  toast.classList.add('show');
  clearTimeout(mostrarToast._timer);
  mostrarToast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2100);
}

function cambiarPantalla(idPantalla) {
  document.querySelectorAll('.screen').forEach((sec) => {
    sec.classList.toggle('active', sec.id === `screen-${idPantalla}`);
  });
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.target === idPantalla);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function iniciarRutinaRapida() {
  cambiarPantalla('entrenos');
  mostrarToast(`⚡ ¡Vamos! ${state.planActivo.titulo}`);
}

function seleccionarPlan(titulo, meta, duracion = '4 Semanas') {
  state.planActivo = { titulo, meta, duracion };
  if (!state.ejerciciosPorPlan[titulo]) {
    state.ejerciciosPorPlan[titulo] = [
      { nombre: 'Calentamiento dinámico', series: '2x30s', hecho: false },
      { nombre: 'Ejercicio principal', series: '4x12', hecho: false }
    ];
  }
  guardarEstado();
  renderTodo();
  mostrarToast(`Plan activo: ${titulo}`);
}

function sumarDiaEntrenado() {
  if (state.diasCompletados < 5) {
    state.diasCompletados += 1;
    state.racha += 1;
    state.caloriasHoy += 240;
    guardarEstado();
    renderTodo();
    mostrarToast('🔥 ¡Día completado! +240 kcal');
  } else {
    mostrarToast('🏆 ¡Meta semanal de 5/5 días cumplida!');
  }
}

/* Temporizador Entrenos */
function actualizarDisplayTimer() {
  const mins = String(Math.floor(timerSegundos / 60)).padStart(2, '0');
  const secs = String(timerSegundos % 60).padStart(2, '0');
  const el = document.getElementById('timer-display');
  if (el) el.textContent = `${mins}:${secs}`;
}

function configurarTimer(segundos, etiqueta) {
  pausarTimer();
  timerTotal = segundos;
  timerSegundos = segundos;
  const lbl = document.getElementById('timer-modo-label');
  if (lbl) lbl.textContent = `${etiqueta} (${segundos}s)`;
  actualizarDisplayTimer();
}

function toggleTimer() {
  if (timerInterval) {
    pausarTimer();
    mostrarToast('Temporizador en pausa');
  } else {
    const btn = document.getElementById('btn-timer-toggle');
    if (btn) btn.textContent = 'Pausar';
    timerInterval = setInterval(() => {
      if (timerSegundos > 1) {
        timerSegundos -= 1;
        actualizarDisplayTimer();
      } else {
        timerSegundos = 0;
        actualizarDisplayTimer();
        pausarTimer();
        mostrarToast('⏱️ ¡Tiempo completado! ¡Excelente serie!');
      }
    }, 1000);
  }
}

function pausarTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  const btn = document.getElementById('btn-timer-toggle');
  if (btn) btn.textContent = 'Iniciar';
}

function resetTimer() {
  pausarTimer();
  timerSegundos = timerTotal;
  actualizarDisplayTimer();
}

/* Nutrición: Macros, Agua, Calorías */
function sumarMacro(tipo, gramos) {
  state.macros[tipo] = (state.macros[tipo] || 0) + gramos;
  state.caloriasComidas += tipo === 'gras' ? gramos * 9 : gramos * 4;
  guardarEstado();
  renderTodo();
  mostrarToast(`+${gramos}g añadidos`);
}

function setVasosAgua(cantidad) {
  state.vasosAgua = cantidad;
  guardarEstado();
  renderTodo();
  mostrarToast(`💧 ${cantidad}/8 vasos (${(cantidad * 0.25).toFixed(2)}L)`);
}

function registrarComida() {
  const input = document.getElementById('input-comida-cal');
  if (!input) return;
  const kcal = parseInt(input.value, 10);
  if (!kcal || kcal < 1) {
    mostrarToast('Escribe cuántas calorías tuvo tu comida');
    return;
  }
  agregarComidaALista(kcal, 'Comida registrada');
  input.value = '';
}

function registrarRapido(kcal, nombre) {
  agregarComidaALista(kcal, nombre);
}

function agregarComidaALista(kcal, nombre) {
  state.caloriasComidas += kcal;
  state.caloriasHoy += Math.round(kcal * 0.35);
  state.comidas.unshift({ nombre, kcal });
  if (state.comidas.length > 5) state.comidas.pop();
  guardarEstado();
  renderTodo();
  mostrarToast(`+${kcal} kcal (${nombre})`);
}

/* Ejercicios */
function toggleEjercicio(idx) {
  const lista = state.ejerciciosPorPlan[state.planActivo.titulo] || [];
  if (!lista[idx]) return;
  lista[idx].hecho = !lista[idx].hecho;
  state.caloriasHoy += lista[idx].hecho ? 70 : -70;
  state.caloriasHoy = Math.max(0, state.caloriasHoy);
  guardarEstado();
  renderTodo();
  if (lista[idx].hecho) mostrarToast('💪 ¡Ejercicio marcado como hecho!');
}

function eliminarEjercicio(idx) {
  const lista = state.ejerciciosPorPlan[state.planActivo.titulo] || [];
  lista.splice(idx, 1);
  guardarEstado();
  renderTodo();
  mostrarToast('Ejercicio eliminado');
}

/* Modales */
function abrirModal(tipo) {
  const modal = document.getElementById('app-modal');
  const titulo = document.getElementById('modal-titulo');
  const cuerpo = document.getElementById('modal-cuerpo');
  if (!modal || !titulo || !cuerpo) return;

  if (tipo === 'menu') {
    titulo.textContent = 'Menú rápido True Fitness';
    cuerpo.innerHTML = `
      <button class="action-row" type="button" onclick="cambiarPantalla('inicio'); cerrarModal();">🏠 Ir a Inicio</button>
      <button class="action-row" type="button" onclick="cambiarPantalla('entrenos'); cerrarModal();">🏋️ Ir a Mis Entrenos</button>
      <button class="action-row" type="button" onclick="cambiarPantalla('nutricion'); cerrarModal();">🥗 Ir a Nutrición</button>
      <button class="action-row" type="button" onclick="cambiarPantalla('perfil'); cerrarModal();">👤 Ir a Perfil</button>
    `;
  } else if (tipo === 'comunidad') {
    titulo.textContent = 'Comunidad y Retos';
    cuerpo.innerHTML = `
      <div class="modal-list-item">
        <strong>🔥 Reto Semanal Activo</strong>
        Llevas <b>${state.diasCompletados}/5 días</b> esta semana y una racha de <b>${state.racha} días</b>.
      </div>
      <div class="modal-list-item">
        <strong>💧 Hidratación Fit</strong>
        Llevas <b>${state.vasosAgua}/8 vasos</b> de agua registrados hoy.
      </div>
      <button class="btn-primary" type="button" onclick="sumarDiaEntrenado(); cerrarModal();">Completar día de hoy</button>
    `;
  } else if (tipo === 'detalle-rutina') {
    const lista = state.ejerciciosPorPlan[state.planActivo.titulo] || [];
    titulo.textContent = state.planActivo.titulo;
    cuerpo.innerHTML = `
      <p><b>Enfoque:</b> ${state.planActivo.meta}</p>
      <p><b>Duración:</b> ${state.planActivo.duracion}</p>
      ${lista.map((e) => `<div class="modal-list-item"><strong>${e.hecho ? '✅' : '⬜'} ${e.nombre}</strong><span>Series: ${e.series}</span></div>`).join('')}
      <button class="btn-primary" type="button" onclick="cerrarModal()">Listo</button>
    `;
  } else if (tipo === 'plan-nutricion') {
    titulo.textContent = 'Plan de Alimentación';
    cuerpo.innerHTML = `
      <div class="modal-list-item">
        <strong>🥗 Pérdida de Grasa Equilibrada</strong>
        Combina proteína magra, verduras frescas, grasas buenas y agua constante.
      </div>
      <div class="modal-list-item">
        <strong>🎯 Meta diaria:</strong> ${state.metaCalorias} kcal • Consumidas: ${state.caloriasComidas} kcal.
      </div>
      <button class="btn-primary" type="button" onclick="cerrarModal()">Cerrar</button>
    `;
  } else if (tipo === 'tips-nutricion') {
    titulo.textContent = 'Snacks Saludables';
    cuerpo.innerHTML = `
      <div class="modal-list-item"><strong>🍓 Yogur griego + frutos rojos</strong> Alto en proteína y saciedad rápida.</div>
      <div class="modal-list-item"><strong>🥑 Hummus con vegetales crujientes</strong> Ideal para media tarde.</div>
      <div class="modal-list-item"><strong>🥚 Huevos cocidos o puñado de nueces</strong> Energía limpia antes o después del gym.</div>
      <button class="btn-primary" type="button" onclick="cerrarModal()">¡Entendido!</button>
    `;
  } else if (tipo === 'avatar-picker') {
    titulo.textContent = 'Foto de Perfil';
    cuerpo.innerHTML = `
      <p>Elige una imagen estándar de la app o sube una foto desde tu galería:</p>
      <div class="preset-avatars-grid">
        ${AVATARES_ESTANDAR.map((av) => `
          <button class="preset-avatar-card" type="button" onclick="seleccionarAvatarEstandar('${av.src}')">
            <img src="${av.src}" alt="${av.label}">
            <span>${av.label}</span>
          </button>
        `).join('')}
      </div>
      <div class="modal-field">
        <label for="input-galeria-avatar">Subir desde tu galería</label>
        <input id="input-galeria-avatar" type="file" accept="image/*">
      </div>
    `;
    const fileInput = document.getElementById('input-galeria-avatar');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            state.avatarSrc = reader.result;
            guardarEstado();
            renderTodo();
            cerrarModal();
            mostrarToast('📸 ¡Foto de perfil actualizada!');
          }
        };
        reader.readAsDataURL(file);
      });
    }
  } else if (tipo === 'editar-perfil') {
    titulo.textContent = 'Editar Perfil y Registrar Peso';
    cuerpo.innerHTML = `
      <form id="form-editar-perfil" class="modal-body">
        <div class="modal-field">
          <label for="edit-nombre">Nombre</label>
          <input id="edit-nombre" type="text" value="${state.nombre}" required>
        </div>
        <div class="modal-field">
          <label for="edit-nivel">Nivel</label>
          <select id="edit-nivel">
            <option ${state.nivel === 'Principiante' ? 'selected' : ''}>Principiante</option>
            <option ${state.nivel === 'Intermedio' ? 'selected' : ''}>Intermedio</option>
            <option ${state.nivel === 'Avanzado' ? 'selected' : ''}>Avanzado</option>
          </select>
        </div>
        <div class="modal-field">
          <label for="edit-peso">Peso actual (kg)</label>
          <input id="edit-peso" type="number" step="0.1" min="25" max="300" value="${state.peso}" required>
        </div>
        <div class="modal-field">
          <label for="edit-altura">Altura (m)</label>
          <input id="edit-altura" type="number" step="0.01" min="1.0" max="2.5" value="${state.altura}" required>
        </div>
        <div class="modal-field">
          <label for="edit-edad">Edad</label>
          <input id="edit-edad" type="number" min="10" max="110" value="${state.edad}" required>
        </div>
        <button class="btn-primary" type="submit">Guardar y añadir al historial</button>
      </form>
    `;
    document.getElementById('form-editar-perfil').addEventListener('submit', (e) => {
      e.preventDefault();
      state.nombre = document.getElementById('edit-nombre').value.trim() || 'Atleta';
      state.nivel = document.getElementById('edit-nivel').value;
      state.peso = parseFloat(document.getElementById('edit-peso').value) || state.peso;
      state.altura = parseFloat(document.getElementById('edit-altura').value) || state.altura;
      state.edad = parseInt(document.getElementById('edit-edad').value, 10) || state.edad;

      const nuevoImc = (state.peso / (state.altura * state.altura)).toFixed(1);
      state.historialPesoImc.unshift({
        fecha: 'Hoy',
        peso: Number(state.peso.toFixed(1)),
        imc: nuevoImc
      });
      if (state.historialPesoImc.length > 5) state.historialPesoImc.pop();

      guardarEstado();
      renderTodo();
      cerrarModal();
      mostrarToast(`Perfil guardado • IMC ${nuevoImc}`);
    });
  } else if (tipo === 'notificaciones') {
    titulo.textContent = 'Recordatorios';
    cuerpo.innerHTML = `
      <div class="modal-list-item">
        <strong>Estado:</strong> ${state.notificacionesActivas ? 'Activas' : 'Pausadas'} (${state.horaRecordatorio})
      </div>
      <button class="btn-primary" type="button" onclick="alternarNotificaciones(); cerrarModal();">
        ${state.notificacionesActivas ? 'Pausar recordatorios' : 'Activar recordatorios diarios'}
      </button>
    `;
  } else if (tipo === 'reiniciar') {
    titulo.textContent = 'Reiniciar datos de la app';
    cuerpo.innerHTML = `
      <p>Se restaurarán rutinas, calorías, macros, vasos de agua, perfil e historial.</p>
      <button class="btn-primary" type="button" onclick="reiniciarDatosConfirmado(); cerrarModal();">Sí, reiniciar todo</button>
      <button class="action-row" type="button" onclick="cerrarModal()">Cancelar</button>
    `;
  }

  modal.classList.remove('hidden');
}

function seleccionarAvatarEstandar(src) {
  state.avatarSrc = src;
  guardarEstado();
  renderTodo();
  cerrarModal();
  mostrarToast('✨ Foto de perfil actualizada');
}

function cerrarModal() {
  const modal = document.getElementById('app-modal');
  if (modal) modal.classList.add('hidden');
}

function alternarNotificaciones() {
  state.notificacionesActivas = !state.notificacionesActivas;
  guardarEstado();
  renderTodo();
  mostrarToast(state.notificacionesActivas ? 'Recordatorios activados 🔔' : 'Recordatorios pausados');
}

function reiniciarDatosConfirmado() {
  state = structuredClone(DEFAULT_STATE);
  guardarEstado();
  renderTodo();
  mostrarToast('Datos reiniciados');
}

/* Carrusel tipo GIF con desvanecido */
function iniciarCarruselGif() {
  const slides = document.querySelectorAll('.gif-slide');
  if (!slides.length) return;
  let actual = 0;

  setInterval(() => {
    slides[actual].classList.remove('is-active');
    actual = (actual + 1) % slides.length;
    slides[actual].classList.add('is-active');
  }, 2400);
}

/* Render */
function renderTodo() {
  const imc = (state.peso / (state.altura * state.altura)).toFixed(1);

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText('user-name-display', state.nombre);
  setText('perfil-nombre', state.nombre);
  setText('perfil-nivel', `Nivel: ${state.nivel}`);
  setText('stat-peso', `${state.peso} kg`);
  setText('stat-altura', `${state.altura} m`);
  setText('stat-edad', state.edad);
  setText('stat-imc', imc);
  setText('racha-dias', state.racha);

  const avatarImg = document.getElementById('perfil-avatar-img');
  if (avatarImg && state.avatarSrc) {
    avatarImg.src = state.avatarSrc;
  }

  const histWrap = document.getElementById('historial-peso-imc');
  if (histWrap) {
    histWrap.innerHTML = state.historialPesoImc
      .slice(0, 4)
      .map((item) => `
        <div class="history-row">
          <span>${item.fecha}</span>
          <span>${item.peso} kg</span>
          <span class="history-imc-pill">IMC ${item.imc}</span>
        </div>
      `)
      .join('');
  }

  setText('inicio-calorias', state.caloriasHoy);
  setText('dias-completados', state.diasCompletados);
  const pctDias = Math.min(100, Math.round((state.diasCompletados / 5) * 100));
  const barra = document.getElementById('barra-dias');
  if (barra) barra.style.width = `${pctDias}%`;

  const dotsWrap = document.getElementById('week-dots');
  if (dotsWrap) {
    const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
    dotsWrap.innerHTML = dias
      .map((d, i) => `<span class="week-dot-pill ${i < state.diasCompletados ? 'done' : ''}">${d}</span>`)
      .join('');
  }

  setText('plan-activo-titulo', state.planActivo.titulo);
  setText('plan-activo-meta', state.planActivo.meta);
  setText('hero-rutina-preview', `${state.planActivo.titulo} • ${state.planActivo.meta.split('/')[0].trim()}`);

  document.querySelectorAll('.plan-card').forEach((card) => {
    card.classList.toggle('active-plan', card.dataset.plan === state.planActivo.titulo);
  });

  const listaEj = document.getElementById('lista-ejercicios');
  const ejercicios = state.ejerciciosPorPlan[state.planActivo.titulo] || [];
  const completados = ejercicios.filter((e) => e.hecho).length;
  setText('contador-ejercicios-pill', `${completados}/${ejercicios.length} listos`);

  if (listaEj) {
    listaEj.innerHTML = ejercicios
      .map(
        (ej, idx) => `
        <li class="${ej.hecho ? 'ex-done' : ''}">
          <button class="ex-check-btn" type="button" onclick="toggleEjercicio(${idx})">
            ${ej.hecho ? '✅' : '⬜'} ${ej.nombre} — <b>${ej.series}</b>
          </button>
          <button class="btn-del" type="button" onclick="eliminarEjercicio(${idx})">✕</button>
        </li>
      `
      )
      .join('');
  }

  setText('macro-prot', `${state.macros.prot}g`);
  setText('macro-carb', `${state.macros.carb}g`);
  setText('macro-gras', `${state.macros.gras}g`);
  const barProt = document.getElementById('bar-prot');
  const barCarb = document.getElementById('bar-carb');
  const barGras = document.getElementById('bar-gras');
  if (barProt) barProt.style.width = `${Math.min(100, Math.round((state.macros.prot / 150) * 100))}%`;
  if (barCarb) barCarb.style.width = `${Math.min(100, Math.round((state.macros.carb / 230) * 100))}%`;
  if (barGras) barGras.style.width = `${Math.min(100, Math.round((state.macros.gras / 70) * 100))}%`;

  setText('agua-actual', state.vasosAgua);
  setText('agua-litros', (state.vasosAgua * 0.25).toFixed(2));
  const cupsGrid = document.getElementById('water-cups-grid');
  if (cupsGrid) {
    cupsGrid.innerHTML = Array.from({ length: 8 }, (_, i) => {
      const num = i + 1;
      const filled = num <= state.vasosAgua;
      return `<button class="water-cup-btn ${filled ? 'filled' : ''}" type="button" aria-label="Vaso ${num}" onclick="setVasosAgua(${num})">💧</button>`;
    }).join('');
  }

  setText('calorias-actuales', state.caloriasComidas);
  setText('calorias-meta', state.metaCalorias);
  const pctCal = Math.min(100, Math.round((state.caloriasComidas / state.metaCalorias) * 100));
  const arc = document.getElementById('calorie-arc');
  if (arc) {
    arc.style.background = `conic-gradient(#7749a6 0% ${pctCal}%, rgba(255, 255, 255, 0.88) ${pctCal}% 100%)`;
  }

  const mealsList = document.getElementById('lista-comidas');
  if (mealsList) {
    mealsList.innerHTML = state.comidas
      .slice(0, 3)
      .map((c) => `<li><span>🍽️ ${c.nombre}</span><b>+${c.kcal} kcal</b></li>`)
      .join('');
  }

  setText('estado-notif', state.notificacionesActivas ? 'Activas' : 'Pausadas');
}

/* Animación energética de partículas/emojis dentro del móvil */
function iniciarAnimacionMovil() {
  const canvas = document.getElementById('canvas-movil');
  const shell = document.querySelector('.app-shell');
  if (!canvas || !shell) return;
  const ctx = canvas.getContext('2d');

  let w = 0;
  let h = 0;

  function resize() {
    w = canvas.width = shell.clientWidth || window.innerWidth;
    h = canvas.height = Math.max(shell.scrollHeight, window.innerHeight);
  }

  window.addEventListener('resize', resize);
  resize();

  const emojis = ['💪', '🔥', '⚡', '🏋️‍♀️', '✨', '💧'];
  const tonos = [
    'rgba(99, 216, 242, ',
    'rgba(149, 128, 212, ',
    'rgba(117, 173, 201, '
  ];

  class ParticulaEnergia {
    constructor(inicial = false) {
      this.reset(inicial);
    }
    reset(inicial = false) {
      this.x = Math.random() * w;
      this.y = inicial ? Math.random() * h : h + 26;
      this.size = Math.random() * 12 + 13;
      this.vy = Math.random() * 0.9 + 0.45;
      this.vx = (Math.random() - 0.5) * 0.65;
      this.alpha = Math.random() * 0.24 + 0.14;
      this.color = tonos[Math.floor(Math.random() * tonos.length)];
      this.esEmoji = Math.random() > 0.45;
      this.emoji = emojis[Math.floor(Math.random() * emojis.length)];
      this.rot = (Math.random() - 0.5) * 0.45;
      this.vRot = (Math.random() - 0.5) * 0.018;
    }
    update() {
      this.y -= this.vy;
      this.x += Math.sin(this.y * 0.014) * 0.7 + this.vx;
      this.rot += this.vRot;
      if (this.y < -30 || this.x < -30 || this.x > w + 30) {
        this.reset(false);
      }
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      if (this.esEmoji) {
        ctx.globalAlpha = Math.min(0.45, this.alpha + 0.14);
        ctx.font = `${this.size}px "Poppins", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
      } else {
        const r = this.size * 0.56;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = this.color + (this.alpha * 0.62) + ')';
        ctx.fill();
        ctx.strokeStyle = this.color + (this.alpha * 0.92) + ')';
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  const items = Array.from({ length: 26 }, () => new ParticulaEnergia(true));

  function loop() {
    ctx.clearRect(0, 0, w, h);
    items.forEach((p) => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(loop);
  }

  loop();
}

window.addEventListener('DOMContentLoaded', () => {
  renderTodo();
  actualizarDisplayTimer();
  iniciarCarruselGif();
  iniciarAnimacionMovil();

  const formEj = document.getElementById('form-ejercicio');
  if (formEj) {
    formEj.addEventListener('submit', (e) => {
      e.preventDefault();
      const nombreInput = document.getElementById('input-nombre');
      const seriesInput = document.getElementById('input-series');
      const nombre = nombreInput.value.trim();
      const series = seriesInput.value.trim();
      if (!nombre || !series) return;

      if (!state.ejerciciosPorPlan[state.planActivo.titulo]) {
        state.ejerciciosPorPlan[state.planActivo.titulo] = [];
      }
      state.ejerciciosPorPlan[state.planActivo.titulo].push({ nombre, series, hecho: false });
      guardarEstado();
      renderTodo();
      nombreInput.value = '';
      seriesInput.value = '';
      mostrarToast('💪 Ejercicio agregado');
    });
  }

  const splash = document.getElementById('splash-screen');
  if (splash) {
    setTimeout(() => {
      splash.classList.add('hidden');
    }, 1400);
  }
});