document.addEventListener('DOMContentLoaded', async () => {
  await loadAdminSelects();
  await loadAdminTable();

  document.getElementById('place-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('cancel-edit-btn').addEventListener('click', resetForm);
});

async function loadAdminSelects() {
  const categories = await getApiData('categorias');
  const entities = await getApiData('entidades');
  const locations = await getApiData('ubicaciones');

  fillSelect('form-category', categories);
  fillSelect('form-entity', entities);
  fillSelect('form-location', locations);
}

function fillSelect(elementId, items) {
  const select = document.getElementById(elementId);
  select.innerHTML = '<option value="">-- Seleccionar --</option>';
  if (items) {
    items.forEach(item => {
      select.innerHTML += `<option value="${item.id}">${item.nombre || item.municipio}</option>`;
    });
  }
}

async function loadAdminTable() {
  const places = await getApiData('lugares');
  const tbody = document.getElementById('admin-table-body');
  tbody.innerHTML = '';

  if (!places || places.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center p-3 text-muted">No hay registros cargados.</td></tr>';
    return;
  }

  places.forEach(place => {
    const categoryName = place.Categorium ? place.Categorium.nombre : (place.Categoria ? place.Categoria.nombre : 'General');
    tbody.innerHTML += `
      <tr>
        <td class="fw-bold">${place.nombre}</td>
        <td><span class="badge bg-primary">${categoryName}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="deletePlace(${place.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const payload = {
    nombre: document.getElementById('form-name').value,
    categoriaId: document.getElementById('form-category').value,
    entidadId: document.getElementById('form-entity').value,
    ubicacionId: document.getElementById('form-location').value,
    direccion: document.getElementById('form-address').value,
    latitud: parseFloat(document.getElementById('form-lat').value),
    longitud: parseFloat(document.getElementById('form-lng').value),
    descripcion: document.getElementById('form-description').value
  };

  const result = await sendApiData('lugares', 'POST', payload);

  if (result) {
    alert('¡Registro guardado con éxito!');
    resetForm();
    await loadAdminTable();
  } else {
    alert('Ocurrió un error al guardar el registro.');
  }
}

async function deletePlace(id) {
  if (confirm('¿Seguro que deseas eliminar este registro?')) {
    await sendApiData(`lugares/${id}`, 'DELETE');
    await loadAdminTable();
  }
}

function resetForm() {
  document.getElementById('place-form').reset();
  document.getElementById('place-id').value = '';
}