document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initBot();
  loadEntitiesSelect();
  loadPlaces();

  // Evento de Búsqueda
  document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    filterPlaces();
  });

  // Recentrar mapa
  document.getElementById('btn-recenter').addEventListener('click', () => {
    if (map) map.setView([14.5586, -90.7339], 15);
  });

  // Botón Favoritos
  document.getElementById('btn-nav-favoritos').addEventListener('click', () => {
    showFavoritesOnly();
  });

  document.getElementById('btn-nav-inicio').addEventListener('click', (e) => {
    e.preventDefault();
    loadPlaces();
    document.getElementById('list-title').innerHTML = '<i class="bi bi-bank text-primary me-2"></i> Lugares y Servicios';
  });
});

let map;
let markersGroup;
let allPlaces = [
  { id: 1, name: 'Banco Industrial - Agencia Antigua', entity: 'Banco Industrial', type: 'banco', address: '2a Av. Norte #5', distance: '0.4 km', lat: 14.5572, lng: -90.7332 },
  { id: 2, name: 'Banrural - Agencia Parque Central', entity: 'Banrural', type: 'banco', address: '4a Calle Oriente #2', distance: '0.2 km', lat: 14.5565, lng: -90.7328 },
  { id: 3, name: 'Cajero 5B - Calle del Arco', entity: '5B', type: 'cajero', address: '5ta Ave Norte y Calle del Arco', distance: '0.5 km', lat: 14.5592, lng: -90.7341 },
  { id: 4, name: 'G&T Continental - Agencia Central', entity: 'G&T Continental', type: 'banco', address: '5a Avenida Sur #4', distance: '0.3 km', lat: 14.5560, lng: -90.7335 },
  { id: 5, name: 'Cajero BI 24 Horas - Calzada Santa Lucía', entity: 'Banco Industrial', type: 'cajero', address: 'Calzada Santa Lucía Sur', distance: '0.8 km', lat: 14.5550, lng: -90.7380 },
  { id: 6, name: 'BAC Credomatic - Antigua GT', entity: 'BAC Credomatic', type: 'banco', address: '4a Calle Poniente #12', distance: '0.6 km', lat: 14.5578, lng: -90.7360 }
];

function initMap() {
  const antiguaCoords = [14.5586, -90.7339];
  map = L.map('antigua-map').setView(antiguaCoords, 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  markersGroup = L.layerGroup().addTo(map);

  setTimeout(() => { map.invalidateSize(); }, 400);
}

function loadEntitiesSelect() {
  const select = document.getElementById('entity-select');
  const entities = [...new Set(allPlaces.map(p => p.entity))];
  
  select.innerHTML = '<option value="">Todas las entidades</option>' + 
    entities.map(e => `<option value="${e}">${e}</option>`).join('');
}

function renderPlaces(places) {
  const container = document.getElementById('places-container');
  const countBadge = document.getElementById('results-count');
  const favorites = JSON.parse(localStorage.getItem('fav_places') || '[]');

  countBadge.textContent = `${places.length} resultados`;
  markersGroup.clearLayers();

  if (places.length === 0) {
    container.innerHTML = '<div class="col-12 text-center py-4 text-muted">No se encontraron lugares que coincidan con los filtros.</div>';
    return;
  }

  const bounds = [];

  container.innerHTML = places.map(place => {
    const isFav = favorites.includes(place.id);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;

    // Marcador en el mapa con Popup para abrir en Google Maps
    const popupContent = `
      <div style="font-family: sans-serif;">
        <b style="font-size:0.95rem;">${place.name}</b><br>
        <small style="color:#666;">${place.address}</small><br>
        <a href="${googleMapsUrl}" target="_blank" style="display:inline-block; margin-top:6px; padding:4px 8px; background-color:#4285F4; color:#fff; text-decoration:none; border-radius:4px; font-size:0.75rem; font-weight:bold;">
          <i class="bi bi-box-arrow-up-right"></i> Abrir en Google Maps
        </a>
      </div>
    `;

    const marker = L.marker([place.lat, place.lng]).bindPopup(popupContent);
    markersGroup.addLayer(marker);
    bounds.push([place.lat, place.lng]);

    return `
      <div class="col-md-6">
        <div class="card card-antigua p-3 h-100 shadow-sm position-relative">
          <div class="d-flex align-items-start gap-3">
            <div class="place-icon-badge ${place.type === 'cajero' ? 'cajero' : ''}">
              <i class="bi ${place.type === 'cajero' ? 'bi-credit-card-2-front' : 'bi-bank'}"></i>
            </div>
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between align-items-start">
                <h6 class="fw-bold mb-0 text-dark" style="font-size: 0.9rem;">${place.name}</h6>
                <button class="btn-fav ${isFav ? 'active' : ''}" onclick="toggleFavorite(${place.id})" title="Favorito">
                  <i class="bi bi-heart${isFav ? '-fill' : ''}"></i>
                </button>
              </div>
              <span class="badge bg-light text-secondary border my-1">${place.entity}</span>
              <div class="text-muted small mt-1" style="font-size: 0.78rem;">
                <div><i class="bi bi-geo-alt me-1"></i>${place.address}</div>
                <div class="fw-semibold text-dark mt-1"><i class="bi bi-pin-map me-1"></i>A ${place.distance} del parque</div>
              </div>
            </div>
          </div>
          <div class="d-flex gap-2 mt-3">
            <button onclick="focusMap(${place.lat}, ${place.lng}, '${place.name}', '${place.address}')" class="btn btn-antigua-primary btn-sm py-1 px-2 flex-grow-1">
              <i class="bi bi-geo-fill me-1"></i> Ver en mapa
            </button>
            <a href="${googleMapsUrl}" target="_blank" class="btn btn-outline-danger btn-sm py-1 px-2 fw-semibold">
              <i class="bi bi-google me-1"></i> Maps
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (bounds.length > 0 && map) {
    map.fitBounds(bounds, { padding: [30, 30] });
  }
}

function loadPlaces() {
  renderPlaces(allPlaces);
}

function filterPlaces() {
  const searchText = document.getElementById('search-input').value.toLowerCase();
  const selectedEntity = document.getElementById('entity-select').value;
  const selectedType = document.getElementById('type-select').value;

  const filtered = allPlaces.filter(p => {
    const matchText = p.name.toLowerCase().includes(searchText) || p.address.toLowerCase().includes(searchText);
    const matchEntity = !selectedEntity || p.entity === selectedEntity;
    const matchType = !selectedType || p.type === selectedType;
    return matchText && matchEntity && matchType;
  });

  renderPlaces(filtered);
}

function focusMap(lat, lng, title, address) {
  if (map) {
    map.setView([lat, lng], 17);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    
    L.marker([lat, lng]).addTo(map).bindPopup(`
      <div>
        <b>${title}</b><br><small>${address}</small><br>
        <a href="${googleMapsUrl}" target="_blank" style="display:inline-block; margin-top:5px; color:#4285F4; font-weight:bold;">
          Abrir en Google Maps &raquo;
        </a>
      </div>
    `).openPopup();
  }
}

function toggleFavorite(id) {
  let favorites = JSON.parse(localStorage.getItem('fav_places') || '[]');
  if (favorites.includes(id)) {
    favorites = favorites.filter(favId => favId !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem('fav_places', JSON.stringify(favorites));
  filterPlaces();
}

function showFavoritesOnly() {
  const favorites = JSON.parse(localStorage.getItem('fav_places') || '[]');
  const favPlaces = allPlaces.filter(p => favorites.includes(p.id));
  document.getElementById('list-title').innerHTML = '<i class="bi bi-heart-fill text-danger me-2"></i> Mis Bancos y Cajeros Favoritos';
  renderPlaces(favPlaces);
}

function initBot() {
  const toggleBtn = document.getElementById('bot-toggle-btn');
  const closeBtn = document.getElementById('bot-close-btn');
  const chatWindow = document.getElementById('bot-chat-window');
  const sendBtn = document.getElementById('bot-send-btn');
  const input = document.getElementById('bot-input');
  const messages = document.getElementById('bot-messages');

  toggleBtn.addEventListener('click', () => {
    chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
  });

  closeBtn.addEventListener('click', () => chatWindow.style.display = 'none');

  function botReply(text) {
    const userMsg = document.createElement('div');
    userMsg.className = 'msg-user';
    userMsg.textContent = text;
    messages.appendChild(userMsg);

    setTimeout(() => {
      const botMsg = document.createElement('div');
      botMsg.className = 'msg-bot';
      const q = text.toLowerCase();

      if (q.includes('cajero') || q.includes('24')) {
        botMsg.innerHTML = '🏧 <strong>Don Antigüeño:</strong> Hay cajeros 24 horas seguros sobre la <strong>5ta Avenida Calle del Arco</strong> y en Calzada Santa Lucía.';
      } else if (q.includes('dolar') || q.includes('divisa') || q.includes('cambio')) {
        botMsg.innerHTML = '💵 <strong>Don Antigüeño:</strong> Te sugiero <strong>Banco Industrial</strong> o <strong>BAC Credomatic</strong> para las mejores tasas oficiales en Antigua.';
      } else if (q.includes('banrural')) {
        botMsg.innerHTML = '🏛️ <strong>Don Antigüeño:</strong> La agencia Banrural se encuentra frente al <strong>Parque Central</strong> (4a Calle Oriente).';
      } else {
        botMsg.innerHTML = '😊 <strong>Don Antigüeño:</strong> Puedo indicarte la ubicación exacta y guiarte a Google Maps para cualquier agencia en Antigua Guatemala.';
      }

      messages.appendChild(botMsg);
      messages.scrollTop = messages.scrollHeight;
    }, 500);
  }

  sendBtn.addEventListener('click', () => {
    if (input.value.trim()) {
      botReply(input.value.trim());
      input.value = '';
    }
  });

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      botReply(input.value.trim());
      input.value = '';
    }
  });

  document.querySelectorAll('.btn-quick').forEach(btn => {
    btn.addEventListener('click', (e) => {
      botReply(e.target.textContent);
    });
  });
}