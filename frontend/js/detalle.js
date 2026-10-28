document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const placeId = urlParams.get('id');

  if (!placeId) {
    window.location.href = 'index.html';
    return;
  }

  const place = await getApiData(`lugares/${placeId}`);

  if (place) {
    document.getElementById('place-name').textContent = place.nombre;
    document.getElementById('place-category').textContent = place.Categorium ? place.Categorium.nombre : (place.Categoria ? place.Categoria.nombre : 'Lugar');
    document.getElementById('place-entity').textContent = place.Entidad ? place.Entidad.nombre : 'General';
    document.getElementById('place-description').textContent = place.descripcion || 'Sin descripción disponible.';
    document.getElementById('place-address').textContent = place.direccion || 'No especificada';
    
    const locationName = place.Ubicacion ? `${place.Ubicacion.municipio}, ${place.Ubicacion.departamento}` : 'Antigua Guatemala';
    document.getElementById('place-location').textContent = locationName;
    
    document.getElementById('place-phone').textContent = place.telefono || 'No disponible';
    
    const webElem = document.getElementById('place-website');
    if (place.sitioWeb) {
      webElem.href = place.sitioWeb;
      webElem.textContent = place.sitioWeb;
    } else {
      webElem.textContent = 'No disponible';
      webElem.removeAttribute('href');
    }

    document.getElementById('place-lat').textContent = place.latitud;
    document.getElementById('place-lng').textContent = place.longitud;

    const gmapsUrl = `https://www.google.com/maps?q=${place.latitud},${place.longitud}`;
    document.getElementById('gmaps-link').href = gmapsUrl;
  }
});