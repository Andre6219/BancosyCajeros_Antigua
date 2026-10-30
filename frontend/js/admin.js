document.addEventListener('DOMContentLoaded', async () => {
  // Verificar autenticación
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Inicializar componentes
  await loadSelectOptions();
  await loadPlacesTable();

  // Event Listeners
  document.getElementById('place-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('btn-cancel').addEventListener('click', resetForm);
  document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  });
});

// Cargar opciones para los selects de Entidad y Ubicación
async function loadSelectOptions() {
  try {
    const [entities, locations] = await Promise.all([
      getApiData('entidades'),
      getApiData('ubicaciones')
    ]);

    const entitySelect = document.getElementById('form-entity');
    const locationSelect = document.getElementById('form-location');

    if (entities && entitySelect) {
      entitySelect.innerHTML = '<option value="">-- Seleccionar Entidad --</option>' +
        entities.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('');
    }

    if (locations && locationSelect) {
      locationSelect.innerHTML = '<option value="">-- Seleccionar Municipio --</option>' +
        locations.map(l => `<option value="${l.id}">${l.municipio}</option>`).join('');
    }
  } catch (error) {
    console.error('Error al cargar opciones de los select:', error);
  }
}

// Cargar lista de lugares en la tabla
async function loadPlacesTable() {
  const tbody = document.getElementById('places-table-body');
  const countBadge = document.getElementById('total-records');

  try {
    const places = await getApiData('lugares');
    
    if (!places || places.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="2" class="text-center py-4 text-muted">
            No hay registros cargados.
          </td>
        </tr>`;
      countBadge.textContent = '0 Registros';
      return;
    }

    countBadge.textContent = `${places.length} Registros`;
    tbody.innerHTML = places.map(place => `
      <tr>
        <td class="ps-3 fw-medium">
          <div>${place.nombre}</div>
          <small class="text-muted"><i class="bi bi-geo-alt"></i> ${place.direccion || 'Sin dirección'}</small>
        </td>
        <td class="text-end pe-3">
          <button class="btn btn-outline-primary btn-sm me-1" onclick="editPlace(${place.id})" title="Editar">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn btn-outline-danger btn-sm" onclick="deletePlace(${place.id})" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error al cargar la tabla:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="2" class="text-center py-4 text-danger">
          Error al conectar con la base de datos.
        </td>
      </tr>`;
  }
}

// Guardar o Actualizar Registro (Sin Categoría)
async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('form-id').value;
  const payload = {
    nombre: document.getElementById('form-name').value,
    entidadId: document.getElementById('form-entity').value,
    ubicacionId: document.getElementById('form-location').value,
    direccion: document.getElementById('form-address').value,
    latitud: parseFloat(document.getElementById('form-lat').value),
    longitud: parseFloat(document.getElementById('form-lng').value),
    descripcion: document.getElementById('form-description').value
  };

  const endpoint = id ? `lugares/${id}` : 'lugares';
  const method = id ? 'PUT' : 'POST';

  const response = await sendApiData(endpoint, method, payload);
  if (response) {
    resetForm();
    await loadPlacesTable();
  }
}

// Cargar datos en el formulario para Editar
async function editPlace(id) {
  const place = await getApiData(`lugares/${id}`);
  if (!place) return;

  document.getElementById('form-id').value = place.id;
  document.getElementById('form-name').value = place.nombre;
  document.getElementById('form-entity').value = place.entidadId || '';
  document.getElementById('form-location').value = place.ubicacionId || '';
  document.getElementById('form-address').value = place.direccion || '';
  document.getElementById('form-lat').value = place.latitud;
  document.getElementById('form-lng').value = place.longitud;
  document.getElementById('form-description').value = place.descripcion || '';

  // Cambiar interfaz al modo edición
  document.getElementById('form-title').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Registro';
  document.getElementById('btn-save').innerHTML = '<i class="bi bi-check-lg me-1"></i> Actualizar Registro';
  document.getElementById('btn-cancel').classList.remove('d-none');
}

// Eliminar Registro
async function deletePlace(id) {
  if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
    const response = await sendApiData(`lugares/${id}`, 'DELETE');
    if (response) {
      await loadPlacesTable();
    }
  }
}

// Limpiar formulario y resetear estado
function resetForm() {
  document.getElementById('place-form').reset();
  document.getElementById('form-id').value = '';
  document.getElementById('form-title').innerHTML = '<i class="bi bi-plus-circle me-2"></i>Registrar Nuevo Lugar / Servicio';
  document.getElementById('btn-save').innerHTML = '<i class="bi bi-floppy me-1"></i> Guardar Registro';
  document.getElementById('btn-cancel').classList.add('d-none');
}