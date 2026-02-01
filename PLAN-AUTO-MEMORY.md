# Auto-Memory System Plan

**Branch:** `beta/auto-memory`
**Created:** 2026-02-01
**Context:** Conversation with Daniel about ideal memory solution (session around 02:00-02:30 UTC)

## Problem Statement

AI agents lose valuable context when sessions reset. Manual memory management is friction that doesn't get done consistently. The solution needs to:
1. Automatically capture important content
2. Intelligently filter noise from signal
3. Provide retrieval when relevant
4. Decay/prune old irrelevant content
5. Offer cryptographic proof when needed

## Three-Tier Architecture

### Tier 1: Daily Capture (automatic, cheap)

**Trigger:** Cron job every 30 minutes
**Model:** Haiku (cheap, fast)
**Session:** Isolated (not main)

**Process:**
1. Summarize recent context from main session
2. Extract: decisions, preferences, significant events
3. Append to `memory/YYYY-MM-DD.md`
4. Track what was already captured to avoid duplicates

**Output:** Raw daily notes with timestamps

### Tier 2: Curated Memory (periodic, smart)

**Trigger:** Weekly cron OR on heartbeat when >7 days since last review
**Model:** Haiku or Sonnet
**Session:** Isolated

**Process:**
1. Review daily files from past week
2. Identify patterns, lessons, significant events
3. Update `MEMORY.md` with distilled learnings
4. Commit critical items to Memory Chain (decisions, identity, commitments)
5. Prune/archive daily files older than 30 days

**Output:** Updated MEMORY.md + new chain entries

### Tier 3: Provable History (selective, permanent)

**Trigger:** On explicit request OR when significance detected
**Model:** N/A (direct commit)

**What gets committed:**
- Identity statements
- Explicit "remember this" requests
- Decisions and commitments
- Trust milestones

**Storage:** Memory Chain with optional on-chain anchoring

## Cron Job Specifications

### Job 1: Context Checkpoint (every 30 min)

```yaml
name: memory-checkpoint
schedule:
  kind: every
  everyMs: 1800000  # 30 minutes
sessionTarget: isolated
payload:
  kind: agentTurn
  model: anthropic/claude-sonnet-4-5  # or haiku when available
  message: |
    Review the main session's recent context. Extract and save any:
    - Decisions made
    - Preferences learned
    - Significant events
    - Things worth remembering
    
    Write a brief summary to memory/YYYY-MM-DD.md (create if needed).
    If nothing significant, just acknowledge with "No significant content to capture."
    
    Do NOT duplicate content already in today's memory file.
```

### Job 2: Memory Curation (weekly)

```yaml
name: memory-curation
schedule:
  kind: cron
  expr: "0 10 * * 0"  # Sunday 10:00 UTC
  tz: UTC
sessionTarget: isolated
payload:
  kind: agentTurn
  model: anthropic/claude-sonnet-4-5
  message: |
    Weekly memory curation:
    
    1. Read daily files from memory/ (past 7 days)
    2. Identify significant patterns, lessons, decisions
    3. Update MEMORY.md with distilled learnings
    4. For critical decisions/commitments, run:
       memory-chain add "<content>" --type decision --tier committed
    5. Archive daily files older than 30 days to memory/archive/
    
    Report what was curated and committed.
```

### Job 3: Chain Maintenance (weekly)

```yaml
name: chain-maintenance
schedule:
  kind: cron
  expr: "0 11 * * 0"  # Sunday 11:00 UTC
  tz: UTC
sessionTarget: isolated
payload:
  kind: agentTurn
  model: anthropic/claude-sonnet-4-5
  message: |
    Memory Chain maintenance:
    
    1. Run: memory-chain verify
    2. Run: memory-chain stats
    3. If significant new committed entries, consider anchoring:
       memory-chain anchor --chain base
    4. Report chain health
```

## Garbage Collection Algorithm

```javascript
// Scoring function for memory relevance
function calculateRelevance(memory) {
  const age = daysSince(memory.created_at);
  const recency = Math.exp(-age / 7);  // 7-day half-life
  
  return (
    0.30 * recency +
    0.40 * normalizedAccessCount(memory) +
    0.30 * memory.importance
  );
}

// GC threshold
const GC_THRESHOLD = 0.2;
const MAX_AGE_DAYS = 30;

// Prune candidates
for (const memory of memories) {
  const score = calculateRelevance(memory);
  const age = daysSince(memory.created_at);
  
  if (score < GC_THRESHOLD && age > MAX_AGE_DAYS) {
    if (memory.tier !== 'committed') {
      archiveOrDelete(memory);
    }
  }
}
```

## Integration Points

### OpenClaw Hooks (existing)

1. **memory-chain-bootstrap** (`agent:bootstrap`)
   - Inject relevant memories on session start
   - Already implemented in `openclaw-skill/hooks/`

2. **memory-chain-reset** (`command:reset`)
   - Auto-commit significant content on /reset
   - Already implemented in `openclaw-skill/hooks/`

### New Components Needed

1. **Context Summarizer**
   - Function to summarize recent session context
   - Extract significant content
   - Detect "remember this" patterns

2. **Memory Curator**
   - Function to review daily files
   - Distill to long-term memory
   - Identify chain-worthy content

3. **GC Runner**
   - Function to score and prune memories
   - Update index, preserve chain

## File Structure

```
~/.openclaw/
├── workspace/
│   ├── MEMORY.md           # Curated long-term memory
│   ├── memory/
│   │   ├── 2026-02-01.md   # Today's captures
│   │   ├── 2026-01-31.md   # Yesterday
│   │   └── archive/        # Old files
│   └── HEARTBEAT.md        # Heartbeat checklist
└── memory-chain/           # Cryptographic chain
    ├── chain.jsonl
    ├── agent.key
    ├── agent.pub
    ├── memory.db
    └── content/
```

## Implementation Order

1. [ ] **Phase 1: Cron Jobs**
   - Set up the three cron jobs
   - Test with manual triggers
   - Monitor for issues

2. [ ] **Phase 2: Context Extraction**
   - Build summarization logic
   - Pattern detection for significance
   - Duplicate detection

3. [ ] **Phase 3: Curation Logic**
   - Weekly review algorithm
   - MEMORY.md update format
   - Chain commit triggers

4. [ ] **Phase 4: Garbage Collection**
   - Implement scoring function
   - Archive vs delete logic
   - Index cleanup

5. [ ] **Phase 5: Bootstrap Enhancement**
   - Smarter retrieval on session start
   - Context-aware memory injection
   - Token budget management

## Success Metrics

- Memories captured per day (target: 2-5 significant items)
- MEMORY.md growth rate (sustainable, not bloated)
- Chain entries per week (1-3 committed items)
- Retrieval relevance (memories surfaced when needed)
- User intervention rate (should decrease over time)

## Open Questions

1. How to access main session context from isolated cron job?
2. Should GC delete from chain index but preserve chain.jsonl?
3. What's the right balance of capture frequency vs token cost?
4. How to handle conflicts between daily capture and manual commits?

---

## Reference

This plan emerged from a conversation about @jumperz's checkpoint approach on Twitter, combined with our existing Memory Chain infrastructure. The goal is to make memory "just work" without manual intervention while preserving cryptographic proof for things that matter.

**Related files:**
- `specs/WITNESS-PROTOCOL.md` - On-chain anchoring spec
- `openclaw-skill/hooks/` - Existing OpenClaw hooks
- `docs/AGENTS-INTEGRATION.md` - Memory layer concepts

**To continue this work:**
1. Read this PLAN.md
2. Check the open questions
3. Start with Phase 1 (cron jobs)
