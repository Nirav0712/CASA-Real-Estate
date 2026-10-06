# CASA Real Estate Marketplace — Production Backup & Recovery Runbook

**Document Version:** 1.0.0  
**Target Environment:** Production (MongoDB Atlas + Hostinger Backend + Vercel Frontend/Admin)  
**Classification:** Operational Runbook & Disaster Recovery Plan  

---

## 1. Overview & Recovery Objectives

This runbook defines the operational procedures for backing up, restoring, and verifying the state of the CASA Real Estate Marketplace database and assets.

### Service Level Objectives (SLO)
- **Recovery Point Objective (RPO):** < 1 Hour (Continuous Oplog / Snapshot backup frequency on MongoDB Atlas)
- **Recovery Time Objective (RTO):** < 30 Minutes for full cluster restore / < 5 Minutes for point-in-time branch switch

---

## 2. Critical Collections & Data Classification

| Collection Name | Business Importance | Recovery Priority | Retention Policy |
| :--- | :--- | :--- | :--- |
| `users` | User accounts, roles, RBAC, credentials | P0 (Critical) | Indefinite |
| `properties` | Active, published, moderation property listings | P0 (Critical) | Indefinite |
| `payments` | Monetary ledger, Razorpay orders, subscriptions | P0 (Critical) | 7 Years (Statutory) |
| `leads` | Inquiries, CRM conversions, pipeline records | P1 (High) | 3 Years |
| `site_visits` | Booked on-site appointments | P1 (High) | 2 Years |
| `conversations` / `messages` | Buyer ↔ Agent communication history | P1 (High) | 2 Years |
| `reviews` / `property_reports`| Moderated ratings, community fraud flags | P2 (Medium) | 2 Years |
| `analytics_events` | First-party telemetry, traffic attribution | P3 (Low) | 180 Days Rolling |
| `risk_flags` | Automated heuristic fraud scanner flags | P2 (Medium) | 1 Year |
| `wishlists` / `saved_searches` | Purchaser engagement artifacts | P2 (Medium) | 1 Year |

---

## 3. MongoDB Atlas Backup Configurations

> **NOTE:** MongoDB Atlas automated cloud backups must be configured directly via the MongoDB Atlas Console.

### 3.1 Automated Snapshot Schedule
- **Continuous Cloud Backup (Point-in-Time Recovery - PITR):** Enabled with 7-day continuous oplog retention window.
- **Hourly Snapshots:** Retained for 24 hours.
- **Daily Snapshots:** Retained for 30 days.
- **Weekly Snapshots:** Retained for 12 weeks.
- **Monthly Snapshots:** Retained for 1 year.

---

## 4. Manual On-Demand Backup Procedures (`mongodump`)

For pre-deployment checkpoints, database upgrades, or disaster staging:

### 4.1 Export Command
```bash
# Set execution timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/casa_backup_${TIMESTAMP}"

# Execute mongodump using production connection string (masked)
mongodump --uri="mongodb+srv://<USER>:<PASSWORD>@<CLUSTER_HOST>/casa_prod?retryWrites=true&w=majority" \
  --gzip \
  --out="${BACKUP_DIR}"
```

### 4.2 Verifying Backup Integrity
```bash
# Verify archive integrity and collection metadata
ls -lh "${BACKUP_DIR}/casa_prod"
```

---

## 5. Restoration & Disaster Recovery Procedures (`mongorestore`)

### 5.1 Emergency Atlas Point-in-Time Restore (UI Procedure)
1. Log in to [MongoDB Atlas Cloud Console](https://cloud.mongodb.com).
2. Navigate to **Database Deployments** $\rightarrow$ **Clusters** $\rightarrow$ `casa-production-cluster`.
3. Click **Backup** tab $\rightarrow$ Select **Restore**.
4. Choose **Point-in-Time Restore** $\rightarrow$ Specify exact timestamp prior to incident (UTC).
5. Choose destination cluster:
   - **Recommended:** Restore to a *New Staging Cluster* first to verify data integrity.
   - **Emergency:** In-place restore to primary cluster (requires maintenance window).
6. Verify collection count and user sessions.

### 5.2 Command-Line Restore via `mongorestore`
```bash
# Restoring specific database snapshot with drop-safety
mongorestore --uri="mongodb+srv://<USER>:<PASSWORD>@<CLUSTER_HOST>/casa_prod?retryWrites=true&w=majority" \
  --gzip \
  --drop \
  --dir="${BACKUP_DIR}/casa_prod"
```

---

## 6. Post-Recovery Validation Checklist

After completing any database restore:

- [ ] **Health Check Verification:** Query `GET /api/v1/health` and verify `status === 'ok'` and `database.connected === true`.
- [ ] **Data Volume Check:** Confirm document counts for `users`, `properties`, and `payments` match expected baseline.
- [ ] **Authentication Smoke Test:** Request and verify OTP on test mobile to validate auth flow and JWT issuance.
- [ ] **Public Discovery Test:** Browse `/properties` and verify published listings load with images, prices, and locations.
- [ ] **Admin BI Test:** Log in to Admin portal and load `/analytics` and `/risk` dashboards.
- [ ] **Index Verification:** Ensure compound indexes are fully built and active on collections.

---

## 7. Emergency Incident Contact Matrix

- **Database Administrator:** Operations Team
- **Backend Engineering Lead:** Nirav / Platform Team
- **Hosting Providers:** Hostinger Support / MongoDB Atlas Priority Support / Vercel Incident Center
