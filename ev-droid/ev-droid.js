/* EVLAB AI droid widget for evlab.ee
 * - droid: glossy render (droid.webp, cut out of the reference) + SVG LED face with moods
 * - scene: two canvases (behind / in front of the droid) -> 3D particle vortex, thruster flames and sparks
 * - HUD terminal (built lazily): chat via n8n webhook, quick booking -> Supabase `leads`
 * No dependencies. Leads are sent through the EVLAB backend (EvlConsent.sendLead), never directly to the database.
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
    googleReview: "https://g.page/r/CQoEp6qkUKTHECE/review",       // Google Business Profile EVLAB (то же в schema.org sameAs на evlab.ee)
    // Страница отзывов EVLAB на Tripadvisor. В коде сайта ссылки пока нет: впишите URL (https://www.tripadvisor.com/UserReviewEdit-… или страница компании) —
    // пока строка пустая, кнопка «Tripadvisor» в финальном сообщении не показывается (чтобы не вести клиента на чужую страницу).
    tripadvisorReview: "",
    trustpilot: "https://www.trustpilot.com/evaluate/evlab.ee",
    phone: "+372 5551 6666",
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
      bubble: "EVA · Assistent",
      open: "Ava EVLAB AI-insener", close: "Sulge",
      status: "Online • Tallinn & Harjumaa",
      title: "EVA · Digitaalne insener",
      placeholder: "Nt: Hyundai Kona 2020, 110 000 km...",
      welcome: "Tere! Mina olen EVA, sinu digitaalne insener. Räägin hea meelega, kuidas me elektriautode akusid kontrollime ja mis kuulub aruandesse, või aitan valida sobiva kontrolli. Küsi häälega või kirjuta!",
      chips: [
        ["📅 Broneeri kontroll", "#book"],
        ["🔋 Mis on SoH?", "Mis on SoH ja kuidas seda mõõdetakse?"],
        ["⚖️ Elementide ΔV", "Mida näitab elementide pingeerinevus ΔV?"],
        ["🛣️ Reaalne ulatus", "Kuidas aku seisukord mõjutab reaalset sõiduulatust?"],
        ["💶 65 € vs 135 €", "Mis vahe on 65 € ekspresstestil ja 135 € koormusauditil?"],
      ],
      thinking: "Analüüsin...",
      error: `⚠️ AI-insener on hetkel kättesaamatu. Helista ${CFG.phone}.`,
      offline: "(võrguühenduseta vastus)",
      reviewTitle: "Kas jäid konsultatsiooni või EVLAB teenusega rahule? Sinu 5★ tagasiside aitab meid väga!",
      review: "Jäta tagasiside",
      voiceNa: "Teie brauser ei toeta häälsisendit.",
      mic: "Häälsisend", send: "Saada", micBig: "Räägi", orType: "või kirjuta allpool",
      copy: "Kopeeri", copied: "Kopeeritud", speak: "Kuula vastust", stopSpeak: "Peata kuulamine",
      bTitle: "Broneeri aku kontroll", bSub: "Võtame ühendust 15 minuti jooksul (E–L 9–20).",
      bCar: "Sisesta auto reg-number või mark ja mudel", bCarPh: "Nt: 123 ABC või Hyundai Kona 2020",
      bContact: "Sisesta telefon, Telegram (@kasutaja) või e-post", bContactPh: "+372 5… · @kasutaja · e-post",
      legalPre: "Päringu saatmisega nõustud EVLABi ", legalLink: "andmekaitsetingimustega", legalPost: ".",
      bService: "Teenus",
      services: ["Ekspresstest (65 €)", "Dünaamiline koormusaudit (135 €)", "Ei tea veel — nõu"],
      bSubmit: "SAADA PÄRING", bCancel: "Tagasi", bSending: "Saadan...",
      bOk: "✓ Päring saadetud! Võtame peagi ühendust.",
      bOkChat: "Aitäh! Päring on vastu võetud — insener võtab peagi ühendust. Kui suhtlus minuga ja meie teenus meeldis, oleme väga tänulikud hinnangu ja paari sõna eest Google’is või Tripadvisoris!",
      bErrCar: "Sisesta auto reg-number või mark ja mudel.", bErrContact: "Sisesta telefon, Telegram (@kasutaja) või e-post.",
      bWait: "Päring on juba saadetud — võtame peagi ühendust!",
      bFail: `Ei õnnestunud saata. Palun helista ${CFG.phone}.`,
    },
    ru: {
      bubble: "EVA · Ассистент",
      open: "Открыть AI-инженера EVLAB", close: "Закрыть",
      status: "Online • Таллинн и Харьюмаа",
      title: "EVA · Цифровой инженер",
      placeholder: "Напр.: Tesla Model 3 2020, 130 000 км...",
      welcome: "Привет! Я Ева, ваш цифровой инженер. Могу рассказать, как мы проверяем батареи электромобилей, что входит в отчёт, или помочь выбрать подходящую проверку. Спрашивайте голосом или текстом!",
      chips: [
        ["📅 Записаться", "#book"],
        ["🔋 Что такое SoH?", "Что такое SoH и как его измеряют?"],
        ["⚖️ Разбаланс ΔV", "Что показывает разбаланс ячеек ΔV?"],
        ["🛣️ Реальный запас хода", "Как состояние батареи влияет на реальный запас хода?"],
        ["💶 65 € vs 135 €", "В чём разница между экспресс-тестом за 65 € и нагрузочным аудитом за 135 €?"],
      ],
      thinking: "Анализирую...",
      error: `⚠️ AI-инженер временно недоступен. Позвоните ${CFG.phone}.`,
      offline: "(ответ без подключения к серверу)",
      reviewTitle: "Понравилась консультация или работа EVLAB? Будем благодарны за оценку 5★!",
      review: "Оставить отзыв",
      voiceNa: "Ваш браузер не поддерживает голосовой ввод.",
      mic: "Голосовой ввод", send: "Отправить", micBig: "Говорить", orType: "или напишите ниже",
      copy: "Копировать", copied: "Скопировано", speak: "Озвучить", stopSpeak: "Остановить",
      bTitle: "Запись на проверку батареи", bSub: "Перезвоним или напишем в течение 15 минут (Пн–Сб 9–20).",
      bCar: "Укажите госномер авто или марку и модель", bCarPh: "Напр.: 123 ABC или Tesla Model 3 2020",
      bContact: "Укажите телефон, Telegram (@ник) или e-mail", bContactPh: "+372 5… · @ник · e-mail",
      legalPre: "Отправляя заявку, вы соглашаетесь с ", legalLink: "политикой конфиденциальности", legalPost: " EVLAB.",
      bService: "Услуга",
      services: ["Экспресс-тест (65 €)", "Динамический нагрузочный аудит (135 €)", "Пока не знаю — нужна консультация"],
      bSubmit: "ОТПРАВИТЬ ЗАЯВКУ", bCancel: "Назад", bSending: "Отправляю...",
      bOk: "✓ Заявка отправлена! Скоро свяжемся.",
      bOkChat: "Спасибо! Заявка принята — инженер скоро свяжется с вами. Если вам понравилось общаться со мной и наш сервис, будем очень рады вашей оценке и паре слов в Google или Tripadvisor!",
      bErrCar: "Укажите госномер авто или марку и модель.", bErrContact: "Укажите телефон, Telegram (@ник) или e-mail.",
      bWait: "Заявка уже отправлена — скоро свяжемся!",
      bFail: `Не удалось отправить. Пожалуйста, позвоните ${CFG.phone}.`,
    },
    en: {
      bubble: "EVA · Assistant",
      open: "Open EVLAB AI engineer", close: "Close",
      status: "Online • Tallinn & Harjumaa",
      title: "EVA · Digital Engineer",
      placeholder: "E.g.: VW ID.4 2021, 95 000 km...",
      welcome: "Hi! I’m EVA, your digital engineer. I’ll gladly explain how we test EV batteries, what’s included in the report, or help you pick the right inspection. Ask by voice or text!",
      chips: [
        ["📅 Book a check", "#book"],
        ["🔋 What is SoH?", "What is SoH and how is it measured?"],
        ["⚖️ Cell ΔV", "What does cell voltage imbalance ΔV tell me?"],
        ["🛣️ Real range", "How does battery health affect real-world range?"],
        ["💶 65 € vs 135 €", "What is the difference between the 65 € Express Test and the 135 € Load Audit?"],
      ],
      thinking: "Analysing...",
      error: `⚠️ The AI engineer is temporarily unavailable. Call ${CFG.phone}.`,
      offline: "(offline answer)",
      reviewTitle: "Found our advice or EVLAB service helpful? Your 5★ review means a lot to us!",
      review: "Leave a review",
      voiceNa: "Voice input is not supported in this browser.",
      mic: "Voice input", send: "Send", micBig: "Tap to speak", orType: "or just type below",
      copy: "Copy", copied: "Copied", speak: "Read aloud", stopSpeak: "Stop",
      bTitle: "Book a battery check", bSub: "We'll get back to you within 15 minutes (Mon–Sat 9–20).",
      bCar: "Enter license plate or car make & model", bCarPh: "e.g. 123 ABC or Tesla Model 3 2020",
      bContact: "Enter phone, Telegram (@username) or e-mail", bContactPh: "+372 5… · @username · e-mail",
      legalPre: "By submitting, you agree to EVLAB’s ", legalLink: "Privacy Policy", legalPost: ".",
      bService: "Service",
      services: ["Express test (65 €)", "Dynamic load audit (135 €)", "Not sure yet — advise me"],
      bSubmit: "SEND REQUEST", bCancel: "Back", bSending: "Sending...",
      bOk: "✓ Request sent! We'll contact you shortly.",
      bOkChat: "Thank you! Your request is confirmed — an engineer will contact you shortly. If you enjoyed chatting with me and our service, we’d really appreciate a quick rating and review on Google or Tripadvisor!",
      bErrCar: "Please enter the license plate or car make & model.", bErrContact: "Please enter a phone, Telegram (@username) or e-mail.",
      bWait: "Your request was already sent — we'll be in touch soon!",
      bFail: `Could not send. Please call ${CFG.phone}.`,
    },
  };

  // Offline answers, used only if the n8n backend is unreachable.
  const FAQ = {
    soh: {
      et: "SoH (State of Health) näitab, kui palju aku mahutavusest on alles võrreldes uuega. Usaldusväärne SoH saadakse BMS-i andmetest ja koormustestist — mitte armatuurlaua protsendist. EVLAB mõõdab seda kohapeal ja annab PDF-sertifikaadi.",
      ru: "SoH (State of Health) — сколько ёмкости батареи осталось по сравнению с новой. Надёжный SoH получают из данных BMS и нагрузочного теста, а не по проценту на приборной панели. EVLAB измеряет его на месте и выдаёт PDF-сертификат.",
      en: "SoH (State of Health) is how much of the battery's capacity remains compared to new. A reliable SoH comes from BMS data plus a load test — not from the dashboard percentage. EVLAB measures it on site and issues a PDF certificate.",
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
  const SPR = [sprite(34, 211, 238), sprite(56, 189, 248), sprite(45, 212, 191), sprite(200, 250, 255)];   // #22d3ee #38bdf8 #2dd4bf + светлая искра

  // ------------------------------------------------------------------ droid scene
  // Energy halo: three layers of fine particles flowing on a wavy ring (two crossing "DNA" strands + a diffuse haze).
  // A bright arc with a fading, scattering tail rotates slowly; hover / speech widen the wave and quicken the flow.
  const RING = { r: 0.5, n: 440, layers: [0.34, 0.34, 0.32] };
  const TAU = Math.PI * 2;
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
      // One positioned container: canvas halo + flames, droid body and front canvas all share the same centre (50% / 50%).
      host.innerHTML = `<div class="evd-orb-wrap">` +
        `<canvas class="evd-cv-back" aria-hidden="true"></canvas>` +
        `<div class="evd-float"><div class="evd-body"><img alt="" src="${CFG.droidImg}" decoding="async" draggable="false">${faceSVG()}</div></div>` +
        `<canvas class="evd-cv-front" aria-hidden="true"></canvas></div>`;
      this.cb = $(".evd-cv-back", host); this.cf = $(".evd-cv-front", host);
      this.xb = this.cb.getContext("2d"); this.xf = this.cf.getContext("2d");
      this.body = $(".evd-body", host); this.par = $(".evd-parallax", host);
      this.boost = 0; this.target = 0; this.flash = 0; this.last = 0;
      this.parts = [];
      {
        const n = Math.round(RING.n * this.o.density);
        for (let i = 0; i < n; i++) {
          const q = i / n, l = q < RING.layers[0] ? 0 : q < RING.layers[0] + RING.layers[1] ? 1 : 2;
          const c = Math.random();
          this.parts.push({
            l, a: Math.random() * TAU, sp: 0.8 + Math.random() * 0.4, ph: Math.random() * TAU,
            j: (Math.random() + Math.random() - 1), sc: Math.random(),
            sz: 0.4 + Math.pow(Math.random(), 2.4) * 0.9,
            spr: c < 0.07 ? 3 : l === 0 ? 0 : l === 1 ? 2 : 1,
          });
        }
      }
      this.talk = 0; this.talkT = 0; this.hx = 0; this.hy = 0;
      this.resize();
    }
    resize() {
      const s = this.host.clientWidth || this.o.size || 160;
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      this.s = s;
      // Canvases overhang the stage by PAD on every side so the wave halo is never clipped. They are centred with
      // left/top 50% + translate(-50%,-50%) (CSS); the backing store is a whole number of device pixels and the CSS
      // size is exactly backing/dpr, so the halo, flames and body keep one common centre on any screen / zoom.
      const px = Math.round(s * 1.36 * dpr), S = px / dpr;
      this.S = S; this.pad = (S - s) / 2;
      [this.cb, this.cf].forEach((c) => { c.width = px; c.height = px; c.style.width = S + "px"; c.style.height = S + "px"; });
      [this.xb, this.xf].forEach((x) => x.setTransform(dpr, 0, 0, dpr, dpr * this.pad, dpr * this.pad));
      // droid image box inside the scene (matches .evd-body: centred, 58% square)
      this.D = s * 0.58; this.bx = s * 0.21; this.by = s * 0.21;
      this.draw(0.9, 0);
    }
    pt(p) { return [this.bx + (p[0] / 100) * this.D, this.by + (p[1] / 100) * this.D]; }
    /** hover / finger down: accelerate; press(): additional burst (shockwave + arcs) */
    boostOn(on) { this.target = on ? 1 : 0; Loop.kick(); }
    press() { this.flash = 1; this.target = 1; Loop.kick(); }
    talkOn(on) { this.talkT = on ? 1 : 0; Loop.kick(); }
    active() { return this.target > 0 || this.boost > 0.02 || this.flash > 0 || this.talkT > 0 || this.talk > 0.02; }
    hover(dx, dy) {
      this.hx = dx; this.hy = dy;
      this.body.style.setProperty("--evd-rx", (-dy * 10).toFixed(1) + "deg");
      this.body.style.setProperty("--evd-ry", (dx * 14).toFixed(1) + "deg");
      this.par.setAttribute("transform", `translate(${(dx * 3).toFixed(2)} ${(dy * 2.4).toFixed(2)})`);
    }
    draw(t, dt) {
      const { xb, xf, s } = this;
      this.boost += (this.target - this.boost) * Math.min(1, dt * 6 || 0.1);
      this.flash = Math.max(0, this.flash - dt * 1.4);
      this.talk += (this.talkT - this.talk) * Math.min(1, dt * 4 || 0.1);
      if (dt) {                                                   // gentle idle sway of the body (adds to pointer tilt)
        this.body.style.setProperty("--evd-ry", (this.hx * 14 + 6 * Math.sin(t * 0.55)).toFixed(1) + "deg");
        this.body.style.setProperty("--evd-rx", (-this.hy * 10 + 3 * Math.sin(t * 0.43 + 1)).toFixed(1) + "deg");
      }
      const cx = s / 2, cy = s / 2, k = s / 208, B = this.boost, F = this.flash, I = 0.3 + 0.1 * Math.sin(t * 0.7), E = Math.min(1, Math.max(B, this.talk * 0.9, I) + F * 0.5);   // I: idle swell, the halo is never flat
      const o = this.pad, S = this.S;
      xb.clearRect(-o, -o, S, S); xf.clearRect(-o, -o, S, S);
      xb.globalCompositeOperation = xf.globalCompositeOperation = "lighter";

      // soft core glow behind the droid
      const glow = xb.createRadialGradient(cx, cy, s * 0.05, cx, cy, s * (0.52 + 0.1 * E));
      glow.addColorStop(0, `rgba(34,211,238,${Math.min(0.7, 0.13 + 0.2 * E + 0.35 * F)})`);
      glow.addColorStop(1, "rgba(34,211,238,0)");
      xb.fillStyle = glow; xb.fillRect(-o, -o, S, S);

      // thruster flames (behind the body, so the nozzles cover the roots)
      NOZ.forEach((nz, i) => this.flame(xb, nz, t, i));

      // halo ------------------------------------------------------------------
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.0);
      const R0 = s * RING.r * (1 + 0.015 * pulse + 0.035 * E);
      const amp = s * (0.022 + 0.016 * E);                       // wave depth (px), grows when hovered / speaking
      const flow = 0.11 * (1 + 1.3 * E), wt = t * 1.15 * (1 + 0.9 * E);
      const thead = t * 0.34 * (1 + 1.0 * E);                    // angle of the bright arc head
      const mod = (v) => ((v % TAU) + TAU) % TAU;
      const tailAt = (ang) => {                                  // 1 at the head, fading behind it, short soft ramp ahead
        let u = mod(thead - ang); if (u > Math.PI) u -= TAU;
        return u >= 0 ? Math.exp(-u * 0.85) : Math.max(0, 1 + u / 0.45);
      };
      const wave = (ang, layer) => {                             // radial offset in px; strand B is in antiphase (crossing ribbons)
        const ph = layer === 1 ? Math.PI : 0;
        return amp * (Math.sin(3 * ang - wt + ph) + 0.45 * Math.sin(5 * ang + wt * 0.7 + layer));
      };
      // soft ribbons (two strands) drawn as short segments so brightness follows the arc
      const SEG = this.o.density < 0.6 ? 36 : 72;
      xb.lineCap = "round";
      for (let l = 0; l < 2; l++) {
        xb.strokeStyle = l === 0 ? "rgb(34,211,238)" : "rgb(45,212,191)";
        xb.lineWidth = Math.max(0.8, s * (0.013 + 0.005 * E));
        let px = 0, py = 0;
        for (let i = 0; i <= SEG; i++) {
          const ang = (i / SEG) * TAU, r = R0 + wave(ang, l);
          const x = cx + r * Math.cos(ang), y = cy + r * Math.sin(ang);
          if (i) {
            xb.globalAlpha = Math.min(1, (0.07 + 0.3 * tailAt(ang)) * (1 + 0.6 * E));
            xb.beginPath(); xb.moveTo(px, py); xb.lineTo(x, y); xb.stroke();
          }
          px = x; py = y;
        }
      }
      // particles
      for (const p of this.parts) {
        const ang = p.a + t * flow * p.sp;
        const tl = tailAt(ang), dim = 1 - tl;
        let r = R0 + wave(ang, p.l === 2 ? 0 : p.l);
        const spread = p.l === 2 ? 0.05 : 0.012;               // the haze layer is wide; strands are tight near the head
        r += p.j * s * spread * (1 + 2.6 * dim * p.sc);
        if (p.l === 2) r += s * 0.03 * Math.sin(t * 0.8 + p.ph);
        if (p.sc > 0.82 && tl < 0.5) r += s * 0.07 * (p.sc - 0.82) * 5 * dim;   // stray sparks drifting out of the tail
        const x = cx + r * Math.cos(ang), y = cy + r * Math.sin(ang);
        const tw = 0.7 + 0.3 * Math.sin(t * 1.7 + p.ph);
        const a = Math.min(1, (0.3 + 0.7 * tl) * tw * (0.95 + 0.25 * E) * (p.l === 2 ? 0.6 : 1));
        const z = p.sz * k * 3.9 * (0.75 + 0.8 * tl) * (1 + 0.2 * E);
        xb.globalAlpha = a;
        xb.drawImage(SPR[p.spr], x - z, y - z, z * 2, z * 2);
      }
      // glowing head of the arc
      {
        const hr = R0 + wave(thead, 0);
        const hx = cx + hr * Math.cos(thead), hy = cy + hr * Math.sin(thead), hs = s * (0.13 + 0.04 * E);
        const g = xb.createRadialGradient(hx, hy, 0, hx, hy, hs);
        g.addColorStop(0, `rgba(190,250,255,${0.32 + 0.22 * E})`); g.addColorStop(0.4, `rgba(45,212,191,${0.16 + 0.12 * E})`); g.addColorStop(1, "rgba(34,211,238,0)");
        xb.globalAlpha = 1; xb.fillStyle = g; xb.fillRect(hx - hs, hy - hs, hs * 2, hs * 2);
      }
      xb.globalAlpha = xf.globalAlpha = 1;
      xb.globalCompositeOperation = xf.globalCompositeOperation = "source-over";
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
  }

  // Animation loop: the droid is always alive (float, sway, wave halo) from page load, no hover needed.
  const Loop = {
    scenes: new Set(), raf: 0, t0: performance.now(), last: 0,
    set(sc, on) {
      if (on) this.scenes.add(sc); else this.scenes.delete(sc);
      this.kick();
    },
    wanted() { return this.scenes.size > 0; },
    kick() { if (!this.raf && !document.hidden && this.wanted()) this.raf = requestAnimationFrame(this.tick); },
    tick(now) {
      Loop.raf = 0;
      const t = (now - Loop.t0) / 1000;
      const dt = Math.min(0.05, Loop.last ? t - Loop.last : 0.016);
      Loop.last = t;
      Loop.scenes.forEach((s) => s.draw(t, dt));
      if (!Loop.wanted()) Loop.last = 0;
      Loop.kick();
    },
  };
  document.addEventListener("visibilitychange", () => { Loop.last = 0; Loop.kick(); });

  // ------------------------------------------------------------------ mood
  let root;
  let speakingNow = false;                          // пока играет озвучка, «happy» подменяется анимацией речи
  function setMood(m, revertMs) {
    root.dataset.mood = speakingNow && m === "happy" ? "talk" : m;
    clearTimeout(moodTimer);
    if (revertMs) moodTimer = setTimeout(() => { root.dataset.mood = speakingNow ? "talk" : "happy"; }, revertMs);
  }
  function setSpeaking(on) {
    if (speakingNow === on) return;
    speakingNow = on;
    if (launchScene) launchScene.talkOn(on);
    if (!root) return;
    if (on) { if (root.dataset.mood !== "alert") root.dataset.mood = "talk"; }
    else if (root.dataset.mood === "talk") root.dataset.mood = "happy";
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
    launcher.innerHTML = `<span class="evd-stage"></span><span class="evd-bubble" aria-hidden="true"></span>`;
    root.appendChild(launcher);
    document.body.appendChild(root);
    const stage = $(".evd-stage", launcher);
    stage.style.cssText = "position:absolute;inset:0";
    launchScene = new Scene(stage, { density: 1, size: 208 });
    Loop.set(launchScene, true);

    // Same "power-up" for mouse hover (desktop) and finger hold (touch); press/click adds a burst.
    const boost = (on) => { launchScene.boostOn(on); launcher.classList.toggle("is-boost", on); };
    launcher.addEventListener("pointerenter", () => { boost(true); ensureBuilt(); preloadWelcome(lang, true); });
    launcher.addEventListener("pointerdown", () => { boost(true); launchScene.press(); ensureBuilt(); preloadWelcome(lang, true); });
    launcher.addEventListener("pointerleave", () => { if (!drag && !flyRaf) { boost(false); launchScene.hover(0, 0); } });
    launcher.addEventListener("pointercancel", () => boost(false));
    launcher.addEventListener("focus", () => { ensureBuilt(); boost(true); });
    launcher.addEventListener("blur", () => boost(false));
    // ---- перетаскивание и «пинок»: смещение > порога = полёт с инерцией и отскоком от краёв; короткий тап = открыть чат
    // облачко «EVA · Ассистент»: рядом с дроидом, за радиусом кольца; сторона выбирается так, чтобы не обрезаться краем экрана
    const bubble = $(".evd-bubble", launcher);
    const updateBubble = () => {
      const r = launcher.getBoundingClientRect(), vw = document.documentElement.clientWidth, need = bubble.offsetWidth + 16;
      const roomL = r.left, roomR = vw - r.right;
      let right = r.left + r.width / 2 < vw / 2;                       // дроид у левого края -> облачко справа
      if (!right && roomL < need && roomR > roomL) right = true;
      if (right && roomR < need && roomL > roomR) right = false;
      bubble.classList.toggle("is-right", right);
    };
    launcher.addEventListener("evd-layout", updateBubble);
    let pos = null, drag = null, flyRaf = 0, suppressClick = 0;
    const clampN = (v, a, b) => Math.min(b, Math.max(a, v));
    const bounds = () => {
      const sz = launcher.offsetWidth || 208;
      return { minX: -sz * 0.12, maxX: document.documentElement.clientWidth - sz * 0.88, minY: -sz * 0.12, maxY: document.documentElement.clientHeight - sz * 0.88 };
    };
    const place = (x, y) => {
      pos = { x, y };
      launcher.classList.add("is-free");
      launcher.style.left = x.toFixed(1) + "px"; launcher.style.top = y.toFixed(1) + "px";
      updateBubble();
    };
    const savePos = () => {
      if (!pos) return;
      const b = bounds();
      store.sset("evd_pos", JSON.stringify({ fx: (pos.x - b.minX) / (b.maxX - b.minX), fy: (pos.y - b.minY) / (b.maxY - b.minY) }));
    };
    const stopFly = () => { if (flyRaf) { cancelAnimationFrame(flyRaf); flyRaf = 0; } };
    const settle = () => {
      stopFly(); drag = null;
      launcher.classList.remove("is-dragging");
      boost(false); launchScene.hover(0, 0);
      savePos();
    };
    const fling = (vx, vy) => {
      let last = performance.now();
      const step = (now) => {
        const dt = Math.min(0.035, (now - last) / 1000); last = now;
        const b = bounds();
        let x = pos.x + vx * dt, y = pos.y + vy * dt;
        if (x < b.minX) { x = b.minX; vx = Math.abs(vx) * 0.62; } else if (x > b.maxX) { x = b.maxX; vx = -Math.abs(vx) * 0.62; }
        if (y < b.minY) { y = b.minY; vy = Math.abs(vy) * 0.62; } else if (y > b.maxY) { y = b.maxY; vy = -Math.abs(vy) * 0.62; }
        const f = Math.exp(-dt * 2.7); vx *= f; vy *= f;                  // мягкое затухание
        place(x, y);
        launchScene.hover(clampN(vx / 1500, -0.5, 0.5), clampN(vy / 1500, -0.5, 0.5));
        if (Math.hypot(vx, vy) > 22) flyRaf = requestAnimationFrame(step); else { flyRaf = 0; settle(); }
      };
      flyRaf = requestAnimationFrame(step);
    };
    // над баннером cookies: пока дроид «в доке», поднимаем его выше плашки (на телефоне баннер на всю ширину)
    const updateLift = () => {
      let lift = 0;
      const b = pos ? null : document.getElementById("evl-consent");
      if (b) {
        const r = b.getBoundingClientRect(), vw = document.documentElement.clientWidth, sz = launcher.offsetWidth || 208;
        if (r.width > 0 && r.right > vw - 24 - sz) lift = Math.max(0, document.documentElement.clientHeight - r.top);   // зазор над плашкой = базовый отступ (2–10px)
      }
      lift = Math.min(lift, Math.max(0, document.documentElement.clientHeight - (launcher.offsetWidth || 208) - 28));   // не выше экрана
      launcher.style.setProperty("--evd-lift", lift.toFixed(0) + "px");
      updateBubble();
    };
    new MutationObserver(updateLift).observe(document.body, { childList: true });
    launcher.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      stopFly();
      const r = launcher.getBoundingClientRect();
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top, moved: false, s: [{ t: e.timeStamp, x: e.clientX, y: e.clientY }] };
      primeAudio();
    });
    launcher.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < (e.pointerType === "mouse" ? 5 : 9)) return;
        drag.moved = true;
        try { launcher.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        launcher.classList.add("is-dragging"); boost(true);
      }
      const b = bounds();
      place(clampN(drag.ox + dx, b.minX, b.maxX), clampN(drag.oy + dy, b.minY, b.maxY));
      drag.s.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
      while (drag.s.length > 2 && e.timeStamp - drag.s[0].t > 90) drag.s.shift();
    });
    const endDrag = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      if (!d.moved) { drag = null; return; }
      drag = null;
      clearTimeout(suppressClick);
      suppressClick = setTimeout(() => { suppressClick = 0; }, 450);          // клик после броска не должен открывать чат
      const a = d.s[0], z = d.s[d.s.length - 1];
      let vx = 0, vy = 0;
      if (e.type === "pointerup" && e.timeStamp - z.t <= 90) {
        const dt = Math.max(0.016, (z.t - a.t) / 1000);
        vx = (z.x - a.x) / dt; vy = (z.y - a.y) / dt;
      }
      const sp = Math.hypot(vx, vy);
      if (sp > 2800) { vx *= 2800 / sp; vy *= 2800 / sp; }
      if (REDUCED || Math.hypot(vx, vy) < 160) settle(); else fling(vx, vy);
    };
    launcher.addEventListener("pointerup", endDrag);
    launcher.addEventListener("pointercancel", endDrag);
    try { const p = JSON.parse(store.sget("evd_pos") || "null"); if (p && isFinite(p.fx) && isFinite(p.fy)) { const b = bounds(); place(Math.max(6, b.minX + clampN(p.fx, 0, 1) * (b.maxX - b.minX)), Math.max(6, b.minY + clampN(p.fy, 0, 1) * (b.maxY - b.minY))); } } catch (_) { /* ignore */ }
    updateLift();

    let opening = 0;
    launcher.addEventListener("click", (e) => {
      if (suppressClick) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (opening) return;
      primeAudio();                                                    // жест пользователя: разрешаем озвучку приветствия (iOS)
      if (e.detail === 0) launchScene.press();                         // keyboard activation: same burst
      opening = setTimeout(() => { opening = 0; toggle(true); greet(); }, REDUCED ? 120 : 260);  // let the burst show
    });
    launcher.addEventListener("pointermove", (e) => {
      if (drag && drag.moved) return;
      const b = launcher.getBoundingClientRect();
      launchScene.hover((e.clientX - b.left) / b.width - 0.5, (e.clientY - b.top) / b.height - 0.5);
    });
    window.addEventListener("resize", () => {
      launchScene.resize(); if (headScene) headScene.resize();
      if (pos) { const b = bounds(); place(clampN(pos.x, b.minX, b.maxX), clampN(pos.y, b.minY, b.maxY)); }
      updateLift();
    }, { passive: true });

    applyLauncherText();
    updateBubble();
  }
  function applyLauncherText() {
    $(".evd-bubble", launcher).textContent = T[lang].bubble;
    launcher.setAttribute("aria-label", T[lang].open);
    launcher.dispatchEvent(new Event("evd-layout"));
  }

  // ------------------------------------------------------------------ panel
  let panel, msgs, chips, input, sheet;
  const ICON = {
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h4l5 4v-13l-5 4z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    spin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9"/></svg>',
    stop: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="6.5" y="6.5" width="11" height="11" rx="2"/></svg>',
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
  <div class="evd-title"><b id="evd-title" data-t="title"></b><span class="evd-status"><i></i><span data-t="status"></span></span></div>
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
  <label class="evd-field"><span data-t="bContact"></span><input name="contact" maxlength="80" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
  <p class="evd-legal"><span data-t="legalPre"></span><a class="evd-legal-link" data-t="legalLink" href="https://evlab.ee/privaatsuspoliitika.html" target="_blank" rel="noopener"></a><span data-t="legalPost"></span></p>
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
    headScene = new Scene($(".evd-avatar", panel), { density: 0.45, size: 64 });

    panel.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.lang) setLang(b.dataset.lang);
      else if (b.dataset.act === "close") toggle(false);
      else if (b.dataset.act === "review") showReview();
      else if (b.dataset.act === "mic") voice(b);
      else if (b.classList.contains("evd-act")) onAct(b);
    });
    $(".evd-input", panel).addEventListener("submit", (e) => { e.preventDefault(); send(); });
    sheet.addEventListener("submit", submitLead);
    $(".evd-cancel", sheet).addEventListener("click", () => openSheet(false));

    renderTexts();
    addWelcome();
  }

  function renderTexts() {
    const t = T[lang];
    panel.querySelectorAll("[data-t]").forEach((n) => { n.textContent = t[n.dataset.t]; });
    panel.querySelectorAll("[data-tt]").forEach((n) => { n.title = t[n.dataset.tt]; n.setAttribute("aria-label", t[n.dataset.tt]); });
    panel.querySelectorAll(".evd-lang").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    input.placeholder = t.placeholder;
    panel.querySelectorAll(".evd-act").forEach(labelAct);
    $('[name="car"]', sheet).placeholder = t.bCarPh;
    $('[name="contact"]', sheet).placeholder = t.bContactPh;
    $(".evd-legal-link", sheet).href = "https://evlab.ee/privaatsuspoliitika.html" + (lang === "et" ? "" : "#" + lang);   // политика на языке чата
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
    stopSpeak();                       // сразу обрываем озвучку приветствия на прежнем языке
    lang = l;
    store.set("evd_lang", l);
    applyLauncherText();
    renderTexts();
    const wm = addWelcome();
    if (l === "et") { loadEtManifest(); preloadWelcome("et"); }
    // переключение языка = жест пользователя: приветствие на новом языке сразу звучит тем же голосом EVA.
    // Фокус на поле ввода не ставится (на телефоне клавиатура не выпрыгивает).
    if (isOpen && CAN_SPEAK && wm && wm._text) {
      greeted = true;
      primeAudio();
      speak(wm.querySelector('[data-act="speak"]'), wm._text);
    }
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
    syncViewport();
    if (open) {
      headScene.resize();
      headScene.press();
      setTimeout(() => headScene.boostOn(false), 300);
      setMood("scan", 900);
      if (lang === "et") loadEtManifest();
      if (typeof window.gtag === "function") window.gtag("event", "evd_open", { lang });
    } else {
      stopSpeak();
      openSheet(false);
      launcher.focus({ preventScroll: true });
    }
  }
  // Keep the panel inside the *visual* viewport: on iOS/Android the on-screen keyboard does not shrink 100dvh.
  const vv = window.visualViewport;
  function syncViewport() {
    const mobile = window.matchMedia && matchMedia("(max-width: 640px)").matches;
    if (!vv || !isOpen || !mobile) {
      root.classList.remove("evd-vv");
      root.style.removeProperty("--evd-vh"); root.style.removeProperty("--evd-vt");
      return;
    }
    root.style.setProperty("--evd-vh", Math.round(vv.height) + "px");
    root.style.setProperty("--evd-vt", Math.round(vv.offsetTop) + "px");
    root.classList.add("evd-vv");
    msgs.scrollTop = msgs.scrollHeight;
  }
  if (vv) {
    vv.addEventListener("resize", syncViewport);
    vv.addEventListener("scroll", syncViewport);
  }
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !isOpen) return;
    if (sheet && sheet.classList.contains("is-open")) openSheet(false);
    else toggle(false);
  });

  // ------------------------------------------------------------------ message actions: copy / speak (TTS)
  const TTS = "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance !== "undefined";
  const AUDIO = typeof window.Audio === "function";
  const CAN_SPEAK = TTS || AUDIO;
  const VOICE_LANG = { et: "et-EE", ru: "ru-RU", en: "en-US" };
  let speakToken = 0, speakBtn = null;

  const plainText = (text) => String(text || "").replace(/[ \t]+\n/g, "\n").trim();
  // Текст для синтезатора: «ΔV» -> «дельта В» / «delta V», без эмодзи и markdown-символов.
  function speechText(text, l) {
    return plainText(text)
      .replace(/Δ\s*V/gi, l === "ru" ? "дельта В" : "delta V")
      .replace(/Δ/g, l === "ru" ? "дельта " : "delta ")
      .replace(/[*_`#>~]+/g, " ")
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u2B50]/gu, " ")
      .replace(/\s+/g, " ").trim();
  }
  // Chrome обрывает длинные реплики (~15 с): режем по предложениям на куски до ~180 символов.
  function speechChunks(text) {
    const out = []; let cur = "";
    (text.match(/[^.!?…]+[.!?…]*\s*/g) || [text]).forEach((s) => {
      if (cur && (cur + s).length > 180) { out.push(cur.trim()); cur = ""; }
      cur += s;
    });
    if (cur.trim()) out.push(cur.trim());
    return out.flatMap((c) => (c.length > 260 ? c.match(/.{1,240}(?:\s|$)/g) || [c] : [c]));
  }
  // Голос: точное совпадение языка, затем по языку; для эстонского без голоса — близкий финский; иначе голос по умолчанию.
  function pickVoice(l) {
    let vs = [];
    try { vs = speechSynthesis.getVoices() || []; } catch (_) { /* ignore */ }
    const FEM = /female|woman|zira|samantha|milena|irina|svetlana|katja|tuuli|mari|aria|jenny|libby|sonia|hedda|helena|google/i;   // голос EVA — женский
    const by = (p) => {
      const a = vs.filter((v) => v.lang && v.lang.toLowerCase().replace("_", "-").startsWith(p));
      return a.find((v) => FEM.test(v.name)) || a[0];
    };
    return by(VOICE_LANG[l].toLowerCase()) || by(l) || (l === "et" ? by("fi") : null) || null;
  }
  function labelAct(b) {
    const k = b.dataset.k;
    b.title = T[lang][k];
    b.setAttribute("aria-label", T[lang][k]);
  }
  // Состояние кнопки озвучки: "idle" | "loading" (запрос к /api/tts) | "on" (играет)
  function setSpeakState(btn, st) {
    if (st === true) st = "on"; else if (st === false) st = "idle";
    btn.classList.toggle("is-on", st === "on");
    btn.classList.toggle("is-loading", st === "loading");
    btn.innerHTML = st === "idle" ? ICON.speaker : (st === "loading" ? ICON.spin : ICON.stop);
    btn.dataset.k = st === "idle" ? "speak" : "stopSpeak";
    btn.setAttribute("aria-pressed", String(st !== "idle"));
    btn.setAttribute("aria-busy", String(st === "loading"));
    labelAct(btn);
  }
  const TTS_URL = () => ((window.EvlConsent && window.EvlConsent.API) || "https://evlab-engine-254944045596.europe-north1.run.app") + "/api/tts";
  const SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
  let player = null, ttsCtrl = null, speakPhase = "idle";
  const blobCache = new Map();                      // lang+text -> blob URL (повторное прослушивание без сети)
  // iOS/Safari разрешают play() только из жеста пользователя: "прогреваем" единый плеер синхронно в клике
  function primeAudio() {
    if (!AUDIO) return;
    try {
      if (!player) player = new Audio();
      player.src = SILENT;
      const p = player.play();
      if (p && p.catch) p.catch(() => { /* ignore */ });
    } catch (_) { /* ignore */ }
  }
  function stopSpeak() {
    speakToken++;                                   // обнуляет колбэки прежних реплик
    if (ttsCtrl) { try { ttsCtrl.abort(); } catch (_) { /* ignore */ } ttsCtrl = null; }
    if (player) { try { player.onended = player.onerror = null; player.pause(); } catch (_) { /* ignore */ } }
    if (TTS) { try { speechSynthesis.cancel(); } catch (_) { /* ignore */ } }
    if (speakBtn) { setSpeakState(speakBtn, "idle"); speakBtn = null; }
    speakPhase = "idle";
    setSpeaking(false);
  }
  // Готовые нейросетевые (TartuNLP) реплики для эстонского: audio/manifest.json, ключ = FNV-1a(32) нормализованного текста
  // (тот же алгоритм в tools/gen_et_audio.py). Нет файла для текста — запрос к /api/tts, затем speechSynthesis.
  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 0x01000193) >>> 0;
    return ("00000000" + h.toString(16)).slice(-8);
  }
  let etItems = null, etItemsP = null, etVer = "";
  function loadEtManifest() {
    if (!etItemsP) {
      etItemsP = fetch(ASSET("audio/manifest.json?v=4"))
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => { etItems = (j && j.items) || {}; etVer = (j && j.v) || ""; return etItems; })
        .catch(() => { etItems = {}; return etItems; });
    }
    return etItemsP;
  }
  async function staticAudioUrl(text, l) {
    if (l !== "et") return null;
    const items = etItems || (await loadEtManifest());
    const it = items[fnv1a(plainText(text).replace(/\s+/g, " "))];
    if (!(it && it.file)) return null;
    const url = ASSET("audio/" + it.file + (etVer ? "?v=" + etVer : ""));
    return blobCache.get("static\n" + url) || url;        // уже предзагружен -> blob: старт без сети
  }
  // Предзагрузка приветствия, чтобы тап по дроиду начинал звук мгновенно:
  //  ET — готовый MP3 грузится сразу после загрузки страницы (blob в памяти);
  //  RU/EN — живой /api/tts, поэтому грузим только по намерению (наведение/касание дроида), а не у каждого посетителя.
  function preloadStatic(text) {
    try {
      return staticAudioUrl(text, "et").then((url) => {
        if (!url || url.indexOf("blob:") === 0) return null;
        const key = "static\n" + url;
        return fetch(url).then((r) => (r.ok ? r.blob() : null)).then((b) => { if (b) blobCache.set(key, URL.createObjectURL(b)); }).catch(() => { /* ignore */ });
      }).catch(() => { /* ignore */ });
    } catch (_) { return null; }
  }
  function preloadWelcome(l, intent) {
    try {
      if (l === "et") {
        return staticAudioUrl(T.et.welcome, "et").then((url) => {
          if (!url || url.indexOf("blob:") === 0) return null;
          const key = "static\n" + url;
          return fetch(url).then((r) => (r.ok ? r.blob() : null)).then((b) => { if (b) blobCache.set(key, URL.createObjectURL(b)); }).catch(() => { /* ignore */ });
        }).catch(() => { /* ignore */ });
      }
      if (intent && AUDIO) return fetchAudio(T[l].welcome.slice(0, 1500), l).catch(() => { /* ignore */ });
    } catch (_) { /* ignore */ }
    return null;
  }
  const pendingAudio = new Map();                   // запросы /api/tts в полёте: предзагрузка и тап не дублируют запрос
  function fetchAudio(text, l, signal) {
    const key = l + "\n" + text;
    if (blobCache.has(key)) return Promise.resolve(blobCache.get(key));
    if (!pendingAudio.has(key)) pendingAudio.set(key, fetchAudioNet(key, text, l, signal).finally(() => pendingAudio.delete(key)));
    return pendingAudio.get(key);
  }
  async function fetchAudioNet(key, text, l, signal) {
    const r = await fetch(TTS_URL(), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang: l }), signal,
    });
    if (!r.ok) throw new Error("tts " + r.status);
    const url = URL.createObjectURL(await r.blob());
    blobCache.set(key, url);
    const dyn = [...blobCache.keys()].filter((k) => k.indexOf("static\n") !== 0);
    if (dyn.length > 12) { URL.revokeObjectURL(blobCache.get(dyn[0])); blobCache.delete(dyn[0]); }
    return url;
  }
  // Тихий резерв: браузерный синтезатор (без сообщений об ошибках)
  function browserSpeak(token, text, l, done) {
    try {
      const parts = speechChunks(speechText(text, l));
      if (!parts.length) { done(); return; }
      const v = pickVoice(l);
      parts.forEach((p, i) => {
        const u = new SpeechSynthesisUtterance(p);
        u.lang = (v && v.lang) || VOICE_LANG[l];
        if (v) u.voice = v;
        if (i === parts.length - 1) u.onend = done;
        u.onerror = done;
        speechSynthesis.speak(u);
      });
    } catch (_) { done(); }
  }
  // btn может быть null (автоозвучка стартует раньше, чем появится строка действий); возвращает токен озвучки.
  function speak(btn, text) {
    if (!CAN_SPEAK) return 0;
    const l = lang;
    const plain = plainText(text).slice(0, 1500);
    if (!plain) return 0;
    const token = ++speakToken;
    speakBtn = btn;
    const setPhase = (p) => { speakPhase = p; if (speakBtn) setSpeakState(speakBtn, p); };
    const finish = () => {
      if (token !== speakToken) return;
      if (speakBtn) setSpeakState(speakBtn, "idle");
      speakBtn = null; speakPhase = "idle";
      setSpeaking(false);
    };
    const fallback = () => {
      if (token !== speakToken) return;
      if (!TTS) { finish(); return; }
      setPhase("on"); setSpeaking(true);
      browserSpeak(token, text, l, finish);
    };
    if (!AUDIO) { setPhase("on"); setSpeaking(true); browserSpeak(token, text, l, finish); return token; }
    setPhase("loading");
    primeAudio();
    ttsCtrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const signal = ttsCtrl ? ttsCtrl.signal : undefined;
    const timer = setTimeout(() => { if (ttsCtrl) ttsCtrl.abort(); }, 20000);
    // воспроизвести url; onFail вызывается при ошибке загрузки/декодирования или отказе play() (автоплей)
    const playUrl = (url, onFail) => {
      if (token !== speakToken) return null;
      player.onended = finish;
      player.onerror = onFail;
      player.src = url;
      return player.play().then(() => { if (token === speakToken) { setPhase("on"); setSpeaking(true); } });
    };
    const dynamic = () => fetchAudio(plain, l, signal).then((url) => { clearTimeout(timer); return playUrl(url, fallback); })
      .catch(() => { clearTimeout(timer); fallback(); });
    staticAudioUrl(text, l).catch(() => null).then((url) => {
      if (token !== speakToken) return null;
      if (!url) return dynamic();
      clearTimeout(timer);
      return Promise.resolve(playUrl(url, dynamic)).catch(() => { if (token === speakToken) dynamic(); });
    });
    return token;
  }
  async function copyText(btn, text) {
    const t = plainText(text);
    let ok = false;
    try { await navigator.clipboard.writeText(t); ok = true; } catch (_) {
      try {
        const ta = el("textarea");
        ta.value = t; ta.setAttribute("readonly", "");
        ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
        document.body.appendChild(ta); ta.select();
        ok = document.execCommand("copy");
        ta.remove();
      } catch (__) { /* ignore */ }
    }
    if (!ok) return;
    clearTimeout(btn._t);
    btn.innerHTML = ICON.check; btn.classList.add("is-ok"); btn.dataset.k = "copied"; labelAct(btn);
    btn._t = setTimeout(() => {
      btn.innerHTML = ICON.copy; btn.classList.remove("is-ok"); btn.dataset.k = "copy"; labelAct(btn);
    }, 1500);
  }
  function addActions(node, text) {
    if (!node || node.querySelector(".evd-acts")) return null;
    node._text = text;
    const row = el("div", "evd-acts");
    const mk = (act, icon, k) => {
      const b = el("button", "evd-act");
      b.type = "button"; b.dataset.act = act; b.dataset.k = k; b.innerHTML = icon;
      labelAct(b);
      return b;
    };
    row.appendChild(mk("copy", ICON.copy, "copy"));
    if (CAN_SPEAK) row.appendChild(mk("speak", ICON.speaker, "speak"));
    node.appendChild(row);
    return row;
  }
  function onAct(b) {
    const node = b.closest(".evd-msg");
    if (!node) return;
    if (b.dataset.act === "copy") copyText(b, node._text);
    else if (b.dataset.act === "speak") {
      if (speakBtn === b) stopSpeak();              // повторный клик = стоп
      else { stopSpeak(); speak(b, node._text); }   // другое сообщение останавливает текущую озвучку
    }
  }
  function clearInput(sent) {
    const reset = () => { input.value = ""; input.style.height = ""; };
    reset();
    // мобильные клавиатуры/голосовой набор иногда возвращают текст следующим тиком
    setTimeout(() => { if (sent && input.value.trim() === String(sent).trim()) reset(); }, 60);
  }
  window.addEventListener("pagehide", stopSpeak);

  // ------------------------------------------------------------------ chat
  const SR_OK = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  // Крупная кнопка «говорить» под приветствием (на телефоне удобнее мелкой иконки у поля ввода); исчезает после первого вопроса.
  function makeCta() {
    const box = el("div", "evd-cta");
    const b = el("button", "evd-micbig");
    b.type = "button"; b.dataset.act = "mic"; b.dataset.tt = "mic";
    b.innerHTML = ICON.mic + '<span data-t="micBig"></span>';
    const hint = el("span", "evd-ctahint"); hint.dataset.t = "orType";
    box.append(b, hint);
    return box;
  }
  function addWelcome() {
    msgs.querySelectorAll(".evd-cta").forEach((n) => n.remove());
    const m = addMsg(T[lang].welcome, "bot", true);
    if (SR_OK) { msgs.appendChild(makeCta()); renderTexts(); msgs.scrollTop = msgs.scrollHeight; }
    return m;
  }
  // Тап по дроиду = жест пользователя: чат открывается и сразу озвучивает приветствие (один раз за сессию, пока нет вопросов).
  let greeted = false;
  function greet() {
    if (greeted || !CAN_SPEAK || !msgs || msgs.querySelector(".evd-msg.user")) return;
    const m = msgs.querySelector(".evd-msg.bot");
    if (!m || !m._text) return;
    greeted = true;
    stopSpeak();
    speak(m.querySelector('[data-act="speak"]'), m._text);
  }
  function addMsg(text, who, acts) {
    const m = el("div", "evd-msg " + who);
    m.textContent = text;
    msgs.appendChild(m);
    if (acts) addActions(m, text);
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
  // Компактные кнопки-пилюли отзывов внутри пузыря (перед строкой действий): Google всегда, Tripadvisor — когда задан CFG.tripadvisorReview
  function addReviewLinks(m) {
    const row = el("div", "evd-review evd-review-pills");
    [["⭐ Google (5★)", CFG.googleReview], ["🦉 Tripadvisor", CFG.tripadvisorReview]].forEach(([label, href]) => {
      if (!href) return;
      const a = el("a");
      a.href = href; a.target = "_blank"; a.rel = "noopener"; a.textContent = label;
      row.appendChild(a);
    });
    if (!row.children.length) return;
    const acts = m.querySelector(".evd-acts");
    if (acts) m.insertBefore(row, acts); else m.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
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

  async function send(preset, fromVoice) {
    const text = (preset || input.value).trim();
    if (!text || busy) return;
    msgs.querySelectorAll(".evd-cta").forEach((n) => n.remove());
    clearInput(text);            // поле очищается всегда: и после текста, и после голоса, и после чипа
    stopSpeak();                 // новый вопрос останавливает прежнюю озвучку
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
    // голосовой ввод -> озвучка стартует сразу, не дожидаясь анимации набора; текстовый -> только кнопка динамика
    const auto = fromVoice && CAN_SPEAK ? speak(null, reply) : 0;
    await typeInto(loader, reply);
    const row = addActions(loader, reply);
    const sb = row && row.querySelector('[data-act="speak"]');
    if (auto && sb && auto === speakToken && !speakBtn && speakPhase !== "idle") { speakBtn = sb; setSpeakState(sb, speakPhase); }
    setMood(alarm ? "alert" : "happy", 4000);
    if (data && data.show_review_cta) showReview();
    busy = false;
  }

  function voice(btn) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { addMsg(T[lang].voiceNa, "sys"); return; }
    if (recognition) { recognition.stop(); return; }
    stopSpeak();                                   // микрофон не должен слышать синтезатор
    primeAudio();                                  // жест пользователя: разрешаем автоозвучку ответа (iOS)
    recognition = new SR();
    recognition.lang = { et: "et-EE", ru: "ru-RU", en: "en-US" }[lang];
    recognition.interimResults = false;
    const mics = () => panel.querySelectorAll('[data-act="mic"]');
    recognition.onstart = () => { mics().forEach((m) => m.classList.add("rec")); setMood("scan"); };
    recognition.onend = () => { mics().forEach((m) => m.classList.remove("rec")); recognition = null; if (!busy) setMood("happy"); };
    recognition.onerror = () => { /* onend follows */ };
    recognition.onresult = (e) => {
      const tr = e.results[0][0].transcript;
      if (busy) { input.value = tr; return; }      // ответ ещё идёт: не теряем фразу, оставляем в поле
      send(tr, true);                              // hands-free: ответ будет озвучен
    };
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
      if (lang === "et") preloadStatic(T.et.bOkChat);      // финальное «Aitäh!» готово к мгновенному старту
      setTimeout(() => $('[name="car"]', sheet).focus({ preventScroll: true }), 300);
    }
  }
  // Контакт: e-mail -> email; @ник или t.me/ник -> telegram_username (без «@», нижний регистр); иначе телефон -> phone.
  // contact — нормализованная строка целиком (обратная совместимость). Сервер классифицирует заново и не доверяет этим полям.
  function parseContact(raw) {
    const v = String(raw || "").replace(/\s+/g, " ").trim();
    const tme = v.match(/^(?:https?:\/\/)?(?:www\.)?t\.me\/([A-Za-z0-9_]{4,32})\/?$/i);
    if (tme) return { kind: "telegram", contact: "@" + tme[1].toLowerCase(), telegram_username: tme[1].toLowerCase() };
    if (/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v)) return { kind: "email", contact: v.toLowerCase(), email: v.toLowerCase() };
    const tg = v.match(/^@([A-Za-z0-9_]{4,32})$/);
    if (tg) return { kind: "telegram", contact: "@" + tg[1].toLowerCase(), telegram_username: tg[1].toLowerCase() };
    if (/^\+?[0-9(][0-9\s\-()]{5,}$/.test(v) && v.replace(/\D/g, "").length >= 7) return { kind: "phone", contact: v, phone: v };
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
    const parsed = parseContact(conIn.value);
    const contact = parsed && parsed.contact;
    if (car.length < 2) { carIn.setAttribute("aria-invalid", "true"); say(t.bErrCar, "err"); carIn.focus(); return; }
    if (!contact) { conIn.setAttribute("aria-invalid", "true"); say(t.bErrContact, "err"); conIn.focus(); return; }
    const last = parseInt(store.get("last_lead_sent") || "0", 10);
    if (Date.now() - last < CFG.leadCooldownMs) { say(t.bWait, "ok"); return; }

    const service = $('[name="service"]', sheet).value + " · AI-droid";
    const row = {
      service,
      name: parsed.kind === "telegram" ? contact : "AI-droid (" + lang.toUpperCase() + ")",
      car,
      loc: "— (AI-droid, " + lang.toUpperCase() + ")",
    };
    primeAudio();                                   // жест пользователя: разрешаем озвучку финального сообщения (iOS)
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = t.bSending;
    try {
      if (!window.EvlConsent || !window.EvlConsent.sendLead) throw new Error("EvlConsent missing");
      const res = await window.EvlConsent.sendLead({
        name: parsed.kind === "telegram" ? contact : "", contact, phone: parsed.phone || null, email: parsed.email || null,
        telegram_username: parsed.telegram_username || null, car, service, loc: row.loc, lang, website: "",
        source: "eva_chat", consent_given: true, consent_timestamp: new Date().toISOString(),
      });
      if (!res.ok || !(res.data && res.data.ok)) throw new Error("lead api " + res.status);
      store.set("last_lead_sent", String(Date.now()));
      say(t.bOk, "ok");
      if (typeof window.gtag === "function") window.gtag("event", "generate_lead", { source: "ev-droid", lang });
      setTimeout(() => {
        openSheet(false);
        sheet.reset();
        const m = addMsg(t.bOkChat, "bot", true);
        addReviewLinks(m);
        setMood("happy");
        // финал: сразу озвучиваем тем же голосом EVA (плеер «прогрет» кликом по кнопке отправки)
        if (CAN_SPEAK && isOpen) { stopSpeak(); speak(m.querySelector('[data-act="speak"]'), t.bOkChat); }
      }, 1400);
    } catch (err) {
      console.error("[EV Droid] lead submit failed", err);
      say(t.bFail, "err");
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
    // ET: готовое приветствие подгружается сразу после загрузки страницы (тап по дроиду стартует звук без задержки)
    const warm = () => setTimeout(() => preloadWelcome(lang, false), 300);
    if (document.readyState === "complete") warm(); else window.addEventListener("load", warm, { once: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
