import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export const hashPassword = async (plainPassword) => {
  const hashed = await bcrypt.hash(plainPassword, SALT_ROUNDS)
  return hashed
}

export const comparePassword = async (plainPassword, hashedPassword) => {
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword)
  return isMatch
}
