import { api } from '../boot/axios'

export const updateProfile = async (id, profileData) => {
  return await api.put(`/profiles/${id}`, { profile: profileData })
}

export const getProfile = async (userId) => {
  return await api.get(`/profiles/${userId}`)
}

export const getAllProfiles = async () => {
  return await api.get('/profiles')
}

export const createProfile = async (profileData) => {
  return await api.post('/profiles', { profile: profileData })
}

export const deleteProfile = async (userId) => {
  return await api.delete(`/profiles/${userId}`)
}
