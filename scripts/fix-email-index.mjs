// 一次性脚本：把 users.email_1 索引重建为 sparse + unique，避免多用户都没有 email 时被当成重复 null 冲突。
// 用法：node scripts/fix-email-index.mjs
import mongoose from 'mongoose'
import 'dotenv/config'

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('MONGODB_URI is not set')
  process.exit(1)
}

await mongoose.connect(uri)
const col = mongoose.connection.db.collection('users')

const before = await col.indexes()
const emailIdx = before.find((i) => i.name === 'email_1')
console.log('before:', JSON.stringify(emailIdx))

if (emailIdx && !emailIdx.sparse) {
  await col.dropIndex('email_1')
  console.log('dropped non-sparse email_1')
}

await col.createIndex({ email: 1 }, { unique: true, sparse: true, name: 'email_1' })
console.log('after:', JSON.stringify((await col.indexes()).find((i) => i.name === 'email_1')))

await mongoose.disconnect()
