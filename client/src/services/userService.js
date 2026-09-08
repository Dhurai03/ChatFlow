import api from './api';

export const searchUsers = (search = '') =>
  api.get('/users', { params: { search } }).then((r) => r.data);

export const updateProfile = (data) =>
  api.patch('/users/profile', data).then((r) => r.data);
