async function searchAyah() {
  const query = document.getElementById('searchInput').value;
  const res = await fetch(`https://api.alquran.cloud/v1/search/${query}/all/ar`);
  const data = await res.json();
  const container = document.getElementById('results');
  container.innerHTML = '';
  data.data.matches.forEach(match => {
    const card = document.createElement('div');
    card.className = 'ayah-card';
    card.innerHTML = `
      <div><strong>${match.text}</strong> <br> [${match.surah.name} - ${match.numberInSurah}]</div>
      <button onclick="toggleTafsir(this)">📘 عرض التفسير</button>
      <div class="tafsir">تفسير مختصر للآية سيتم إضافته لاحقًا...</div>
    `;
    container.appendChild(card);
  });
}

function toggleTafsir(btn) {
  const tafsir = btn.nextElementSibling;
  tafsir.style.display = tafsir.style.display === 'none' ? 'block' : 'none';
}

function startVoiceSearch() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'ar-SA';
  recognition.onresult = function(event) {
    document.getElementById('searchInput').value = event.results[0][0].transcript;
    searchAyah();
  };
  recognition.start();
}
