import { api } from 'boot/axios'

const getAll = async () => {
  const response = await api.get('/restaurants')
  return response.data
}

const getByName = async (name) => {
  const response = await api.get(`/restaurants/${name}`)
  return response.data
}

const addRestaurant = async (restaurantBody) => {
  const response = await api.post('/restaurants', restaurantBody)
  return response
}

const updateRestaurant = async (id, restaurantBody) => {
  const response = await api.put(`/restaurants/${id}`, restaurantBody)
  return response
}

const deleteRestaurant = async (id) => {
  const response = await api.delete(`/restaurants/${id}`)
  return response
}

export default {
  getAll,
  getByName,
  addRestaurant,
  updateRestaurant,
  deleteRestaurant,
}
