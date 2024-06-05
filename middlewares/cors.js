import cors from 'cors'

const corsMiddleware = ({ acceptedOrigins }) => cors({
  origin: ( origin, callback ) => {

    if (acceptedOrigins.includes(origin) || !origin) {
      return callback(null, true)
    }

    return callback(new Error("Not allowed by CORS"))
  }
})

export { corsMiddleware }