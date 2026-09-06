import { join } from 'path'
import { mkdir, writeFile, stat } from 'fs/promises'

const STORAGE_DIR = join(process.cwd(), 'storage')
const ALLOWED_SUBFOLDERS = ['settings', 'avatars', 'general', 'documents']

export const StorageService = {
  async saveFile(subfolder: string, file: { originalFilename: string; buffer: Buffer }) {
    if (!ALLOWED_SUBFOLDERS.includes(subfolder)) {
      throw new Error('Invalid subfolder')
    }

    const dir = join(STORAGE_DIR, subfolder)
    await mkdir(dir, { recursive: true })

    const timestamp = Date.now()
    const random = Math.round(Math.random() * 1e6)
    const ext = file.originalFilename?.split('.').pop() || 'bin'
    const filename = `${subfolder}-${timestamp}-${random}.${ext}`

    await writeFile(join(dir, filename), file.buffer)
    return `/api/storage/${subfolder}/${filename}`
  },

  async getFilePath(subfolder: string, filename: string) {
    if (!ALLOWED_SUBFOLDERS.includes(subfolder)) {
      throw new Error('Invalid subfolder')
    }
    const filePath = join(STORAGE_DIR, subfolder, filename)
    await stat(filePath)
    return filePath
  },
}
