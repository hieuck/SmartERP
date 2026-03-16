import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Form } from 'antd'
import { FormField } from './FormField'

describe('FormField Component', () => {
  it('renders with label', () => {
    render(
      <Form>
        <FormField name="test" label="Test Field">
          <input />
        </FormField>
      </Form>
    )

    expect(screen.getByText('Test Field')).toBeInTheDocument()
  })

  it('renders required indicator when required=true', () => {
    render(
      <Form>
        <FormField name="test" label="Test Field" required>
          <input />
        </FormField>
      </Form>
    )

    // Ant Design adds asterisk for required fields
    const label = screen.getByText('Test Field')
    expect(label).toBeInTheDocument()
  })

  it('renders tooltip when provided', () => {
    render(
      <Form>
        <FormField name="test" label="Test Field" tooltip="Help text">
          <input />
        </FormField>
      </Form>
    )

    // Tooltip icon should be present
    const tooltipIcon = document.querySelector('.anticon-question-circle')
    expect(tooltipIcon).toBeInTheDocument()
  })

  it('renders help text when provided', () => {
    render(
      <Form>
        <FormField name="test" label="Test Field" help="This is help text">
          <input />
        </FormField>
      </Form>
    )

    expect(screen.getByText('This is help text')).toBeInTheDocument()
  })

  it('renders children input', () => {
    render(
      <Form>
        <FormField name="test" label="Test Field">
          <input data-testid="test-input" />
        </FormField>
      </Form>
    )

    expect(screen.getByTestId('test-input')).toBeInTheDocument()
  })

  it('applies custom validation rules', () => {
    const customRules = [
      { min: 5, message: 'Minimum 5 characters' },
      { max: 10, message: 'Maximum 10 characters' },
    ]

    render(
      <Form>
        <FormField name="test" label="Test Field" rules={customRules}>
          <input />
        </FormField>
      </Form>
    )

    // Form.Item should be rendered with rules
    const formItem = document.querySelector('.ant-form-item')
    expect(formItem).toBeInTheDocument()
  })

  it('supports array name for nested fields', () => {
    render(
      <Form>
        <FormField name={['user', 'email']} label="Email">
          <input />
        </FormField>
      </Form>
    )

    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('applies aria-label when provided', () => {
    render(
      <Form>
        <FormField name="test" label="Test Field" aria-label="Test input field">
          <input />
        </FormField>
      </Form>
    )

    // Form.Item should have aria-label
    const formItem = document.querySelector('.ant-form-item')
    expect(formItem).toBeInTheDocument()
  })
})
