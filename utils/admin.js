import dotenv from 'dotenv'

dotenv.config()
const isAdmin = ({ nickname, id }) => {

  if (!process.env.USERS_ADMIN) return false

  const admins = JSON.parse(process.env.USERS_ADMIN) 
  const findIndexAdmin = admins.findIndex((user) => user.nickname.toLowerCase() === nickname.toLowerCase());

  if (findIndexAdmin === -1 ) return false

  const veridyId = admins[findIndexAdmin].id === id

  return veridyId 
}

export { isAdmin }