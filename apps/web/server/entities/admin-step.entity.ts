import { EntitySchema } from 'typeorm'

export interface AdminStep {
  id: number
  adminId: number
  templateId: number
  stepOrder: number
  mappingJson: string
}

export const AdminStepSchema = new EntitySchema<AdminStep>({
  name: 'admin_steps',
  columns: {
    id: { type: Number, primary: true, generated: true },
    adminId: { type: Number },
    templateId: { type: Number },
    stepOrder: { type: Number },
    mappingJson: { type: 'text', default: '{}' },
  },
  relations: {
    administration: {
      type: 'many-to-one',
      target: 'administrations',
      joinColumn: { name: 'adminId', referencedColumnName: 'id' },
      onDelete: 'CASCADE',
    },
    template: {
      type: 'many-to-one',
      target: 'doc_templates',
      joinColumn: { name: 'templateId', referencedColumnName: 'id' },
      onDelete: 'RESTRICT',
    },
  },
  indices: [
    { columns: ['adminId', 'stepOrder'], unique: true },
  ],
})
