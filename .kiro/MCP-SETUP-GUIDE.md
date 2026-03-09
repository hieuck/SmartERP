# MCP Setup Guide for SmartERP

**Model Context Protocol (MCP) Servers Configuration**

---

## 📊 Current Status

### User-level MCP (~/.kiro/settings/mcp.json)

- ❌ `fetch` server: Disabled
- ⚠️ Total servers: 1 (disabled)

### Workspace-level MCP (.kiro/settings/mcp.json)

- ⚠️ Empty configuration
- ⚠️ No SmartERP-specific servers

**Overall Rating: 2/10** - Minimal MCP usage

---

## 🎯 Recommended Setup

### Priority Levels

**High Priority** (Essential for development):

1. `git` - Git operations
2. `postgres` - Database queries
3. `filesystem` - File operations
4. `fetch` - Web research (Odoo/ERPNext docs)

**Medium Priority** (Helpful): 5. `github` - GitHub integration 6. `docker` - Container management

**Low Priority** (Nice to have): 7. `slack` - Team notifications

---

## 🚀 Quick Setup

### Step 1: Install uv (if not installed)

```bash
# Windows (PowerShell)
irm https://astral.sh/uv/install.ps1 | iex

# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Verify installation
uv --version
```

### Step 2: Copy Recommended Config

```bash
# Copy recommended config to workspace
cp .kiro/settings/mcp.json.recommended .kiro/settings/mcp.json

# Or manually edit .kiro/settings/mcp.json
```

### Step 3: Configure Environment Variables

Edit `.kiro/settings/mcp.json` and update:

```json
{
  "mcpServers": {
    "postgres": {
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:pass@localhost:5432/smarterp_dev"
      }
    },
    "github": {
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

### Step 4: Enable fetch Server (User-level)

Edit `~/.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"],
      "disabled": false, // Change to false
      "autoApprove": ["fetch"]
    }
  }
}
```

### Step 5: Restart Kiro

Restart Kiro IDE to load new MCP servers.

---

## 📖 Server Details

### 1. Git Server

**Purpose:** Git operations (status, diff, commit, push)

**Installation:**

```bash
uvx mcp-server-git --help
```

**Usage:**

- Check git status
- View diffs
- Create commits
- Push changes

**Auto-approve:** `read_file`, `list_directory`

---

### 2. PostgreSQL Server

**Purpose:** Database queries and schema inspection

**Installation:**

```bash
uvx mcp-server-postgres --help
```

**Configuration:**

```json
"env": {
  "POSTGRES_CONNECTION_STRING": "postgresql://postgres:postgres@localhost:5432/smarterp_dev"
}
```

**Usage:**

- Query database
- Inspect schema
- Check data
- Debug queries

**Auto-approve:** `query` (read-only queries)

---

### 3. Filesystem Server

**Purpose:** File operations (read, write, list)

**Installation:**

```bash
npx -y @modelcontextprotocol/server-filesystem --help
```

**Configuration:**

```json
"args": ["-y", "@modelcontextprotocol/server-filesystem", "./src"]
```

**Usage:**

- Read files
- List directories
- Write files
- Search files

**Auto-approve:** `read_file`, `list_directory`

---

### 4. Fetch Server

**Purpose:** Web content fetching for research

**Installation:**

```bash
uvx mcp-server-fetch --help
```

**Usage:**

- Fetch Odoo documentation
- Fetch ERPNext documentation
- Research best practices
- Read blog posts

**Auto-approve:** `fetch`

**Example:**

```typescript
// Fetch Odoo docs
fetch('https://www.odoo.com/documentation/17.0/developer/reference/backend/orm.html');

// Fetch ERPNext docs
fetch('https://frappeframework.com/docs/user/en/basics/doctypes');
```

---

### 5. GitHub Server

**Purpose:** GitHub integration (search, read files)

**Installation:**

```bash
uvx mcp-server-github --help
```

**Configuration:**

```json
"env": {
  "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
}
```

**Get Token:**

1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `read:org`
4. Copy token

**Usage:**

- Search repositories
- Read file contents
- Check issues
- View PRs

**Auto-approve:** `search_repositories`, `get_file_contents`

---

### 6. Docker Server

**Purpose:** Docker container management

**Installation:**

```bash
uvx mcp-server-docker --help
```

**Usage:**

- List containers
- Start/stop containers
- View logs
- Inspect images

**Status:** Disabled by default (enable if needed)

---

### 7. Slack Server

**Purpose:** Team notifications

**Installation:**

```bash
uvx mcp-server-slack --help
```

**Configuration:**

```json
"env": {
  "SLACK_BOT_TOKEN": "xoxb-your-token",
  "SLACK_TEAM_ID": "T1234567890"
}
```

**Get Token:**

1. Go to https://api.slack.com/apps
2. Create new app
3. Add bot token scopes: `chat:write`, `channels:read`
4. Install app to workspace
5. Copy bot token

**Usage:**

- Send notifications
- Post updates
- Alert team

**Status:** Disabled by default (enable if needed)

---

## 🔧 Troubleshooting

### MCP Server Not Loading

**Check:**

1. Server installed: `uvx mcp-server-git --help`
2. Config syntax: Valid JSON
3. Restart Kiro IDE
4. Check Kiro logs

### Permission Errors

**Solution:**

- Add to `autoApprove` list
- Or approve manually when prompted

### Connection Errors (PostgreSQL)

**Check:**

1. Database running: `psql -U postgres -d smarterp_dev`
2. Connection string correct
3. Firewall allows connection

### GitHub Token Invalid

**Solution:**

1. Regenerate token
2. Check scopes: `repo`, `read:org`
3. Update config
4. Restart Kiro

---

## 📊 Benefits by Use Case

### For Odoo/ERPNext Research

**Enable:**

- `fetch` - Fetch documentation
- `github` - Search ERPNext source code

**Benefit:**

- ✅ Quick access to official docs
- ✅ Search patterns in ERPNext repo
- ✅ Compare implementations

### For Database Work

**Enable:**

- `postgres` - Query database
- `filesystem` - Read migration files

**Benefit:**

- ✅ Inspect schema
- ✅ Debug queries
- ✅ Check data

### For Git Operations

**Enable:**

- `git` - Git commands
- `github` - GitHub integration

**Benefit:**

- ✅ Check status
- ✅ Create commits
- ✅ View diffs

---

## 🎓 Best Practices

### 1. Auto-approve Safe Operations

```json
"autoApprove": [
  "read_file",      // Safe: read-only
  "list_directory", // Safe: read-only
  "query",          // Safe: read-only queries
  "fetch"           // Safe: web requests
]
```

### 2. Manual Approve Dangerous Operations

```json
"autoApprove": []  // Require approval for:
// - write_file
// - delete_file
// - execute_command
// - database mutations
```

### 3. Disable Unused Servers

```json
"disabled": true  // Disable if not needed
```

### 4. Use Workspace-specific Config

```
User-level (~/.kiro/settings/mcp.json):
  - fetch, github (global tools)

Workspace-level (.kiro/settings/mcp.json):
  - postgres, filesystem (project-specific)
```

---

## 📋 Setup Checklist

- [ ] Install uv: `uv --version`
- [ ] Copy recommended config
- [ ] Configure PostgreSQL connection string
- [ ] Generate GitHub token (if using)
- [ ] Enable fetch server (user-level)
- [ ] Test each server
- [ ] Add to autoApprove (safe operations)
- [ ] Restart Kiro IDE
- [ ] Verify servers loaded

---

## 🎯 Recommended Configuration for SmartERP

**Minimal Setup (Start here):**

```json
{
  "mcpServers": {
    "git": { "disabled": false },
    "fetch": { "disabled": false }
  }
}
```

**Full Setup (Recommended):**

```json
{
  "mcpServers": {
    "git": { "disabled": false },
    "postgres": { "disabled": false },
    "filesystem": { "disabled": false },
    "fetch": { "disabled": false },
    "github": { "disabled": false }
  }
}
```

**See:** `.kiro/settings/mcp.json.recommended` for complete config

---

## 📚 Resources

- **MCP Documentation**: https://modelcontextprotocol.io/
- **Available Servers**: https://github.com/modelcontextprotocol/servers
- **uv Installation**: https://docs.astral.sh/uv/getting-started/installation/
- **GitHub Tokens**: https://github.com/settings/tokens

---

**Last Updated**: 2026-03-09  
**Version**: 1.0.0  
**Status**: ⚠️ Needs Setup
