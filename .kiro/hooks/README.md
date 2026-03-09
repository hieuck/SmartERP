# Kiro Hooks

Automation hooks for SmartERP development workflow.

---

## 🎯 Active Hooks

### 1. auto-work-on-prompt.kiro.hook ⚡ NEW

**Trigger:** promptSubmit (when user sends message)  
**Action:** Analyze request and execute immediately  
**Purpose:** Autonomous work mode - no questions, direct execution

**Behavior:**

- Analyze user request (10 seconds)
- Execute immediately without asking
- Brief report at end (2-3 sentences)
- No planning docs, no confirmations

**Use Case:** All development tasks (fix, implement, refactor, research)

---

### 2. post-tool-continue-work.kiro.hook

**Trigger:** postToolUse (after write/shell tools)  
**Action:** Quick verify and continue immediately  
**Purpose:** Keep momentum, avoid stopping

**Behavior:**

- Quick verify (1 sentence)
- Continue to next subtask
- No long analysis or reports

---

### 3. git-commit-milestone.kiro.hook

**Trigger:** agentStop (after task completion)  
**Action:** Suggest git commit if milestone completed  
**Purpose:** Track progress with conventional commits

**Behavior:**

- Check if milestone completed
- Suggest commit message
- Include CHANGELOG and ROADMAP updates

---

### 4. pre-commit-quality-gate.kiro.hook

**Trigger:** userTriggered (manual)  
**Action:** Run lint, type-check, tests, security audit  
**Purpose:** Quality gate before commit

**Behavior:**

- Lint staged files
- Type check
- Run tests
- Security audit

---

## 🚫 Disabled Hooks

### agent-stop-summary.kiro.hook.disable

**Reason:** Too verbose, creates unnecessary summaries

---

### auto-execute-decision.kiro.hook.disable

**Reason:** Replaced by auto-work-on-prompt.kiro.hook

---

### autonomous-team-meeting.kiro.hook.disable

**Reason:** Team disbanded, solo development now

---

### autonomous-workflow.kiro.hook.disable

**Reason:** Team disbanded, no delegation needed

---

### smart-architecture-check.kiro.hook.disable

**Reason:** Covered by steering files (odoo-erpnext-architecture.md)

---

## 📊 Hook Statistics

| Hook                    | Type          | Frequency         | Token Impact |
| ----------------------- | ------------- | ----------------- | ------------ |
| auto-work-on-prompt     | promptSubmit  | Every message     | +200 tokens  |
| post-tool-continue-work | postToolUse   | After write/shell | +100 tokens  |
| git-commit-milestone    | agentStop     | End of task       | +150 tokens  |
| pre-commit-quality-gate | userTriggered | Manual            | 0 (manual)   |

**Total Token Overhead:** ~450 tokens per task (acceptable)

---

## 🎯 Workflow

```
User sends message
    ↓
auto-work-on-prompt (analyze + execute)
    ↓
Execute tools (read, write, shell)
    ↓
post-tool-continue-work (verify + continue)
    ↓
Task complete
    ↓
git-commit-milestone (suggest commit)
```

---

## 🔧 Configuration

### Enable/Disable Hook

Rename file:

- Enable: `.kiro.hook`
- Disable: `.kiro.hook.disable`

### Edit Hook

Edit JSON file directly:

- `enabled`: true/false
- `when.type`: Event type
- `then.prompt`: Agent instructions

---

## 📝 Best Practices

1. **Keep hooks focused** - One purpose per hook
2. **Minimize token usage** - Brief prompts only
3. **Avoid redundancy** - Don't overlap with steering files
4. **Test thoroughly** - Verify hook behavior
5. **Document clearly** - Explain purpose and behavior

---

**Last Updated:** 2026-03-09  
**Active Hooks:** 4  
**Disabled Hooks:** 5  
**Total Token Overhead:** ~450 tokens/task
