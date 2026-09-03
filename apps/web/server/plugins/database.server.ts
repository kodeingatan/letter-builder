import { getDataSource } from '~~/server/utils/db'
import { seedDatabase } from '~~/server/services/seeder.service'

export default defineNitroPlugin(async () => {
  const ds = await getDataSource()
  await seedDatabase(ds)
})
