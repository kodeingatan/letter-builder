import { EntitySchema } from 'typeorm'

export interface TemplateBinding {
  id: number
  templateId: number
  placementId: string
  componentId: number
  requirementName: string
  source: string
  sourceRef: string | null
  literalValue: string | null
  expression: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

export const TemplateBindingSchema = new EntitySchema<TemplateBinding>({
  name: 'template_bindings',
  columns: {
    id: { type: Number, primary: true, generated: true },
    templateId: { type: Number },
    placementId: { type: String, length: 64 },
    componentId: { type: Number },
    requirementName: { type: String, length: 64 },
    source: { type: String, length: 16 },
    sourceRef: { type: String, length: 255, nullable: true },
    literalValue: { type: 'text', nullable: true },
    expression: { type: 'text', nullable: true },
    status: { type: String, length: 16, default: 'bound' },
    createdAt: { type: 'datetime', createDate: true },
    updatedAt: { type: 'datetime', updateDate: true },
  },
  indices: [
    { name: 'IDX_TEMPLATE_BINDING_TEMPLATE_ID', columns: ['templateId'] },
    { name: 'IDX_TEMPLATE_BINDING_TEMPLATE_PLACEMENT_REQUIREMENT', columns: ['templateId', 'placementId', 'requirementName'], unique: true },
    { name: 'IDX_TEMPLATE_BINDING_COMPONENT_ID', columns: ['componentId'] },
  ],
})
