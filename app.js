let characters = [];
let currentCategory = 'All';

let favorites = JSON.parse(localStorage.getItem('fav_chars')) || [];
let userRatings = JSON.parse(localStorage.getItem('user_ratings')) || {};

async function loadCharacters() {
  try {
    const res = await fetch('characters.json');
    characters = await res.json();
    
    setupCategoryTabs();
    renderCards(filterCharactersList());
  } catch (error) {
    console.error('Không thể đọc dữ liệu characters.json:', error);
  }
}

function setupCategoryTabs() {
  const container = document.getElementById('categoryContainer');
  const categories = ['All', '❤️ Yêu thích', ...new Set(characters.map(c => c.category))];

  container.innerHTML = categories.map(cat => `
    <button class="cat-btn ${cat === 'All' ? 'active' : ''}" data-cat="${cat}">
      ${cat}
    </button>
  `).join('');

  container.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      container.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.dataset.cat;
      renderCards(filterCharactersList());
    });
  });
}

function renderCards(list) {
  const grid = document.getElementById('charGrid');
  
  if (list.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #a78bfa; padding: 2rem;">Chưa có nhân vật nào trong mục này ✨</p>`;
    return;
  }

  grid.innerHTML = list.map(char => {
    const isFav = favorites.includes(char.id);
    const score = userRatings[char.id] || char.rating || 5.0;

    return `
      <div class="char-card" onclick="openModal('${char.id}')">
        <button class="card-fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, '${char.id}')" title="Thêm vào yêu thích">
          ${isFav ? '❤️' : '🤍'}
        </button>

        <div class="card-img-container">
          <img src="${char.avatar}" alt="${char.name}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
          <span class="category-badge">${char.category}</span>
        </div>
        
        <div class="card-info">
          <h3>${char.name}</h3>
          <p class="title">${char.title}</p>
          
          <div class="card-rating">
            <span>⭐</span> <span>${score.toFixed(1)}</span>
          </div>

          <p style="font-size: 0.85rem; color: #cbd5e1; margin-top: 0.4rem;">${char.shortDesc}</p>
          
          <div class="card-tags">
            ${char.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterCharactersList() {
  const keyword = document.getElementById('searchInput').value.toLowerCase();

  return characters.filter(char => {
    let matchCat = false;
    if (currentCategory === 'All') matchCat = true;
    else if (currentCategory === '❤️ Yêu thích') matchCat = favorites.includes(char.id);
    else matchCat = (char.category === currentCategory);

    const matchSearch = char.name.toLowerCase().includes(keyword) || 
                        char.title.toLowerCase().includes(keyword) ||
                        char.tags.some(t => t.toLowerCase().includes(keyword));

    return matchCat && matchSearch;
  });
}

document.getElementById('searchInput').addEventListener('input', () => {
  renderCards(filterCharactersList());
});

function toggleFavorite(event, charId) {
  if (event) event.stopPropagation();

  if (favorites.includes(charId)) {
    favorites = favorites.filter(id => id !== charId);
  } else {
    favorites.push(charId);
  }

  localStorage.setItem('fav_chars', JSON.stringify(favorites));
  renderCards(filterCharactersList());

  const modalFavBtn = document.getElementById('modalFavBtn');
  if (modalFavBtn) {
    const isFav = favorites.includes(charId);
    modalFavBtn.className = `fav-modal-btn ${isFav ? 'active' : ''}`;
    modalFavBtn.innerHTML = isFav ? '❤️ Đã yêu thích' : '🤍 Yêu thích';
  }
}

function setRating(charId, score) {
  userRatings[charId] = score;
  localStorage.setItem('user_ratings', JSON.stringify(userRatings));
  
  updateModalStars(score);
  renderCards(filterCharactersList());
}

function updateModalStars(score) {
  const starsContainer = document.getElementById('starRating');
  if (!starsContainer) return;

  starsContainer.querySelectorAll('span').forEach((star, index) => {
    if (index < score) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

function openModal(charId) {
  const char = characters.find(c => c.id === charId);
  if (!char) return;

  const isFav = favorites.includes(char.id);
  const userScore = userRatings[char.id] || char.rating || 0;

  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <div class="modal-header-info">
      <img src="${char.avatar}" alt="${char.name}" onerror="this.src='https://via.placeholder.com/100'">
      <div>
        <h2>${char.name}</h2>
        <p style="color: #00f0ff; font-weight: 600;">${char.title} • <span style="color: #a78bfa;">${char.category}</span></p>
        <div class="card-tags" style="margin-top: 0.5rem;">
          ${char.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
        </div>
      </div>
    </div>
    
    <div class="modal-rating-section">
      <div style="display: flex; align-items: center; gap: 0.6rem;">
        <span style="font-size: 0.85rem; color: #a78bfa;">Đánh giá của bạn:</span>
        <div class="star-rating" id="starRating">
          ${[1, 2, 3, 4, 5].map(star => `
            <span class="${star <= userScore ? 'active' : ''}" onclick="setRating('${char.id}',${star})">★</span>
          `).join('')}
        </div>
      </div>

      <button id="modalFavBtn" class="fav-modal-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(null, '${char.id}')">
        ${isFav ? '❤️ Đã yêu thích' : '🤍 Yêu thích'}
      </button>
    </div>

    <p style="margin-top: 0.8rem;"><strong>Mô tả:</strong> ${char.shortDesc}</p>
    
    <div class="greeting-box">
      <strong>💬 Lời chào đầu tiên (First Message):</strong><br>
      "${char.greeting}"
    </div>

    <a href="${char.aiStudioLink}" target="_blank" class="play-btn">
      🚀 Trải nghiệm ngay trên Google AI Studio
    </a>
  `;

  document.getElementById('charModal').style.display = 'flex';
}

document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('charModal').style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === document.getElementById('charModal')) {
    document.getElementById('charModal').style.display = 'none';
  }
});

loadCharacters();