/* EVLAB (GVKFORGE OÜ) — общий скрипт веб-согласия: форма заказа (index.html) и страница /akt.
   Без зависимостей. Эндпоинты бэкенда: GET /api/vehicle-lookup, POST /api/web-consent. */
(function () {
  'use strict';

  var API = 'https://evlab-engine-254944045596.europe-north1.run.app';
  var TERMS_VERSION = '2026-11-18-v2';

  var TERMS = {
    et: {
      tab: 'ET', title: "Teenuse osutamise tingimused ja vastutuse piirang",
      sub: 'GVKFORGE OÜ / EVLAB',
      items: [
        ["1. Teenuse sisu ja diagnostikaraport", "EVLAB teostab elektri- ja hübriidsõidukite kõrgepingeaku (HV) mitteinvasiivset diagnostikat läbi tootja diagnostikapordi (OBD-II) ning väljastab kliendile digitaalse PDF-raporti koos autentsuse kontrolli QR-koodiga. Raport põhineb sõiduki juhtmoodulitest (BMS) mõõtmise hetkel loetud andmetel. Sõidukite puhul, millel puudub standardne OBD-II pesa (sh Tesla), teostatakse ühendus tootja ettenähtud diagnostilise CAN-liidese kaudu spetsiaalse Y-adapteri abil, eemaldades ajutiselt dekoratiivse kattepaneeli ilma juhtmestikku kahjustamata."],
        ["2. Tasumine, tühistamine ja taganemisõiguse piirang", "Teenuse eest tasumine toimub vastavalt kehtivale hinnakirjale arve alusel või kohapeal. Vastavalt võlaõigusseaduse (VÕS) § 53 lg 4 p 1 ei kohaldu 14-päevane taganemisõigus pärast seda, kui diagnostikateenus on täielikult osutatud ja raport on kliendile väljastatud. Broneeringu tühistamisel vähem kui 2 tundi enne kokkulepitud aega on GVKFORGE OÜ-l õigus nõuda väljakutsetasu hüvitamist."],
        ["3. Vastutuse piirang ja ostueelne kontroll", "GVKFORGE OÜ ei vastuta sõiduki varjatud tehniliste rikete eest, mis ilmnevad tavapärase testimise käigus. EVLAB raport ei kujuta endast garantiid sõiduki tulevase töökindluse, aku edasise degradeerumise ega teiste sõlmede korrasoleku kohta. Sõiduki ostuotsuse teeb klient iseseisvalt ning GVKFORGE OÜ ei vastuta ostu-müügitehingust tulenevate nõuete eest."],
        ["4. Andmekaitse (GDPR)", "Raporti koostamiseks ja QR-koodi kaudu autentsuse kontrollimiseks töötleb GVKFORGE OÜ tellija kontaktandmeid ja sõiduki andmeid (VIN-kood, registreerimisnumber, telemeetria) vastavalt kehtivatele andmekaitsenõuetele ega edasta neid kolmandatele isikutele."]
      ],
      safety: ["Ohutusreeglid ja juriidiline protokoll", "/ohutus.html"],
      note: 'Märkeruudu märkimisel salvestame kinnituse aja, IP-aadressi, brauseri andmed ja kirje ID ning koostame sellest PDF-akti (säilitame 7 aastat). Kinnitus on elektrooniline, mitte digiallkiri.',
      close: 'Sulge'
    },
    ru: {
      tab: 'RU', title: "Условия оказания услуг и ограничение ответственности",
      sub: 'GVKFORGE OÜ / EVLAB',
      items: [
        ["1. Содержание услуги и диагностический отчёт", "EVLAB выполняет неинвазивную диагностику высоковольтной батареи (HV) электромобилей и гибридов через штатный диагностический разъём (OBD-II) и выдаёт клиенту цифровой PDF-отчёт с QR-кодом проверки подлинности. Отчёт отражает данные блоков управления (BMS) на момент проведения замера. Для автомобилей, не оснащённых стандартным разъёмом OBD-II (включая Tesla), подключение выполняется к штатному диагностическому CAN-интерфейсу производителя через сертифицированный Y-переходник с временным снятием декоративной накладки без повреждения штатной проводки."],
        ["2. Оплата, отмена выезда и ограничение права на возврат", "Оплата услуги производится согласно действующему прейскуранту по счёту или на месте. Согласно § 53 ч. 4 п. 1 Обязательственно-правового закона Эстонии (VÕS), 14-дневное право на отказ не применяется после того, как услуга оказана в полном объёме и отчёт передан клиенту. При отмене выезда менее чем за 2 часа до согласованного времени GVKFORGE OÜ вправе потребовать компенсацию выездного сбора."],
        ["3. Ограничение ответственности и предпокупочная проверка", "GVKFORGE OÜ не несёт ответственности за скрытые технические неисправности автомобиля, проявившиеся в ходе штатного тестирования. Отчёт EVLAB не является гарантией будущей надёжности автомобиля, дальнейшей деградации батареи или исправности иных узлов. Решение о покупке автомобиля клиент принимает самостоятельно; GVKFORGE OÜ не отвечает за претензии, вытекающие из сделки купли-продажи."],
        ["4. Защита данных (GDPR)", "Для формирования отчёта и проверки его подлинности по QR-коду GVKFORGE OÜ обрабатывает контактные данные заказчика и данные автомобиля (VIN-код, регистрационный номер, телеметрию) в соответствии с требованиями GDPR и не передаёт их третьим лицам."]
      ],
      safety: ["Правила безопасности и юридический протокол", "/ohutus.html"],
      note: 'При отметке галочки мы сохраняем время подтверждения, IP-адрес, данные браузера и ID записи и формируем из них PDF-акт (хранится 7 лет). Подтверждение электронное, это не цифровая подпись.',
      close: 'Закрыть'
    },
    en: {
      tab: 'EN', title: "Terms of Service and Limitation of Liability",
      sub: 'GVKFORGE OÜ / EVLAB · courtesy translation, the Estonian version prevails',
      items: [
        ["1. Scope of Service and Diagnostic Report", "EVLAB performs non-invasive high-voltage (HV) battery diagnostics for electric and hybrid vehicles via the manufacturer's diagnostic port (OBD-II) and issues a digital PDF report with a QR authenticity verification code. The report reflects data read from the vehicle's control modules (BMS) at the time of measurement. For vehicles not equipped with a standard OBD-II port (including Tesla), connection is made to the manufacturer's designated diagnostic CAN interface using a certified Y-adapter, involving temporary removal of a trim cover without altering or damaging factory wiring."],
        ["2. Payment, Cancellation, and Limitation of Right of Withdrawal", "Payment is made according to the valid price list by invoice or on-site. Pursuant to § 53 (4) 1) of the Estonian Law of Obligations Act (VÕS), the 14-day right of withdrawal does not apply once the diagnostic service has been fully performed and the report has been delivered to the client. If an appointment is cancelled less than 2 hours prior to the scheduled time, GVKFORGE OÜ reserves the right to charge a call-out fee."],
        ["3. Limitation of Liability and Pre-Purchase Inspection", "GVKFORGE OÜ is not liable for pre-existing hidden technical faults that manifest during standard testing. The EVLAB report does not constitute a warranty regarding future vehicle reliability, subsequent battery degradation, or the condition of other components. Any vehicle purchase decision is made solely by the client, and GVKFORGE OÜ bears no liability for claims arising from a sale and purchase transaction."],
        ["4. Data Protection (GDPR)", "To generate the report and enable QR code authenticity verification, GVKFORGE OÜ processes the client's contact details and vehicle data (VIN, registration plate, telemetry) in compliance with GDPR and does not share them with third parties."]
      ],
      safety: ["Safety Rules and Legal Protocol", "/ohutus.html"],
      note: 'When you tick the box we store the time of confirmation, your IP address, browser data and a record ID, and generate a PDF act from them (kept for 7 years). The confirmation is electronic, not a digital signature.',
      close: 'Close'
    }
  };

  /* Госномер: верхний регистр, визуально похожие кириллические буквы -> латиница, без пробелов, дефисов и прочих знаков. */
  var CYR2LAT = { '\u0410': 'A', '\u0412': 'B', '\u0415': 'E', '\u041A': 'K', '\u041C': 'M', '\u041D': 'H',
                  '\u041E': 'O', '\u0420': 'P', '\u0421': 'C', '\u0422': 'T', '\u0423': 'Y', '\u0425': 'X' };
  function latinize(v) {
    return String(v || '').toUpperCase().replace(/[\u0410\u0412\u0415\u041A\u041C\u041D\u041E\u0420\u0421\u0422\u0423\u0425]/g, function (c) { return CYR2LAT[c]; });
  }
  function normPlate(v) { return latinize(v).replace(/[^A-Z0-9]/g, ''); }
  // Нормализует значение поля «на лету» и сохраняет позицию курсора (ввод в середине строки не прыгает в конец).
  function applyPlateNorm(el) {
    var v = el.value, n = normPlate(v);
    if (v === n) return n;
    var pos = null;
    try { if (document.activeElement === el && el.selectionStart != null) pos = normPlate(v.slice(0, el.selectionStart)).length; } catch (_) { /* ignore */ }
    el.value = n;
    if (pos !== null) { try { el.setSelectionRange(pos, pos); } catch (_) { /* ignore */ } }
    return n;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  /* ---------- подсказка марки/модели по госномеру ---------- */
  function bindPlateLookup(opts) {
    var plate = opts.plate, car = opts.car, hint = opts.hint, msgs = opts.msgs || {};
    var timer = null, ctrl = null, autoValue = null, disabled = false;

    car.addEventListener('input', function () { if (car.value !== autoValue) autoValue = null; });

    function say(text, ok) {
      if (!hint) return;
      hint.textContent = text || '';
      hint.style.color = ok ? '#5eead4' : '';
    }

    function onPlate(e) {
      if (e && e.isComposing) return;           // не трогаем текст во время композиции (Android/IME)
      var n = applyPlateNorm(plate);
      clearTimeout(timer);
      if (ctrl) ctrl.abort();
      say('');
      if (n.length < 4 || disabled) return;
      timer = setTimeout(function () {
        ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        fetch(API + '/api/vehicle-lookup?plate=' + encodeURIComponent(n), ctrl ? { signal: ctrl.signal } : {})
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) {
            if (d && d.configured === false) { disabled = true; return; } // источник авто не подключён: дальше не спрашиваем
            if (!d || normPlate(plate.value) !== n) return;
            if (d.found) {
              var text = [d.make, d.model].filter(Boolean).join(' ') + (d.year ? ' (' + d.year + ')' : '');
              if (!car.value.trim() || car.value === autoValue) { car.value = text; autoValue = text; say((msgs.found || '✓ ') + text, true); }
              else say((msgs.suggest || 'Register: ') + text);
            }
          })
          .catch(function () { /* подсказка необязательна: ошибки сети молча игнорируем */ });
      }, 450);
    }
    plate.addEventListener('input', onPlate);
    plate.addEventListener('compositionend', function () { onPlate(); });
    onPlate();                                   // значение, подставленное браузером (автозаполнение)
  }

  /* ---------- модальное окно с условиями (без скачивания PDF) ---------- */
  var termsEl = null, lastFocus = null;

  function ensureStyle() {
    if (document.getElementById('evl-terms-style')) return;
    var st = document.createElement('style');
    st.id = 'evl-terms-style';
    st.textContent =
      '#evl-terms{position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(2,6,23,.82);backdrop-filter:blur(4px)}' +
      '#evl-terms.on{display:flex}' +
      '#evl-terms .evl-box{position:relative;width:100%;max-width:560px;max-height:88vh;overflow:auto;background:#0b1220;border:1px solid #1e293b;border-radius:16px;padding:20px 20px 18px;color:#cbd5e1;font:14px/1.6 Inter,system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.6)}' +
      '#evl-terms h3{margin:0 28px 2px 0;color:#fff;font-size:17px;line-height:1.3}' +
      '#evl-terms .evl-sub{color:#64748b;font-size:12px;margin-bottom:12px}' +
      '#evl-terms h4{margin:14px 0 4px;color:#fff;font-size:14px}' +
      '#evl-terms p{margin:0}' +
      '#evl-terms .evl-safety{margin-top:14px}' +
      '#evl-terms .evl-safety a{color:#2dd4bf}' +
      '#evl-terms .evl-note{margin-top:14px;padding:10px 12px;border:1px solid #1e293b;border-radius:10px;background:#0f172a;color:#94a3b8;font-size:12px}' +
      '#evl-terms .evl-tabs{display:flex;gap:6px;margin:10px 0 4px}' +
      '#evl-terms .evl-tabs button{min-height:36px;min-width:52px;border-radius:8px;border:1px solid #334155;background:#111a2e;color:#fff;font:600 13px Inter,system-ui,sans-serif;cursor:pointer}' +
      '#evl-terms .evl-tabs button[aria-pressed="true"]{border-color:#2dd4bf;color:#2dd4bf}' +
      '#evl-terms .evl-x{position:absolute;top:10px;right:10px;width:36px;height:36px;border:0;border-radius:8px;background:transparent;color:#94a3b8;font-size:22px;cursor:pointer}' +
      '#evl-terms .evl-x:hover{color:#fff}' +
      '#evl-terms .evl-close{margin-top:14px;width:100%;min-height:44px;border-radius:10px;border:1px solid #334155;background:#111a2e;color:#fff;font:600 14px Inter,system-ui,sans-serif;cursor:pointer}' +
      '#evl-terms button:focus-visible{outline:2px solid #2dd4bf;outline-offset:2px}';
    document.head.appendChild(st);
  }

  function renderTerms(lang) {
    var T = TERMS[lang] || TERMS.et;
    var tabs = Object.keys(TERMS).map(function (k) {
      return '<button type="button" data-l="' + k + '" aria-pressed="' + (k === lang) + '">' + TERMS[k].tab + '</button>';
    }).join('');
    var items = T.items.map(function (it) { return '<h4>' + esc(it[0]) + '</h4><p>' + esc(it[1]) + '</p>'; }).join('');
    if (T.safety) items += '<p class="evl-safety"><a href="' + esc(T.safety[1]) + '" target="_blank" rel="noopener">' + esc(T.safety[0]) + '</a></p>';
    termsEl.querySelector('.evl-box').innerHTML =
      '<button type="button" class="evl-x" aria-label="' + esc(T.close) + '">×</button>' +
      '<h3 id="evl-terms-h">' + esc(T.title) + '</h3><div class="evl-sub">' + esc(T.sub) + ' · v' + TERMS_VERSION + '</div>' +
      '<div class="evl-tabs">' + tabs + '</div>' + items +
      '<div class="evl-note">' + esc(T.note) + '</div>' +
      '<button type="button" class="evl-close">' + esc(T.close) + '</button>';
  }

  function closeTerms() {
    if (!termsEl) return;
    termsEl.classList.remove('on');
    document.removeEventListener('keydown', onKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function onKey(e) { if (e.key === 'Escape') closeTerms(); }

  function openTerms(lang) {
    ensureStyle();
    lastFocus = document.activeElement;
    if (!termsEl) {
      termsEl = document.createElement('div');
      termsEl.id = 'evl-terms';
      termsEl.setAttribute('role', 'dialog');
      termsEl.setAttribute('aria-modal', 'true');
      termsEl.setAttribute('aria-labelledby', 'evl-terms-h');
      termsEl.innerHTML = '<div class="evl-box"></div>';
      termsEl.addEventListener('click', function (e) {
        var t = e.target;
        if (t === termsEl || (t.closest && (t.closest('.evl-x') || t.closest('.evl-close')))) { closeTerms(); return; }
        var b = t.closest && t.closest('[data-l]');
        if (b) { renderTerms(b.getAttribute('data-l')); var c = termsEl.querySelector('.evl-close'); if (c) c.focus(); }
      });
      document.body.appendChild(termsEl);
    }
    renderTerms(TERMS[lang] ? lang : 'et');
    termsEl.classList.add('on');
    document.addEventListener('keydown', onKey);
    var x = termsEl.querySelector('.evl-x'); if (x) x.focus();
  }

  /* ---------- отправка согласия ---------- */
  function post(path, payload) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, 25000);
    return fetch(API + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) { return { ok: r.ok, status: r.status, data: data }; });
    }).catch(function () { return { ok: false, status: 0, data: {} }; })
      .then(function (res) { clearTimeout(to); return res; });
  }
  function send(payload) { return post('/api/web-consent', payload); }
  function sendLead(payload) { return post('/api/lead', payload); }

  window.EvlConsent = { API: API, TERMS_VERSION: TERMS_VERSION, normPlate: normPlate, latinize: latinize, applyPlateNorm: applyPlateNorm, bindPlateLookup: bindPlateLookup, openTerms: openTerms, send: send, sendLead: sendLead };
})();
