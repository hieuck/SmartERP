import React from 'react'
import { Form, Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import type { Rule } from 'antd/es/form'

/**
 * FormField component - Wrapper for Ant Design Form.Item with consistent styling
 * 
 * @example
 * ```tsx
 * <FormField name="email" label="Email" required>
 *   <Input placeholder="Enter email" />
 * </FormField>
 * ```
 */
export interface FormFieldProps {
  /** Field name for form state */
  name: string | string[]
  
  /** Label text displayed above input */
  label: string
  
  /** Whether field is required (adds * indicator and validation) */
  required?: boolean
  
  /** Additional validation rules */
  rules?: Rule[]
  
  /** Input component (Input, Select, DatePicker, etc.) */
  children: React.ReactNode
  
  /** Tooltip text shown next to label */
  tooltip?: string
  
  /** Help text shown below input */
  help?: string
  
  /** ARIA label for accessibility */
  'aria-label'?: string
  
  /** ARIA described by for accessibility */
  'aria-describedby'?: string
}

/**
 * FormField Component
 * 
 * Provides consistent form field styling with:
 * - Automatic required validation
 * - Tooltip support
 * - Help text
 * - Accessibility attributes
 * - Theme token integration
 */
export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  required = false,
  rules = [],
  children,
  tooltip,
  help,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  // Build validation rules
  const validationRules: Rule[] = [
    ...(required
      ? [
          {
            required: true,
            message: `Please input ${label.toLowerCase()}`,
          },
        ]
      : []),
    ...rules,
  ]

  // Build label with tooltip
  const labelNode = (
    <span>
      {label}
      {tooltip && (
        <Tooltip title={tooltip}>
          <QuestionCircleOutlined style={{ marginLeft: 4, cursor: 'help' }} />
        </Tooltip>
      )}
    </span>
  )

  return (
    <Form.Item
      name={name}
      label={labelNode}
      rules={validationRules}
      help={help}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      {children}
    </Form.Item>
  )
}

export default FormField
