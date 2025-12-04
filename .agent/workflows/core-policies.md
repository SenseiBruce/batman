---
description: Master policy loader - References all core rules
---

# 🎯 Core Policies - Master Loader

> **Agent Instructions:** When tagged with `@[/core-policies]`, you MUST read ALL the `.rules` files listed below.

---

## 📋 Required Reading - Read ALL These Rules Files

When you see `@[/core-policies]`, you MUST immediately read these files:

### 🔴 CRITICAL Rules (Read First):

1. **Proactive Error Prevention Rule** ⭐
   - **File:** `.agent/proactive-error-prevention.rules`
   - **Action:** `view_file` this file NOW
   - **Rule:** Check error knowledge base BEFORE risky tasks

2. **Search Best Practices Rule** ⭐ NEW
   - **File:** `.agent/search-best-practices.rules`
   - **Action:** `view_file` this file NOW
   - **Rule:** Use `rg` for searches, not `grep_search` without filters

3. **File Editing Rule**
   - **File:** `.agent/file-editing.rules`
   - **Action:** `view_file` this file NOW
   - **Rule:** Use `write_to_file` with `Overwrite=true`

4. **File Backup Rule**
   - **File:** `.agent/file-backup.rules`
   - **Action:** `view_file` this file NOW
   - **Rule:** Create `.backup` before modifications

### 🟡 REQUIRED Rules (Read Next):

5. **Token Tracking Rule**
   - **File:** `.agent/token-tracking.rules`
   - **Action:** `view_file` this file NOW
   - **Rule:** Report token usage at end of response

6. **Error Resolution Rule**
   - **File:** `.agent/error-resolution.rules`
   - **Action:** `view_file` this file NOW
   - **Rule:** Document fixed errors in knowledge base

7. **No Documentation Files Rule**
   - **File:** `.agent/no-documentation-files.rules`
   - **Action:** `view_file` this file NOW
   - **Rule:** Never create .md files to explain work

---

## 🔄 Auto-Learning Loop

These two rules work together to create a self-improving system:

```
┌─────────────────────────────────────────┐
│  1. PROACTIVE ERROR PREVENTION          │
│     (Before risky task)                 │
│     ↓                                   │
│  Check error-knowledge-base.md          │
│     ↓                                   │
│  Use documented solution if found       │
│     ↓                                   │
│  Execute task successfully              │
└─────────────────────────────────────────┘
                 OR (if new error)
┌─────────────────────────────────────────┐
│  2. ERROR RESOLUTION                    │
│     (After error occurs)                │
│     ↓                                   │
│  Fix the error                          │
│     ↓                                   │
│  Document in error-knowledge-base.md    │
│     ↓                                   │
│  Future tasks will use this solution    │
└─────────────────────────────────────────┘
```

**Result:** Project becomes smarter over time! 🧠

---

## 🤖 Agent Workflow When Tagged

**Step-by-Step:**
1. ✅ User tags `@[/core-policies]`
2. ✅ Agent reads THIS file (master loader)
3. ✅ Agent uses `view_file` on `proactive-error-prevention.rules`
4. ✅ Agent uses `view_file` on `search-best-practices.rules` ⭐ NEW
5. ✅ Agent uses `view_file` on `file-editing.rules`
6. ✅ Agent uses `view_file` on `file-backup.rules`
7. ✅ Agent uses `view_file` on `token-tracking.rules`
8. ✅ Agent uses `view_file` on `error-resolution.rules`
9. ✅ Agent uses `view_file` on `no-documentation-files.rules`
10. ✅ Agent applies all 7 rules for the session

---

## 📂 File Locations

All rules files are in: `.agent/`

```
.agent/
├── core-policies.md                        ⭐ THIS FILE (master loader)
├── proactive-error-prevention.rules        🔴 CRITICAL - view this
├── search-best-practices.rules             🔴 CRITICAL - view this (NEW!)
├── file-editing.rules                      🔴 CRITICAL - view this
├── file-backup.rules                       🔴 CRITICAL - view this
├── token-tracking.rules                    🟡 REQUIRED - view this
├── error-resolution.rules                  🟡 REQUIRED - view this
└── no-documentation-files.rules            🟡 REQUIRED - view this
```

---

## 📋 Quick Reference Summary

| Rule | Priority | File | Key Rule |
|------|----------|------|----------|
| Proactive Error Prevention | 🔴 CRITICAL | `proactive-error-prevention.rules` | Check KB before risky tasks |
| Search Best Practices | 🔴 CRITICAL | `search-best-practices.rules` | Use `rg` for searches |
| File Editing | 🔴 CRITICAL | `file-editing.rules` | Use `write_to_file` with `Overwrite=true` |
| File Backup | 🔴 CRITICAL | `file-backup.rules` | Create `.backup` before edits |
| Token Tracking | 🟡 REQUIRED | `token-tracking.rules` | Report at end of response |
| Error Resolution | 🟡 REQUIRED | `error-resolution.rules` | Document fixed errors |
| No Doc Files | 🟡 REQUIRED | `no-documentation-files.rules` | No .md explanation files |

---

## ✅ Compliance Checklist

After reading all rules files, verify:

- [ ] Read `proactive-error-prevention.rules`?
- [ ] Read `search-best-practices.rules`? ⭐ NEW
- [ ] Read `file-editing.rules`?
- [ ] Read `file-backup.rules`?
- [ ] Read `token-tracking.rules`?
- [ ] Read `error-resolution.rules`?
- [ ] Read `no-documentation-files.rules`?
- [ ] Understand all 7 rules?

---

## 🎯 How This Works

### For User:
1. Tag `@[/core-policies]` once per session
2. Agent automatically reads all 7 rules files
3. Agent applies all rules for that session
4. Project learns from mistakes and becomes smarter! 🧠

### For Agent:
1. See `@[/core-policies]` tag
2. Read THIS master loader file
3. Use `view_file` to read each `.rules` file listed above
4. Follow all rules for the entire session

---

## ⚠️ CRITICAL INSTRUCTIONS FOR AGENT

**When you see `@[/core-policies]` you MUST:**

1. ✅ Read this master loader file (you're doing it now)
2. ✅ **Immediately use `view_file` on ALL 7 rules files:**
   - `view_file .agent/proactive-error-prevention.rules`
   - `view_file .agent/search-best-practices.rules` ⭐ NEW
   - `view_file .agent/file-editing.rules`
   - `view_file .agent/file-backup.rules`
   - `view_file .agent/token-tracking.rules`
   - `view_file .agent/error-resolution.rules`
   - `view_file .agent/no-documentation-files.rules`
3. ✅ Apply all rules for the entire session

**DO NOT skip reading the rules files!**  
**This master loader is just a router - the actual rules are in separate `.rules` files!**

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 6.0 | 2025-12-04 | Added search-best-practices.rules (ripgrep guidance!) |
| 5.0 | 2025-12-04 | Added proactive-error-prevention.rules (auto-learning!) |
| 4.0 | 2025-12-04 | Updated to reference .rules files instead of .md |
| 3.1 | 2025-12-04 | Changed to index/router model |
| 3.0 | 2025-12-04 | Created master single-entry-point |

---

**Last Updated:** 2025-12-04  
**Type:** Master Loader / Router  
**Purpose:** Single entry point that directs agent to read all rules files

---

**🎯 Remember: This is a LOADER. The agent must VIEW the actual `.rules` files!**
