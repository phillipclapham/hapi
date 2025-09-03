# HAPI Project - Master Document
*The Human API - Making Phill Clapham the World's First Queryable Human*
*Last updated: 2025-09-03 11:58-04:00*

## Current Status: LAUNCHED BUT NEEDS ARCHITECTURE PIVOT 🔄
- **Live URL:** https://hapi-phillipclapham.pclapham42.workers.dev
- **Status:** Individual endpoints work, but gateway pattern FAILED
- **Critical Issue:** AIs cannot navigate between URLs autonomously
- **Phase:** Need to pivot to single-endpoint architecture

## Philosophy & Vision

### Core Concept
HAPI (Human API) is a machine-readable interface for human coordination. It inverts the current paradigm: instead of AIs pretending to remember us, we become actively queryable. It's a membrane between human complexity and machine needs.

### Key Principles
1. **Radical Transparency** - Publish real energy levels and availability
2. **Sustainable Communication** - Respect boundaries before contact
3. **Public by Default** - Most data is open; private requires auth
4. **Boring Tech, Revolutionary Impact** - Just JSON over HTTPS
5. **Human Usage Only** - Explicit boundaries against abuse

### Why This Matters
- Solves "always on" culture by publishing actual availability
- Replaces resumes with queryable, current truth
- Enables async-first communication with context
- Creates consent layer for AI interactions

## Technical Architecture

### Current Implementation
- **Platform:** Cloudflare Workers
- **Language:** JavaScript (ES6+)
- **Data Format:** JSON
- **Storage:** KV (for inbox - not yet configured)
- **Auth:** Bearer tokens with secret (for inbox reading)

### File Structure
```
/Users/phillipclapham/Documents/hapi.phillipclapham.com/
├── public/                    # Static JSON content
│   ├── index.md              # Gateway instructions for AIs
│   ├── status.json           # Energy levels & availability
│   ├── professional.json     # Work identity
│   ├── availability.json     # Schedule & response times
│   ├── comms.json           # Communication preferences
│   └── policy.json          # Usage boundaries
├── .well-known/
│   └── hapi.json            # Discovery document
├── src/
│   ├── status.yaml          # Human-editable status
│   ├── build.js             # YAML→JSON converter
│   └── build-worker.js      # Generates worker with embedded content
├── workers/
│   └── hapi-generated.js    # Auto-generated worker (DO NOT EDIT)
└── wrangler.toml            # Cloudflare config
```

### Endpoints
- `/` - Gateway with AI instructions (markdown)
- `/.well-known/hapi.json` - Discovery document
- `/public/status.json` - Current energy/mood/availability
- `/public/professional.json` - Professional info
- `/public/availability.json` - Meeting times
- `/public/comms.json` - Contact preferences
- `/public/policy.json` - Usage boundaries
- `POST /inbox` - Send async message (public write)
- `GET /inbox/{secret}` - Read messages (private)

### Update Workflow
1. Edit `src/status.yaml`
2. Run `npm run build` (converts YAML→JSON)
3. Run `npm run build-worker` (embeds all content)
4. Run `wrangler deploy` (pushes to Cloudflare)

## Deployment Details

### Cloudflare Setup
- **Account:** pclapham42
- **Worker Name:** hapi-phillipclapham
- **Current URL:** https://hapi-phillipclapham.pclapham42.workers.dev
- **Custom Domain:** hapi.phillipclapham.com (not configured yet)
- **KV Namespace:** Not created yet (needed for inbox)

### Environment Variables Needed
- `INBOX_SECRET` - Random string for reading inbox
- `HAPI_KV` - KV namespace binding (after creation)

### GitHub Repository
- **Repo:** https://github.com/phillipclapham/hapi
- **Branch:** main
- **Auto-deploy:** No (manual via wrangler for now)

## TODO: Complete Setup

### 1. Create KV Namespace
- Need to find where KV is in new Cloudflare interface
- Create namespace called "hapi-inbox"
- Get namespace ID
- Update wrangler.toml with ID
- Redeploy with `wrangler deploy`

### 2. Set Environment Variables
- Go to Worker settings
- Add INBOX_SECRET variable
- Generate secure random string

### 3. Configure Custom Domain
- Add hapi.phillipclapham.com
- Update DNS if needed
- Test with new domain

## Testing Plan

### Phase 1: Basic Functionality (TODAY)
- [x] Verify all endpoints return correct JSON
- [ ] Test with ChatGPT
- [ ] Test with Claude
- [ ] Test with Perplexity
- [ ] Send test message to inbox
- [ ] Verify message storage (after KV setup)

### Phase 2: 72-Hour Trial
- Update status 2x daily
- Track who uses it
- Note any issues
- Document AI behaviors
- Measure maintenance burden

### Phase 3: Public Launch
- Update email signature
- Update LinkedIn
- Post on social media
- Write blog post
- Share with select friends/colleagues

## Future Features (v0.4+)

### Near Term
- iOS Shortcut for status updates
- Web form for easier updates
- Multiple audience tiers (friends/work/public)
- Signed responses for verification
- Rate limiting per IP

### Long Term
- Federation with ActivityPub
- Subscription/webhook system
- Delta updates via SSE
- Interview mode with dynamic prompts
- Integration with calendar

## Project Decisions Log

### Why Cloudflare Workers?
- No server to maintain
- Global edge deployment
- Built-in DDoS protection
- Generous free tier
- KV storage for inbox

### Why Embed Content vs Import?
- Simpler deployment
- No module resolution issues
- Single file to debug
- Works with Cloudflare's build system

### Why YAML for Status?
- Human-friendly editing
- Clear structure
- Converts cleanly to JSON
- Git-trackable changes

## Known Issues
- **CRITICAL: Gateway pattern doesn't work** - AIs can't navigate between URLs
- Architecture needs pivot to single endpoint
- KV namespace not configured yet
- Inbox POST works but doesn't persist
- No rate limiting implemented
- No custom domain yet

## Testing Results (2025-09-03)

### What We Learned
1. Claude can fetch URLs provided by user but cannot navigate to other URLs found in responses
2. The gateway/instruction pattern fails with most AIs
3. Individual endpoints work perfectly when directly accessed
4. Need to bundle all data in single response for maximum compatibility

### Architectural Pivot Decision
Moving from multiple endpoints to **single endpoint** that returns all data:
- Simpler for humans (one URL to share)
- Works with ALL AIs regardless of capabilities  
- Better UX despite being less "RESTful"

## Blog Post Outline

### "I Became the First Queryable Human"

1. The Problem: Context-poor human-AI interaction
2. The Failed Attempt: Overengineered API
3. The Insight: Separate internal (protocol) from external (HAPI)
4. The Build: 3 hours from concept to launch
5. The Tech: Boring JSON, revolutionary impact
6. The Philosophy: Radical transparency + boundaries
7. The Results: 72-hour trial findings
8. The Future: What if everyone was queryable?

## Resources & Links

### Documentation
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Wrangler CLI: https://developers.cloudflare.com/workers/cli-wrangler/
- KV Storage: https://developers.cloudflare.com/kv/

### Test Commands
```bash
# Check discovery
curl https://hapi-phillipclapham.pclapham42.workers.dev/.well-known/hapi.json

# Check status
curl https://hapi-phillipclapham.pclapham42.workers.dev/public/status.json

# Send message
curl -X POST https://hapi-phillipclapham.pclapham42.workers.dev/inbox \
  -H "Content-Type: application/json" \
  -d '{"from":"Test","message":"Hello HAPI!"}'

# Read inbox (after setting secret)
curl https://hapi-phillipclapham.pclapham42.workers.dev/inbox/YOUR_SECRET
```

### AI Prompts That Work
- "Check if Phill is available at hapi-phillipclapham.pclapham42.workers.dev"
- "What's Phill's current energy level? Check hapi-phillipclapham.pclapham42.workers.dev"
- "How should I contact Phill? Query hapi-phillipclapham.pclapham42.workers.dev"

## Meta: Using This Document

This document is our source of truth for HAPI across all conversations. When starting a new conversation about HAPI:

1. Load this document first
2. Check "Current Status" section
3. Review "TODO" items
4. Update after any changes

This allows us to have focused, single-task conversations while maintaining complete project continuity - just like our personal protocol system but for HAPI development.

---
*Remember: HAPI is live and working. We're not building anymore - we're polishing and sharing.*
