const API_BASE_URL = 'http://localhost:3000/api'; // Ajusta el puerto según tu servidor backend

// Petición GET genérica
async function getApiData(endpoint) {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error en GET /${endpoint}:`, error);
    return null;
  }
}

// Petición POST, PUT o DELETE genérica
async function sendApiData(endpoint, method = 'POST', data = null) {
  try {
    const options = {
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) {
      options.body = JSON.stringify(data);
    }
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, options);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error en ${method} /${endpoint}:`, error);
    return null;
  }
}