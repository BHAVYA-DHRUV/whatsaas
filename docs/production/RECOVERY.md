# Disaster recovery

## RPO / RTO targets (recommended)

| Asset | Backup frequency | Retention |
|-------|------------------|-----------|
| PostgreSQL | Daily | 14 days |
| Media uploads | Daily | 14 days |
| Evolution instances | Evolution volume snapshot | 7 days |

## Restore PostgreSQL

```bash
gunzip -c /var/backups/whats-saas/postgres/whats_saas_YYYYMMDD.sql.gz | psql "$POSTGRES_URL"
```

Verify tenant row counts per `teams.id` before announcing recovery.

## Restore media

```bash
tar -xzf uploads_YYYYMMDD.tar.gz -C /path/to/whats-saas-main/public
```

## Application recovery

```bash
pm2 restart ecosystem.config.js --env production
curl -s https://your-domain.com/api/health | jq
```

## Tenant-safe restoration

- Logical dumps include all tenants; for single-tenant restore, extract rows by `team_id` in a staging DB before merge.
- Do not replay webhooks across tenants without filtering `instanceName`.

## Test restores quarterly

1. Restore to staging DB
2. Run migrations
3. Login as each demo tenant
4. Send test WhatsApp message
