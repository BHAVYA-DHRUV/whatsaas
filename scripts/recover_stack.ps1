# WhatSaaS Stack Recovery and Validation Script
# Run this from a PowerShell terminal inside the project root:
# .\scripts\recover_stack.ps1

Write-Host "=== Starting WhatSaaS Stack Recovery ===" -ForegroundColor Cyan

# 1. Clean up old/conflicting containers
Write-Host "`n[1/5] Checking for old/conflicting docker containers..." -ForegroundColor Green
$oldContainers = @("evolution-api", "redis", "whats_saas_postgres", "whats_saas_redis", "whats_saas_evolution")
foreach ($name in $oldContainers) {
    $exists = docker ps -a --filter "name=$name" --format "{{.Name}}"
    if ($exists) {
        Write-Host "Removing existing container: $name" -ForegroundColor Yellow
        docker rm -f $name 2>$null
    }
}

# 2. Boot Compose Stack
Write-Host "`n[2/5] Spinning up WhatSaaS Docker Compose stack..." -ForegroundColor Green
docker compose up -d --build

# 3. Wait for Database
Write-Host "`n[3/5] Waiting for PostgreSQL container to become ready..." -ForegroundColor Green
$ready = $false
for ($i = 1; $i -le 10; $i++) {
    $status = docker inspect -f '{{.State.Health.Status}}' whats_saas_postgres 2>$null
    if ($status -eq "healthy") {
        Write-Host "PostgreSQL container is healthy!" -ForegroundColor Green
        $ready = $true
        break
    }
    Write-Host "Waiting... (Attempt $i/10, Current Status: $status)" -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}

if (-not $ready) {
    Write-Host "Warning: PostgreSQL container health check is taking too long. Proceeding anyway..." -ForegroundColor Yellow
}

# 4. Run Drizzle Migrations and Seed Plans
Write-Host "`n[4/5] Running Drizzle ORM migrations and seeding plans..." -ForegroundColor Green
Write-Host "Running db:migrate..." -ForegroundColor Gray
npm run db:migrate

Write-Host "Running db:seed:plans..." -ForegroundColor Gray
npm run db:seed:plans

# 5. Run Integration Verification
Write-Host "`n[5/5] Running integration diagnostics..." -ForegroundColor Green
npx tsx scripts/verify-integrations.ts

Write-Host "`n=== Recovery Steps Completed ===" -ForegroundColor Cyan
Write-Host "To start the development servers, run the following command in your terminal:" -ForegroundColor Yellow
Write-Host "    npm run dev" -ForegroundColor Green
Write-Host "This will concurrently spin up Next.js (port 3000), Socket.IO (port 3001), and BullMQ background workers." -ForegroundColor Gray
