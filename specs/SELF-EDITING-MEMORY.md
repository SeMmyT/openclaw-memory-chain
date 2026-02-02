# Self-Editing Memory System

**Project:** WITNESS / Memory Chain
**Status:** Spec Draft
**Date:** 2026-02-02
**Authors:** Klowalski + SeMmy
**Inspiration:** Letta (MemGPT)

---

## Executive Summary

This spec integrates Letta's best practices into Witness Memory Chain while preserving cryptographic integrity. The core insight: **agents should actively manage their own memory**, not just passively accumulate it.

Key features:
1. **Self-editing memory tools** - Agents commit, recall, and consolidate memories
2. **Memory blocks** - Structured containers (persona, user_profile, goals, knowledge)
3. **Consolidation entries** - Update understanding without breaking the chain
4. **Core vs working memory** - Always-injected vs retrieved-on-demand

---

## The Problem

### Current State: Passive Memory Accumulation

```
Session ends → Hook saves summary → Memory grows → Retrieval degrades
```

Problems:
- **Uncontrolled growth** - Everything saved, nothing curated
- **Stale context** - Old understanding never updated
- **No structure** - Flat list of memories, no semantic organization
- **Agent passivity** - Agent doesn't decide what's worth remembering

### Letta's Insight: Agents as Memory Curators

Letta (formerly MemGPT) solved this by giving agents explicit memory management tools:
- `core_memory_append` / `core_memory_replace`
- `archival_memory_insert` / `archival_memory_search`

The agent decides what to remember, what to update, and what to consolidate.

---

## Solution: Self-Editing Memory for Witness Chain

### Design Principles

1. **Agent autonomy** - Agent decides what's important
2. **Chain integrity** - Never modify history; append consolidations
3. **Structured blocks** - Semantic organization for core context
4. **Token efficiency** - Core memories always injected; working memories retrieved

### Memory Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                      CORE MEMORY                             │
│  Always injected into context. Agent's persistent identity.  │
│                                                               │
│  ┌──────────┐  ┌──────────────┐  ┌───────┐  ┌───────────┐   │
│  │ Persona  │  │ User Profile │  │ Goals │  │ Knowledge │   │
│  └──────────┘  └──────────────┘  └───────┘  └───────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    WORKING MEMORY                            │
│  Retrieved on-demand based on query relevance.               │
│                                                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Memory  │  │ Memory  │  │ Memory  │  │ Memory  │  ...    │
│  │ (active)│  │ (active)│  │(supersd)│  │ (active)│        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Design

### Phase 1: Type Definitions

**File:** `src/types.ts`

```typescript
// Extend EntryType
export type EntryType = 'memory' | 'identity' | 'decision' | 'redaction' | 'consolidation' | 'block';

// Block labels for structured memory
export type BlockLabel = 'persona' | 'user_profile' | 'goals' | 'knowledge';

// Metadata for consolidation entries
export interface ConsolidationMetadata {
  supersedes: number[];  // Sequence numbers being consolidated
  reason?: string;       // Why this consolidation happened
}

// Metadata for block entries
export interface BlockMetadata {
  block_label: BlockLabel;
  version?: number;           // Auto-incremented
  previous_block_seq?: number; // Links to previous version
}

// Extended Memory interface
export interface Memory {
  // ... existing fields ...
  is_superseded?: boolean;      // True if consolidated into another memory
  superseded_by?: number | null; // Seq of consolidation entry
  block_label?: BlockLabel | null;
  is_core?: boolean;            // Always injected if true
}

// Extended retrieval options
export interface RetrievalOptions {
  // ... existing fields ...
  includeSuperseded?: boolean;  // Include superseded memories (default: false)
}
```

### Phase 2: Schema Migration

**File:** `src/index/sqlite.ts`

```sql
-- New columns on memories table
ALTER TABLE memories ADD COLUMN is_superseded INTEGER DEFAULT 0;
ALTER TABLE memories ADD COLUMN superseded_by INTEGER;
ALTER TABLE memories ADD COLUMN block_label TEXT;
ALTER TABLE memories ADD COLUMN is_core INTEGER DEFAULT 0;

-- Track consolidation relationships
CREATE TABLE IF NOT EXISTS consolidations (
  consolidation_seq INTEGER NOT NULL,
  superseded_seq INTEGER NOT NULL,
  PRIMARY KEY (consolidation_seq, superseded_seq)
);

-- Efficient lookups
CREATE INDEX IF NOT EXISTS idx_memories_core ON memories(is_core) WHERE is_core = 1;
CREATE INDEX IF NOT EXISTS idx_memories_block ON memories(block_label) WHERE block_label IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_memories_active ON memories(is_superseded) WHERE is_superseded = 0;
```

New functions:
- `markSuperseded(db, seq, consolidationSeq)` - Mark memory as superseded
- `insertConsolidation(db, consolidationSeq, supersededSeq)` - Record relationship
- `getLatestBlock(db, label)` - Get current block by label
- `getCoreMemories(db)` - Get all core memories

### Phase 3: Agent Tools API

**New file:** `src/tools/index.ts`

```typescript
export class AgentMemoryTools {
  constructor(private dataDir: string, private dbPath: string) {}

  /**
   * Agent commits something worth remembering.
   * Use when encountering important facts, user preferences, or decisions.
   */
  async memoryCommit(input: {
    content: string;
    tier?: Tier;
    importance?: number;
  }): Promise<{ seq: number; contentHash: string }>;

  /**
   * Agent retrieves relevant context.
   * Use when needing background information for a task.
   */
  async memoryRecall(input: {
    query: string;
    maxTokens?: number;
    maxResults?: number;
  }): Promise<{ memories: ScoredMemory[]; tokensUsed: number }>;

  /**
   * Agent consolidates/updates understanding.
   * Use when multiple memories can be synthesized into a clearer understanding.
   */
  async memoryRethink(input: {
    supersedes: number[];
    newUnderstanding: string;
    reason?: string;
  }): Promise<{ consolidationSeq: number; supersededCount: number }>;

  /**
   * Get a memory block by label.
   */
  async blockGet(label: BlockLabel): Promise<Memory | null>;

  /**
   * Update a memory block.
   * Creates a new version, superseding the previous one.
   */
  async blockUpdate(input: {
    label: BlockLabel;
    content: string;
    isCore?: boolean;
  }): Promise<{ seq: number; version: number }>;

  /**
   * Get all core memories (always injected into context).
   */
  async getCoreMemories(): Promise<Memory[]>;
}
```

### Phase 4: Tool Definitions for AI Frameworks

**New file:** `src/tools/definitions.ts`

```typescript
export const MEMORY_TOOLS = {
  memory_commit: {
    name: "memory_commit",
    description: "Commit important information to long-term memory. Use when you learn something worth remembering about the user, a decision, or important context.",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "What to remember" },
        importance: { type: "number", description: "1-10 importance score" }
      },
      required: ["content"]
    }
  },
  memory_recall: {
    name: "memory_recall",
    description: "Retrieve relevant memories for a topic. Use before tasks that might benefit from background context.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to search for" },
        maxResults: { type: "number", description: "Maximum memories to return" }
      },
      required: ["query"]
    }
  },
  memory_rethink: {
    name: "memory_rethink",
    description: "Consolidate multiple memories into a clearer understanding. Use when you have fragmented or outdated memories that should be unified.",
    parameters: {
      type: "object",
      properties: {
        supersedes: { type: "array", items: { type: "number" }, description: "Sequence numbers to consolidate" },
        newUnderstanding: { type: "string", description: "The consolidated understanding" },
        reason: { type: "string", description: "Why consolidating" }
      },
      required: ["supersedes", "newUnderstanding"]
    }
  },
  block_update: {
    name: "block_update",
    description: "Update a structured memory block (persona, user_profile, goals, knowledge). Use to maintain persistent context about yourself or the user.",
    parameters: {
      type: "object",
      properties: {
        label: { type: "string", enum: ["persona", "user_profile", "goals", "knowledge"] },
        content: { type: "string", description: "New block content" },
        isCore: { type: "boolean", description: "Always inject into context" }
      },
      required: ["label", "content"]
    }
  }
};
```

### Phase 5: Retrieval Updates

**File:** `src/index/retrieval.ts`

Update `retrieveMemories()` to:
- Filter out superseded memories by default
- Add `includeSuperseded` option for historical queries

```typescript
export function retrieveMemories(
  db: Database.Database,
  query: string,
  options: RetrievalOptions = {}
): ScoredMemory[] {
  const { includeSuperseded = false, ...rest } = options;

  // Add WHERE clause: is_superseded = 0 unless includeSuperseded
  // ... rest of implementation
}

export function getCoreMemories(db: Database.Database): Memory[] {
  return db.prepare(`
    SELECT * FROM memories
    WHERE is_core = 1 AND is_superseded = 0
    ORDER BY block_label, seq DESC
  `).all();
}

export function getLatestBlock(db: Database.Database, label: BlockLabel): Memory | null {
  return db.prepare(`
    SELECT * FROM memories
    WHERE block_label = ? AND is_superseded = 0
    ORDER BY seq DESC LIMIT 1
  `).get(label) || null;
}
```

### Phase 6: Bootstrap Enhancement

**File:** `skill/hooks/agent-bootstrap.ts`

```typescript
export async function bootstrap(context: BootstrapContext): Promise<BootstrapResult> {
  // ... existing setup ...

  // 1. Get core memories (always injected, ~500 tokens reserved)
  const coreMemories = getCoreMemories(db);
  const coreBlock = formatCoreMemories(coreMemories);

  // 2. Get working memories (query-based retrieval)
  const workingBudget = maxTokens - estimateTokens(coreBlock);
  const workingMemories = context.userMessage
    ? retrieveMemories(db, context.userMessage, { maxTokens: workingBudget })
    : retrieveContext(db, { maxTokens: workingBudget });

  // 3. Format with distinct sections
  const memoryBlock = [coreBlock, formatMemoriesForPrompt(workingMemories)]
    .filter(Boolean)
    .join('\n\n');

  return { systemPrompt: memoryBlock, ... };
}

function formatCoreMemories(memories: Memory[]): string {
  const blocks: Record<BlockLabel, string[]> = {
    persona: [],
    user_profile: [],
    goals: [],
    knowledge: []
  };

  for (const m of memories) {
    if (m.block_label) blocks[m.block_label].push(m.content);
  }

  const sections = [
    blocks.persona.length && `## Who I Am\n${blocks.persona.join('\n')}`,
    blocks.user_profile.length && `## About the User\n${blocks.user_profile.join('\n')}`,
    blocks.goals.length && `## Current Goals\n${blocks.goals.join('\n')}`,
    blocks.knowledge.length && `## Key Knowledge\n${blocks.knowledge.join('\n')}`
  ].filter(Boolean);

  return sections.join('\n\n');
}
```

---

## Chain Integrity

### How Consolidation Preserves History

```
# Original memories (still in chain, marked superseded)
seq=5: "User prefers dark mode"
seq=8: "User mentioned they use VS Code"
seq=12: "User is a TypeScript developer"

# Consolidation entry (new entry, references originals)
seq=15: {
  type: "consolidation",
  content: "User is a TypeScript developer who prefers dark mode and uses VS Code",
  metadata: {
    supersedes: [5, 8, 12],
    reason: "Unified user profile information"
  }
}
```

The chain remains append-only. Original entries are never modified. The index tracks supersession for efficient retrieval.

### Verification Still Works

```bash
memory-chain verify  # Still validates entire chain
```

Consolidation entries are valid chain entries with proper signatures and hash-links.

---

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `src/tools/index.ts` | AgentMemoryTools class |
| `src/tools/definitions.ts` | AI framework tool definitions |
| `skill/commands/memory-tools.ts` | Skill command handlers |
| `test/tools.test.ts` | Agent tools tests |
| `test/consolidation.test.ts` | Consolidation tests |
| `test/blocks.test.ts` | Memory blocks tests |

### Modified Files

| File | Changes |
|------|---------|
| `src/types.ts` | New types (EntryType, BlockLabel, etc.) |
| `src/index/sqlite.ts` | Schema migration, new functions |
| `src/index/retrieval.ts` | Supersession filtering, getCoreMemories |
| `src/index.ts` | Export new tools and types |
| `skill/hooks/agent-bootstrap.ts` | Core memory injection |

---

## Migration Strategy

1. **Backward compatible** - New columns have defaults; old chains work unchanged
2. **Schema auto-migration** - `initIndex()` adds columns if missing (idempotent ALTERs)
3. **Rebuild handles new types** - `rebuildFromChain()` processes consolidation/block entries

---

## Verification Checklist

- [ ] Existing tests pass: `pnpm test:run`
- [ ] Schema migration works with existing chain
- [ ] Consolidation flow:
  - Add 3 memories
  - Consolidate into 1
  - Verify originals marked superseded
  - Verify consolidated memory returned in retrieval
  - Verify originals excluded from default retrieval
- [ ] Block flow:
  - Set persona block
  - Verify injected in bootstrap
  - Update block
  - Verify version increments
  - Verify old version superseded
- [ ] Retrieval:
  - Superseded memories excluded by default
  - `includeSuperseded: true` includes them

---

## Implementation Order

1. **Types (Phase 1)** - Foundation for everything else
2. **Schema (Phase 2)** - Database must support new data
3. **Retrieval updates (Phase 4)** - Needed by tools
4. **Agent tools (Phase 3)** - Core feature
5. **Bootstrap enhancement (Phase 5)** - Use new retrieval
6. **Skill commands (Phase 6)** - Expose to agents

---

## References

- [Letta (MemGPT) Documentation](https://docs.letta.com/)
- [MemGPT Paper](https://arxiv.org/abs/2310.08560)
- Witness Protocol spec: `specs/WITNESS-PROTOCOL.md`
