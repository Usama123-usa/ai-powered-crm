import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-pw4dcjf5j-usama123-usas-projects.vercel.app'

const api = axios.create({ baseURL: API_URL })

export const leadsApi = {
  getAll: () => api.get('/leads').then(r => r.data),
  getOne: (id) => api.get(`/leads/${id}`).then(r => r.data),
  create: (data) => api.post('/leads', data).then(r => r.data),
  update: (id, data) => api.patch(`/leads/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/leads/${id}`).then(r => r.data),
}

export const tasksApi = {
  getAll: (params) => api.get('/tasks', { params }).then(r => r.data),
  getByLead: (leadId) => api.get(`/tasks/lead/${leadId}`).then(r => r.data),
  create: (data) => api.post('/tasks', data).then(r => r.data),
  update: (id, data) => api.patch(`/tasks/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/tasks/${id}`).then(r => r.data),
  syncFromLeads: () => api.post('/tasks/sync-from-leads').then(r => r.data),
}

export const teamApi = {
  getAll: () => api.get('/team').then(r => r.data),
  create: (data) => api.post('/team', data).then(r => r.data),
  update: (id, data) => api.patch(`/team/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/team/${id}`).then(r => r.data),
}

export const callsApi = {
  initiate: (leadId) => api.post('/calls/initiate', { lead_id: leadId }).then(r => r.data),
  getByLead: (leadId) => api.get(`/calls/lead/${leadId}`).then(r => r.data),
}

export const emailsApi = {
  send: (data) => api.post('/emails/send', data).then(r => r.data),
  getByLead: (leadId) => api.get(`/emails/lead/${leadId}`).then(r => r.data),
}

export const analyticsApi = {
  get: () => api.get('/analytics').then(r => r.data),
}

export const meetingsApi = {
  getSlots: () => api.get('/meetings/slots').then(r => r.data),
  getAll: () => api.get('/meetings').then(r => r.data),
  getByLead: (leadId) => api.get(`/meetings/lead/${leadId}`).then(r => r.data),
  create: (data) => api.post('/meetings', data).then(r => r.data),
  update: (id, data) => api.patch(`/meetings/${id}`, data).then(r => r.data),
  cancel: (id) => api.delete(`/meetings/${id}`).then(r => r.data),
}
