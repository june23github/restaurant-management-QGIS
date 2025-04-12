import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default {
  /**
   * @swagger
   * /api/restaurants:
   *   get:
   *     tags:
   *       - Restaurants
   *     summary: Get all restaurants with pagination and search
   *     parameters:
   *       - name: page
   *         in: query
   *         description: Page number
   *         schema:
   *           type: integer
   *           default: 1
   *       - name: per_page
   *         in: query
   *         description: Number of items per page
   *         schema:
   *           type: integer
   *           default: 10
   *       - name: search
   *         in: query
   *         description: Search by restaurant name
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of restaurants
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 count:
   *                   type: integer
   *                 data:
   *                   type: object
   *                   properties:
   *                     type:
   *                       type: string
   *                     features:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Restaurant'
   *                 page:
   *                   type: integer
   *                 per_page:
   *                   type: integer
   *       400:
   *         description: Cannot find any restaurants
   */
  getAll: async (req, res) => {
    try {
      const data = await prisma.$queryRaw`
        SELECT
          id,
          name,
          ST_AsGeoJSON(geom)::json AS geometry,
          cuisine,
          "addr:street" AS addr_street,
          "addr:housenumber" AS addr_housenumber
        FROM restaurants
        ORDER BY name ASC
      `

      const geojson = {
        type: 'FeatureCollection',
        features: data.map((row) => ({
          type: 'Feature',
          properties: {
            id: row.id,
            name: row.name,
            cuisine: row.cuisine,
            addr_street: row.addr_street,
            addr_housenumber: row.addr_housenumber,
          },
          geometry: row.geometry,
        })),
      }

      res.json(geojson)
    } catch (error) {
      console.error('Lỗi truy vấn:', error)
      res.status(400).json({ message: 'Không tìm thấy nhà hàng nào!' })
    }
  },

  /**
   * @swagger
   * /api/restaurants/{name}:
   *   get:
   *     tags:
   *       - Restaurants
   *     summary: Get a restaurant by name
   *     parameters:
   *       - name: name
   *         in: path
   *         description: Restaurant name
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Restaurant found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Restaurant'
   *       404:
   *         description: Restaurant not found
   */
  getByName: async (req, res) => {
    const { name } = req.params
    try {
      const restaurants = await prisma.$queryRaw`
        SELECT
          id,
          name,
          ST_AsGeoJSON(geom)::json AS geometry,
          cuisine,
          "addr:street" AS addr_street,
          "addr:housenumber" AS addr_housenumber
        FROM restaurants
        WHERE name ILIKE ${'%' + name + '%'}
      `

      if (!restaurants || restaurants.length === 0) {
        return res.status(404).json({ message: 'No restaurants found!' })
      }

      const geojson = {
        type: 'FeatureCollection',
        features: restaurants.map((restaurant) => ({
          type: 'Feature',
          properties: {
            id: restaurant.id,
            name: restaurant.name,
            cuisine: restaurant.cuisine,
            addr_street: restaurant.addr_street,
            addr_housenumber: restaurant.addr_housenumber,
          },
          geometry: restaurant.geometry,
        })),
      }

      res.json(geojson)
    } catch (error) {
      console.error('Lỗi truy vấn:', error)
      res.status(400).json({ message: 'Cannot find restaurants!' })
    }
  },

  /**
   * @swagger
   * /api/restaurants:
   *   post:
   *     tags:
   *       - Restaurants
   *     summary: Create a new restaurant
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               latitude:
   *                 type: number
   *               longitude:
   *                 type: number
   *               cuisine:
   *                 type: string
   *               addr_street:
   *                 type: string
   *               addr_housenumber:
   *                 type: string
   *     responses:
   *       201:
   *         description: Restaurant created successfully
   *       400:
   *         description: Invalid request
   */
  create: async (req, res) => {
    try {
      const { name, latitude, longitude, cuisine, addr_street, addr_housenumber } = req.body

      if (!name || !latitude || !longitude) {
        return res.status(400).json({ message: 'Name, latitude, and longitude are required!' })
      }

      const restaurant = await prisma.$queryRaw`
        INSERT INTO restaurants (
          name,
          geom,
          cuisine,
          "addr:street",
          "addr:housenumber"
        )
        VALUES (
          ${name},
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
          ${cuisine},
          ${addr_street},
          ${addr_housenumber}
        )
        RETURNING
          id,
          name,
          ST_AsGeoJSON(geom)::json AS geometry,
          cuisine,
          "addr:street" AS addr_street,
          "addr:housenumber" AS addr_housenumber
      `

      const geojson = {
        type: 'Feature',
        properties: {
          id: restaurant[0].id,
          name: restaurant[0].name,
          cuisine: restaurant[0].cuisine,
          addr_street: restaurant[0].addr_street,
          addr_housenumber: restaurant[0].addr_housenumber,
        },
        geometry: restaurant[0].geometry,
      }

      res.status(201).json(geojson)
    } catch (error) {
      console.error('Lỗi tạo nhà hàng:', error)
      res.status(400).json({ message: 'Restaurant create attempt failed!' })
    }
  },

  /**
   * @swagger
   * /api/restaurants/{id}:
   *   put:
   *     tags:
   *       - Restaurants
   *     summary: Update a restaurant by ID
   *     parameters:
   *       - name: id
   *         in: path
   *         description: Restaurant ID
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               latitude:
   *                 type: number
   *               longitude:
   *                 type: number
   *               cuisine:
   *                 type: string
   *               addr_street:
   *                 type: string
   *               addr_housenumber:
   *                 type: string
   *     responses:
   *       200:
   *         description: Restaurant updated successfully
   *       400:
   *         description: Invalid request
   *       404:
   *         description: Restaurant not found
   */
  update: async (req, res) => {
    const { id } = req.params
    const { name, latitude, longitude, cuisine, addr_street, addr_housenumber } = req.body

    try {
      const restaurant = await prisma.$queryRaw`
        UPDATE restaurants
        SET
          name = COALESCE(${name}, name),
          geom = COALESCE(${latitude && longitude ? `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)` : null}, geom),
          cuisine = COALESCE(${cuisine}, cuisine),
          "addr:street" = COALESCE(${addr_street}, "addr:street"),
          "addr:housenumber" = COALESCE(${addr_housenumber}, "addr:housenumber")
        WHERE id = ${parseInt(id)}
        RETURNING
          id,
          name,
          ST_AsGeoJSON(geom)::json AS geometry,
          cuisine,
          "addr:street" AS addr_street,
          "addr:housenumber" AS addr_housenumber
      `

      if (!restaurant || restaurant.length === 0) {
        return res.status(404).json({ message: 'Restaurant not found!' })
      }

      const geojson = {
        type: 'Feature',
        properties: {
          id: restaurant[0].id,
          name: restaurant[0].name,
          cuisine: restaurant[0].cuisine,
          addr_street: restaurant[0].addr_street,
          addr_housenumber: restaurant[0].addr_housenumber,
        },
        geometry: restaurant[0].geometry,
      }

      res.json(geojson)
    } catch (error) {
      console.error('Lỗi cập nhật nhà hàng:', error)
      res.status(400).json({ message: 'Restaurant update attempt failed!' })
    }
  },

  /**
   * @swagger
   * /api/restaurants/{id}:
   *   delete:
   *     tags:
   *       - Restaurants
   *     summary: Delete a restaurant by ID
   *     parameters:
   *       - name: id
   *         in: path
   *         description: Restaurant ID
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Restaurant deleted successfully
   *       404:
   *         description: Restaurant not found
   */
  delete: async (req, res) => {
    const { id } = req.params
    try {
      const restaurant = await prisma.$queryRaw`
        DELETE FROM restaurants
        WHERE id = ${parseInt(id)}
        RETURNING
          id,
          name,
          ST_AsGeoJSON(geom)::json AS geometry,
          cuisine,
          "addr:street" AS addr_street,
          "addr:housenumber" AS addr_housenumber
      `

      if (!restaurant || restaurant.length === 0) {
        return res.status(404).json({ message: 'Restaurant not found!' })
      }

      const geojson = {
        type: 'Feature',
        properties: {
          id: restaurant[0].id,
          name: restaurant[0].name,
          cuisine: restaurant[0].cuisine,
          addr_street: restaurant[0].addr_street,
          addr_housenumber: restaurant[0].addr_housenumber,
        },
        geometry: restaurant[0].geometry,
      }

      res.json(geojson)
    } catch (error) {
      console.error('Lỗi xóa nhà hàng:', error)
      res.status(400).json({ message: 'Restaurant delete attempt failed!' })
    }
  },
}
