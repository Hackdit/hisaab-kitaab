# PHASE_STATUS.md - Phase Gate Checklists

## Current Phase: 1 (Week 1-4)

---

## PHASE 1 GATE (Week 4)

### Core Messaging
- [ ] WhatsApp webhook receives and responds to messages
- [ ] "Invoice bhejo" command generates real GST-compliant PDF
- [ ] Invoice delivered on WhatsApp within 5 seconds
- [ ] Udhaar entry recorded in Supabase

### Authentication
- [ ] WhatsApp OTP onboarding completes in under 60 seconds

### Payments
- [ ] Razorpay subscription flow works end-to-end

### Testing
- [ ] 10 real test messages processed without error

---

## PHASE 2 GATE (Week 8)

### Dashboard
- [ ] Dashboard shows real data from Supabase

### GST Compliance
- [ ] GSTR-1 JSON generated correctly for test month

### Revenue
- [ ] At least 1 paying customer on ₹299 plan

---

## PHASE 3 GATE (Week 12)

### UPI Reconciliation
- [ ] UPI reconciliation parsing bank SMS correctly

### Growth
- [ ] 500+ registered businesses in system

---

## Notes

- Phase 1 focuses on WhatsApp-first experience
- No web app required for Phase 1 - all via WhatsApp
- Payments required for revenue validation
- Phase 2 adds dashboard for business insights
- Phase 3 adds UPI SMS parsing for reconciliation