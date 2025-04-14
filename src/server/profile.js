import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default {
  /**
   * @swagger
   * /api/profiles:
   *   post:
   *     tags:
   *       - Profiles
   *     summary: Create a user profile
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Profile'
   *     responses:
   *       200:
   *         description: Profile created successfully
   *       400:
   *         description: Profile creation failed
   */
  create: async (req, res) => {
    const { profile } = req.body
    try {
      const data = await prisma.profile.create({
        data: {
          email: profile.email || undefined,
          name: profile.name || undefined,
          picture: profile.picture || undefined,
          gender: profile.gender || undefined,
          address: profile.address || undefined,
          birthday: profile.birthday || undefined,
        },
      })
      res.json(data)
    } catch {
      res.status(400).json({ message: 'Profile create attempt failed!' })
    }
  },

  /**
   * @swagger
   * /api/profiles/{id}:
   *   put:
   *     tags:
   *       - Profiles
   *     summary: Update a user profile by ID
   *     parameters:
   *       - name: id
   *         in: path
   *         description: Profile ID
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Profile'
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *       400:
   *         description: Profile update failed
   */
  update: async (req, res) => {
    const { id } = req.params
    const { profile } = req.body

    try {
      const updateData = {
        email: profile.email || undefined,
        name: profile.name || undefined,
        picture: profile.picture || undefined,
        gender: profile.gender?.value || profile.gender || undefined,
        birthday: profile.birthday || undefined,
        address: profile.address || undefined,
        phone_number: profile.phone_number || undefined,
        current_location: profile.current_location || undefined,
      }

      const data = await prisma.profile.update({
        where: {
          id: id,
        },
        data: updateData,
      })
      res.json(data)
    } catch (error) {
      console.error('Profile update error:', error)
      res.status(400).json({ message: 'Profile update attempt failed!', error: error.message })
    }
  },

  /**
   * @swagger
   * /api/profiles:
   *   get:
   *     tags:
   *       - Profiles
   *     summary: Get all user profiles
   *     responses:
   *       200:
   *         description: Successful operation
   *       400:
   *         description: Failed to retrieve profiles
   */
  getAll: async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        include: {
          profile: true,
        },
      })
      res.json(users)
    } catch {
      res.status(400).json({ message: 'Cannot find any profiles!' })
    }
  },

  /**
   * @swagger
   * /api/profiles/{id}:
   *   get:
   *     tags:
   *       - Profiles
   *     summary: Get a user profile by ID
   *     parameters:
   *       - name: id
   *         in: path
   *         description: Profile ID
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Successful operation
   *       404:
   *         description: Profile not found
   */
  getById: async (req, res) => {
    const { id } = req.params
    try {
      const profile = await prisma.profile.findUnique({
        where: {
          id: id,
        },
      })

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found!' })
      }

      res.json(profile)
    } catch (error) {
      console.error('Get profile error:', error)
      res.status(400).json({ message: 'Failed to retrieve profile!', error: error.message })
    }
  },

  /**
   * @swagger
   * /api/profiles/{id}:
   *   delete:
   *     tags:
   *       - Profiles
   *     summary: Delete a profile by ID
   *     parameters:
   *       - name: id
   *         in: path
   *         description: Profile ID
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Successful operation
   *       400:
   *         description: Profile deletion failed
   */
  delete: async (req, res) => {
    const { id } = req.params
    try {
      const response = await prisma.profile.delete({
        where: {
          id: parseInt(id),
        },
      })
      res.json(response)
    } catch {
      res.status(400).json({ message: 'Profile delete attempt failed!' })
    }
  },
}
