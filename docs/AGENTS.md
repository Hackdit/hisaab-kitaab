# AGENTS.md - Agent Ownership Map

## Sub-Agent Domains

### DATA Agent
**Owner**: DATA  
**Domain**: Database, migrations, Supabase client  
**Owned Packages**:
- `packages/db` - Supabase client + migrations

**Responsibilities**:
- Schema design for users, invoices, udhaar, inventory
- Write and run migrations
- Provide typed client utilities
- Ensure data consistency and constraints

---

### BACKEND Agent
**Owner**: BACKEND  
**Domain**: Fastify API, WhatsApp webhook, business logic  
**Owned Apps**:
- `apps/backend` - Main API server + WhatsApp handler

**Responsibilities**:
- HTTP API endpoints (REST)
- WhatsApp message receiving/responding
- Webhook verification
- Request validation and error handling
- Integration with all packages

---

### NLP Agent
**Owner**: NLP  
**Domain**: Intent parsing, Hindi/regional language processing  
**Owned Packages**:
- `packages/nlp` - Claude intent parser

**Responsibilities**:
- Parse WhatsApp messages to structured intents
- Support Hindi and regional languages
- Extract: invoice details, udhaar entries, inventory queries
- Handle ambiguous inputs gracefully

---

### INVOICE Agent
**Owner**: INVOICE  
**Domain**: PDF generation, invoice logic  
**Owned Packages**:
- `packages/pdf` - Invoice PDF generator

**Responsibilities**:
- Generate GST-compliant PDF invoices
- Support Hindi/English bilingual format
- QR code generation for UPI payments
- Delivery via WhatsApp media API

---

### PAYMENTS Agent
**Owner**: PAYMENTS  
**Domain**: Subscription management, Razorpay integration  
**Owned Apps**:
- `apps/worker` - Background jobs

**Responsibilities**:
- Razorpay subscription flow
- Webhook handling for payment events
- Trial period management
- Failed payment retries

---

### DASHBOARD Agent
**Owner**: DASHBOARD  
**Domain**: Web dashboard, data visualization  
**Owned Apps**:
- `apps/dashboard` - Next.js web dashboard

**Responsibilities**:
- Business overview dashboard
- Invoice management UI
- Udhaar ledger view
- GSTR report viewing
- Settings and profile

---

### GST Agent (Shared)
**Owner**: SHARED  
**Domain**: GST calculations, compliance  
**Owned Packages**:
- `packages/gst` - GST calculations + GSTN API

**Responsibilities**:
- CGST/SGST/IGST calculations
- HSN code mapping
- GSTR-1 JSON generation
- GSTN API integration (prod)

---

## Coordination Rules

1. **DATA must run first** - All agents depend on database schema
2. **BACKEND coordinates** - WhatsApp UX is the source of truth
3. **NLP + INVOICE are sequential** - NLP output feeds invoice generation
4. **DASHBOARD reads only** - Never writes directly to database
5. **PAYMENTS owns worker** - Background jobs for subscriptions

## Conflict Resolution

When agents disagree:
- WhatsApp UX > Web UX
- Hindi-first > English-first
- Simplicity > Features (Phase 1)
- Revenue features > DX improvements