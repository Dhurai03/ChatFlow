import api from './api';

export const searchUsers = (search = '') =>
  api.get('/users', { params: { search } }).then((r) => r.data);
