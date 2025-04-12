import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

import userAPI from './src/server/user.js'
import profileAPI from './src/server/profile.js'
import restaurantAPI from './src/server/restaurant.js'

const app = express()

app.use(cors())
app.use(express.json())

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WebGIS API',
      version: '1.0.0',
      description: 'API documentation for WebGIS',
    },
    servers: [
      {
        url: `${process.env.BASE_HOST}:${process.env.API_PORT}`,
      },
    ],
  },
  apis: ['./src/server/*.js'],
}

const specs = swaggerJsdoc(options)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

// restaurant
app.get('/api/restaurants', restaurantAPI.getAll)
app.post('/api/restaurants', restaurantAPI.create)
app.put('/api/restaurants/:id', restaurantAPI.update)
app.get('/api/restaurants/:name', restaurantAPI.getByName)
app.delete('/api/restaurants/:id', restaurantAPI.delete)

// user
app.get('/api/users/:id', userAPI.findUser)
app.get('/api/users/findByEmail/:email', userAPI.findUserByEmail)
app.delete('/api/users', userAPI.delete)
app.get('/api/users', userAPI.getAll)
app.post('/api/users', userAPI.updateOrCreateUser)
app.put('/api/users/:id', userAPI.activateUser)
app.post('/api/login', userAPI.login)
app.post('/api/login-google', userAPI.loginGoogle)
app.post('/api/register', userAPI.register)

// profile
app.get('/api/profile', userAPI.getAll)
app.put('/api/profile/:id', profileAPI.update)

app.listen(process.env.API_PORT || 3000, () => {
  console.log(`Server started on port ${process.env.API_PORT || 3000}`)
})
