import mongoose from 'mongoose'

let connecting: Promise<typeof mongoose> | null = null

export function connectMongoDB(uri?: string): Promise<typeof mongoose> {
  const target = uri || process.env.MONGODB_URI
  if (!target) {
    return Promise.reject(new Error('MONGODB_URI is not defined'))
  }

  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose)
  }
  if (connecting) {
    return connecting
  }

  connecting = mongoose.connect(target).then((m) => {
    console.log('[MongoDB] connected')
    return m
  }).catch((err) => {
    connecting = null
    console.error('[MongoDB] connection failed:', err)
    throw err
  })

  return connecting
}

export function getMongoConnection() {
  return mongoose.connection
}
