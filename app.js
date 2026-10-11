/**
 * Cak Supi'i - Kanugrahan Hub
 * Balik Desa, Bikin Karya: Saatnya Kanugrahan Level Up!
 * Modern Gen-Z Community Movement & Agri-Tech Platform
 */

document.addEventListener('DOMContentLoaded', () => {
  initAmbientSound();
  initAspirasiFeed();
  initAgriSimulator();
  initInitiativeModals();
  initFaqAccordion();
  initStatCounters();
  initScrollNav();
  initCopyShare();
});

/* ========================================================
   1. AMBIENT SOUNDSCAPE (Web Audio API - Sawah Kanugrahan)
   ======================================================== */
let audioCtx = null;
let isAudioPlaying = false;
let ambientNodes = [];

function initAmbientSound() {
  const toggleBtn = document.getElementById('soundToggleBtn');
  const soundStatus = document.getElementById('soundStatus');
  const visualizerBars = document.querySelectorAll('.sound-bar');

  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    if (!isAudioPlaying) {
      startAmbientAudio();
      isAudioPlaying = true;
      toggleBtn.classList.add('bg-emerald-800', 'text-white', 'ring-2', 'ring-emerald-400');
      toggleBtn.classList.remove('bg-white/80', 'text-emerald-950');
      soundStatus.textContent = 'Suara Aliran Sawah (Aktif)';
      visualizerBars.forEach(b => b.classList.add('animate-pulse'));
    } else {
      stopAmbientAudio();
      isAudioPlaying = false;
      toggleBtn.classList.remove('bg-emerald-800', 'text-white', 'ring-2', 'ring-emerald-400');
      toggleBtn.classList.add('bg-white/80', 'text-emerald-950');
      soundStatus.textContent = 'Putar Suara Sawah';
      visualizerBars.forEach(b => b.classList.remove('animate-pulse'));
    }
  });
}

function startAmbientAudio() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Pink/Brown noise for relaxing water brook
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.1;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to simulate bubbling stream & irrigation flow
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, audioCtx.currentTime);

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    whiteNoise.start(0);

    ambientNodes = [whiteNoise, gainNode];
  } catch (e) {
    console.log('Audio init prevented:', e);
  }
}

function stopAmbientAudio() {
  try {
    ambientNodes.forEach(node => {
      if (node && node.stop) node.stop();
      if (node && node.disconnect) node.disconnect();
    });
    ambientNodes = [];
  } catch (e) {
    console.log('Audio stop error:', e);
  }
}

/* ========================================================
   2. KANUGRAHAN-HUB: LIVE ASPIRASI & CURHAT WARGA FEED
   ======================================================== */
const defaultAspirasi = [
  {
    id: 1,
    tag: '#Irigasi & Pertanian',
    author: 'Mas Rizki (Pemuda Tani Dusun Krajan)',
    text: 'Sistem jadwal giliran air blok kulon perlu dibuat grup WA transparan biar bapak-bapak nggak rebutan malam-malam & debit air terpantau jelas.',
    likes: 54,
    time: '3 jam yang lalu'
  },
  {
    id: 2,
    tag: '#IdeEventPemuda',
    author: 'Dinda Lestari (Karang Taruna)',
    text: 'Bikin Kanugrahan Mini Fest: Pameran olahan pangan lokal, live acoustic di tepi sawah, dan turnamen Mobile Legends pemuda desa biar makin guyub!',
    likes: 92,
    time: '5 jam yang lalu'
  },
  {
    id: 3,
    tag: '#UMKM & Dagang',
    author: 'Bu Wahyu & Tim Ibu Kreatif',
    text: 'Pelatihan packaging modern foil/vacuum buat keripik pisang dan rengginang warga. Biar bisa kurasi masuk oleh-oleh khas & live TikTok Shop.',
    likes: 71,
    time: '1 hari yang lalu'
  },
  {
    id: 4,
    tag: '#FasilitasUmum',
    author: 'Cak Hadi (Warga Blok Kidul)',
    text: 'Lampu penerangan solar panel swadaya di tikungan kali kidul jalan sawah biar bapak-bapak aman pas pulang ngarit sore dan penerangan jalan sawah.',
    likes: 126,
    time: '2 hari yang lalu'
  }
];

function getStoredAspirasi() {
  const data = localStorage.getItem('kanugrahan_aspirasi_data');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return defaultAspirasi;
    }
  }
  return defaultAspirasi;
}

function saveStoredAspirasi(data) {
  localStorage.setItem('kanugrahan_aspirasi_data', JSON.stringify(data));
}

let currentFilterTag = 'Semua';

function initAspirasiFeed() {
  const listContainer = document.getElementById('aspirasiFeedList');
  const chipButtons = document.querySelectorAll('.filter-chip');
  const newPostForm = document.getElementById('newAspirasiForm');
  const formChips = document.querySelectorAll('.form-tag-chip');
  const selectedTagInput = document.getElementById('formSelectedTag');
  const modalSuccess = document.getElementById('modalSuccessAspirasi');
  const closeModalBtn = document.getElementById('closeModalSuccess');

  if (!listContainer) return;

  function renderFeed() {
    const list = getStoredAspirasi();
    const filtered = currentFilterTag === 'Semua' 
      ? list 
      : list.filter(item => item.tag.toLowerCase().includes(currentFilterTag.toLowerCase().replace('#', '')));

    listContainer.innerHTML = '';

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="col-span-full py-12 text-center text-emerald-800/70">
          <p class="text-sm font-medium">Belum ada ide di kategori ini. Jadilah yang pertama menuangkan gagasan!</p>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'glass-card p-5 rounded-2xl flex flex-col justify-between border border-emerald-900/10 hover:border-emerald-500/40 transition-all';
      
      const tagColors = {
        '#Irigasi & Pertanian': 'bg-emerald-100 text-emerald-800 border-emerald-300',
        '#IdeEventPemuda': 'bg-amber-100 text-amber-800 border-amber-300',
        '#UMKM & Dagang': 'bg-teal-100 text-teal-800 border-teal-300',
        '#FasilitasUmum': 'bg-blue-100 text-blue-800 border-blue-300'
      };

      const tagClass = tagColors[item.tag] || 'bg-emerald-100 text-emerald-800 border-emerald-300';

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs px-2.5 py-1 rounded-full font-semibold border ${tagClass}">
              ${item.tag}
            </span>
            <span class="text-xs text-stone-500 font-medium">${item.time}</span>
          </div>
          <p class="text-stone-800 text-sm font-normal leading-relaxed mb-4">"${escapeHtml(item.text)}"</p>
        </div>
        <div class="pt-3 border-t border-emerald-950/10 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <div class="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">
              ${item.author.charAt(0).toUpperCase()}
            </div>
            <span class="text-xs font-semibold text-stone-700 truncate max-w-[150px] sm:max-w-[200px]">${escapeHtml(item.author)}</span>
          </div>
          <button class="like-btn flex items-center space-x-1.5 text-xs text-stone-600 hover:text-emerald-700 font-medium bg-white/70 hover:bg-emerald-50 px-2.5 py-1 rounded-full border border-stone-200 transition-colors" data-id="${item.id}">
            <svg class="w-3.5 h-3.5 text-rose-500 fill-rose-500" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <span class="like-count">${item.likes}</span>
          </button>
        </div>
      `;

      listContainer.appendChild(card);
    });

    // Attach like events
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(btn.getAttribute('data-id'));
        toggleLike(id, btn);
      });
    });
  }

  function toggleLike(id, btnElement) {
    const list = getStoredAspirasi();
    const item = list.find(x => x.id === id);
    if (!item) return;

    const likedKey = `aspirasi_liked_${id}`;
    const hasLiked = localStorage.getItem(likedKey);

    if (hasLiked) {
      item.likes = Math.max(0, item.likes - 1);
      localStorage.removeItem(likedKey);
      btnElement.classList.remove('bg-rose-50', 'text-rose-700', 'border-rose-300');
    } else {
      item.likes += 1;
      localStorage.setItem(likedKey, 'true');
      btnElement.classList.add('bg-rose-50', 'text-rose-700', 'border-rose-300');
    }

    saveStoredAspirasi(list);
    const countEl = btnElement.querySelector('.like-count');
    if (countEl) countEl.textContent = item.likes;
  }

  // Filter chips click
  chipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      chipButtons.forEach(b => {
        b.classList.remove('bg-emerald-800', 'text-white', 'shadow-sm');
        b.classList.add('bg-white', 'text-emerald-900', 'border-stone-200');
      });
      btn.classList.add('bg-emerald-800', 'text-white', 'shadow-sm');
      btn.classList.remove('bg-white', 'text-emerald-900', 'border-stone-200');

      currentFilterTag = btn.getAttribute('data-tag');
      renderFeed();
    });
  });

  // Form tag selector chips
  formChips.forEach(chip => {
    chip.addEventListener('click', () => {
      formChips.forEach(c => {
        c.classList.remove('bg-emerald-700', 'text-white', 'ring-2', 'ring-emerald-400');
        c.classList.add('bg-stone-100', 'text-stone-700');
      });
      chip.classList.add('bg-emerald-700', 'text-white', 'ring-2', 'ring-emerald-400');
      chip.classList.remove('bg-stone-100', 'text-stone-700');
      if (selectedTagInput) selectedTagInput.value = chip.getAttribute('data-val');
    });
  });

  // Handle Form Submission
  if (newPostForm) {
    newPostForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const textInput = document.getElementById('formAspirasiText');
      const authorInput = document.getElementById('formAspirasiAuthor');
      const tagValue = selectedTagInput ? selectedTagInput.value : '#Irigasi & Pertanian';

      if (!textInput.value.trim()) return;

      const newEntry = {
        id: Date.now(),
        tag: tagValue,
        author: authorInput.value.trim() ? authorInput.value.trim() : 'Pemuda Kanugrahan (Anonim)',
        text: textInput.value.trim(),
        likes: 1,
        time: 'Baru saja'
      };

      const list = getStoredAspirasi();
      list.unshift(newEntry);
      saveStoredAspirasi(list);

      // Reset form
      textInput.value = '';
      authorInput.value = '';

      renderFeed();

      // Show success modal
      if (modalSuccess) {
        modalSuccess.classList.remove('hidden-modal');
        modalSuccess.classList.add('visible-modal');
      }
    });
  }

  if (closeModalBtn && modalSuccess) {
    closeModalBtn.addEventListener('click', () => {
      modalSuccess.classList.remove('visible-modal');
      modalSuccess.classList.add('hidden-modal');
    });
  }

  // Initial render
  renderFeed();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ========================================================
   3. "BANGGA JADI PETANI MUDA": INTERACTIVE AGRI SIMULATOR
   ======================================================== */
const cropProfiles = {
  cabai: {
    name: 'Cabai Merah Keriting Modern',
    yieldPerHa: 14.5, // Ton
    pricePerKg: 35000, // Rp/kg
    costPerHa: 45000000,
    cycleMonths: 4,
    workersPerHa: 4,
    badge: 'Cash Crop Nilai Tinggi'
  },
  padi: {
    name: 'Padi Organik Premium Kanugrahan',
    yieldPerHa: 6.8, // Ton
    pricePerKg: 14000, // Rp/kg
    costPerHa: 16000000,
    cycleMonths: 3.5,
    workersPerHa: 3,
    badge: 'Pangan Berkelanjutan'
  },
  melon: {
    name: 'Melon Golden Sultan (Smart Greenhouse)',
    yieldPerHa: 22.0, // Ton
    pricePerKg: 28000, // Rp/kg
    costPerHa: 95000000,
    cycleMonths: 2.5,
    workersPerHa: 5,
    badge: 'Agri-Tech Presisi'
  },
  jagung: {
    name: 'Jagung Hibrida Pipil Kering',
    yieldPerHa: 8.5, // Ton
    pricePerKg: 5500, // Rp/kg
    costPerHa: 12000000,
    cycleMonths: 3.5,
    workersPerHa: 2,
    badge: 'Rotasi Cepat & Stabil'
  }
};

function initAgriSimulator() {
  const cropSelect = document.getElementById('simCropSelect');
  const areaSlider = document.getElementById('simAreaSlider');
  const areaDisplay = document.getElementById('simAreaDisplay');

  const outYield = document.getElementById('simOutYield');
  const outGross = document.getElementById('simOutGross');
  const outNet = document.getElementById('simOutNet');
  const outNetMonthly = document.getElementById('simOutNetMonthly');
  const outWorkers = document.getElementById('simOutWorkers');

  if (!areaSlider || !cropSelect) return;

  function calculate() {
    const cropKey = cropSelect.value;
    const crop = cropProfiles[cropKey] || cropProfiles.cabai;
    const area = parseFloat(areaSlider.value);

    if (areaDisplay) areaDisplay.textContent = area.toFixed(2) + ' Ha (' + Math.round(area * 10000) + ' m²)';

    const totalYieldTon = crop.yieldPerHa * area;
    const totalYieldKg = totalYieldTon * 1000;
    const grossIncome = totalYieldKg * crop.pricePerKg;
    const totalCost = crop.costPerHa * area;
    const netIncome = Math.max(0, grossIncome - totalCost);
    const netMonthly = Math.round(netIncome / crop.cycleMonths);
    const workers = Math.max(1, Math.round(crop.workersPerHa * area));

    if (outYield) outYield.textContent = totalYieldTon.toFixed(1) + ' Ton';
    if (outGross) outGross.textContent = formatRupiah(grossIncome);
    if (outNet) outNet.textContent = formatRupiah(netIncome);
    if (outNetMonthly) outNetMonthly.textContent = formatRupiah(netMonthly) + ' / bln';
    if (outWorkers) outWorkers.textContent = workers + ' Pemuda Terberdayakan';
  }

  cropSelect.addEventListener('change', calculate);
  areaSlider.addEventListener('input', calculate);

  calculate();
}

function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(number);
}

/* ========================================================
   4. 6 INISIATIF AKSI NYATA (Interactive Drawer/Modal)
   ======================================================== */
const initiativesDetail = {
  1: {
    title: 'Smart-Farming & Irigasi Presisi (Agri-GenZ)',
    tag: 'Modernisasi Pertanian',
    summary: 'Mengubah stigma bertani yang "kotor & capek" jadi modern, berbasis teknologi, dan menguntungkan pemuda desa.',
    points: [
      'Digitalisasi Jadwal Air: Pembagian debit air sawah transparan berbasis bot WhatsApp desa tanpa sengketa malam.',
      'Kemitraan Alsintan Modern: Penyediaan traktor dan drone sprayer pupuk organik bersama kelompok pemuda tani.',
      'Sertifikasi Organik: Pendampingan kualitas tanah agar gabah Kanugrahan berharga jual premium.'
    ],
    quote: '"Petani modern bukan yang mencangkul sampai bungkuk tanpa hitungan, tapi yang bertani dengan data, akal, dan keberkahan."'
  },
  2: {
    title: 'BUMDes Rebranding & Circular Economy',
    tag: 'Ekonomi Kerakyatan Syariah',
    summary: 'Mentransformasi BUMDes dari simpan-pinjam konvensional menjadi agregator logistik panen & lokomotif ekonomi mandiri.',
    points: [
      'Hub Penjualan Hasil Bumi: Menampung gabah dan sayur langsung dari petani tanpa jeratan tengkulak rente.',
      'Unit Pengolahan Pupuk Kandang Mandiri: Memanfaatkan limbah ternak warga jadi pupuk organik siap pakai.',
      'Audit Terbuka & Syariah: Laporan laba-rugi dipublikasikan tiap bulan di mading masjid & platform digital.'
    ],
    quote: '"BUMDes itu milik seluruh warga, rezeki yang berkah mengalir saat tidak ada yang ditutupi."'
  },
  3: {
    title: 'Local Creator & Youth Preneur Lab',
    tag: 'Inkubasi Bisnis Pemuda & Ibu',
    summary: 'Menjembatani produk rumahan warga desa agar tembus pasar retail, e-commerce, dan pasar kuliner kekinian.',
    points: [
      'Studio Foto & Desain Kemasan Gratis: Fasilitas foto produk estetik dan kemasan standing pouch bermutu.',
      'Akses Sertifikasi P-IRT & Halal: Pendampingan perizinan legalitas produk UMKM ibu-ibu desa sampai tuntas.',
      'Pelatihan Live TikTok & Shopee: Karang taruna diberdayakan jadi host live affiliate produk unggulan kampung.'
    ],
    quote: '"Dari dapur desa Kanugrahan, produk kita layak mejeng di etalase kota."'
  },
  4: {
    title: 'Creative Hub & Event Karang Taruna',
    tag: 'Wadah Ekspresi & Solidaritas',
    summary: 'Menyalurkan energi anak muda Kanugrahan ke kegiatan positif, kreatif, olahraga, dan kepedulian sosial.',
    points: [
      'Kanugrahan Fest & Pasar Senja: Event tahunan kolaborasi pameran produk desa, musik akustik, dan bazaar.',
      'Liga Olahraga & E-Sports Desa: Turnamen futsal, voli, dan Mobile Legends antar-dusun yang sportif & guyub.',
      'Aksi Bersih Kali & Penghijauan: Gerakan rutin anak muda menjaga kebersihan saluran air dan tanggul sawah.'
    ],
    quote: '"Anak muda itu bukan penonton masa depan. Mereka adalah penggerak hari ini."'
  },
  5: {
    title: 'Open Ledger & Kultur Transparan',
    tag: 'Kejujuran & Keberkahan',
    summary: 'Membangun budaya rembuk terbuka, gotong royong tanpa prasangka, dan transparansi anggaran inisiatif warga.',
    points: [
      'Rembuk Warga Bulanan: Diskusi santai kopi bareng di balai sawah untuk mengevaluasi setiap program bersama.',
      'Papan Transparansi Digital: Rekap donasi & penggunaan kas inisiatif dapat dipantau siapa saja secara real-time.',
      'Prinsip Khoirunnas Anfa\'uhum Lin-Nas: Bekerja murni sebagai khidmat tanpa kepentingan pribadi.'
    ],
    quote: '"Keberkahan suatu kampung dimulai saat warganya saling percaya dan para pemudanya tulus berkhidmat."'
  },
  6: {
    title: 'Kanugrahan-Hub (Aspirasi Interaktif Cepat)',
    tag: 'Sistem Gotong Royong Digital',
    summary: 'Platform pelaporan warga yang cepat tanggap, anti-birokrasi, dan memangkas jarak antara ide dan eksekusi nyata.',
    points: [
      'Lapor Masalah Lingkungan: Foto jalan berlubang, lampu padam, atau saluran mampet langsung terdisposisi ke relawan.',
      'Bank Ide & Kolaborasi: Siapapun warga yang punya inovasi langsung dicatat dan dijadwalkan rembuk tindak lanjut.',
      'Integrasi Bot WhatsApp Komunitas: Akses mudah bahkan untuk bapak tani sepuh yang minim literasi aplikasi rumit.'
    ],
    quote: '"Tidak ada keluhan warga yang terlalu kecil untuk didengar. Solusi cepat dimulai dari keterbukaan."'
  }
};

function initInitiativeModals() {
  const modal = document.getElementById('initiativeModal');
  const modalTitle = document.getElementById('initModalTitle');
  const modalTag = document.getElementById('initModalTag');
  const modalSummary = document.getElementById('initModalSummary');
  const modalPoints = document.getElementById('initModalPoints');
  const modalQuote = document.getElementById('initModalQuote');
  const closeBtn = document.getElementById('closeInitModal');
  const joinWaBtn = document.getElementById('initModalWaBtn');

  if (!modal) return;

  document.querySelectorAll('.open-initiative-btn').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-initiative-id');
      const data = initiativesDetail[id];
      if (!data) return;

      modalTitle.textContent = data.title;
      modalTag.textContent = data.tag;
      modalSummary.textContent = data.summary;
      modalQuote.textContent = data.quote;

      modalPoints.innerHTML = '';
      data.points.forEach(pt => {
        const li = document.createElement('li');
        li.className = 'flex items-start space-x-2 text-stone-700 text-sm';
        li.innerHTML = `
          <svg class="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
          <span>${pt}</span>
        `;
        modalPoints.appendChild(li);
      });

      if (joinWaBtn) {
        const msg = encodeURIComponent(`Halo Cak Supi'i & Tim Kanugrahan Level Up, saya tertarik ikut kolaborasi di inisiatif: ${data.title}`);
        joinWaBtn.href = `https://wa.me/6281234567890?text=${msg}`;
      }

      modal.classList.remove('hidden-modal');
      modal.classList.add('visible-modal');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('visible-modal');
      modal.classList.add('hidden-modal');
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('visible-modal');
      modal.classList.add('hidden-modal');
    }
  });
}

/* ========================================================
   5. FAQ ACCORDION
   ======================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');
    const icon = item.querySelector('.faq-icon');

    if (!trigger || !content) return;

    trigger.addEventListener('click', () => {
      const isOpen = !content.classList.contains('hidden');

      // Close all others
      faqItems.forEach(other => {
        const otherContent = other.querySelector('.faq-content');
        const otherIcon = other.querySelector('.faq-icon');
        if (otherContent) otherContent.classList.add('hidden');
        if (otherIcon) otherIcon.classList.remove('rotate-180');
      });

      if (!isOpen) {
        content.classList.remove('hidden');
        if (icon) icon.classList.add('rotate-180');
      }
    });
  });
}

/* ========================================================
   6. STAT COUNTERS & VIEWPORT ANIMATIONS
   ======================================================== */
function initStatCounters() {
  const counters = document.querySelectorAll('.counter-val');
  let animated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        counters.forEach(counter => {
          const target = parseInt(counter.getAttribute('data-target')) || 0;
          const prefix = counter.getAttribute('data-prefix') || '';
          const suffix = counter.getAttribute('data-suffix') || '';
          let count = 0;
          const duration = 1600;
          const stepTime = 25;
          const steps = duration / stepTime;
          const increment = target / steps;

          const timer = setInterval(() => {
            count += increment;
            if (count >= target) {
              counter.textContent = prefix + target + suffix;
              clearInterval(timer);
            } else {
              counter.textContent = prefix + Math.floor(count) + suffix;
            }
          }, stepTime);
        });
      }
    });
  }, { threshold: 0.2 });

  const statSection = document.getElementById('statsSection');
  if (statSection) observer.observe(statSection);
}

/* ========================================================
   7. NAVBAR ACTIVE SCROLL SPY & MOBILE MENU
   ======================================================== */
function initScrollNav() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenuDrawer = document.getElementById('mobileMenuDrawer');
  const closeMobileMenu = document.getElementById('closeMobileMenu');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 180;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('text-emerald-700', 'font-bold');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('text-emerald-700', 'font-bold');
      }
    });
  });

  if (mobileMenuBtn && mobileMenuDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuDrawer.classList.toggle('hidden');
    });
  }

  if (closeMobileMenu && mobileMenuDrawer) {
    closeMobileMenu.addEventListener('click', () => {
      mobileMenuDrawer.classList.add('hidden');
    });
  }

  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (mobileMenuDrawer) mobileMenuDrawer.classList.add('hidden');
    });
  });
}

/* ========================================================
   8. COPY SHARE LINK & TOAST
   ======================================================== */
function initCopyShare() {
  const shareBtn = document.getElementById('shareHubBtn');
  const toast = document.getElementById('toastNotice');

  if (!shareBtn) return;

  shareBtn.addEventListener('click', async () => {
    const shareData = {
      title: "Cak Supi'i | Kanugrahan Level Up",
      text: "Balik Desa, Bikin Karya: Saatnya Kanugrahan Level Up! Gerakan Pemuda & Smart-Agri Desa Kanugrahan.",
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('Link berhasil disalin ke clipboard!');
      });
    }
  });
}

function showToast(message) {
  const toast = document.getElementById('toastNotice');
  if (!toast) return;
  toast.querySelector('.toast-text').textContent = message;
  toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
  toast.classList.add('opacity-100', 'translate-y-0');

  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
  }, 3200);
}
