
import { environment } from '../../../environments/environment';

// URL principal del backend
export const API_BASE_URL = environment.apiUrl;

// URL raíz de los endpoints
export const API_URL = `${API_BASE_URL}/api`;

// URL de autenticación
export const AUTH_API_URL = `${API_URL}/auth`;
