/* EV Lab AI droid widget for evlab.ee
 * - droid: glossy render (droid.webp, cut out of the reference) + SVG LED face with moods
 * - scene: two canvases (behind / in front of the droid) -> 3D particle vortex, thruster flames and sparks
 * - HUD terminal (built lazily): chat via n8n webhook, quick booking -> Supabase `leads`
 * No dependencies. Uses the page's global `supabaseClient` if present.
 */
(() => {
  "use strict";
  if (window.__evdLoaded) return;
  window.__evdLoaded = true;

  const SCRIPT_SRC = (document.currentScript && document.currentScript.src) || location.href;
  const ASSET = (f) => new URL(f, SCRIPT_SRC).href;
  const CFG = {
    webhook: "https://n8n.evlab.ee/webhook/evlab-chat",
    timeoutMs: 45000,
    googleReview: "https://g.page/r/CQoEp6qkUKTHECE/review",
    trustpilot: "https://www.trustpilot.com/evaluate/evlab.ee",
    phone: "+372 5551 6666",
    wa: "37255516666",
    leadCooldownMs: 60000,
    droidImg: ASSET("droid.webp?v=2"),
  };
  // anchor points on droid.webp, in % of the image (from the cut-out script)
  const A = { eyeL: [19.1, 35.3], eyeR: [42.8, 34.7], mouth: [29.9, 46.2], nozL: [12.4, 82.7], nozR: [83.5, 81.3], nozB: [43.1, 93.6] };
  const REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* private mode */ } },
    sget(k) { try { return sessionStorage.getItem(k); } catch (_) { return null; } },
    sset(k, v) { try { sessionStorage.setItem(k, v); } catch (_) { /* ignore */ } },
  };

  // ------------------------------------------------------------------ i18n
  const T = {
    et: {
      badge: "⚡ EV AI-insener • Küsi aku kohta",
      open: "Ava EV Lab AI-insener", close: "Sulge",
      status: "Online • Tallinn & Harjumaa",
      placeholder: "Nt: Hyundai Kona 2020, 110 000 km...",
      welcome: "Tere! Olen EV Lab virtuaalne akuinsener. Kirjuta auto mudel, aasta ja läbisõit — selgitan SoH-d, elementide pingeerinevust (ΔV) ja reaalset sõiduulatust ning aitan broneerida kohalesõiduga diagnostika Tallinnas ja Harjumaal (65 € / 135 €).",
      chips: [
        ["📅 Broneeri kontroll", "#book"],
        ["🔋 Mis on SoH?", "Mis on SoH ja kuidas seda mõõdetakse?"],
        ["⚖️ Elementide ΔV", "Mida näitab elementide pingeerinevus ΔV?"],
        ["🛣️ Reaalne ulatus", "Kuidas aku seisukord mõjutab reaalset sõiduulatust?"],
        ["💶 65 € vs 135 €", "Mis vahe on 65 € ekspresstestil ja 135 € koormusauditil?"],
      ],
      thinking: "Analüüsin...",
      error: `⚠️ AI-insener on hetkel kättesaamatu. Helista ${CFG.phone} või kirjuta WhatsAppi (wa.me/${CFG.wa}).`,
      offline: "(võrguühenduseta vastus)",
      reviewTitle: "Kas jäid konsultatsiooni või EV Lab teenusega rahule? Sinu 5★ tagasiside aitab meid väga!",
      review: "Jäta tagasiside",
      voiceNa: "Teie brauser ei toeta häälsisendit.",
      mic: "Häälsisend", send: "Saada",
      bTitle: "Broneeri aku kontroll", bSub: "Võtame ühendust 15 minuti jooksul (E–L 9–20).",
      bCar: "Auto mudel ja aasta", bCarPh: "nt. Tesla Model 3 2020",
      bContact: "Telefon või Telegram", bContactPh: "+372 5... või @kasutaja",
      bService: "Teenus",
      services: ["Ekspresstest (65 €)", "Dünaamiline koormusaudit (135 €)", "Ei tea veel — nõu"],
      bSubmit: "SAADA PÄRING", bCancel: "Tagasi", bSending: "Saadan...",
      bOk: "✓ Päring saadetud! Võtame peagi ühendust.",
      bOkChat: "Aitäh! Päring on vastu võetud — insener võtab ühendust telefoni või Telegrami teel.",
      bErrCar: "Sisesta auto mudel.", bErrContact: "Sisesta telefoninumber või @telegram.",
      bWait: "Päring on juba saadetud — võtame peagi ühendust!",
      bFail: "Ei õnnestunud saata — avame WhatsAppi.",
      waText: (s, car, c) => `Tere! Soovin broneerida: ${s}. Auto: ${car}. Kontakt: ${c}`,
    },
    ru: {
      badge: "⚡ EV AI-инженер • Проверка батареи",
      open: "Открыть AI-инженера EV Lab", close: "Закрыть",
      status: "Online • Таллинн и Харьюмаа",
      placeholder: "Напр.: Tesla Model 3 2020, 130 000 км...",
      welcome: "Привет! Я виртуальный инженер-диагност EV Lab. Напиши модель, год и пробег электромобиля — объясню SoH, разбаланс ячеек (ΔV) и реальный запас хода, и запишу на выездную диагностику в Таллинне и Харьюмаа (65 € / 135 €).",
      chips: [
        ["📅 Записаться", "#book"],
        ["🔋 Что такое SoH?", "Что такое SoH и как его измеряют?"],
        ["⚖️ Разбаланс ΔV", "Что показывает разбаланс ячеек ΔV?"],
        ["🛣️ Реальный запас хода", "Как состояние батареи влияет на реальный запас хода?"],
        ["💶 65 € vs 135 €", "В чём разница между экспресс-тестом за 65 € и нагрузочным аудитом за 135 €?"],
      ],
      thinking: "Анализирую...",
      error: `⚠️ AI-инженер временно недоступен. Позвоните ${CFG.phone} или напишите в WhatsApp (wa.me/${CFG.wa}).`,
      offline: "(ответ без подключения к серверу)",
      reviewTitle: "Понравилась консультация или работа EV Lab? Будем благодарны за оценку 5★!",
      review: "Оставить отзыв",
      voiceNa: "Ваш браузер не поддерживает голосовой ввод.",
      mic: "Голосовой ввод", send: "Отправить",
      bTitle: "Запись на проверку батареи", bSub: "Перезвоним или напишем в течение 15 минут (Пн–Сб 9–20).",
      bCar: "Модель и год авто", bCarPh: "напр. Tesla Model 3 2020",
      bContact: "Телефон или Telegram", bContactPh: "+372 5... или @username",
      bService: "Услуга",
      services: ["Экспресс-тест (65 €)", "Динамический нагрузочный аудит (135 €)", "Пока не знаю — нужна консультация"],
      bSubmit: "ОТПРАВИТЬ ЗАЯВКУ", bCancel: "Назад", bSending: "Отправляю...",
      bOk: "✓ Заявка отправлена! Скоро свяжемся.",
      bOkChat: "Спасибо! Заявка принята — инженер свяжется с вами по телефону или в Telegram.",
      bErrCar: "Укажите модель авто.", bErrContact: "Укажите телефон или @telegram.",
      bWait: "Заявка уже отправлена — скоро свяжемся!",
      bFail: "Не удалось отправить — открываю WhatsApp.",
      waText: (s, car, c) => `Здравствуйте! Хочу записаться: ${s}. Авто: ${car}. Контакт: ${c}`,
    },
    en: {
      badge: "⚡ EV AI-engineer • Battery check",
      open: "Open EV Lab AI engineer", close: "Close",
      status: "Online • Tallinn & Harjumaa",
      placeholder: "E.g.: VW ID.4 2021, 95 000 km...",
      welcome: "Hi! I'm EV Lab's virtual battery engineer. Send me the EV model, year and mileage — I'll explain SoH, cell imbalance (ΔV) and real-world range, and book a mobile diagnostic in Tallinn & Harjumaa (65 € / 135 €).",
      chips: [
        ["📅 Book a check", "#book"],
        ["🔋 What is SoH?", "What is SoH and how is it measured?"],
        ["⚖️ Cell ΔV", "What does cell voltage imbalance ΔV tell me?"],
        ["🛣️ Real range", "How does battery health affect real-world range?"],
        ["💶 65 € vs 135 €", "What is the difference between the 65 € Express Test and the 135 € Load Audit?"],
      ],
      thinking: "Analysing...",
      error: `⚠️ The AI engineer is temporarily unavailable. Call ${CFG.phone} or WhatsApp us (wa.me/${CFG.wa}).`,
      offline: "(offline answer)",
      reviewTitle: "Found our advice or EV Lab service helpful? Your 5★ review means a lot to us!",
      review: "Leave a review",
      voiceNa: "Voice input is not supported in this browser.",
      mic: "Voice input", send: "Send",
      bTitle: "Book a battery check", bSub: "We'll get back to you within 15 minutes (Mon–Sat 9–20).",
      bCar: "Car model and year", bCarPh: "e.g. Tesla Model 3 2020",
      bContact: "Phone or Telegram", bContactPh: "+372 5... or @username",
      bService: "Service",
      services: ["Express test (65 €)", "Dynamic load audit (135 €)", "Not sure yet — advise me"],
      bSubmit: "SEND REQUEST", bCancel: "Back", bSending: "Sending...",
      bOk: "✓ Request sent! We'll contact you shortly.",
      bOkChat: "Thank you! Your request is in — an engineer will contact you by phone or Telegram.",
      bErrCar: "Please enter the car model.", bErrContact: "Please enter a phone number or @telegram.",
      bWait: "Your request was already sent — we'll be in touch soon!",
      bFail: "Could not send — opening WhatsApp.",
      waText: (s, car, c) => `Hi! I'd like to book: ${s}. Car: ${car}. Contact: ${c}`,
    },
  };

  // Offline answers, used only if the n8n backend is unreachable.
  const FAQ = {
    soh: {
      et: "SoH (State of Health) näitab, kui palju aku mahutavusest on alles võrreldes uuega. Usaldusväärne SoH saadakse BMS-i andmetest ja koormustestist — mitte armatuurlaua protsendist. EV Lab mõõdab seda kohapeal ja annab PDF-sertifikaadi.",
      ru: "SoH (State of Health) — сколько ёмкости батареи осталось по сравнению с новой. Надёжный SoH получают из данных BMS и нагрузочного теста, а не по проценту на приборной панели. EV Lab измеряет его на месте и выдаёт PDF-сертификат.",
      en: "SoH (State of Health) is how much of the battery's capacity remains compared to new. A reliable SoH comes from BMS data plus a load test — not from the dashboard percentage. EV Lab measures it on site and issues a PDF certificate.",
    },
    delta: {
      et: "ΔV on suurima ja väikseima elemendi pinge vahe. Orienteeruvalt: 4–15 mV — tehase tasakaal, 16–30 mV — lubatud tööhälve, üle 50 mV — viitab nõrgale elemendile. Kõige ausam pilt tekib koormuse all, seda kontrollime 135 € koormusauditis.",
      ru: "ΔV — разница напряжений между самой сильной и самой слабой ячейкой. Ориентиры: 4–15 мВ — заводской баланс, 16–30 мВ — допустимый рабочий разбег, больше 50 мВ — признак слабой ячейки. Честнее всего разбаланс видно под нагрузкой — это проверяем в нагрузочном аудите за 135 €.",
      en: "ΔV is the voltage gap between the strongest and weakest cell. Rough guide: 4–15 mV — factory balance, 16–30 mV — acceptable working spread, above 50 mV — points to a weak cell. It shows most honestly under load, which we check in the 135 € load audit.",
    },
    range: {
      et: "Reaalne sõiduulatus ≈ kasutatav mahtuvus (sõltub SoH-st) jagatud tegeliku kuluga. Talvel ja kiirteel on kulu oluliselt suurem kui WLTP-normis, seega vähendab ka väike SoH langus ulatust märgatavalt.",
      ru: "Реальный запас хода ≈ доступная ёмкость (зависит от SoH), делённая на фактический расход. Зимой и на трассе расход заметно выше паспортного WLTP, поэтому даже небольшое падение SoH ощутимо снижает запас хода.",
      en: "Real range ≈ usable capacity (driven by SoH) divided by actual consumption. In winter and on motorways consumption is well above the WLTP figure, so even a small SoH drop noticeably cuts range.",
    },
    price: {
      et: "65 € ekspresstest: BMS-i andmed, SoH ja elementide pinged ~15 minutiga koos PDF-sertifikaadiga. 135 € koormusaudit: lisaks dünaamiline koormustest, mis paljastab nõrgad elemendid ja peidetud vead. Tuleme kohale Tallinnas ja Harjumaal.",
      ru: "65 € экспресс-тест: данные BMS, SoH и напряжения ячеек примерно за 15 минут с PDF-сертификатом. 135 € нагрузочный аудит: дополнительно динамический тест под нагрузкой, который выявляет слабые ячейки и скрытые дефекты. Выезжаем по Таллинну и Харьюмаа.",
      en: "65 € express test: BMS data, SoH and cell voltages in about 15 minutes with a PDF certificate. 135 € load audit: adds a dynamic load test that exposes weak cells and hidden faults. We come to you in Tallinn & Harjumaa.",
    },
  };
  const KW = {
    delta: /(Δ|delta|дельт|разбал|дисбал|ячейк|элемент|cell|imbalanc|balance|rakk|element|tasakaal|pingeerin)/i,
    soh: /(\bsoh\b|state of health|износ|деград|[её]мкост|здоров|health|degrad|capacity|mahtuv|tervis|kulum)/i,
    range: /(запас хода|пробег на|\brange\b|sõiduulatus|\bulatus|how far|сколько проед)/i,
    price: /(\d+\s?€|цен|стоим|тариф|price|cost|hind|maksa)/i,
    book: /(запис|брон|выезд|book|appointment|broneeri|tellida|tule kohale)/i,
  };
  const topicOf = (t) => ["delta", "soh", "range", "price"].find((k) => KW[k].test(t)) || null;

  // ------------------------------------------------------------------ state
  const pickLang = () => {
    const saved = store.get("evd_lang");
    if (saved && T[saved]) return saved;
    const nav = (navigator.language || "").toLowerCase();
    if (nav.startsWith("ru")) return "ru";
    if (nav.startsWith("en")) return "en";
    return "et";
  };
  let lang = pickLang();
  let isOpen = false, built = false, busy = false, recognition = null, moodTimer = 0;
  const chatHistory = [];
  let sessionId = store.sget("evd_sid");
  if (!sessionId) {
    sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    store.sset("evd_sid", sessionId);
  }
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  // ------------------------------------------------------------------ LED face (SVG over the visor)
  function faceSVG() {
    const [lx, ly] = A.eyeL, [rx, ry] = A.eyeR, [mx, my] = A.mouth;
    const caret = (x, y) => `M${x - 5.6} ${y + 2.4} Q${x} ${y - 7.6} ${x + 5.6} ${y + 2.4}`;
    const happyEyes = `<g class="evd-eyes"><path class="evd-led" d="${caret(lx, ly)}"/><path class="evd-led" d="${caret(rx, ry)}"/></g>`;
    return `<svg class="evd-face" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g class="evd-parallax">
 <g class="evd-mood evd-mood-happy">${happyEyes}<path class="evd-led" d="M${mx - 4.6} ${my - 0.6} Q${mx} ${my + 4} ${mx + 4.6} ${my - 0.6}"/></g>
 <g class="evd-mood evd-mood-talk">${happyEyes}<ellipse class="evd-led evd-talk-mouth" cx="${mx}" cy="${my + 0.6}" rx="3.4" ry="2.1"/></g>
 <g class="evd-mood evd-mood-scan"><path class="evd-led" d="M${lx - 5} ${ly} H${lx + 5}"/><path class="evd-led" d="M${rx - 5} ${ry} H${rx + 5}"/>
  <path class="evd-led solid evd-scanline" d="M${lx - 9} ${(ly + my) / 2} H${rx + 9}" stroke-width="1.1" opacity=".85"/></g>
 <g class="evd-mood evd-mood-think"><g>
  <circle class="evd-think-dot" cx="${mx - 7}" cy="${ly + 4}" r="1.9" fill="#9ffcff"/>
  <circle class="evd-think-dot" cx="${mx}" cy="${ly + 4}" r="1.9" fill="#9ffcff"/>
  <circle class="evd-think-dot" cx="${mx + 7}" cy="${ly + 4}" r="1.9" fill="#9ffcff"/></g></g>
 <g class="evd-mood evd-mood-alert"><path class="evd-led amber" d="M${lx - 5} ${ly - 3.5} L${lx + 4} ${ly}"/><path class="evd-led amber" d="M${rx + 5} ${ry - 3.5} L${rx - 4} ${ry}"/>
  <circle cx="${lx}" cy="${ly + 3}" r="1.5" fill="#FFD27A"/><circle cx="${rx}" cy="${ry + 3}" r="1.5" fill="#FFD27A"/>
  <path class="evd-led amber" d="M${mx - 3.5} ${my + 0.5} H${mx + 3.5}"/></g>
</g></svg>`;
  }

  // ------------------------------------------------------------------ particle sprites
  const sprite = (r, g, b) => {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const x = c.getContext("2d");
    const grd = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.22, `rgba(${r},${g},${b},.95)`);
    grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = grd;
    x.fillRect(0, 0, 32, 32);
    return c;
  };
  const SPR = [sprite(0, 240, 255), sprite(40, 130, 255), sprite(170, 250, 255), sprite(120, 90, 255)];

  // ------------------------------------------------------------------ droid scene
  // Rings: particles orbit on tilted circles (3D); back half drawn behind the droid, front half in front.
  const RINGS = [
    { r: 0.43, incl: 1.16, roll: -0.38, n: 170, sp: 0.62, spread: 0.035, alpha: 1 },   // saturn-like swirl
    { r: 0.47, incl: 1.28, roll: 0.52, n: 110, sp: -0.45, spread: 0.05, alpha: 0.75 },  // counter swirl
    { r: 0.485, incl: 0.22, roll: 0, n: 120, sp: 0.18, spread: 0.06, alpha: 0.45 },     // wide halo
  ];
  const NOZ = [
    { a: A.nozL, dir: Math.PI / 2 + 0.38, len: 0.34, w: 0.075 },
    { a: A.nozR, dir: Math.PI / 2 - 0.22, len: 0.34, w: 0.085 },
    { a: A.nozB, dir: Math.PI / 2, len: 0.2, w: 0.15 },
  ];

  class Scene {
    constructor(host, opts) {
      this.o = Object.assign({ density: 1, sparks: 26 }, opts);
      this.host = host;
      host.classList.add("evd-scene");
      host.innerHTML =
        `<canvas class="evd-cv-back" aria-hidden="true"></canvas>` +
        `<div class="evd-float"><div class="evd-body"><img alt="" src="${CFG.droidImg}" decoding="async" draggable="false">${faceSVG()}</div></div>` +
        `<canvas class="evd-cv-front" aria-hidden="true"></canvas>`;
      this.cb = $(".evd-cv-back", host); this.cf = $(".evd-cv-front", host);
      this.xb = this.cb.getContext("2d"); this.xf = this.cf.getContext("2d");
      this.body = $(".evd-body", host); this.par = $(".evd-parallax", host);
      this.boost = 0; this.target = 0; this.flash = 0; this.last = 0;
      this.parts = [];
      RINGS.forEach((ring, ri) => {
        const n = Math.round(ring.n * this.o.density);
        for (let i = 0; i < n; i++) {
          const g = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
          const c = Math.random();
          this.parts.push({
            ri, a: Math.random() * Math.PI * 2,
            r: 1 + g * ring.spread, sp: ring.sp * (0.7 + Math.random() * 0.6),
            sz: 0.45 + Math.pow(Math.random(), 2.2) * 1.6, ph: Math.random() * 6.28,
            spr: c < 0.58 ? 0 : c < 0.82 ? 1 : c < 0.95 ? 2 : 3,
            comet: ri === 0 && Math.random() < 0.05,
          });
        }
      });
      this.sparks = Array.from({ length: this.o.sparks }, () => ({ life: 0 }));
      this.resize();
    }
    resize() {
      const s = this.host.clientWidth || this.o.size || 160;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.s = s;
      // canvases overhang the stage by PAD on every side (CSS inset:-18%), so the boosted vortex,
      // arcs and shockwave are never clipped; drawing stays in stage coordinates via the translate.
      const PAD = 0.18, S = s * (1 + 2 * PAD);
      this.pad = s * PAD; this.S = S;
      [this.cb, this.cf].forEach((c) => { c.width = Math.round(S * dpr); c.height = Math.round(S * dpr); });
      [this.xb, this.xf].forEach((x) => x.setTransform(dpr, 0, 0, dpr, dpr * this.pad, dpr * this.pad));
      // droid image box inside the scene (matches .evd-body: left 18%, top 14%, size 64%)
      this.D = s * 0.64; this.bx = s * 0.18; this.by = s * 0.14;
      this.draw(0.9, 0);
    }
    pt(p) { return [this.bx + (p[0] / 100) * this.D, this.by + (p[1] / 100) * this.D]; }
    /** hover / finger down: accelerate; press(): additional burst (shockwave + arcs) */
    boostOn(on) { this.target = on ? 1 : 0; Loop.kick(); }
    press() { this.flash = 1; this.target = 1; Loop.kick(); }
    active() { return this.target > 0 || this.boost > 0.02 || this.flash > 0; }
    hover(dx, dy) {
      this.body.style.setProperty("--evd-rx", (-dy * 10).toFixed(1) + "deg");
      this.body.style.setProperty("--evd-ry", (dx * 14).toFixed(1) + "deg");
      this.par.setAttribute("transform", `translate(${(dx * 3).toFixed(2)} ${(dy * 2.4).toFixed(2)})`);
    }
    draw(t, dt) {
      const { xb, xf, s } = this;
      this.boost += (this.target - this.boost) * Math.min(1, dt * 6 || 0.1);
      this.flash = Math.max(0, this.flash - dt * 1.4);
      const cx = s / 2, cy = s * 0.47, k = s / 160, B = this.boost, F = this.flash;
      const o = this.pad, S = this.S;
      xb.clearRect(-o, -o, S, S); xf.clearRect(-o, -o, S, S);
      xb.globalCompositeOperation = xf.globalCompositeOperation = "lighter";

      // soft core glow behind the droid (flares up on hover / press)
      const glow = xb.createRadialGradient(cx, cy, s * 0.05, cx, cy, s * (0.5 + 0.12 * B));
      glow.addColorStop(0, `rgba(0,240,255,${Math.min(0.75, 0.16 + 0.24 * B + 0.4 * F)})`);
      glow.addColorStop(1, "rgba(0,240,255,0)");
      xb.fillStyle = glow; xb.fillRect(-o, -o, S, S);

      // thruster flames (behind the body, so the nozzles cover the roots)
      NOZ.forEach((nz, i) => this.flame(xb, nz, t, i));

      // vortex particles
      const spd = 1 + B * 2.4 + F * 2.5;
      const grow = 0.11 * B + 0.12 * F;
      for (const p of this.parts) {
        const ring = RINGS[p.ri];
        const R = s * ring.r * (1 + 0.03 * Math.sin(t * 1.3 + p.ri) + grow) * p.r;
        const n = p.comet ? 5 : 1;
        for (let j = 0; j < n; j++) {
          const ang = p.a + (t - j * 0.035) * p.sp * spd;
          const ca = Math.cos(ang), sa = Math.sin(ang);
          const y3 = sa * Math.cos(ring.incl), z3 = sa * Math.sin(ring.incl);
          const cr = Math.cos(ring.roll), sr = Math.sin(ring.roll);
          const x = cx + R * (ca * cr - y3 * sr);
          const y = cy + R * (ca * sr + y3 * cr);
          const depth = 0.5 + 0.5 * z3;                       // 0 back .. 1 front
          const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.6 + p.ph));
          let a = ring.alpha * tw * (0.35 + 0.65 * depth) * (1 - j / n);
          a = Math.min(1, a + 0.35 * B + 0.45 * F);
          const z = p.sz * (0.6 + 0.8 * depth) * k * 2.3 * (j ? 0.75 : 1) * (1 + 0.35 * B + 0.35 * F);
          const ctx = z3 >= 0 ? xf : xb;
          ctx.globalAlpha = a;
          ctx.drawImage(SPR[p.spr], x - z, y - z, z * 2, z * 2);
        }
      }

      // electric arcs: hull -> vortex, flicker every frame; strong on hover/press, rare at idle
      const nArcs = Math.round(3.2 * B + 4 * F + (Math.random() < 0.012 ? 1 : 0));
      for (let i = 0; i < nArcs; i++) this.arc(xf, cx, cy, s, k, 0.45 + 0.4 * B + 0.4 * F);

      // press shockwave
      if (F > 0) {
        xf.globalAlpha = F;
        xf.strokeStyle = "rgba(160,250,255,.9)";
        xf.lineWidth = (1 + 2.5 * F) * k;
        xf.beginPath();
        xf.ellipse(cx, cy, s * (0.24 + (1 - F) * 0.28), s * (0.24 + (1 - F) * 0.28) * 0.94, 0, 0, Math.PI * 2);
        xf.stroke();
      }

      // exhaust sparks (in front)
      if (dt > 0) this.spawn(dt, t);
      for (const sp of this.sparks) {
        if (sp.life <= 0) continue;
        sp.age += dt;
        if (sp.age >= sp.life) { sp.life = 0; continue; }
        sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vy += 40 * k * dt;
        const f = 1 - sp.age / sp.life;
        xf.globalAlpha = f;
        const z = (0.8 + f) * k * 2;
        xf.drawImage(SPR[sp.spr], sp.x - z, sp.y - z, z * 2, z * 2);
      }
      xb.globalAlpha = xf.globalAlpha = 1;
      xb.globalCompositeOperation = xf.globalCompositeOperation = "source-over";
    }
    arc(ctx, cx, cy, s, k, alpha) {
      const a0 = Math.random() * Math.PI * 2;
      const a1 = a0 + (Math.random() - 0.5) * 0.9;
      const r0 = s * 0.25, r1 = s * (0.41 + Math.random() * 0.08);
      let x = cx + Math.cos(a0) * r0, y = cy + Math.sin(a0) * r0 * 0.94;
      const x1 = cx + Math.cos(a1) * r1, y1 = cy + Math.sin(a1) * r1 * 0.94;
      const seg = 7, dx = (x1 - x) / seg, dy = (y1 - y) / seg, len = Math.hypot(dx, dy);
      const nx = -dy / (len || 1), ny = dx / (len || 1);
      const pts = [[x, y]];
      for (let i = 1; i < seg; i++) {
        const j = (Math.random() - 0.5) * s * 0.06;
        pts.push([x + dx * i + nx * j, y + dy * i + ny * j]);
      }
      pts.push([x1, y1]);
      for (const [w, col] of [[3.2, "rgba(0,240,255,.28)"], [1.1, "rgba(225,255,255,.95)"]]) {
        ctx.globalAlpha = Math.min(1, alpha * (0.6 + 0.4 * Math.random()));
        ctx.strokeStyle = col; ctx.lineWidth = w * k; ctx.lineJoin = "round";
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.stroke();
      }
      ctx.globalAlpha = Math.min(1, alpha);
      const z = 3.2 * k;
      ctx.drawImage(SPR[2], x1 - z, y1 - z, z * 2, z * 2);            // hot spot where the arc hits the vortex
    }
    flame(ctx, nz, t, i) {
      const [x, y] = this.pt(nz.a);
      const B = this.boost, F = this.flash;
      const f = 0.82 + 0.12 * Math.sin(t * 29 + i * 2) + 0.08 * Math.sin(t * 47 + i * 5) + 0.45 * B + 0.6 * F;
      const L = this.D * nz.len * f, w = this.D * nz.w * (0.92 + 0.08 * Math.sin(t * 37 + i)) * (1 + 0.25 * B);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(nz.dir - Math.PI / 2);
      ctx.globalAlpha = 1;
      const g1 = ctx.createRadialGradient(0, L * 0.25, 0, 0, L * 0.25, L * 0.7);
      g1.addColorStop(0, `rgba(0,200,255,${Math.min(0.85, 0.45 + 0.3 * B + 0.3 * F)})`);
      g1.addColorStop(1, "rgba(0,120,255,0)");
      ctx.fillStyle = g1;
      ctx.beginPath(); ctx.ellipse(0, L * 0.3, w * 1.5, L * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      const g2 = ctx.createLinearGradient(0, 0, 0, L);
      g2.addColorStop(0, "rgba(255,255,255,.95)");
      g2.addColorStop(0.18, "rgba(150,250,255,.9)");
      g2.addColorStop(0.55, "rgba(0,170,255,.45)");
      g2.addColorStop(1, "rgba(60,80,255,0)");
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.bezierCurveTo(-w / 2, L * 0.35, -w * 0.14, L * 0.78, 0, L);
      ctx.bezierCurveTo(w * 0.14, L * 0.78, w / 2, L * 0.35, w / 2, 0);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    spawn(dt, t) {
      this._acc = (this._acc || 0) + dt * (18 + 70 * this.boost + 120 * this.flash);
      while (this._acc >= 1) {
        this._acc -= 1;
        const sp = this.sparks.find((q) => q.life <= 0);
        if (!sp) break;
        const nz = NOZ[Math.random() < 0.45 ? 0 : Math.random() < 0.8 ? 1 : 2];
        const [x, y] = this.pt(nz.a);
        const ang = nz.dir + (Math.random() - 0.5) * 0.5;
        const v = this.D * (0.9 + Math.random() * 0.9);
        Object.assign(sp, { x, y: y + this.D * 0.04, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v,
          age: 0, life: 0.25 + Math.random() * 0.45, spr: Math.random() < 0.6 ? 2 : 0 });
      }
    }
  }

  // Animation loop. With prefers-reduced-motion the droid stays still while idle and only animates
  // during user-initiated interaction (hover / press / waiting for an answer), then settles to a still frame.
  const Loop = {
    scenes: new Set(), raf: 0, t0: performance.now(), last: 0,
    set(sc, on) {
      if (on) this.scenes.add(sc); else this.scenes.delete(sc);
      if (on && REDUCED) sc.draw(0.9, 0);
      this.kick();
    },
    wanted() { for (const s of this.scenes) if (!REDUCED || s.active()) return true; return false; },
    kick() { if (!this.raf && !document.hidden && this.wanted()) this.raf = requestAnimationFrame(this.tick); },
    tick(now) {
      Loop.raf = 0;
      const t = (now - Loop.t0) / 1000;
      const dt = Math.min(0.05, Loop.last ? t - Loop.last : 0.016);
      Loop.last = t;
      Loop.scenes.forEach((s) => {
        if (!REDUCED || s.active()) { s.draw(t, dt); s.settled = false; }
        else if (!s.settled) { s.boost = 0; s.flash = 0; s.draw(0.9, 0); s.settled = true; }
      });
      if (!Loop.wanted()) Loop.last = 0;
      Loop.kick();
    },
  };
  document.addEventListener("visibilitychange", () => { Loop.last = 0; Loop.kick(); });

  // ------------------------------------------------------------------ mood
  let root;
  function setMood(m, revertMs) {
    root.dataset.mood = m;
    clearTimeout(moodTimer);
    if (revertMs) moodTimer = setTimeout(() => { root.dataset.mood = "happy"; }, revertMs);
  }

  // ------------------------------------------------------------------ launcher
  let launcher, launchScene, headScene;
  function buildLauncher() {
    root = el("div", "evd-root");
    root.dataset.mood = "happy";
    launcher = el("button", "evd-launcher");
    launcher.type = "button";
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-controls", "evd-panel");
    launcher.innerHTML = `<span class="evd-badge"></span><span class="evd-stage"></span>`;
    root.appendChild(launcher);
    document.body.appendChild(root);
    const stage = $(".evd-stage", launcher);
    stage.style.cssText = "position:absolute;inset:0";
    launchScene = new Scene(stage, { density: 1, sparks: 28, size: 168 });
    Loop.set(launchScene, true);

    // Same "power-up" for mouse hover (desktop) and finger hold (touch); press/click adds a burst.
    const boost = (on) => { launchScene.boostOn(on); launcher.classList.toggle("is-boost", on); };
    launcher.addEventListener("pointerenter", () => { boost(true); ensureBuilt(); });
    launcher.addEventListener("pointerdown", () => { boost(true); launchScene.press(); ensureBuilt(); });
    launcher.addEventListener("pointerleave", () => { boost(false); launchScene.hover(0, 0); });
    launcher.addEventListener("pointercancel", () => boost(false));
    launcher.addEventListener("focus", () => { ensureBuilt(); boost(true); });
    launcher.addEventListener("blur", () => boost(false));
    let opening = 0;
    launcher.addEventListener("click", (e) => {
      if (opening) return;
      if (e.detail === 0) launchScene.press();                       // keyboard activation: same burst
      opening = setTimeout(() => { opening = 0; toggle(true); }, REDUCED ? 120 : 260);  // let the burst show
    });
    launcher.addEventListener("pointermove", (e) => {
      const b = launcher.getBoundingClientRect();
      launchScene.hover((e.clientX - b.left) / b.width - 0.5, (e.clientY - b.top) / b.height - 0.5);
    });
    window.addEventListener("resize", () => { launchScene.resize(); if (headScene) headScene.resize(); }, { passive: true });

    applyLauncherText();
    if (!store.sget("evd_badge")) {
      setTimeout(() => {
        if (isOpen) return;
        const b = $(".evd-badge", launcher);
        b.classList.add("is-visible");
        store.sset("evd_badge", "1");
        setTimeout(() => b.classList.remove("is-visible"), 6000);
      }, 3500);
    }
  }
  function applyLauncherText() {
    $(".evd-badge", launcher).textContent = T[lang].badge;
    launcher.setAttribute("aria-label", T[lang].open);
  }

  // ------------------------------------------------------------------ panel
  let panel, msgs, chips, input, sheet;
  const ICON = {
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
  };

  function ensureBuilt() {
    if (built) return;
    built = true;
    panel = el("div", "evd-panel");
    panel.id = "evd-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-labelledby", "evd-title");
    panel.innerHTML = `
<div class="evd-head">
  <div class="evd-avatar"></div>
  <div class="evd-title"><b id="evd-title">EVLAB.EE · AI</b><span class="evd-status"><i></i><span data-t="status"></span></span></div>
  <div class="evd-ctrls">
    <button type="button" class="evd-lang" data-lang="et">ET</button>
    <button type="button" class="evd-lang" data-lang="ru">RU</button>
    <button type="button" class="evd-lang" data-lang="en">EN</button>
    <button type="button" class="evd-icon" data-act="review" data-tt="review">★</button>
    <button type="button" class="evd-icon" data-act="close" data-tt="close">✕</button>
  </div>
</div>
<div class="evd-msgs" aria-live="polite"></div>
<div class="evd-chips"></div>
<form class="evd-input" autocomplete="off">
  <button type="button" class="evd-btn" data-act="mic" data-tt="mic">${ICON.mic}</button>
  <input type="text" maxlength="600" enterkeyhint="send">
  <button type="submit" class="evd-btn send" data-tt="send">${ICON.send}</button>
</form>
<form class="evd-sheet" novalidate>
  <h3 data-t="bTitle"></h3><p data-t="bSub"></p>
  <label class="evd-field"><span data-t="bCar"></span><input name="car" maxlength="80" autocomplete="off"></label>
  <label class="evd-field"><span data-t="bContact"></span><input name="contact" maxlength="60" inputmode="text" autocomplete="tel"></label>
  <label class="evd-field"><span data-t="bService"></span><select name="service"></select></label>
  <input class="evd-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
  <div class="evd-row"><button type="button" class="evd-cancel" data-t="bCancel"></button><button type="submit" class="evd-submit" data-t="bSubmit"></button></div>
  <div class="evd-formmsg" role="status"></div>
</form>`;
    root.appendChild(panel);
    msgs = $(".evd-msgs", panel);
    chips = $(".evd-chips", panel);
    input = $(".evd-input input", panel);
    sheet = $(".evd-sheet", panel);
    headScene = new Scene($(".evd-avatar", panel), { density: 0.45, sparks: 10, size: 64 });

    panel.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.lang) setLang(b.dataset.lang);
      else if (b.dataset.act === "close") toggle(false);
      else if (b.dataset.act === "review") showReview();
      else if (b.dataset.act === "mic") voice(b);
    });
    $(".evd-input", panel).addEventListener("submit", (e) => { e.preventDefault(); send(); });
    sheet.addEventListener("submit", submitLead);
    $(".evd-cancel", sheet).addEventListener("click", () => openSheet(false));

    renderTexts();
    addMsg(T[lang].welcome, "bot");
  }

  function renderTexts() {
    const t = T[lang];
    panel.querySelectorAll("[data-t]").forEach((n) => { n.textContent = t[n.dataset.t]; });
    panel.querySelectorAll("[data-tt]").forEach((n) => { n.title = t[n.dataset.tt]; n.setAttribute("aria-label", t[n.dataset.tt]); });
    panel.querySelectorAll(".evd-lang").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    input.placeholder = t.placeholder;
    $('[name="car"]', sheet).placeholder = t.bCarPh;
    $('[name="contact"]', sheet).placeholder = t.bContactPh;
    const sel = $('[name="service"]', sheet);
    const idx = sel.selectedIndex > 0 ? sel.selectedIndex : 1;
    sel.innerHTML = t.services.map((s) => `<option>${s}</option>`).join("");
    sel.selectedIndex = idx;
    chips.innerHTML = "";
    t.chips.forEach(([label, text], i) => {
      const b = el("button", "evd-chip" + (i === 0 ? " primary" : ""));
      b.type = "button";
      b.textContent = label;
      b.addEventListener("click", () => (text === "#book" ? openSheet(true) : send(text)));
      chips.appendChild(b);
    });
  }
  function setLang(l) {
    if (!T[l] || l === lang) return;
    lang = l;
    store.set("evd_lang", l);
    applyLauncherText();
    renderTexts();
    addMsg(T[lang].welcome, "bot");
  }

  // ------------------------------------------------------------------ open / close
  function toggle(open) {
    if (open === isOpen) return;
    ensureBuilt();
    isOpen = open;
    root.classList.toggle("is-open", open);
    launcher.setAttribute("aria-expanded", String(open));
    launchScene.target = 0; launchScene.flash = 0;               // launcher is hidden/shown calm
    launcher.classList.remove("is-boost");
    Loop.set(launchScene, !open);
    Loop.set(headScene, open);
    if (open) {
      headScene.resize();
      headScene.press();
      setTimeout(() => headScene.boostOn(false), 300);
      setMood("scan", 900);
      setTimeout(() => input.focus({ preventScroll: true }), 350);
      if (typeof window.gtag === "function") window.gtag("event", "evd_open", { lang });
    } else {
      openSheet(false);
      launcher.focus({ preventScroll: true });
    }
  }
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !isOpen) return;
    if (sheet && sheet.classList.contains("is-open")) openSheet(false);
    else toggle(false);
  });

  // ------------------------------------------------------------------ chat
  function addMsg(text, who) {
    const m = el("div", "evd-msg " + who);
    m.textContent = text;
    msgs.appendChild(m);
    msgs.scrollTop = msgs.scrollHeight;
    return m;
  }
  function typeInto(node, text) {
    return new Promise((resolve) => {
      if (REDUCED) { node.textContent = text; msgs.scrollTop = msgs.scrollHeight; return resolve(); }
      const step = Math.max(2, Math.ceil(text.length / 90));
      let i = 0;
      node.textContent = "";
      const tick = () => {
        i = Math.min(text.length, i + step);
        node.textContent = text.slice(0, i);
        msgs.scrollTop = msgs.scrollHeight;
        if (i < text.length) requestAnimationFrame(tick); else resolve();
      };
      requestAnimationFrame(tick);
    });
  }
  function showReview() {
    const box = el("div", "evd-msg bot");
    box.textContent = "⭐ " + T[lang].reviewTitle;
    const links = el("div", "evd-review");
    [["Google 5★", CFG.googleReview], ["Trustpilot ★", CFG.trustpilot]].forEach(([label, href]) => {
      const a = el("a");
      a.href = href; a.target = "_blank"; a.rel = "noopener"; a.textContent = label;
      links.appendChild(a);
    });
    box.appendChild(links);
    msgs.appendChild(box);
    msgs.scrollTop = msgs.scrollHeight;
  }

  async function send(preset) {
    const text = (preset || input.value).trim();
    if (!text || busy) return;
    if (!preset) input.value = "";
    busy = true;
    addMsg(text, "user");
    const topic = topicOf(text);
    if (KW.book.test(text)) setTimeout(() => openSheet(true), 600);
    setMood("scan");
    if (headScene) headScene.boostOn(true);
    const loader = addMsg("⏳ " + T[lang].thinking, "bot");
    const thinkTimer = setTimeout(() => setMood("think"), 1200);

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CFG.timeoutMs);
    let reply = "", data = null;
    try {
      const res = await fetch(CFG.webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, lang, source: "ev-droid", session_id: sessionId, history: chatHistory.slice(-6) }),
        signal: ctrl.signal,
      });
      try { data = await res.json(); } catch (_) { /* non-JSON */ }
      reply = data && typeof data.reply === "string" ? data.reply.trim() : "";
      if (!res.ok || !reply) { console.error("[EV Droid] bad backend response", res.status, data); reply = ""; }
    } catch (err) {
      console.error("[EV Droid] request failed", err);
    } finally {
      clearTimeout(timer);
      clearTimeout(thinkTimer);
      if (headScene) headScene.boostOn(false);
    }

    if (!reply) {
      const faq = topic && FAQ[topic] ? FAQ[topic][lang] : null;
      reply = faq ? faq + "\n\n" + T[lang].offline + " " + T[lang].error.replace(/^⚠️\s*/, "") : T[lang].error;
    } else {
      chatHistory.push({ role: "user", content: text }, { role: "assistant", content: reply });
      if (chatHistory.length > 12) chatHistory.splice(0, chatHistory.length - 12);
    }
    const tl = data && data.telemetry;
    const alarm = tl && typeof tl.delta_mv === "number" && tl.delta_mv > 50;
    setMood("talk");
    await typeInto(loader, reply);
    setMood(alarm ? "alert" : "happy", 4000);
    if (data && data.show_review_cta) showReview();
    busy = false;
  }

  function voice(btn) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { addMsg(T[lang].voiceNa, "sys"); return; }
    if (recognition) { recognition.stop(); return; }
    recognition = new SR();
    recognition.lang = { et: "et-EE", ru: "ru-RU", en: "en-US" }[lang];
    recognition.interimResults = false;
    recognition.onstart = () => { btn.classList.add("rec"); setMood("scan"); };
    recognition.onend = () => { btn.classList.remove("rec"); recognition = null; if (!busy) setMood("happy"); };
    recognition.onerror = () => { /* onend follows */ };
    recognition.onresult = (e) => { const tr = e.results[0][0].transcript; input.value = tr; send(tr); };
    recognition.start();
  }

  // ------------------------------------------------------------------ booking -> Supabase `leads`
  function openSheet(open) {
    if (!sheet) return;
    sheet.classList.toggle("is-open", open);
    const msg = $(".evd-formmsg", sheet);
    msg.textContent = ""; msg.className = "evd-formmsg";
    if (open) {
      setMood("happy");
      setTimeout(() => $('[name="car"]', sheet).focus({ preventScroll: true }), 300);
    }
  }
  function normContact(v) {
    v = v.trim();
    const tme = v.match(/^(?:https?:\/\/)?t\.me\/([A-Za-z0-9_]{4,32})$/i);
    if (tme) return "@" + tme[1];
    if (/^@[A-Za-z0-9_]{4,32}$/.test(v)) return v;
    if (/^\+?[0-9][0-9\s\-()]{6,18}$/.test(v)) return v.replace(/\s+/g, " ");
    return null;
  }
  async function submitLead(e) {
    e.preventDefault();
    const t = T[lang];
    const msg = $(".evd-formmsg", sheet);
    const carIn = $('[name="car"]', sheet), conIn = $('[name="contact"]', sheet);
    const btn = $(".evd-submit", sheet);
    const say = (text, cls) => { msg.textContent = text; msg.className = "evd-formmsg " + (cls || ""); };
    carIn.removeAttribute("aria-invalid"); conIn.removeAttribute("aria-invalid");

    if ($('[name="website"]', sheet).value) { openSheet(false); return; }   // honeypot
    const car = carIn.value.trim();
    const contact = normContact(conIn.value);
    if (car.length < 2) { carIn.setAttribute("aria-invalid", "true"); say(t.bErrCar, "err"); carIn.focus(); return; }
    if (!contact) { conIn.setAttribute("aria-invalid", "true"); say(t.bErrContact, "err"); conIn.focus(); return; }
    const last = parseInt(store.get("last_lead_sent") || "0", 10);
    if (Date.now() - last < CFG.leadCooldownMs) { say(t.bWait, "ok"); return; }

    const service = $('[name="service"]', sheet).value + " · AI-droid";
    const row = {
      service,
      name: contact.startsWith("@") ? contact : "AI-droid (" + lang.toUpperCase() + ")",
      phone: contact,
      car,
      loc: "— (AI-droid, " + lang.toUpperCase() + ")",
    };
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = t.bSending;
    try {
      const sb = typeof supabaseClient !== "undefined" ? supabaseClient : null; // global from index.html
      if (!sb) throw new Error("supabaseClient missing");
      const { error } = await sb.from("leads").insert([row]);
      if (error) throw error;
      store.set("last_lead_sent", String(Date.now()));
      say(t.bOk, "ok");
      if (typeof window.gtag === "function") window.gtag("event", "generate_lead", { source: "ev-droid", lang });
      setTimeout(() => {
        openSheet(false);
        sheet.reset();
        addMsg(t.bOkChat, "bot");
        setMood("happy");
      }, 1400);
    } catch (err) {
      console.error("[EV Droid] lead submit failed", err);
      say(t.bFail, "err");
      window.open("https://wa.me/" + CFG.wa + "?text=" + encodeURIComponent(t.waText(service, car, contact)), "_blank", "noopener");
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  }

  // ------------------------------------------------------------------ boot + public API
  function boot() {
    buildLauncher();
    window.EVDroid = {
      open: () => toggle(true),
      close: () => toggle(false),
      ask: (q) => { toggle(true); send(String(q || "")); },
      book: () => { toggle(true); openSheet(true); },
    };
    window.evToggleChat = () => toggle(!isOpen);   // backwards compatibility with the old widget
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
