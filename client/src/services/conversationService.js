import api from './api';

export const getConversations = () => api.get('/conversations').then((r) => r.data);

export const createConversation = (participantId) =>
  api.post('/conversations', { participantId }).then((r) => r.data);
