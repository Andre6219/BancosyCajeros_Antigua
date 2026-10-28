document.addEventListener('DOMContentLoaded', async () => {
  await loadSelectFilters();
  await loadPlaces();

  document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    loadPlaces();
  });
});

async function loadSelectFilters() {
  const categories = await getApiData('categorias');
  const entities = await getApiData('entidades');

  const catSelect = document.getElementById('category-select');
  const entSelect = document.getElementById('entity-select');

  if (categories) {
    categories.forEach(cat => {
      catSelect.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
    });
  }

  if (entities) {
    entities.forEach(ent => {
      entSelect.innerHTML += `<option value="${ent.id}">${ent.nombre}</option>`;
    });
  }
}

async function loadPlaces() {
  const container = document.getElementById('places-container');
  const spinner = document.getElementById('loading-spinner');
  
  const search = document.getElementById('search-input').value;
  const categoryId = document.getElementById('category-select').value;
  const entityId = document.getElementById('entity-select').value;

  spinner.classList.remove('d-none');
  container.innerHTML = '';

  let query = `lugares?search=${encodeURIComponent(search)}`;
  if (categoryId) query += `&categoriaId=${categoryId}`;
  if (entityId) query += `&entidadId=${entityId}`;

  const places = await getApiData(query);
  spinner.classList.add('d-none');

  if (!places || places.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center text-muted my-5">
        <i class="bi bi-info-circle display-4"></i>
        <p class="mt-2">No se encontraron registros para tu búsqueda.</p>
      </div>`;
    return;
  }

  places.forEach(place => {
    const gmapsUrl = `https://www.google.com/maps?q=${place.latitud},${place.longitud}`;
    const categoryName = place.Categorium ? place.Categorium.nombre : (place.Categoria ? place.Categoria.nombre : 'General');
    const entityName = place.Entidad ? place.Entidad.nombre : 'Sin Entidad';

    container.innerHTML += `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm border-0 place-card">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between mb-2">
              <span class="badge bg-primary">${categoryName}</span>
              <span class="badge bg-secondary">${entityName}</span>
            </div>
            <h5 class="card-title fw-bold text-dark">${place.nombre}</h5>
            <p class="card-text text-muted small mb-3">
              <i class="bi bi-geo-alt text-danger"></i> ${place.direccion || 'Sin dirección especificada'}
            </p>
            <div class="mt-auto d-flex justify-content-between align-items-center pt-2">
              <a href="detalle.html?id=${place.id}" class="btn btn-outline-primary btn-sm">Ver Detalle</a>
              <a href="${gmapsUrl}" target="_blank" class="btn btn-success btn-sm">
                <i class="bi bi-map-fill"></i> Abrir Mapa
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}