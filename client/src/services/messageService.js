import api from './api';

export const getMessages = (conversationId, page = 1, limit = 30) =>
  api
    .get(`/messages/conversations/${conversationId}/messages`, { params: { page, limit } })
    .then((r) => r.data);

export const sendMessage = (conversationId, receiverId, text) =>
  api.post('/messages', { conversationId, receiverId, text }).then((r) => r.data);

export const markConversationRead = (conversationId) =>
  api.patch(`/messages/conversations/${conversationId}/read`).then((r) => r.data);
