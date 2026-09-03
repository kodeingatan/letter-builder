import { getDataSource } from '~~/server/utils/db'
import { SettingSchema } from '~~/server/entities/setting.entity'

export const SettingsService = {
  async findAll() {
    const ds = await getDataSource()
    return ds.getRepository(SettingSchema).find()
  },

  async findByKey(key: string) {
    const ds = await getDataSource()
    const setting = await ds.getRepository(SettingSchema).findOne({ where: { key } })
    return setting?.value || null
  },

  async upsert(key: string, value: string) {
    const ds = await getDataSource()
    const repo = ds.getRepository(SettingSchema)
    let setting = await repo.findOne({ where: { key } })
    if (setting) {
      setting.value = value
    } else {
      setting = repo.create({ key, value })
    }
    return repo.save(setting)
  },

  async upsertMany(settings: { key: string; value: string }[]) {
    const results = []
    for (const { key, value } of settings) {
      results.push(await this.upsert(key, value))
    }
    return results
  },
}
