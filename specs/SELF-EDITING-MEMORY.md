# Witness Memory System

**Project:** WITNESS Protocol
**Status:** Spec Draft (Revised)
**Date:** 2026-02-02
**Authors:** Klowalski + SeMmy
**Inspiration:** Letta (MemGPT), Human Neuroscience, OpenClaw Heartbeat

---

## Executive Summary

Witness provides **verifiable, brain-inspired memory** for AI agents via the **Model Context Protocol (MCP)**. Any agent framework can use Witness as their memory backend and gain:

1. **Cryptographic integrity** - Tamper-proof, signed, hash-linked memories
2. **Brain-inspired storage** - Provenance tracking, consolidation, decay
3. **Framework-agnostic interface** - MCP standard (adopted by OpenAI, Google, Microsoft, Anthropic)
4. **On-chain anchoring** - Bitcoin timestamps, Base blockchain proofs

**Core insight:** Memory systems store what agents remember. Witness **proves** what they knew and when.

---

## The Three Functions of an Agent

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           AGENT RUNTIME                                  │
│                                                                          │
│   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐            │
│   │   REASONING   │   │  REMEMBERING  │   │   PROACTION   │            │
│   │               │   │               │   │  (Heartbeat)  │            │
│   │  LLM thinking │   │ Memory system │   │               │            │
│   │  Tool calling │   │ Context mgmt  │   │ Cron jobs     │            │
│   │  Planning     │   │ Learning      │   │ Background    │            │
│   │               │   │               │   │ Self-check    │            │
│   └───────┬───────┘   └───────┬───────┘   └───────┬───────┘            │
│           │                   │                   │                     │
│           └───────────────────┼───────────────────┘                     │
│                               │                                          │
│                               ▼                                          │
│                    ┌─────────────────────┐                              │
│                    │   WITNESS MEMORY    │                              │
│                    │   (MCP Server)      │                              │
│                    │                     │                              │
│                    │   - Integrity layer │                              │
│                    │   - Brain storage   │                              │
│                    │   - Proof system    │                              │
│                    └─────────────────────┘                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

| Function | Purpose | Witness Role |
|----------|---------|--------------|
| **Reasoning** | Think, plan, decide | Stores decisions with provenance |
| **Remembering** | Learn, recall, update | Core memory infrastructure |
| **Proaction** | Background tasks, self-maintenance | Consolidation, decay, anchoring |

---

## Why MCP?

### Industry Standard (2025-2026)

MCP is now the de-facto protocol for AI tool integration:

- **Anthropic** - Created MCP, donated to Linux Foundation
- **OpenAI** - Adopted across ChatGPT, Agents SDK
- **Google** - Gemini MCP support
- **Microsoft** - Windows 11, Copilot, VS Code integration
- **10,000+ public MCP servers** / **97M+ monthly SDK downloads**

### Transport Options

| Transport | Hosting | Use Case |
|-----------|---------|----------|
| **STDIO** | No - local subprocess | Claude Desktop, Cursor, local dev |
| **Streamable HTTP** | Yes - HTTP server | Remote agents, Telegram bots, shared |

Witness supports both. Local agents spawn our process; remote agents call our HTTP endpoint.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ANY MCP-COMPATIBLE CLIENT                            │
│                                                                          │
│  Claude │ ChatGPT │ Gemini │ Cursor │ Letta │ Convex │ Custom Agents    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ MCP Protocol
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        WITNESS MCP SERVER                                │
│                                                                          │
│  Tools:                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │memory_commit │ │memory_recall │ │memory_rethink│ │ block_update │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                                          │
│  Transport: STDIO (local) │ HTTP (remote)                               │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     BRAIN-INSPIRED STORAGE                               │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  PROVENANCE TRACKING                                             │   │
│  │                                                                   │   │
│  │  source: "auto" | "manual" | "consolidation" | "heartbeat"      │   │
│  │  trigger: "user_said" | "decision_made" | "pattern_detected"    │   │
│  │  importance: 0.0 - 1.0                                          │   │
│  │  emotion_tag: "significant" | "routine" | null                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  MEMORY LIFECYCLE                                                │   │
│  │                                                                   │
│  │  ┌────────┐    ┌────────┐    ┌────────┐    ┌────────────────┐   │   │
│  │  │  HOT   │───▶│  WARM  │───▶│  COLD  │───▶│ ARCHIVED/SUPER │   │   │
│  │  │ 0-7d   │    │ 8-30d  │    │ 30d+   │    │   (in chain)   │   │   │
│  │  └────────┘    └────────┘    └────────┘    └────────────────┘   │   │
│  │       ▲                                                          │   │
│  │       └──────── access reheats ──────────────────────────────────│   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  CONSOLIDATION (Brain's "Sleep")                                 │   │
│  │                                                                   │
│  │  Multiple memories ──▶ Synthesized understanding                 │   │
│  │  Original entries: marked superseded (not deleted)               │   │
│  │  New entry: references originals via supersedes[]                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      WITNESS INTEGRITY LAYER                             │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │ chain.jsonl  │  │  content/    │  │        memory.db             │  │
│  │              │  │              │  │                              │  │
│  │ Append-only  │  │ Content-     │  │ SQLite index                 │  │
│  │ Hash-linked  │  │ addressable  │  │ FTS5 search                  │  │
│  │ Ed25519 sig  │  │ SHA-256 keys │  │ Mutable (rebuildable)        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────────┘  │
│                                                                          │
│  Verification: memory-chain verify                                       │
│  Export: memory-chain export --format json|markdown                     │
│                                                                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       ON-CHAIN ANCHORING                                 │
│                                                                          │
│  ┌──────────────────────┐    ┌──────────────────────────────────────┐  │
│  │   OpenTimestamps     │    │        WITNESS Protocol              │  │
│  │                      │    │                                      │  │
│  │   Bitcoin timestamps │    │   Base blockchain anchors            │  │
│  │   Free, slow (~hrs)  │    │   $WITNESS token fee                 │  │
│  │   Maximum trust      │    │   Fast, on-demand                    │  │
│  └──────────────────────┘    └──────────────────────────────────────┘  │
│                                                                          │
│  Proof: "This agent had these memories at this specific time"           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## MCP Tool Definitions

### memory_commit

Commit important information to long-term memory.

```typescript
{
  name: "memory_commit",
  description: "Store something worth remembering. Use when you learn important facts, user preferences, decisions, or significant events.",
  parameters: {
    content: string,           // What to remember
    source?: "manual" | "auto" | "heartbeat",  // Why this memory exists
    trigger?: string,          // What caused this memory ("user_said", "decided", etc.)
    importance?: number,       // 0.0-1.0 significance score
    tier?: "committed" | "relationship" | "ephemeral",
    relatedEntities?: string[] // Knowledge graph connections
  }
}
```

### memory_recall

Retrieve relevant memories for context.

```typescript
{
  name: "memory_recall",
  description: "Search memories for relevant context. Use before tasks that benefit from background information.",
  parameters: {
    query: string,             // What to search for
    maxTokens?: number,        // Token budget
    maxResults?: number,       // Max memories to return
    includeSuperseded?: boolean, // Include consolidated memories (default: false)
    tiers?: string[]           // Filter by tier
  }
}
```

### memory_rethink

Consolidate multiple memories into clearer understanding.

```typescript
{
  name: "memory_rethink",
  description: "Synthesize fragmented or outdated memories into a unified understanding. Like the brain's memory consolidation during sleep.",
  parameters: {
    supersedes: number[],      // Sequence numbers to consolidate
    newUnderstanding: string,  // The synthesized memory
    reason?: string            // Why this consolidation
  }
}
```

### block_update

Update structured memory blocks (core context).

```typescript
{
  name: "block_update",
  description: "Update a persistent memory block. Blocks are always injected into context.",
  parameters: {
    label: "persona" | "user_profile" | "goals" | "knowledge",
    content: string,
    isCore?: boolean           // Always inject (default: true for blocks)
  }
}
```

### memory_introspect

Understand why a memory exists (provenance).

```typescript
{
  name: "memory_introspect",
  description: "Get the full history and provenance of a memory. Understand why it exists and what triggered it.",
  parameters: {
    seq: number                // Memory sequence number
  },
  returns: {
    memory: Memory,
    source: string,            // How it was created
    trigger: string,           // What caused it
    supersededBy?: number,     // If consolidated
    supersedes?: number[],     // What it consolidated
    anchorProof?: AnchorProof  // On-chain proof if anchored
  }
}
```

---

## Brain-Inspired Storage Schema

### Memory Entry (Extended)

```typescript
interface Memory {
  // Core fields
  seq: number;
  content: string;
  type: EntryType;
  tier: Tier;
  created_at: string;

  // Brain-inspired provenance
  source: "manual" | "auto" | "consolidation" | "heartbeat";
  trigger?: string;           // "user_said", "decided", "pattern_detected"
  importance: number;         // 0.0 - 1.0
  emotion_tag?: string;       // Amygdala-like significance marker

  // Lifecycle tracking
  access_count: number;
  last_accessed: string | null;
  decay_tier: "hot" | "warm" | "cold";

  // Consolidation
  is_superseded: boolean;
  superseded_by?: number;
  supersedes?: number[];      // For consolidation entries

  // Knowledge graph
  related_entities?: string[];
  block_label?: BlockLabel;
  is_core: boolean;
}
```

### SQLite Schema Additions

```sql
-- Provenance tracking
ALTER TABLE memories ADD COLUMN source TEXT DEFAULT 'manual';
ALTER TABLE memories ADD COLUMN trigger TEXT;
ALTER TABLE memories ADD COLUMN emotion_tag TEXT;

-- Lifecycle
ALTER TABLE memories ADD COLUMN decay_tier TEXT DEFAULT 'hot';

-- Consolidation
ALTER TABLE memories ADD COLUMN is_superseded INTEGER DEFAULT 0;
ALTER TABLE memories ADD COLUMN superseded_by INTEGER;

-- Knowledge graph
ALTER TABLE memories ADD COLUMN related_entities TEXT; -- JSON array
ALTER TABLE memories ADD COLUMN block_label TEXT;
ALTER TABLE memories ADD COLUMN is_core INTEGER DEFAULT 0;

-- Indexes for efficient queries
CREATE INDEX idx_memories_decay ON memories(decay_tier);
CREATE INDEX idx_memories_source ON memories(source);
CREATE INDEX idx_memories_core ON memories(is_core) WHERE is_core = 1;
CREATE INDEX idx_memories_active ON memories(is_superseded) WHERE is_superseded = 0;
```

---

## Heartbeat Integration (Proaction)

The heartbeat system uses Witness for background memory management:

```yaml
# Hourly checkpoint (Haiku - cheap)
name: witness-checkpoint
schedule:
  kind: every
  everyMs: 3600000
payload:
  kind: agentTurn
  model: anthropic/claude-3-5-haiku-latest
  message: |
    Memory checkpoint:
    1. Call memory_recall for recent significant events
    2. Identify patterns worth consolidating
    3. Call memory_rethink if consolidation needed
    4. Update decay_tier based on access patterns

# Weekly consolidation (Sonnet - smarter)
name: witness-consolidation
schedule:
  kind: cron
  expr: "0 10 * * 0"  # Sunday 10:00 UTC
payload:
  kind: agentTurn
  model: anthropic/claude-sonnet-4-5
  message: |
    Weekly memory consolidation (brain's "sleep"):
    1. Review all warm/cold memories
    2. Identify clusters that should be unified
    3. Call memory_rethink for each cluster
    4. Archive cold memories (remove from active index, preserve chain)
    5. Anchor chain if significant changes
```

---

## Comparison: What Witness Adds

| Feature | Letta | Convex | LangChain | **Witness** |
|---------|-------|--------|-----------|-------------|
| Memory storage | ✅ | ✅ | ✅ | ✅ |
| Semantic search | ✅ | ✅ | ✅ | ✅ |
| Agent tools | ✅ | ✅ | ✅ | ✅ (MCP) |
| Provenance tracking | ❌ | ❌ | ❌ | ✅ |
| Tamper-proof chain | ❌ | ❌ | ❌ | ✅ |
| Signed entries | ❌ | ❌ | ❌ | ✅ |
| Bitcoin timestamps | ❌ | ❌ | ❌ | ✅ |
| On-chain anchoring | ❌ | ❌ | ❌ | ✅ |
| Verifiable audit | ❌ | ❌ | ❌ | ✅ |
| Framework-agnostic | ❌ | ❌ | ❌ | ✅ (MCP) |

**Witness unique value:** Memory with receipts. Prove what the agent knew and when.

---

## Implementation Phases

### Phase 1: MCP Server Foundation
- [ ] `src/mcp/server.ts` - MCP server with STDIO transport
- [ ] `src/mcp/tools.ts` - Tool handlers wrapping existing chain operations
- [ ] `src/mcp/http.ts` - HTTP transport for remote access
- [ ] CLI: `memory-chain mcp-server --transport stdio|http`

### Phase 2: Brain-Inspired Storage
- [ ] Schema migration for provenance fields
- [ ] Decay tier calculation in retrieval
- [ ] Consolidation entry type and handling
- [ ] `memory_introspect` tool for provenance queries

### Phase 3: Heartbeat Integration
- [ ] Cron job templates for checkpoint/consolidation
- [ ] Auto-decay based on access patterns
- [ ] Chain anchoring triggers

### Phase 4: Documentation & Discovery
- [ ] Agent47 skill for capability discovery
- [ ] Integration guides for Letta, Convex, LangChain
- [ ] Example agents using Witness MCP

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/mcp/server.ts` | MCP server implementation |
| `src/mcp/tools.ts` | Tool handlers |
| `src/mcp/http.ts` | HTTP transport |
| `skill/witness-discovery.md` | Agent47 capability skill |
| `docs/INTEGRATION.md` | Framework integration guide |

## Files to Modify

| File | Changes |
|------|---------|
| `src/types.ts` | Provenance fields, decay tier |
| `src/index/sqlite.ts` | Schema migration |
| `src/index/retrieval.ts` | Decay-aware retrieval |
| `src/cli.ts` | `mcp-server` command |
| `package.json` | MCP SDK dependency |

---

## References

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- [Letta (MemGPT)](https://docs.letta.com/)
- [MemGPT Paper](https://arxiv.org/abs/2310.08560)
- [Human Memory Consolidation](https://en.wikipedia.org/wiki/Memory_consolidation)
- Witness Protocol: `specs/WITNESS-PROTOCOL.md`
- Auto-Memory Plan: `PLAN-AUTO-MEMORY.md`
