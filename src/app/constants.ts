import { environment } from '../environments/environment';

// Use proxy during development by keeping BASE_URL = '/api/' which maps to backend via proxy.conf.json
export const BASE_URL = environment.apiUrl && environment.apiUrl !== '' ? environment.apiUrl + '/api/' : '/api/';
