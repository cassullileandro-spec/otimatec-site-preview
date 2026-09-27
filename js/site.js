/* OTIMATEC — site.js (vanilla, sem dependências) */
(function () {
  'use strict';
  var d = document, w = window, body = d.body;
  body.classList.remove('no-js'); body.classList.add('js');
  var CFG = w.OTIMATEC || {};
  var reduz = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- utilidades ---------- */
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function on(el, ev, fn, opt) { if (el) el.addEventListener(ev, fn, opt); }
  function evento(nome, params) {
    w.dataLayer = w.dataLayer || [];
    var p = Object.assign({ event: nome }, params || {});
    w.dataLayer.push(p);
    if (typeof w.gtag === 'function') w.gtag('event', nome, params || {});
    if (CFG.debug) console.log('[evento]', nome, params || {});
  }
  function waUrl(msg) { return 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(msg || CFG.whatsappMsg || ''); }
  function utm() {
    var q = new URLSearchParams(w.location.search), o = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach(function (k) { if (q.get(k)) o[k] = q.get(k); });
    try { if (Object.keys(o).length) sessionStorage.setItem('otimatec_utm', JSON.stringify(o)); else { var s = sessionStorage.getItem('otimatec_utm'); if (s) o = JSON.parse(s); } } catch (e) {}
    return o;
  }

  /* ---------- rolagem: topbar, canais, rodapé ---------- */
  var rodape = $('.rodape');
  // a barra de canais só aparece depois que o topo da página (banner ou hero) sai inteiro da tela
  var topoPagina = $('.banner, .hero-escuro, .emp-topo');
  function aoRolar() {
    var y = w.scrollY || w.pageYOffset;
    body.classList.toggle('rolou', y > 80);
    var limite = topoPagina ? topoPagina.getBoundingClientRect().bottom + y - 8 : 400;
    body.classList.toggle('canais-visivel', y > limite);
  }
  on(w, 'scroll', aoRolar, { passive: true }); aoRolar();
  if (rodape && 'IntersectionObserver' in w) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { body.classList.toggle('rodape-visivel', e.isIntersecting); }); }, { threshold: 0.05 }).observe(rodape);
  }

  /* ---------- WhatsApp: mensagem por página + evento ---------- */
  $$('[data-wa]').forEach(function (a) {
    var msg = a.getAttribute('data-wa') || CFG.whatsappMsg;
    a.setAttribute('href', waUrl(msg));
    a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener');
    on(a, 'click', function () { evento('click_whatsapp', { origem: a.getAttribute('data-origem') || a.textContent.trim().slice(0, 40), pagina: CFG.pagina }); });
  });
  $$('a[href^="tel:"]').forEach(function (a) { on(a, 'click', function () { evento('click_telefone', { pagina: CFG.pagina }); }); });

  /* ---------- drawer ---------- */
  var drawer = $('#drawer'), ultimoFoco = null;
  function abrirDrawer() { if (!drawer) return; ultimoFoco = d.activeElement; drawer.classList.add('aberto'); drawer.removeAttribute('aria-hidden'); body.style.overflow = 'hidden'; var f = $('.drawer__fechar', drawer); if (f) f.focus(); }
  function fecharDrawer() { if (!drawer) return; drawer.classList.remove('aberto'); drawer.setAttribute('aria-hidden', 'true'); body.style.overflow = ''; if (ultimoFoco) ultimoFoco.focus(); }
  $$('[data-abre-drawer]').forEach(function (b) { on(b, 'click', function (e) { e.preventDefault(); abrirDrawer(); }); });
  if (drawer) { on($('.drawer__overlay', drawer), 'click', fecharDrawer); on($('.drawer__fechar', drawer), 'click', fecharDrawer); }

  /* ---------- modais genéricos ---------- */
  var modalAberto = null;
  function abrirModal(id, origem) {
    var m = d.getElementById(id); if (!m) return;
    ultimoFoco = origem || d.activeElement;
    m.classList.add('aberto'); m.removeAttribute('aria-hidden'); body.style.overflow = 'hidden'; modalAberto = m;
    var foco = $('[autofocus], input, button.opcao, .modal__fechar', m); if (foco) setTimeout(function () { foco.focus(); }, 50);
  }
  function fecharModal() {
    if (!modalAberto) return;
    modalAberto.classList.remove('aberto'); modalAberto.setAttribute('aria-hidden', 'true'); body.style.overflow = ''; modalAberto = null;
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }
  $$('.modal').forEach(function (m) { on($('.modal__overlay', m), 'click', fecharModal); $$('.modal__fechar', m).forEach(function (b) { on(b, 'click', fecharModal); }); });
  on(d, 'keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (lightbox && lightbox.classList.contains('aberto')) { fecharLightbox(); return; }
    if (modalAberto) { fecharModal(); return; }
    if (drawer && drawer.classList.contains('aberto')) fecharDrawer();
    if (sheet && sheet.classList.contains('aberto')) sheet.classList.remove('aberto');
  });
  // foco preso em modal/drawer
  on(d, 'keydown', function (e) {
    if (e.key !== 'Tab') return;
    var cont = modalAberto ? $('.modal__card', modalAberto) : (drawer && drawer.classList.contains('aberto') ? $('.drawer__painel', drawer) : null);
    if (!cont) return;
    var fs = $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', cont).filter(function (x) { return x.offsetParent !== null; });
    if (!fs.length) return;
    var p = fs[0], u = fs[fs.length - 1];
    if (e.shiftKey && d.activeElement === p) { e.preventDefault(); u.focus(); } else if (!e.shiftKey && d.activeElement === u) { e.preventDefault(); p.focus(); }
  });
  $$('[data-modal]').forEach(function (b) {
    on(b, 'click', function (e) {
      e.preventDefault();
      var id = b.getAttribute('data-modal');
      if (id === 'modal-visita') prepararVisita(b.getAttribute('data-emp'));
      if (id === 'modal-email' && b.getAttribute('data-assunto')) { var s = $('#modal-email select[name="assunto"]'); if (s) s.value = b.getAttribute('data-assunto'); }
      if (id === 'modal-planta') prepararPlanta(b);
      if (b.getAttribute('data-opcao')) { var so = $('#' + id + ' select[name="assunto"]'); if (so) so.value = b.getAttribute('data-opcao'); }
      if (drawer && drawer.classList.contains('aberto')) fecharDrawer();
      abrirModal(id, b);
    });
  });

  /* ---------- formulários: máscara, validação, envio ---------- */
  function mascaraTel(v) {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) return '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + (v.length > 7 ? '-' + v.slice(7) : '');
    if (v.length > 2) return '(' + v.slice(0, 2) + ') ' + v.slice(2);
    if (v.length > 0) return '(' + v;
    return v;
  }
  $$('input[type="tel"]').forEach(function (i) { on(i, 'input', function () { i.value = mascaraTel(i.value); }); i.setAttribute('inputmode', 'numeric'); i.setAttribute('autocomplete', 'tel'); if (!i.placeholder) i.placeholder = '(11) 9XXXX-XXXX'; });
  function marcaErro(campo, msg) { var c = campo.closest('.campo') || campo.parentElement; if (!c) return; c.classList.add('invalido'); var e = $('.campo__erro', c); if (e) e.textContent = msg; campo.setAttribute('aria-invalid', 'true'); }
  function limpaErro(campo) { var c = campo.closest('.campo') || campo.parentElement; if (c) c.classList.remove('invalido'); campo.removeAttribute('aria-invalid'); }
  function validaCampo(i) {
    var v = (i.value || '').trim();
    if (i.type === 'checkbox') { if (i.required && !i.checked) { marcaErro(i, CFG.txt.erroVazio); return false; } limpaErro(i); return true; }
    if (i.required && !v) { marcaErro(i, CFG.txt.erroVazio); return false; }
    if (v && i.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { marcaErro(i, CFG.txt.erroEmail); return false; }
    if (v && i.type === 'tel' && v.replace(/\D/g, '').length < 10) { marcaErro(i, CFG.txt.erroTel); return false; }
    limpaErro(i); return true;
  }
  function validaForm(f) { var ok = true; $$('input, select, textarea', f).forEach(function (i) { if (i.closest('.hp')) return; if (!validaCampo(i)) ok = false; }); return ok; }
  $$('form[data-lead]').forEach(function (f) {
    $$('input, select, textarea', f).forEach(function (i) { on(i, 'blur', function () { validaCampo(i); }); on(i, 'input', function () { if (i.getAttribute('aria-invalid')) validaCampo(i); }); });
    // UTM em campos ocultos
    var u = utm(); Object.keys(u).forEach(function (k) { var h = d.createElement('input'); h.type = 'hidden'; h.name = k; h.value = u[k]; f.appendChild(h); });
    var hp = d.createElement('input'); hp.type = 'text'; hp.name = 'site_url'; hp.tabIndex = -1; hp.autocomplete = 'off'; var hpw = d.createElement('div'); hpw.className = 'hp'; hpw.setAttribute('aria-hidden', 'true'); hpw.appendChild(hp); f.appendChild(hpw);
    on(f, 'submit', function (e) {
      e.preventDefault();
      if (hp.value) return; // honeypot
      if (!validaForm(f)) { var p = $('.invalido input, .invalido select, .invalido textarea', f); if (p) p.focus(); return; }
      enviarLead(f);
    });
  });
  function dadosForm(f) { var o = {}; new FormData(f).forEach(function (v, k) { o[k] = v; }); o.pagina = CFG.pagina; o.url = w.location.href; o.formulario = f.getAttribute('data-lead'); o.data = new Date().toISOString(); return o; }
  function enviarLead(f, cb) {
    var btn = $('button[type="submit"]', f), txt = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.textContent = CFG.txt.carregando; }
    var dados = dadosForm(f);
    var fim = function (ok) {
      if (btn) { btn.disabled = false; btn.innerHTML = txt; }
      if (ok) evento('submit_lead', { formulario: dados.formulario, pagina: CFG.pagina });
      if (cb) return cb(ok);
      var msg = $('.form__msg', f) || d.createElement('div');
      msg.className = 'form__msg' + (ok ? '' : ' form__msg--erro'); msg.setAttribute('role', 'status');
      msg.textContent = ok ? (f.getAttribute('data-sucesso') || 'Mensagem recebida.') : CFG.txt.erroEnvio;
      if (!msg.parentNode) f.appendChild(msg);
      if (ok) { $$('input:not([type=hidden]), select, textarea', f).forEach(function (i) { if (i.type === 'checkbox') i.checked = false; else i.value = ''; }); $$('.form__campos', f).forEach(function (c) { c.hidden = true; }); if (btn) btn.hidden = true; }
    };
    var post = function (dados) {
      if (CFG.recaptcha && w.grecaptcha) { return w.grecaptcha.execute(CFG.recaptcha, { action: 'lead' }).then(function (t) { dados.recaptcha_token = t; return dados; }); }
      return Promise.resolve(dados);
    };
    if (!CFG.endpoint) { setTimeout(function () { fim(true); }, 600); return; } // sem endpoint configurado: modo demonstração
    post(dados).then(function (dd) { return fetch(CFG.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(dd) }); })
      .then(function (r) { fim(r.ok); }).catch(function () { fim(false); });
  }

  /* ---------- modal agendar visita ---------- */
  var mv = $('#modal-visita'), visita = { emp: null, dia: null, periodo: null, etapa: 1, pulaEtapa1: false };
  var FERIADOS = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'];
  var DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'], MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function prepararVisita(slug) {
    if (!mv) return;
    visita = { emp: null, dia: null, periodo: null, etapa: 1, pulaEtapa1: false };
    $$('.opcao', mv).forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
    if (slug) { var o = $('.opcao[data-emp="' + slug + '"]', mv); if (o) { o.setAttribute('aria-pressed', 'true'); visita.emp = slug; visita.pulaEtapa1 = true; } }
    montarCalendario();
    irEtapa(visita.pulaEtapa1 ? 2 : 1);
    $$('.modal__etapa', mv).forEach(function (e) { e.classList.remove('modal__etapa--fim'); });
  }
  // Contato: escolha do empreendimento no próprio card; "Continuar" abre o agendamento já no passo do dia
  $$('[data-agendar-inline]').forEach(function (card) {
    var ops = $$('.opcao', card), aviso = $('.contato-agendar__aviso', card), escolhido = null;
    ops.forEach(function (o) { on(o, 'click', function () { ops.forEach(function (x) { x.setAttribute('aria-pressed', x === o ? 'true' : 'false'); }); escolhido = o.getAttribute('data-emp'); if (aviso) aviso.hidden = true; }); });
    on($('.contato-agendar__btn', card), 'click', function (e) { if (!escolhido) { if (aviso) aviso.hidden = false; return; } prepararVisita(escolhido); abrirModal('modal-visita', e.currentTarget); });
  });
  function irEtapa(n) {
    visita.etapa = n;
    $$('.modal__etapa', mv).forEach(function (e) { e.classList.toggle('ativa', e.getAttribute('data-etapa') === String(n)); });
    var barra = $('.modal__progresso span', mv); if (barra) barra.style.width = ({ 1: '33%', 2: '66%', 3: '100%', 4: '100%', 5: '100%' })[n];
    var f = $('.modal__etapa.ativa input, .modal__etapa.ativa button.opcao, .modal__etapa.ativa .dia', mv); if (f) setTimeout(function () { f.focus(); }, 30);
  }
  function montarCalendario() {
    var cal = $('.calendario', mv); if (!cal) return; cal.innerHTML = '';
    var hoje = new Date(), n = 0, dt = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1), mesAtual = -1;
    while (n < 14) {
      var mmdd = ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);
      var feriado = FERIADOS.indexOf(mmdd) >= 0, domingo = dt.getDay() === 0;
      if (!feriado && !domingo) {
        if (dt.getMonth() !== mesAtual) { mesAtual = dt.getMonth(); var m = d.createElement('div'); m.className = 'calendario__mes'; m.textContent = MESES[mesAtual] + ' ' + dt.getFullYear(); cal.appendChild(m); }
        var b = d.createElement('button'); b.type = 'button'; b.className = 'dia'; b.setAttribute('aria-pressed', 'false');
        b.setAttribute('data-data', dt.toISOString().slice(0, 10)); b.setAttribute('data-dow', dt.getDay());
        b.innerHTML = '<small>' + DIAS[dt.getDay()] + '</small><b>' + dt.getDate() + '</b>';
        on(b, 'click', function (ev) { var el = ev.currentTarget; $$('.dia', cal).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); el.setAttribute('aria-pressed', 'true'); visita.dia = el.getAttribute('data-data'); ajustaPeriodos(+el.getAttribute('data-dow')); });
        cal.appendChild(b); n++;
      }
      dt.setDate(dt.getDate() + 1);
    }
  }
  function ajustaPeriodos(dow) {
    $$('.periodos .opcao', mv).forEach(function (p) {
      var sab = /s[aá]bado/i.test(p.textContent);
      p.disabled = dow === 6 ? !sab : sab;
      if (p.disabled) p.setAttribute('aria-pressed', 'false');
    });
    if (visita.periodo) { var atual = $('.periodos .opcao[aria-pressed="true"]', mv); if (!atual) visita.periodo = null; }
  }
  if (mv) {
    $$('.opcoes--emp .opcao', mv).forEach(function (o) { on(o, 'click', function () { $$('.opcoes--emp .opcao', mv).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); o.setAttribute('aria-pressed', 'true'); visita.emp = o.getAttribute('data-emp'); }); });
    $$('.periodos .opcao', mv).forEach(function (o) { on(o, 'click', function () { if (o.disabled) return; $$('.periodos .opcao', mv).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); o.setAttribute('aria-pressed', 'true'); visita.periodo = o.textContent.trim(); }); });
    $$('[data-etapa-ir]', mv).forEach(function (b) {
      on(b, 'click', function () {
        var alvo = +b.getAttribute('data-etapa-ir');
        if (alvo > visita.etapa) {
          if (visita.etapa === 1 && !visita.emp) { var av = $('.modal__aviso', $('.modal__etapa[data-etapa="1"]', mv)); if (av) av.hidden = false; return; }
          if (visita.etapa === 2 && (!visita.dia || !visita.periodo)) { var av2 = $('.modal__aviso', $('.modal__etapa[data-etapa="2"]', mv)); if (av2) av2.hidden = false; return; }
        }
        if (alvo === 1 && visita.pulaEtapa1) alvo = 2;
        irEtapa(alvo);
      });
    });
    var fv = $('form', mv);
    on(fv, 'submit', function (e) {
      e.preventDefault();
      if (!validaForm(fv)) return;
      $('input[name="empreendimento"]', fv).value = visita.emp || ''; $('input[name="dia"]', fv).value = visita.dia || ''; $('input[name="periodo"]', fv).value = visita.periodo || '';
      enviarLead(fv, function (ok) {
        if (ok) {
          evento('agendar_visita', { empreendimento: visita.emp, dia: visita.dia, periodo: visita.periodo });
          var emp = (CFG.plantoes || {})[visita.emp];
          var end = $('.visita__endereco', mv); if (end) { end.hidden = !emp; if (emp) end.textContent = CFG.txt.enderecoDecorado + ' ' + emp.plantao; }
          var maps = $('.visita__maps', mv); if (maps) { maps.hidden = !emp; if (emp) maps.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(emp.plantao); }
          var ics = $('.visita__ics', mv); if (ics) ics.href = gerarIcs(emp);
          irEtapa(4);
        } else { irEtapa(5); }
      });
    });
    on($('.visita__tentar', mv), 'click', function () { irEtapa(3); });
  }
  function gerarIcs(emp) {
    var dia = (visita.dia || '').replace(/-/g, ''), hora = /tarde/i.test(visita.periodo || '') ? '130000' : '090000';
    var fim = /tarde/i.test(visita.periodo || '') ? '170000' : (/s[aá]bado/i.test(visita.periodo || '') ? '130000' : '120000');
    var txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Otimatec//Visita//PT', 'BEGIN:VEVENT', 'UID:' + Date.now() + '@otimatec.com.br', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
      'DTSTART:' + dia + 'T' + hora, 'DTEND:' + dia + 'T' + fim, 'SUMMARY:Visita ao decorado ' + (emp ? emp.nome : 'Otimatec'), 'LOCATION:' + (emp ? emp.plantao : ''), 'DESCRIPTION:Visita agendada pelo site da Otimatec. ' + (visita.periodo || ''), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(txt);
  }

  /* ---------- modal planta (lead antes do PDF) ---------- */
  var mp = $('#modal-planta');
  function prepararPlanta(b) { if (!mp) return; mp.setAttribute('data-pdf', b.getAttribute('data-pdf') || ''); mp.setAttribute('data-planta', b.getAttribute('data-planta') || ''); var t = $('.planta-nome', mp); if (t) t.textContent = b.getAttribute('data-planta') || ''; $$('.modal__etapa', mp).forEach(function (e, i) { e.classList.toggle('ativa', i === 0); }); }
  if (mp) {
    var fp = $('form', mp);
    on(fp, 'submit', function (e) {
      e.preventDefault(); if (!validaForm(fp)) return;
      $('input[name="planta"]', fp).value = mp.getAttribute('data-planta');
      enviarLead(fp, function (ok) {
        if (!ok) { var m = $('.form__msg', fp); if (m) { m.hidden = false; m.textContent = CFG.txt.erroEnvio; } return; }
        evento('download_planta', { planta: mp.getAttribute('data-planta'), pagina: CFG.pagina });
        var link = $('.planta__baixar', mp); if (link) link.href = mp.getAttribute('data-pdf');
        $$('.modal__etapa', mp).forEach(function (e, i) { e.classList.toggle('ativa', i === 1); });
      });
    });
  }

  /* ---------- banner rotativo ---------- */
  var banner = $('.banner');
  if (banner) {
    var slides = $$('.banner__slide', banner), bolinhas = $$('.banner__bolinhas button', banner), idx = 0, timer = null;
    function mostra(i) { idx = (i + slides.length) % slides.length; slides.forEach(function (s, k) { s.classList.toggle('ativo', k === idx); s.setAttribute('aria-hidden', k === idx ? 'false' : 'true'); }); bolinhas.forEach(function (b, k) { b.setAttribute('aria-selected', k === idx ? 'true' : 'false'); }); }
    var pausado = !!reduz, pausa = $('.banner__pausa', banner);
    function auto() { parar(); if (pausado || slides.length < 2) return; timer = setInterval(function () { mostra(idx + 1); }, 6000); }
    function marcaPausa() { if (!pausa) return; pausa.setAttribute('aria-pressed', pausado ? 'true' : 'false'); pausa.setAttribute('aria-label', pausado ? 'Retomar a troca automática' : 'Pausar a troca automática'); pausa.classList.toggle('pausado', pausado); }
    on(pausa, 'click', function () { pausado = !pausado; marcaPausa(); if (pausado) parar(); else auto(); });
    marcaPausa();
    // clicar na foto ou no texto do slide leva à página do empreendimento (botões e links mantêm a própria ação)
    slides.forEach(function (s) { var url = s.getAttribute('data-href'); if (!url) return; on(s, 'click', function (e) { if (e.target.closest('a, button')) return; w.location.href = url; }); });
    function parar() { if (timer) clearInterval(timer); timer = null; }
    on($('.seta--prox', banner), 'click', function () { mostra(idx + 1); auto(); });
    on($('.seta--ant', banner), 'click', function () { mostra(idx - 1); auto(); });
    bolinhas.forEach(function (b, k) { on(b, 'click', function () { mostra(k); auto(); }); });
    // só pausa com o foco do teclado dentro do banner; o mouse parado em cima não trava mais a troca
    on(banner, 'focusin', function (e) { if (e.target !== pausa) parar(); }); on(banner, 'focusout', auto);
    on(banner, 'keydown', function (e) { if (e.key === 'ArrowRight') { mostra(idx + 1); } if (e.key === 'ArrowLeft') { mostra(idx - 1); } });
    var tx = null; on(banner, 'touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true }); on(banner, 'touchend', function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) mostra(dx < 0 ? idx + 1 : idx - 1); tx = null; auto(); });
    mostra(0); auto();
  }

  /* ---------- carrosséis de cards / fotos ---------- */
  $$('.carrossel').forEach(function (c) {
    var t = $('.carrossel__trilho', c); if (!t) return;
    function passo() { var it = $('.carrossel__item', t); return it ? it.getBoundingClientRect().width + 24 : t.clientWidth; }
    on($('.seta--prox', c), 'click', function () { t.scrollBy({ left: passo(), behavior: reduz ? 'auto' : 'smooth' }); });
    on($('.seta--ant', c), 'click', function () { t.scrollBy({ left: -passo(), behavior: reduz ? 'auto' : 'smooth' }); });
    on(t, 'keydown', function (e) { if (e.key === 'ArrowRight') t.scrollBy({ left: passo() }); if (e.key === 'ArrowLeft') t.scrollBy({ left: -passo() }); });
    if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '0');
  });

  /* ---------- fade-up, números, barras de obra ---------- */
  if ('IntersectionObserver' in w) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; var el = e.target; el.classList.add('visivel'); io.unobserve(el);
        if (el.hasAttribute('data-conta')) contar(el);
        if (el.classList.contains('bento__card')) contarCena(el);
        if (el.classList.contains('barra__fill')) el.style.width = el.getAttribute('data-pct') + '%';
        if (el.classList.contains('circulo')) { var f = $('.fill', el); if (f) f.style.strokeDashoffset = 565.48 * (1 - (+el.getAttribute('data-pct') || 0) / 100); }
      });
    }, { threshold: 0.15 });
    $$('.fade-up, [data-conta], .barra__fill, .circulo').forEach(function (el) { if (el.closest('.bento__palco')) return; io.observe(el); });
  } else { $$('.fade-up').forEach(function (el) { el.classList.add('visivel'); }); }
  function contarCena(card) {
    $$('.bento__palco [data-conta]', card).forEach(function (t) {
      var atr = reduz ? 0 : (+t.getAttribute('data-atraso') || 0);
      setTimeout(function () { contar(t); }, atr);
    });
  }
  function contar(el) {
    var alvo = parseFloat(el.getAttribute('data-conta')), pre = el.getAttribute('data-prefixo') || '', suf = el.getAttribute('data-sufixo') || '';
    if (reduz || isNaN(alvo)) { el.textContent = pre + alvo + suf; return; }
    var ini = performance.now(), dur = 1200;
    (function passo(t) { var p = Math.min(1, (t - ini) / dur), v = Math.round(alvo * (1 - Math.pow(1 - p, 3))); el.textContent = pre + v + suf; if (p < 1) requestAnimationFrame(passo); })(ini);
  }

  /* ---------- vitrine: fileiras movidas pelo scroll ---------- */
  var vitrine = $('[data-vitrine]');
  if (vitrine && !reduz) {
    var fileiras = $$('.vitrine__fileira', vitrine), agendado = false;
    function moveVitrine() {
      agendado = false;
      var r = vitrine.getBoundingClientRect(), vh = w.innerHeight;
      if (r.bottom < -200 || r.top > vh + 200) return;
      var p = (vh - r.top) / (vh + r.height); // 0 ao entrar, 1 ao sair
      fileiras.forEach(function (f) {
        var s = +f.getAttribute('data-sentido'), metade = f.scrollWidth / 2, alcance = Math.min(metade - w.innerWidth * .5, w.innerWidth * .45);
        var x = s < 0 ? -alcance * p : -alcance * (1 - p);
        f.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      });
    }
    on(w, 'scroll', function () { if (!agendado) { agendado = true; requestAnimationFrame(moveVitrine); } }, { passive: true });
    on(w, 'resize', moveVitrine); moveVitrine();
  }

  /* ---------- cenas ilustradas: replay no hover ---------- */
  $$('.bento__card').forEach(function (card) {
    var palco = $('.bento__palco', card); if (!palco) return;
    var ocupado = false;
    on(card, 'mouseenter', function () {
      if (ocupado || reduz || !card.classList.contains('visivel')) return; ocupado = true;
      var svg = $('svg', palco), novo = svg.cloneNode(true); palco.replaceChild(novo, svg);
      $$('[data-conta]', novo).forEach(function (t) { t.textContent = (t.getAttribute('data-prefixo') || '') + '0' + (t.getAttribute('data-sufixo') || ''); });
      contarCena(card);
      setTimeout(function () { ocupado = false; }, 2600);
    });
  });

  /* ---------- vídeo lite (YouTube) ---------- */
  $$('.video-lite').forEach(function (v) {
    var id = v.getAttribute('data-yt'); if (!id) return;
    // capa em alta (1280 px); se o vídeo não tiver, cai para a de 480 px
    var img = $('img', v); if (img && !img.getAttribute('src')) { img.loading = 'lazy'; img.onerror = function () { img.onerror = null; img.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; }; img.src = 'https://i.ytimg.com/vi/' + id + '/maxresdefault.jpg'; }
    on($('.video-lite__play', v), 'click', function () {
      // vídeo com incorporação desativada no YouTube: abre no YouTube em vez de mostrar "vídeo indisponível"
      if (v.hasAttribute('data-externo')) { evento('play_video', { video: id, pagina: CFG.pagina, externo: true }); return; } // o próprio link abre o YouTube
      var f = d.createElement('iframe'); f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0'; f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture'; f.allowFullscreen = true; f.title = v.getAttribute('data-titulo') || 'Vídeo';
      v.innerHTML = ''; v.appendChild(f); evento('play_video', { video: id, pagina: CFG.pagina });
    });
  });

  /* ---------- abas (plantas) ---------- */
  $$('[data-abas]').forEach(function (grupo) {
    var abas = $$('.aba', grupo), paineis = $$('.planta', grupo.parentElement);
    abas.forEach(function (a, i) {
      on(a, 'click', function () { abas.forEach(function (x, k) { x.setAttribute('aria-selected', k === i ? 'true' : 'false'); x.tabIndex = k === i ? 0 : -1; }); paineis.forEach(function (p, k) { p.classList.toggle('ativa', k === i); }); });
      on(a, 'keydown', function (e) { var k = i; if (e.key === 'ArrowRight' || e.key === 'ArrowDown') k = (i + 1) % abas.length; else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') k = (i - 1 + abas.length) % abas.length; else return; e.preventDefault(); abas[k].focus(); abas[k].click(); });
    });
  });

  /* ---------- galeria: filtros em pílula + lightbox ---------- */
  $$('[data-galeria]').forEach(function (g) {
    var pil = $$('.pilula', g), itens = $$('.carrossel__item', g);
    pil.forEach(function (p) {
      on(p, 'click', function () {
        if (p.disabled) return; var f = p.getAttribute('data-filtro');
        pil.forEach(function (x) { x.setAttribute('aria-selected', x === p ? 'true' : 'false'); });
        itens.forEach(function (it) { it.hidden = f !== 'todas' && it.getAttribute('data-tipo') !== f; });
      });
    });
  });
  var lightbox = $('#lightbox'), lbItens = [], lbIdx = 0;
  function abrirLightbox(lista, i) { if (!lightbox) return; lbItens = lista; lbIdx = i; renderLb(); lightbox.classList.add('aberto'); lightbox.removeAttribute('aria-hidden'); body.style.overflow = 'hidden'; $('.modal__fechar', lightbox).focus(); }
  function fecharLightbox() { lightbox.classList.remove('aberto'); lightbox.setAttribute('aria-hidden', 'true'); body.style.overflow = ''; }
  function renderLb() { var it = lbItens[lbIdx]; if (!it) return; var img = $('img', lightbox); img.src = it.src; img.alt = it.alt; $('figcaption', lightbox).textContent = it.legenda || ''; }
  // cards dos empreendimentos vendidos: "Acessar galeria" abre as perspectivas do book no lightbox
  $$('[data-abre-galeria]').forEach(function (b) {
    var abre = function (e) { if (e) e.preventDefault(); var card = b.closest('.card-emp'); if (!card) return; var lista = $$('.card-emp__fotos [data-lb-src]', card).map(function (x) { return { src: x.getAttribute('data-lb-src'), alt: x.getAttribute('data-lb-alt') || '', legenda: x.getAttribute('data-lb-legenda') || '' }; }); if (lista.length) abrirLightbox(lista, 0); };
    on(b, 'click', abre); on(b, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') abre(e); });
  });
  if (lightbox) {
    on($('.modal__fechar', lightbox), 'click', fecharLightbox); on($('.lightbox__overlay', lightbox), 'click', fecharLightbox);
    on($('.seta--prox', lightbox), 'click', function () { lbIdx = (lbIdx + 1) % lbItens.length; renderLb(); }); on($('.seta--ant', lightbox), 'click', function () { lbIdx = (lbIdx - 1 + lbItens.length) % lbItens.length; renderLb(); });
    on(d, 'keydown', function (e) { if (!lightbox.classList.contains('aberto')) return; if (e.key === 'ArrowRight') { lbIdx = (lbIdx + 1) % lbItens.length; renderLb(); } if (e.key === 'ArrowLeft') { lbIdx = (lbIdx - 1 + lbItens.length) % lbItens.length; renderLb(); } });
    $$('[data-lightbox]').forEach(function (grupo) {
      var figs = $$('[data-lb-src]', grupo);
      figs.forEach(function (f, i) {
        f.setAttribute('tabindex', '0'); f.setAttribute('role', 'button'); if (!f.getAttribute('aria-label')) f.setAttribute('aria-label', 'Ampliar: ' + (f.getAttribute('data-lb-alt') || 'imagem'));
        var abrir = function () { var vis = figs.filter(function (x) { return !(x.closest('.carrossel__item') && x.closest('.carrossel__item').hidden) && !(x.closest('.planta') && !x.closest('.planta').classList.contains('ativa')); }); var lista = vis.map(function (x) { return { src: x.getAttribute('data-lb-src'), alt: x.getAttribute('data-lb-alt') || '', legenda: x.getAttribute('data-lb-legenda') || '' }; }); abrirLightbox(lista, Math.max(0, vis.indexOf(f))); };
        on(f, 'click', abrir); on(f, 'keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
      });
    });
  }

  /* ---------- abas âncora + card lateral flutuante ---------- */
  var abasAnc = $('.abas-ancora');
  if (abasAnc) {
    var links = $$('ul a', abasAnc), secs = links.map(function (a) { var h = a.getAttribute('href') || ''; return h.charAt(0) === '#' ? $(h) : null; });
    function ativa() { var y = (w.scrollY || 0) + 200, atual = 0; secs.forEach(function (s, i) { if (s && s.offsetTop <= y) atual = i; }); links.forEach(function (a, i) { a.classList.toggle('ativo', i === atual); }); }
    on(w, 'scroll', ativa, { passive: true }); ativa();
    // o botão "Agendar visita" da barra de abas aparece quando os botões do topo saem da tela
    var topoCard = $('.emp-info__acoes') || $('.emp-topo .card-lateral'), formFinal = $('#garanta');
    if (topoCard && 'IntersectionObserver' in w) {
      var topoVis = true, formVis = false;
      new IntersectionObserver(function (es) { topoVis = es[0].isIntersecting || es[0].boundingClientRect.top > 0; ajusta(); }).observe(topoCard);
      if (formFinal) new IntersectionObserver(function (es) { formVis = es[0].isIntersecting || es[0].boundingClientRect.top < 0; ajusta(); }, { rootMargin: '-40% 0px 0px 0px' }).observe(formFinal);
      function ajusta() { body.classList.toggle('card-lateral-visivel', !topoVis && w.innerWidth >= 1024); }
    }
  }

  /* ---------- listagem /imoveis: filtros ---------- */
  var lista = $('#lista-imoveis'), sheet = $('#filtros-sheet');
  if (lista) {
    var fForm = $('#form-filtros'), cards = $$('[data-card]', lista), cont = $('#contagem'), vazio = $('#vazio'), ordem = $('#ordenar');
    var q = new URLSearchParams(w.location.search);
    ['cidade', 'bairro', 'tamanho', 'dorms', 'vagas', 'status', 'tag'].forEach(function (k) { var s = $('[name="' + k + '"]', fForm); if (s && q.get(k)) s.value = q.get(k); });
    function bairrosPorCidade() {
      var c = $('[name="cidade"]', fForm), b = $('[name="bairro"]', fForm); if (!c || !b) return;
      $$('option', b).forEach(function (o) { o.hidden = !!(o.getAttribute('data-cidade') && c.value && o.getAttribute('data-cidade') !== c.value); });
      var sel = b.options[b.selectedIndex]; if (sel && sel.hidden) b.value = '';
    }
    function aplica() {
      var f = {}; new FormData(fForm).forEach(function (v, k) { f[k] = v; });
      var n = 0;
      cards.forEach(function (c) {
        var ok = true;
        if (f.cidade && c.getAttribute('data-cidade') !== f.cidade) ok = false;
        if (f.bairro && c.getAttribute('data-bairro') !== f.bairro) ok = false;
        if (f.dorms && c.getAttribute('data-dorms').split(',').indexOf(f.dorms) < 0) ok = false;
        if (f.vagas && c.getAttribute('data-vagas').split(',').indexOf(f.vagas) < 0) ok = false;
        if (f.status && c.getAttribute('data-status') !== f.status) ok = false;
        if (f.tag && c.getAttribute('data-tags').split(',').indexOf(f.tag) < 0) ok = false;
        if (f.tamanho) { var mn = +c.getAttribute('data-amin'), mx = +c.getAttribute('data-amax'), r = { 'ate-30': [0, 30], '31-45': [31, 45], '46-70': [46, 70], 'acima-70': [71, 9999] }[f.tamanho]; if (r && (mx < r[0] || mn > r[1])) ok = false; }
        c.hidden = !ok; if (ok) n++;
      });
      if (cont) cont.textContent = n + (n === 1 ? ' empreendimento encontrado' : ' empreendimentos encontrados');
      if (vazio) vazio.hidden = n > 0;
      var ativos = Object.keys(f).filter(function (k) { return f[k]; }).length, btn = $('.filtros__abrir'); if (btn) btn.textContent = 'FILTRAR' + (ativos ? ' (' + ativos + ')' : '');
      var qs = new URLSearchParams(); Object.keys(f).forEach(function (k) { if (f[k]) qs.set(k, f[k]); }); var novo = w.location.pathname + (qs.toString() ? '?' + qs : ''); history.replaceState(null, '', novo);
      evento('filtro_busca', f);
    }
    function ordena() {
      var v = ordem ? ordem.value : 'recentes', arr = cards.slice();
      if (v === 'menor') arr.sort(function (a, b) { return +a.getAttribute('data-amin') - +b.getAttribute('data-amin'); });
      else if (v === 'maior') arr.sort(function (a, b) { return +b.getAttribute('data-amax') - +a.getAttribute('data-amax'); });
      else arr.sort(function (a, b) { return +a.getAttribute('data-ordem') - +b.getAttribute('data-ordem'); });
      arr.forEach(function (c) { lista.appendChild(c); }); var fut = $('.card-futuro', lista); if (fut) lista.appendChild(fut); if (vazio) lista.appendChild(vazio);
    }
    on(fForm, 'submit', function (e) { e.preventDefault(); aplica(); if (sheet) sheet.classList.remove('aberto'); });
    on($('[name="cidade"]', fForm), 'change', bairrosPorCidade);
    on($('.limpar', fForm), 'click', function () { fForm.reset(); bairrosPorCidade(); aplica(); marcaPreenchidos(fForm); });
    on(ordem, 'change', ordena);
    on($('.filtros__abrir'), 'click', function () { if (sheet) sheet.classList.add('aberto'); });
    if (sheet) { on($('.bottom-sheet__overlay', sheet), 'click', function () { sheet.classList.remove('aberto'); }); on($('.bottom-sheet__fechar', sheet), 'click', function () { sheet.classList.remove('aberto'); }); }
    bairrosPorCidade(); aplica(); ordena();
  }
  // campos de busca: estado "preenchido"
  function marcaPreenchidos(ctx) { $$('.campo--sel select', ctx).forEach(function (sel) { var c = sel.closest('.campo--sel'); if (c) c.classList.toggle('preenchido', !!sel.value); }); }
  $$('.campo--sel select').forEach(function (sel) { on(sel, 'change', function () { marcaPreenchidos(d); }); });
  $$('.busca__campos .campo--sel').forEach(function (c) { on(c, 'click', function (e) { var sel = $('select', c); if (e.target === sel) return; sel.focus(); try { sel.showPicker(); } catch (er) {} }); });
  marcaPreenchidos(d);
  // busca da home → querystring
  var buscaHome = $('#busca-home');
  if (buscaHome) {
    on($('[name="cidade"]', buscaHome), 'change', function () { var c = this.value, b = $('[name="bairro"]', buscaHome); $$('option', b).forEach(function (o) { o.hidden = !!(o.getAttribute('data-cidade') && c && o.getAttribute('data-cidade') !== c); }); var sel = b.options[b.selectedIndex]; if (sel && sel.hidden) b.value = ''; });
    on($('.busca__limpar', buscaHome), 'click', function () { buscaHome.reset(); $$('[name="bairro"] option', buscaHome).forEach(function (o) { o.hidden = false; }); marcaPreenchidos(buscaHome); });
    on(buscaHome, 'submit', function () { var f = {}; new FormData(buscaHome).forEach(function (v, k) { f[k] = v; }); evento('filtro_busca', f); });
  }

  /* ---------- cookies ---------- */
  var ck = $('#cookies');
  function consent() { try { return JSON.parse(localStorage.getItem('otimatec_cookies') || 'null'); } catch (e) { return null; } }
  function salvaConsent(o) { try { localStorage.setItem('otimatec_cookies', JSON.stringify(o)); } catch (e) {} if (o.analytics || o.marketing) carregaTags(o); if (ck) ck.classList.remove('aberto'); }
  function carregaTags(o) {
    if (w.__tagsCarregadas) return; w.__tagsCarregadas = true;
    w.dataLayer = w.dataLayer || [];
    if (typeof w.gtag === 'function') w.gtag('consent', 'update', { analytics_storage: o.analytics ? 'granted' : 'denied', ad_storage: o.marketing ? 'granted' : 'denied', ad_user_data: o.marketing ? 'granted' : 'denied', ad_personalization: o.marketing ? 'granted' : 'denied' });
    if (CFG.gtm && o.analytics) { var s = d.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtm.js?id=' + CFG.gtm; d.head.appendChild(s); w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' }); }
    if (CFG.pixel && o.marketing && !w.fbq) { !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(w, d, 'script', 'https://connect.facebook.net/en_US/fbevents.js'); w.fbq('init', CFG.pixel); w.fbq('track', 'PageView'); }
  }
  if (ck) {
    var c0 = consent();
    if (!c0) ck.classList.add('aberto'); else carregaTags(c0);
    on($('[data-ck="aceitar"]', ck), 'click', function () { salvaConsent({ necessarios: true, analytics: true, marketing: true }); });
    on($('[data-ck="rejeitar"]', ck), 'click', function () { salvaConsent({ necessarios: true, analytics: false, marketing: false }); });
    on($('[data-ck="personalizar"]', ck), 'click', function () { ck.classList.toggle('personalizar'); });
    on($('[data-ck="salvar"]', ck), 'click', function () { salvaConsent({ necessarios: true, analytics: $('[name="ck_analytics"]', ck).checked, marketing: $('[name="ck_marketing"]', ck).checked }); });
  }

  /* ---------- compartilhar (copiar link) ---------- */
  $$('[data-copiar-link]').forEach(function (b) { on(b, 'click', function () { try { navigator.clipboard.writeText(w.location.href); b.setAttribute('aria-label', 'Link copiado'); } catch (e) {} }); });
})();
