/* ============================================================
   ريشة فن — صفحة تسجيل الدخول
   JavaScript خالص بدون مكتبات خارجية
   الأقسام:
   1) أدوات مساعدة
   2) جسيمات الخلفية (Canvas)
   3) مؤثر الماوس المخصص
   4) بارالاكس الخلفية + ميلان البطاقة 3D
   5) إظهار / إخفاء كلمة المرور
   6) توهج الحقول أثناء الكتابة
   7) التحقق من النموذج (Validation)
   8) زر تسجيل الدخول (تحميل / نجاح / Ripple)
   9) التنبيه المنبثق (Toast)
   10) الروابط الثانوية
   ============================================================ */
'use strict';

/* ===================== 1) أدوات مساعدة ===================== */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* تفضيلات المستخدم */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer  = window.matchMedia('(pointer: fine)').matches;

/* ===================== 2) جسيمات الخلفية (Canvas) ===================== */
const particleCanvas = $('#particles');
let partCtx = null;
let partSprites = {};
let particles = [];
let partRAF = null;
let partRunning = false;

/* ألوان الجسيمات: وردي · بنفسجي · ذهبي · بنفسجي فاتح */
const PARTICLE_COLORS = [
  [244, 114, 182],
  [139, 92, 246],
  [247, 200, 115],
  [196, 181, 253],
];

function buildSprites() {
  PARTICLE_COLORS.forEach(([r, g, b]) => {
    const key = `${r},${g},${b}`;
    const s = document.createElement('canvas');
    s.width = s.height = 28;
    const c = s.getContext('2d');
    const grad = c.createRadialGradient(14, 14, 0, 14, 14, 14);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, `rgba(${r},${g},${b},0.9)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    c.fillStyle = grad;
    c.beginPath();
    c.arc(14, 14, 14, 0, Math.PI * 2);
    c.fill();
    partSprites[key] = s;
  });
}

function randomSprite() {
  const keys = Object.keys(partSprites);
  return partSprites[keys[Math.floor(Math.random() * keys.length)]];
}

function spawnParticles() {
  const w = particleCanvas.width / window.devicePixelRatio;
  const h = particleCanvas.height / window.devicePixelRatio;
  const count = Math.max(24, Math.min(70, Math.round((w * h) / 14000)));

  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1.4 + Math.random() * 2.6,
      vy: 0.12 + Math.random() * 0.4,
      tw: Math.random() * Math.PI * 2,
      tws: 0.4 + Math.random() * 1.2,
      key: randomSprite(),
    });
  }
}

function resizeParticles() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  particleCanvas.width = w * dpr;
  particleCanvas.height = h * dpr;
  partCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  spawnParticles();
}

function stepParticles(now) {
  const w = particleCanvas.width / window.devicePixelRatio;
  const h = particleCanvas.height / window.devicePixelRatio;
  const t = now / 1000;

  partCtx.clearRect(0, 0, w, h);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    /* جسيمات الانفجار المؤقتة (عند النجاح) */
    if (p.life !== undefined) {
      p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06; /* جاذبية خفيفة */
      p.alpha = Math.max(0, p.life);
    } else {
      /* الجسيمات العادية تطفو للأعلى */
      p.y -= p.vy;
      p.x += Math.sin(t * p.tws + p.tw) * 0.15;
      p.alpha = (0.3 + 0.7 * Math.abs(Math.sin(t * p.tws + p.tw))) * 0.85;

      /* إعادة التدوير عند مغادرة الشاشة */
      if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; }
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
    }

    const size = p.r * 2.4;
    partCtx.globalAlpha = p.alpha;
    partCtx.drawImage(partSprites[p.key], p.x - size / 2, p.y - size / 2, size, size);
  }
  partCtx.globalAlpha = 1;
}

function loopParticles(now) {
  if (!partRunning) return;
  stepParticles(now);
  partRAF = requestAnimationFrame(loopParticles);
}

/* انفجار جسيمات احتفالي من نقطة محددة */
function emitBurst(x, y) {
  if (!partCtx) return;
  for (let i = 0; i < 22; i++) {
    const ang = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4.5;
    particles.push({
      x, y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed - 1.5,
      r: 1.5 + Math.random() * 2.6,
      life: 1,
      decay: 0.012 + Math.random() * 0.02,
      alpha: 1,
      key: randomSprite(),
    });
  }
}

function initParticles() {
  partCtx = particleCanvas.getContext('2d');
  buildSprites();
  resizeParticles();
  window.addEventListener('resize', resizeParticles);
  partRunning = true;
  loopParticles(performance.now());

  /* إيقاف الرسم مؤقتاً عند إخفاء التبويب لتوفير الأداء */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      partRunning = false;
      cancelAnimationFrame(partRAF);
    } else if (!reduceMotion) {
      partRunning = true;
      loopParticles(performance.now());
    }
  });
}

if (particleCanvas && !reduceMotion) initParticles();

/* ===================== 3) مؤثر الماوس المخصص ===================== */
const cursorDot  = $('#cursorDot');
const cursorRing = $('#cursorRing');

if (finePointer && !reduceMotion && cursorDot && cursorRing) {
  document.documentElement.classList.add('custom-cursor');

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let dx = mx, dy = my;
  let rx = mx, ry = my;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  /* حركة انسيابية للدائرة والحلقة (تتبع متأخر) */
  (function followCursor() {
    dx += (mx - dx) * 0.55;
    dy += (my - dy) * 0.55;
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;

    cursorDot.style.transform  = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
    cursorRing.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(followCursor);
  })();

  /* تكبير الحلقة فوق العناصر التفاعلية */
  document.addEventListener('mouseover', (e) => {
    const interactive = e.target.closest('a, button, input, label.check');
    cursorRing.classList.toggle('is-hover', Boolean(interactive));
  });

  /* ضغط / إفلات */
  document.addEventListener('mousedown', () => {
    cursorRing.classList.add('is-down');
    cursorDot.classList.add('is-down');
  });
  document.addEventListener('mouseup', () => {
    cursorRing.classList.remove('is-down');
    cursorDot.classList.remove('is-down');
  });
}

/* ===================== 4) بارالاكس الخلفية + ميلان البطاقة 3D ===================== */
const parallaxLayers = $$('.plx');
const card3d = $('#card3d');

if (finePointer && !reduceMotion && card3d && parallaxLayers.length) {
  /* ميلان البطاقة مع حركة الماوس */
  card3d.addEventListener('mousemove', (e) => {
    const rect = card3d.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;

    /* بدون انتقال أثناء الحركة للحصول على استجابة فورية */
    card3d.style.transition = '';
    card3d.style.transform = `perspective(1100px) rotateY(${(px * 7).toFixed(2)}deg) rotateX(${(-py * 7).toFixed(2)}deg) translateZ(0)`;

    /* إضاءة زجاجية تتبع الماوس داخل البطاقة */
    card3d.style.setProperty('--glowX', `${((px + 0.5) * 100).toFixed(1)}%`);
    card3d.style.setProperty('--glowY', `${((py + 0.5) * 100).toFixed(1)}%`);
  });
  card3d.addEventListener('mouseleave', () => {
    /* عودة سلسة إلى الوضع الطبيعي */
    card3d.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.2)';
    card3d.style.transform = '';
    setTimeout(() => { card3d.style.transition = ''; }, 650);
  });

  /* طبقات الخلفية تتحرك ببطء حسب اتجاه الماوس */
  let tx = 0, ty = 0, txT = 0, tyT = 0;
  window.addEventListener('mousemove', (e) => {
    txT = e.clientX / window.innerWidth - 0.5;
    tyT = e.clientY / window.innerHeight - 0.5;
  });

  (function parallax() {
    requestAnimationFrame(parallax);
    tx += (txT - tx) * 0.06;
    ty += (tyT - ty) * 0.06;

    parallaxLayers.forEach((layer) => {
      const depth = parseFloat(layer.dataset.depth);
      layer.style.transform = `translate3d(${(-tx * depth).toFixed(2)}px, ${(-ty * depth).toFixed(2)}px, 0)`;
    });
  })();
}

/* ===================== 5) إظهار / إخفاء كلمة المرور ===================== */
const passToggle = $('#passToggle');
const passInput  = $('#password');

if (passToggle && passInput) {
  passToggle.addEventListener('click', () => {
    const show = passInput.type === 'password';
    passInput.type = show ? 'text' : 'password';
    passToggle.classList.toggle('visible', show);
    passToggle.setAttribute('aria-pressed', String(show));
    passToggle.setAttribute('aria-label', show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور');
    passInput.focus();
  });
}

/* ===================== 6) توهج الحقول أثناء الكتابة ===================== */
$$('.input-wrap input').forEach((input) => {
  const wrap = input.closest('.input-wrap');
  input.addEventListener('input', () => {
    wrap.classList.toggle('is-active', input.value.trim().length > 0);
  });
});

/* ===================== 7) التحقق من النموذج ===================== */
const form = $('#loginForm');
const emailInput  = $('#email');
const emailError  = $('#emailError');
const passError   = $('#passwordError');
const submitBtn   = $('#loginBtn');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setFieldError(input, errorEl, message) {
  const field = input.closest('.field');
  errorEl.querySelector('.err-text').textContent = message;
  field.classList.add('error');
  input.setAttribute('aria-invalid', 'true');

  /* اهتزاز أنيق (إعادة تشغيل الحركة) */
  field.classList.remove('shake');
  void field.offsetWidth;
  field.classList.add('shake');
}

function clearFieldError(input, errorEl) {
  const field = input.closest('.field');
  errorEl.querySelector('.err-text').textContent = '';
  field.classList.remove('error');
  input.removeAttribute('aria-invalid');
}

/* مسح الخطأ فور بدء المستخدم بالكتابة */
[emailInput, passInput].forEach((input) => {
  const errorEl = input === emailInput ? emailError : passError;
  input.addEventListener('input', () => {
    if (input.closest('.field').classList.contains('error')) {
      clearFieldError(input, errorEl);
    }
  });
});

function validate() {
  let isValid = true;

  /* البريد الإلكتروني */
  const emailValue = emailInput.value.trim();
  if (!emailValue) {
    setFieldError(emailInput, emailError, 'يرجى إدخال البريد الإلكتروني');
    isValid = false;
  } else if (!EMAIL_RE.test(emailValue)) {
    setFieldError(emailInput, emailError, 'صيغة البريد الإلكتروني غير صحيحة');
    isValid = false;
  } else {
    clearFieldError(emailInput, emailError);
  }

  /* كلمة المرور */
  const passValue = passInput.value;
  if (!passValue) {
    setFieldError(passInput, passError, 'يرجى إدخال كلمة المرور');
    isValid = false;
  } else if (passValue.length < 6) {
    setFieldError(passInput, passError, 'كلمة المرور يجب ألا تقل عن 6 أحرف');
    isValid = false;
  } else {
    clearFieldError(passInput, passError);
  }

  return isValid;
}

/* ===================== 8) زر تسجيل الدخول ===================== */
function createRipple(e, btn) {
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;

  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
  ripple.style.top  = `${e.clientY - rect.top - size / 2}px`;

  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);
}

function doLogin() {
  if (submitBtn.disabled) return;

  submitBtn.disabled = true;
  submitBtn.classList.add('loading');

  /* محاكاة طلب تسجيل الدخول إلى الخادم */
  setTimeout(() => {
    submitBtn.classList.remove('loading');
    submitBtn.classList.add('success');
    showToast('تم تسجيل الدخول بنجاح، أهلاً بك مجدداً في ريشة فن');

    /* انفجار جسيمات احتفالي من منتصف الزر */
    const rect = submitBtn.getBoundingClientRect();
    emitBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);

    /* إعادة ضبط الزر بعد اكتمال العرض */
    setTimeout(() => {
      submitBtn.classList.remove('success');
      submitBtn.disabled = false;
      form.reset();
      $$('.input-wrap').forEach((w) => w.classList.remove('is-active'));
    }, 3400);
  }, 1600);
}

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validate()) doLogin();
  });
}

if (submitBtn) {
  submitBtn.addEventListener('click', (e) => {
    if (!submitBtn.disabled && !submitBtn.classList.contains('loading') && !submitBtn.classList.contains('success')) {
      createRipple(e, submitBtn);
    }
  });
}

/* ===================== 9) التنبيه المنبثق (Toast) ===================== */
const toast = $('#toast');
const toastText = $('#toastText');
let toastTimer = null;

function showToast(message) {
  toastText.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3400);
}

/* ===================== 10) الروابط الثانوية ===================== */
const forgotLink = $('#forgotLink');
const signupLink = $('#signupLink');

[forgotLink, signupLink].forEach((link) => {
  if (link) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showToast(link === forgotLink
        ? 'سيتم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك'
        : 'أهلاً بك! سيتم توجيهك إلى صفحة إنشاء الحساب قريباً');
    });
  }
});

/* أزرار وسائل التواصل */
$$('.social').forEach((btn) => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.brand || 'وسيلة التواصل';
    showToast(`جاري التوجه إلى تسجيل الدخول عبر ${name}`);
  });
});
