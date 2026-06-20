/* ═══ Spotlight ═══ */
const spot = document.getElementById('spot');
document.addEventListener('mousemove', e => {
  spot.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;
});

/* ═══ Progress bar + scroll effects ═══ */
window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  document.getElementById('prog').style.width = pct + '%';
  document.getElementById('mainnav').classList.toggle('scrolled', window.scrollY > 40);
  document.getElementById('btt').classList.toggle('show', window.scrollY > 500);
}, {passive:true});

/* ═══ Mobile nav ═══ */
const hbg = document.getElementById('hbg');
const navl = document.getElementById('navl');
hbg.addEventListener('click', () => { hbg.classList.toggle('open'); navl.classList.toggle('open'); });
navl.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { hbg.classList.remove('open'); navl.classList.remove('open'); }));

/* ═══ Active nav highlight ═══ */
const secs = document.querySelectorAll('section[id]');
const nlinks = document.querySelectorAll('.nav-links a');
secs.forEach(s => new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    nlinks.forEach(l => l.classList.remove('active'));
    const m = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
    if (m) m.classList.add('active');
  });
},{threshold:.35}).observe(s));

/* ═══ Scroll reveal ═══ */
const revEls = document.querySelectorAll('.reveal');
const revIO = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); revIO.unobserve(e.target); }});
},{threshold:.1,rootMargin:'0px 0px -30px 0px'});
revEls.forEach(el => revIO.observe(el));

document.querySelectorAll('.skills-grid,.proj-grid').forEach(g => {
  g.querySelectorAll('.reveal').forEach((el,i) => el.style.transitionDelay = (i*.08)+'s');
});

/* ═══ Skill bars ═══ */
const bars = document.querySelectorAll('.sbar-fill');
const barIO = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.style.width = e.target.dataset.w + '%'; barIO.unobserve(e.target); }});
},{threshold:.5});
bars.forEach(b => barIO.observe(b));

/* ═══ 3D tilt ═══ */
document.querySelectorAll('.sk-card,.pj-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - .5;
    const y = (e.clientY - r.top)  / r.height - .5;
    card.style.transform = `translateY(-4px) rotateX(${-y*7}deg) rotateY(${x*7}deg)`;
    card.style.transition = 'border-color .22s,box-shadow .22s';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'border-color .22s,transform .35s,box-shadow .22s';
  });
});

/* ═══ Contact form — sends real email via Web3Forms ═══
   Setup: get a free access key at https://web3forms.com
   (just enter your Gmail, no signup/login needed) and paste it
   into the hidden "access_key" input in index.html. */
async function sendMsg(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = document.getElementById('cfBtn');
  const ok   = document.getElementById('fok');
  const err  = document.getElementById('ferr');

  ok.classList.remove('show');
  err.classList.remove('show');

  const accessKey = form.access_key.value;
  if (!accessKey || accessKey === 'YOUR_ACCESS_KEY_HERE') {
    err.textContent = '⚠️ Form not connected yet — add your Web3Forms access key in index.html.';
    err.classList.add('show');
    return;
  }

  const originalBtnText = btn.textContent;
  btn.textContent = 'Sending…';
  btn.disabled = true;

  try {
    const formData = new FormData(form);
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: formData
    });
    const result = await res.json();

    if (result.success) {
      ok.classList.add('show');
      form.reset();
    } else {
      err.classList.add('show');
    }
  } catch (networkErr) {
    err.classList.add('show');
  } finally {
    btn.textContent = originalBtnText;
    btn.disabled = false;
    setTimeout(() => { ok.classList.remove('show'); err.classList.remove('show'); }, 7000);
  }
}

/* ═══════════════════════════════════════
   CERTIFICATE MANAGER (localStorage based)
   Default cert from resume is baked in;
   user-added certs persist in this browser.
═══════════════════════════════════════ */
const CERT_KEY = 'praveen_certs_v1';
const defaultCerts = [
];

function loadCerts() {
  try {
    const raw = localStorage.getItem(CERT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}
function saveCerts(list) {
  try { localStorage.setItem(CERT_KEY, JSON.stringify(list)); } catch (e) { console.error('Storage error', e); }
}

function renderCerts() {
  const grid = document.getElementById('certGrid');
  const userCerts = loadCerts();
  const all = [...defaultCerts, ...userCerts];

  grid.innerHTML = '';

  all.forEach((c, idx) => {
    const card = document.createElement('div');
    card.className = 'cert-card';
    card.innerHTML = `
      <div class="cert-thumb">${c.img ? `<img src="${c.img}" alt="${c.name}"/>` : '🏆'}</div>
      <div class="cert-body">
        <div class="cert-name">${escapeHtml(c.name)}</div>
        <div class="cert-issuer">${escapeHtml(c.issuer || '')}</div>
      </div>
      ${c.builtin ? '' : `<button class="cert-remove" title="Remove" data-idx="${idx - defaultCerts.length}">✕</button>`}
    `;
    grid.appendChild(card);
  });

  // add "+" tile to add more
  const addTile = document.createElement('div');
  addTile.className = 'cert-card placeholder';
  addTile.onclick = openCertModal;
  addTile.innerHTML = `<div class="plus">＋</div><div>Add Certificate</div>`;
  grid.appendChild(addTile);

  // wire up remove buttons
  grid.querySelectorAll('.cert-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.idx, 10);
      const list = loadCerts();
      list.splice(i, 1);
      saveCerts(list);
      renderCerts();
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function openCertModal() {
  document.getElementById('certModal').classList.add('show');
}
function closeCertModal() {
  document.getElementById('certModal').classList.remove('show');
  document.getElementById('cName').value = '';
  document.getElementById('cIssuer').value = '';
  document.getElementById('cFile').value = '';
}

function saveCert() {
  const name = document.getElementById('cName').value.trim();
  const issuer = document.getElementById('cIssuer').value.trim();
  const fileInput = document.getElementById('cFile');

  if (!name) { alert('Please enter a certificate name.'); return; }

  const finish = (imgDataUrl) => {
    const list = loadCerts();
    list.push({ name, issuer, img: imgDataUrl || null });
    saveCerts(list);
    closeCertModal();
    renderCerts();
  };

  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => finish(reader.result);
    reader.onerror = () => finish(null);
    reader.readAsDataURL(file);
  } else {
    finish(null);
  }
}

function exportCerts() {
  const all = [...defaultCerts, ...loadCerts()];
  const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'praveen-certificates-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('certModal').addEventListener('click', (e) => {
  if (e.target.id === 'certModal') closeCertModal();
});

renderCerts();

/* ===========================
   THEME TOGGLE
=========================== */

const themeBtn =
document.getElementById("themeBtn");

themeBtn.addEventListener("click",()=>{

document.body.classList.toggle("light-theme");

if(document.body.classList.contains("light-theme")){

themeBtn.innerHTML="☀️";

localStorage.setItem("theme","light");

}
else{

themeBtn.innerHTML="🌙";

localStorage.setItem("theme","dark");

}

});

if(localStorage.getItem("theme")==="light"){

document.body.classList.add("light-theme");

themeBtn.innerHTML="☀️";

}

/* ===========================
   LOADER
=========================== */

window.addEventListener("load",()=>{

setTimeout(()=>{

document.getElementById("loader").style.display="none";

},1000);

});

/* ===========================
   COUNTER
=========================== */

const counters =
document.querySelectorAll(".counter");

counters.forEach(counter=>{

const updateCounter=()=>{

const target=
+counter.getAttribute("data-target");

const current=
+counter.innerText;

const increment=
target/100;

if(current<target){

counter.innerText=
Math.ceil(current+increment);

setTimeout(updateCounter,20);

}else{

counter.innerText=target;

}

};

updateCounter();

});
