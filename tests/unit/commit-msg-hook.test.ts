/**
 * Smart Commit Hook Tests
 * Tests for .husky/commit-msg validation rules
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock git functions
const mockGitDiff = vi.fn()
const mockGitRevParse = vi.fn()

// Validation functions
const validateCommitFormat = (message: string): { valid: boolean; error?: string } => {
  const pattern = /^(feat|fix|refactor|docs|test|chore|perf|ci)(\([a-zA-Z0-9_-]+\))?: .+$/
  if (!message || !pattern.test(message)) {
    return { valid: false, error: 'Invalid commit message format. Use: type: description' }
  }
  return { valid: true }
}

const validateNoBlockedKeywords = (message: string): { valid: boolean; error?: string } => {
  const blocked = ['WIP', 'draft', 'work in progress']
  const lower = message.toLowerCase()
  for (const keyword of blocked) {
    if (lower.includes(keyword.toLowerCase())) {
      return { valid: false, error: `Blocked keyword found: ${keyword}` }
    }
  }
  return { valid: true }
}

const validateLength = (message: string): { valid: boolean; error?: string } => {
  const firstLine = message.split('\n')[0]
  if (firstLine.length > 100) {
    return { valid: false, error: `First line too long (${firstLine.length} chars, max 100)` }
  }
  return { valid: true }
}

const validateNoHardcodedSecrets = (files: string[]): { valid: boolean; error?: string } => {
  const secretPatterns = ['api_key', 'secret', 'password', 'token']
  // Simplified - in real implementation would check file contents
  return { valid: true }
}

const validateBranchName = (branch: string): { valid: boolean; warning?: string } => {
  const standardBranches = ['main', 'master']
  if (standardBranches.includes(branch)) {
    return { valid: true }
  }
  const branchPattern = /^(feature|fix|hotfix|refactor|docs|test|chore|perf|ci)\//
  if (!branchPattern.test(branch)) {
    return { valid: true, warning: 'Non-standard branch name format' }
  }
  return { valid: true }
}

// Test suite
describe('Smart Commit Hook', () => {
  describe('validateCommitFormat', () => {
    it('should accept valid conventional commit format', () => {
      const validMessages = [
        'feat: add user authentication',
        'fix: resolve login bug',
        'refactor: clean up service layer',
        'docs: update API documentation',
        'test: add unit tests for auth',
        'chore: update dependencies',
        'perf: optimize database queries',
        'ci: configure CI pipeline',
        'style: format code',
        'feat(auth): add login button',
        'fix(api/user): handle null email',
      ]

      for (const msg of validMessages) {
        const result = validateCommitFormat(msg)
        expect(result.valid).toBe(true)
      }
    })

    it('should reject invalid commit formats', () => {
      const invalidMessages = [
        'add user authentication',
        'WIP: working on login',
        'draft: new feature',
        '',
        'feat add user authentication',
        'FIX: wrong case',
        'feat:',
        'feat: ',
      ]

      for (const msg of invalidMessages) {
        const result = validateCommitFormat(msg)
        expect(result.valid).toBe(false)
      }
    })
  })

  describe('validateNoBlockedKeywords', () => {
    it('should reject WIP commits', () => {
      const result = validateNoBlockedKeywords('WIP: working on feature')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('blocked')
    })

    it('should reject draft commits', () => {
      const result = validateNoBlockedKeywords('draft: new feature')
      expect(result.valid).toBe(false)
    })

    it('should accept clean commits', () => {
      const result = validateNoBlockedKeywords('feat: add user auth')
      expect(result.valid).toBe(true)
    })
  })

  describe('validateLength', () => {
    it('should accept short commit messages', () => {
      const result = validateLength('feat: add user auth')
      expect(result.valid).toBe(true)
    })

    it('should reject long first lines', () => {
      const longMessage = 'feat: ' + 'a'.repeat(100)
      const result = validateLength(longMessage)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('too long')
    })
  })

  describe('validateBranchName', () => {
    it('should accept standard branches', () => {
      expect(validateBranchName('main').valid).toBe(true)
      expect(validateBranchName('master').valid).toBe(true)
    })

    it('should accept feature branches', () => {
      expect(validateBranchName('feature/user-auth').valid).toBe(true)
      expect(validateBranchName('fix/login-bug').valid).toBe(true)
    })

    it('should warn on non-standard branches', () => {
      const result = validateBranchName('my-random-branch')
      expect(result.valid).toBe(true)
      expect(result.warning).toBeDefined()
    })
  })

  describe('full validation pipeline', () => {
    it('should pass all validations for clean commit', () => {
      const message = 'feat(auth): add login button'
      
      const formatResult = validateCommitFormat(message)
      const keywordResult = validateNoBlockedKeywords(message)
      const lengthResult = validateLength(message)
      
      expect(formatResult.valid).toBe(true)
      expect(keywordResult.valid).toBe(true)
      expect(lengthResult.valid).toBe(true)
    })

    it('should fail on WIP commit', () => {
      const message = 'WIP: working on auth'
      
      const formatResult = validateCommitFormat(message)
      const keywordResult = validateNoBlockedKeywords(message)
      
      expect(keywordResult.valid).toBe(false)
    })
  })
})
