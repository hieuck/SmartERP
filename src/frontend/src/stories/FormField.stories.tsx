import type { Meta, StoryObj } from '@storybook/react'
import { Form, Input, Select, DatePicker } from 'antd'
import { FormField } from '../components/common/FormField'

const meta: Meta<typeof FormField> = {
  title: 'Components/FormField',
  component: FormField,
  parameters: {
    docs: {
      description: {
        component: 'Wrapper for Ant Design Form.Item with consistent styling, validation, and accessibility features.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Form layout="vertical" style={{ maxWidth: 600 }}>
        <Story />
      </Form>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof FormField>

/**
 * Default FormField with text input
 */
export const Default: Story = {
  args: {
    name: 'username',
    label: 'Username',
    children: <Input placeholder="Enter username" />,
  },
}

/**
 * Required field with validation
 */
export const Required: Story = {
  args: {
    name: 'email',
    label: 'Email',
    required: true,
    children: <Input type="email" placeholder="Enter email" />,
  },
}

/**
 * Field with tooltip
 */
export const WithTooltip: Story = {
  args: {
    name: 'password',
    label: 'Password',
    required: true,
    tooltip: 'Password must be at least 8 characters',
    children: <Input.Password placeholder="Enter password" />,
  },
}

/**
 * Field with help text
 */
export const WithHelpText: Story = {
  args: {
    name: 'phone',
    label: 'Phone Number',
    help: 'Format: +1 (555) 123-4567',
    children: <Input placeholder="Enter phone number" />,
  },
}

/**
 * Field with custom validation rules
 */
export const WithCustomRules: Story = {
  args: {
    name: 'age',
    label: 'Age',
    required: true,
    rules: [
      { type: 'number', message: 'Must be a number' },
      { min: 18, message: 'Must be at least 18' },
      { max: 100, message: 'Must be under 100' },
    ],
    children: <Input type="number" placeholder="Enter age" />,
  },
}

/**
 * Select field
 */
export const SelectField: Story = {
  args: {
    name: 'country',
    label: 'Country',
    required: true,
    children: (
      <Select placeholder="Select country">
        <Select.Option value="us">United States</Select.Option>
        <Select.Option value="uk">United Kingdom</Select.Option>
        <Select.Option value="ca">Canada</Select.Option>
      </Select>
    ),
  },
}

/**
 * Date picker field
 */
export const DateField: Story = {
  args: {
    name: 'birthdate',
    label: 'Birth Date',
    required: true,
    tooltip: 'Select your date of birth',
    children: <DatePicker style={{ width: '100%' }} />,
  },
}

/**
 * Textarea field
 */
export const TextareaField: Story = {
  args: {
    name: 'description',
    label: 'Description',
    help: 'Maximum 500 characters',
    rules: [{ max: 500, message: 'Description too long' }],
    children: <Input.TextArea rows={4} placeholder="Enter description" />,
  },
}

/**
 * Field with nested name (array)
 */
export const NestedField: Story = {
  args: {
    name: ['user', 'profile', 'bio'],
    label: 'Bio',
    children: <Input.TextArea rows={3} placeholder="Tell us about yourself" />,
  },
}

/**
 * Complete form example
 */
export const CompleteForm: Story = {
  render: () => (
    <Form layout="vertical" style={{ maxWidth: 600 }}>
      <FormField name="fullName" label="Full Name" required>
        <Input placeholder="John Doe" />
      </FormField>

      <FormField
        name="email"
        label="Email"
        required
        rules={[{ type: 'email', message: 'Invalid email format' }]}
      >
        <Input placeholder="john@example.com" />
      </FormField>

      <FormField
        name="password"
        label="Password"
        required
        tooltip="At least 8 characters with uppercase, lowercase, and numbers"
        rules={[
          { min: 8, message: 'Password must be at least 8 characters' },
        ]}
      >
        <Input.Password placeholder="Enter password" />
      </FormField>

      <FormField
        name="role"
        label="Role"
        required
        help="Select your primary role"
      >
        <Select placeholder="Select role">
          <Select.Option value="admin">Administrator</Select.Option>
          <Select.Option value="user">User</Select.Option>
          <Select.Option value="guest">Guest</Select.Option>
        </Select>
      </FormField>

      <FormField name="bio" label="Bio" help="Optional - tell us about yourself">
        <Input.TextArea rows={4} placeholder="Your bio..." />
      </FormField>
    </Form>
  ),
}
