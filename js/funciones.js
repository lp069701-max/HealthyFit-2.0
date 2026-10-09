/* Autor de la página web: Leonel. P */
/* =====================================================================
   HEALTHYFIT · funciones.js
   1 Aparición al hacer scroll (.reveal → .in) · 2 Carrusel (3 imágenes, una a la vez)
   3 Carrito lateral · 4 Pestañas seleccionadas del hero · 5 Buscador de productos
   5b Colección de productos (panel lateral) · 6 Formularios (suscripción, contacto, comentarios) · 7 Multimedia
   Requiere navbar.js (define window.HF).
   ===================================================================== */
(() => {
  'use strict';
  const { $, $$, reduceMotion } = window.HF;

  /* ---------- 1. APARICIÓN AL HACER SCROLL ---------- */
  // Los elementos con class="reveal" están ocultos (solo con JS activo) hasta que reciben .in
  function iniciarAparicion() {
    const items = $$('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) { items.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((lista) => {
      lista.forEach((l) => { if (l.isIntersecting) { l.target.classList.add('in'); io.unobserve(l.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    items.forEach((e) => io.observe(e));
  }

  /* ---------- 2. CARRUSEL ---------- */
  function iniciarCarrusel() {
    const raiz = $('#carousel'), pista = $('#track'), caja = $('#dots');
    if (!raiz || !pista || !caja) return;
    const slides = $$('.slide', pista), total = slides.length;
    let i = 0, timer = null, x0 = null;

    const puntos = slides.map((_, n) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Ir a la imagen ${n + 1} de ${total}`);
      b.addEventListener('click', () => { ir(n); reiniciar(); });
      caja.appendChild(b);
      return b;
    });

    function ir(n) {
      i = (n + total) % total;
      pista.style.transform = `translateX(${-100 * i}%)`;
      slides.forEach((s, k) => s.setAttribute('aria-hidden', String(k !== i)));
      puntos.forEach((p, k) => { p.classList.toggle('on', k === i); p.setAttribute('aria-current', String(k === i)); });
    }
    const jugar = () => { if (!reduceMotion && !timer && total > 1) timer = setInterval(() => ir(i + 1), 5500); };
    const parar = () => { clearInterval(timer); timer = null; };
    const reiniciar = () => { parar(); jugar(); };

    $('#prev')?.addEventListener('click', () => { ir(i - 1); reiniciar(); });
    $('#next')?.addEventListener('click', () => { ir(i + 1); reiniciar(); });
    raiz.addEventListener('mouseenter', parar);
    raiz.addEventListener('mouseleave', jugar);
    raiz.addEventListener('focusin', parar);
    raiz.addEventListener('focusout', jugar);
    document.addEventListener('visibilitychange', () => (document.hidden ? parar() : jugar()));
    raiz.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { ir(i - 1); reiniciar(); }
      if (e.key === 'ArrowRight') { ir(i + 1); reiniciar(); }
    });
    // Deslizar con el dedo o el mouse
    raiz.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    raiz.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 45) { ir(i + (dx < 0 ? 1 : -1)); reiniciar(); }
    });
    raiz.addEventListener('pointercancel', () => { x0 = null; });
    ir(0); jugar();
  }

  /* ---------- 3. CARRITO LATERAL ---------- */
  const CLAVE = 'hf_carrito_v2';
  const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || []; } catch { return []; } };
  const guardar = (c) => { try { localStorage.setItem(CLAVE, JSON.stringify(c)); } catch { /* modo privado */ } };
  const soles = (n) => 'S/ ' + n.toFixed(2);
  const precioDe = (t) => { const m = (t || '').replace(',', '.').match(/(\d+(\.\d+)?)/); return m ? parseFloat(m[1]) : 0; };

  function iniciarCarrito() {
    // Estructura del panel (se crea aquí para no repetirla en cada página)
    const overlay = document.createElement('div');
    overlay.className = 'hf-cart__overlay';
    const panel = document.createElement('aside');
    panel.className = 'hf-cart';
    panel.setAttribute('aria-label', 'Carrito de compras');
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML =
      '<div class="hf-cart__head"><h2>Tu carrito</h2><button type="button" class="hf-cart__x" aria-label="Cerrar carrito">✕</button></div>' +
      '<ul class="hf-cart__list"></ul>' +
      '<div class="hf-cart__foot"><div class="hf-cart__total"><span>Total</span><strong>S/ 0.00</strong></div>' +
      '<button type="button" class="btn btn--primary btn--block" data-act="buy">Finalizar compra</button>' +
      '<button type="button" class="btn btn--outline btn--block" data-act="clear">Vaciar carrito</button></div>';
    const toast = document.createElement('div');
    toast.className = 'hf-toast';
    toast.setAttribute('role', 'status');
    document.body.append(overlay, panel, toast);

    const lista = $('.hf-cart__list', panel), total = $('.hf-cart__total strong', panel);
    const insignia = $('#cartCount'), abrirBtn = $('#nav-carrito');
    let tt = null, foco = null;

    const aviso = (t) => {
      toast.textContent = t; toast.classList.add('show');
      clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2200);
    };
    const abrir = (v) => {
      panel.classList.toggle('open', v); overlay.classList.toggle('open', v);
      panel.setAttribute('aria-hidden', String(!v));
      document.body.classList.toggle('menu-open', v);
      if (v) { foco = document.activeElement; $('.hf-cart__x', panel).focus(); } else if (foco) foco.focus?.();
    };

    function pintar() {
      const c = leer();
      lista.textContent = '';
      if (!c.length) {
        const v = document.createElement('li'); v.className = 'hf-cart__vacio'; v.textContent = 'Tu carrito está vacío. Agrega productos desde la sección Productos.';
        lista.appendChild(v);
      }
      c.forEach((it) => {
        const li = document.createElement('li'); li.className = 'hf-cart__item'; li.dataset.n = it.n;
        const img = document.createElement('img'); img.src = it.img || ''; img.alt = it.n;
        const mid = document.createElement('div');
        const h = document.createElement('h3'); h.textContent = it.n;
        const pr = document.createElement('p'); pr.className = 'hf-cart__precio'; pr.textContent = soles(it.p) + ' c/u';
        const q = document.createElement('div'); q.className = 'hf-cart__qty';
        const menos = document.createElement('button'); menos.type = 'button'; menos.dataset.act = 'minus'; menos.setAttribute('aria-label', 'Quitar uno'); menos.textContent = '−';
        const num = document.createElement('span'); num.textContent = it.q;
        const mas = document.createElement('button'); mas.type = 'button'; mas.dataset.act = 'plus'; mas.setAttribute('aria-label', 'Agregar uno'); mas.textContent = '+';
        q.append(menos, num, mas); mid.append(h, pr, q);
        const del = document.createElement('button'); del.type = 'button'; del.className = 'hf-cart__del'; del.dataset.act = 'del'; del.setAttribute('aria-label', 'Quitar ' + it.n); del.textContent = '🗑';
        li.append(img, mid, del); lista.appendChild(li);
      });
      total.textContent = soles(c.reduce((s, it) => s + it.p * it.q, 0));
      const n = c.reduce((s, it) => s + it.q, 0);
      if (insignia) { insignia.textContent = n; insignia.hidden = n === 0; }
      $('[data-act="buy"]', panel).disabled = $('[data-act="clear"]', panel).disabled = !c.length;
    }

    // Agregar desde las tarjetas de producto
    document.addEventListener('click', (e) => {
      const b = e.target.closest('.btn-cart');
      if (!b) return;
      const card = b.closest('.prod-card');
      const nombre = b.dataset.nombre || card?.querySelector('h3')?.textContent.trim() || 'Producto';
      const precio = precioDe(card?.querySelector('.price-pill')?.textContent);
      const foto = card?.querySelector('.slot img')?.src || '';
      const c = leer(); const ya = c.find((x) => x.n === nombre);
      if (ya) ya.q++; else c.push({ n: nombre, p: precio, img: foto, q: 1 });
      guardar(c); pintar();
      b.classList.add('ok'); setTimeout(() => b.classList.remove('ok'), 900);
      aviso(nombre + ' agregado al carrito');
    });

    // Botones dentro del panel
    panel.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (e.target.closest('.hf-cart__x')) return abrir(false);
      if (!act) return;
      let c = leer();
      const n = e.target.closest('.hf-cart__item')?.dataset.n;
      const it = c.find((x) => x.n === n);
      if (act === 'plus' && it) it.q++;
      if (act === 'minus' && it) { it.q--; if (it.q <= 0) c = c.filter((x) => x !== it); }
      if (act === 'del') c = c.filter((x) => x.n !== n);
      if (act === 'clear') c = [];
      if (act === 'buy') { c = []; abrir(false); aviso('¡Gracias! Un asesor confirmará tu pedido.'); }
      guardar(c); pintar();
    });

    abrirBtn?.addEventListener('click', (e) => { e.preventDefault(); abrir(true); });
    overlay.addEventListener('click', () => abrir(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('open')) abrir(false); });
    window.addEventListener('storage', pintar);
    pintar();
  }

  /* ---------- 4. PESTAÑAS SELECCIONADAS DEL HERO ---------- */
  // En Productos: la pestaña de la sección que estás viendo queda verde (.is-selected), las demás naranja (.is-idle)
  function iniciarPestanas() {
    const grupos = $$('.hero__tabs');
    if (!grupos.length) return;
    const nav = $('#hfNav');
    grupos.forEach((g) => {
      const links = $$('a[href^="#"]', g);
      const metas = links.map((a) => document.getElementById(a.getAttribute('href').slice(1)));
      const marcar = (n) => links.forEach((a, k) => { a.classList.toggle('is-selected', k === n); a.classList.toggle('is-idle', k !== n); });
      const detectar = () => {
        const linea = (nav ? nav.offsetHeight : 80) + 40;
        let n = 0;
        metas.forEach((m, k) => { if (m && m.getBoundingClientRect().top <= linea) n = k; });
        marcar(n);
      };
      links.forEach((a, k) => a.addEventListener('click', () => marcar(k)));
      let p = false;
      window.addEventListener('scroll', () => { if (!p) { p = true; requestAnimationFrame(() => { detectar(); p = false; }); } }, { passive: true });
      detectar();
    });
  }

  /* ---------- 5. BUSCADOR DE PRODUCTOS (productos.html?q=...) ---------- */
  const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  function iniciarBuscador() {
    const lista = $('#lista-productos'), campo = $('#navSearch');
    if (!lista || !campo) return;
    const aviso = $('#noResults'), texto = $('#qText');
    const tarjetas = $$('.prod-card', lista);

    const filtrar = (q) => {
      const b = normalizar(q.trim()); let ok = 0;
      lista.classList.toggle('is-searching', !!b); // al buscar se muestran también los productos ocultos
      tarjetas.forEach((t) => { const v = !b || normalizar(t.textContent).includes(b); t.hidden = !v; if (v) ok++; });
      $$('.prod-sub, .prod-panel', lista).forEach((g) => { g.hidden = !g.querySelector('.prod-card:not([hidden])'); });
      if (aviso) { aviso.hidden = ok > 0 || !b; if (texto) texto.textContent = q.trim(); }
    };
    const q0 = new URLSearchParams(location.search).get('q') || '';
    campo.value = q0; filtrar(q0);
    campo.addEventListener('input', () => filtrar(campo.value));
    campo.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = campo.value.trim();
      history.replaceState(null, '', q ? '?q=' + encodeURIComponent(q) : location.pathname);
      filtrar(q);
      lista.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 5b. COLECCIÓN DE PRODUCTOS (panel lateral desde la derecha) ---------- */
  // Los botones "Ver colección" de las tarjetas abren un panel con TODOS los productos de las 3 categorías.
  // En la página solo se ven 4 productos por catálogo (ver coleccion.css); el resto vive en este panel.
  function iniciarColeccion() {
    const lista = $('#lista-productos');
    if (!lista) return;
    const paneles = $$('.prod-panel', lista);
    if (!paneles.length) return;

    const overlay = document.createElement('div');
    overlay.className = 'hf-col__overlay';
    const panel = document.createElement('aside');
    panel.className = 'hf-col';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Colección de productos');
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML =
      '<div class="hf-col__head"><h2>Colección</h2>' +
      '<button type="button" class="hf-col__x" aria-label="Cerrar colección"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button></div>' +
      '<div class="hf-col__tabs" role="tablist"></div>' +
      '<div class="hf-col__body"></div>';
    document.body.append(overlay, panel);

    const tabs = $('.hf-col__tabs', panel), cuerpo = $('.hf-col__body', panel), cerrar = $('.hf-col__x', panel);
    const etiquetas = { alimentacion: 'Energéticos', ejercicio: 'Ejercicio', prendas: 'Prendas' };
    let armado = false, foco = null;
    const secciones = [], botones = [];

    const clonar = (t) => { const c = t.cloneNode(true); c.hidden = false; c.classList.remove('reveal'); $$('a.btn[href="#"]', c).forEach((a) => a.remove()); return c; };
    const grilla = (origen) => { const g = document.createElement('div'); g.className = 'hf-col__grid'; $$('.prod-card', origen).forEach((t) => g.appendChild(clonar(t))); return g; };

    function armar() {
      if (armado) return; armado = true;
      paneles.forEach((p) => {
        const sec = document.createElement('section'); sec.className = 'hf-col__cat'; sec.dataset.cat = p.id;
        const h = document.createElement('h3'); h.textContent = $('.prod-panel__title h2', p)?.textContent || p.id;
        sec.appendChild(h);
        const subs = $$('.prod-sub', p);
        if (subs.length) subs.forEach((s) => {
          const t = document.createElement('h4'); t.className = 'sub-title'; t.textContent = $('.sub-title', s)?.textContent || '';
          sec.append(t, grilla(s));
        });
        else sec.appendChild(grilla(p));
        cuerpo.appendChild(sec); secciones.push(sec);
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn btn--outline'; b.setAttribute('role', 'tab'); b.dataset.cat = p.id;
        b.textContent = etiquetas[p.id] || h.textContent;
        b.addEventListener('click', () => irA(p.id, true));
        tabs.appendChild(b); botones.push(b);
      });
      let pend = false;
      cuerpo.addEventListener('scroll', () => { if (!pend) { pend = true; requestAnimationFrame(() => { detectar(); pend = false; }); } }, { passive: true });
    }

    const marcar = (id) => botones.forEach((b) => {
      const on = b.dataset.cat === id;
      b.classList.toggle('btn--primary', on); b.classList.toggle('btn--outline', !on);
      b.setAttribute('aria-selected', String(on));
    });
    function irA(id, suave) {
      const s = secciones.find((x) => x.dataset.cat === id); if (!s) return;
      cuerpo.scrollTo({ top: s.offsetTop - cuerpo.offsetTop, behavior: suave && !reduceMotion ? 'smooth' : 'auto' });
      marcar(id);
    }
    function detectar() {
      const fin = cuerpo.scrollTop + cuerpo.clientHeight >= cuerpo.scrollHeight - 4;
      let id = secciones[0]?.dataset.cat;
      secciones.forEach((s) => { if (s.offsetTop - cuerpo.offsetTop <= cuerpo.scrollTop + 40) id = s.dataset.cat; });
      if (fin && secciones.length) id = secciones[secciones.length - 1].dataset.cat;
      marcar(id);
    }
    function abrir(v, id) {
      if (v) armar();
      panel.classList.toggle('open', v); overlay.classList.toggle('open', v);
      panel.setAttribute('aria-hidden', String(!v));
      document.body.classList.toggle('col-open', v);
      if (v) { foco = document.activeElement; irA(id || secciones[0]?.dataset.cat, false); cerrar.focus({ preventScroll: true }); }
      else if (foco) { foco.focus?.({ preventScroll: true }); foco = null; }
    }

    // Botón "Ver colección" de cualquier tarjeta → abre el panel en la categoría de esa tarjeta
    lista.addEventListener('click', (e) => {
      const a = e.target.closest('.prod-card a.btn[href="#"]');
      if (!a) return;
      e.preventDefault();
      abrir(true, a.closest('.prod-panel')?.id);
    });
    cerrar.addEventListener('click', () => abrir(false));
    overlay.addEventListener('click', () => abrir(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('open')) abrir(false); });
  }

  /* ---------- 6. FORMULARIOS (se envían a los PHP de la carpeta php/) ---------- */
  const esEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  const decir = (el, t, tipo) => { if (el) { el.className = 'form-msg ' + (tipo || ''); el.textContent = t; } };
  const invalido = (c, m) => c.setAttribute('aria-invalid', String(m));

  // Envía el formulario al PHP indicado en data-php y devuelve { ok, mensaje }
  async function enviarPHP(f) {
    try {
      const r = await fetch(f.dataset.php, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } });
      const j = await r.json().catch(() => null);
      if (j && typeof j.mensaje === 'string') return { ok: !!j.ok && r.ok, mensaje: j.mensaje };
      return { ok: false, mensaje: 'El servidor no respondió como se esperaba. Revisa que el sitio esté en un hosting con PHP.' };
    } catch {
      return { ok: false, mensaje: 'No se pudo enviar. Revisa tu conexión o que el sitio esté en un servidor con PHP.' };
    }
  }
  const ocupado = (f, v) => { const b = f.querySelector('button[type="submit"]'); if (b) b.disabled = v; };

  function iniciarSuscripcion() {
    const f = $('#subscribeForm'); if (!f) return;
    const c = $('#subscribeEmail'), m = $('#formMsg');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!esEmail(c.value)) { invalido(c, true); decir(m, 'Escribe un correo válido, por ejemplo nombre@gmail.com', 'error'); return; }
      invalido(c, false); decir(m, 'Enviando…'); ocupado(f, true);
      const r = await enviarPHP(f);
      ocupado(f, false);
      decir(m, r.mensaje, r.ok ? 'ok' : 'error');
      if (r.ok) f.reset();
    });
  }

  function iniciarContacto() {
    const f = $('#contactForm'); if (!f) return;
    const correo = $('#contactEmail'), asunto = $('#contactSubject');
    const msj = $('#contactMessage'), terminos = $('#contactTerms'), m = $('#contactMsg');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const malos = [];
      const rev = (c, ok) => { invalido(c, !ok); if (!ok) malos.push(c); };
      rev(correo, esEmail(correo.value)); rev(asunto, asunto.value !== '');
      rev(msj, msj.value.trim().length >= 10); rev(terminos, terminos.checked);
      if (malos.length) { decir(m, 'Revisa los campos marcados: correo válido, asunto, mensaje (mínimo 10 letras) y aceptar los términos.', 'error'); malos[0].focus(); return; }
      decir(m, 'Enviando…'); ocupado(f, true);
      const r = await enviarPHP(f);
      ocupado(f, false);
      decir(m, r.mensaje, r.ok ? 'ok' : 'error');
      if (r.ok) f.reset();
    });
    f.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') invalido(e.target, false); });
  }

  function iniciarComentarios() {
    const f = $('#commentForm'); if (!f) return;
    const lista = $('#commentList'), m = $('#commentMsg'), n = $('#commentName'), t = $('#commentText');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (n.value.trim().length < 2 || t.value.trim().length < 5) { decir(m, 'Escribe tu nombre y un comentario (mínimo 5 letras).', 'error'); return; }
      const nombre = n.value.trim(), texto = t.value.trim();
      decir(m, 'Enviando…'); ocupado(f, true);
      const r = await enviarPHP(f);
      ocupado(f, false);
      decir(m, r.mensaje, r.ok ? 'ok' : 'error');
      if (!r.ok) return;
      const li = document.createElement('li'), s = document.createElement('strong');
      s.textContent = nombre;
      li.append(s, document.createElement('br'), document.createTextNode(texto));
      lista.prepend(li); f.reset();
    });
  }

  /* ---------- 7. MULTIMEDIA ---------- */
  function iniciarMultimedia() {
    const audios = $$('audio');
    audios.forEach((a) => a.addEventListener('play', () => audios.forEach((o) => { if (o !== a) o.pause(); })));
    const auto = $$('video[autoplay]');
    if (auto.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((l) => l.forEach((x) => (x.isIntersecting ? x.target.play().catch(() => {}) : x.target.pause())), { threshold: 0.25 });
      auto.forEach((v) => io.observe(v));
    }
  }

  iniciarAparicion();
  iniciarCarrusel();
  iniciarCarrito();
  iniciarPestanas();
  iniciarBuscador();
  iniciarColeccion();
  iniciarSuscripcion();
  iniciarContacto();
  iniciarComentarios();
  iniciarMultimedia();
})();
