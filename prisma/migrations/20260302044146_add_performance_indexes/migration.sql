-- CreateIndex
CREATE INDEX "Activity_createdAt_vesselId_idx" ON "Activity"("createdAt", "vesselId");

-- CreateIndex
CREATE INDEX "Activity_type_createdAt_idx" ON "Activity"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Location_siteId_isActive_idx" ON "Location"("siteId", "isActive");

-- CreateIndex
CREATE INDEX "User_organizationId_role_idx" ON "User"("organizationId", "role");

-- CreateIndex
CREATE INDEX "Vessel_organizationId_stage_idx" ON "Vessel"("organizationId", "stage");

-- CreateIndex
CREATE INDEX "Vessel_organizationId_healthStatus_idx" ON "Vessel"("organizationId", "healthStatus");

-- CreateIndex
CREATE INDEX "Vessel_organizationId_nextSubcultureDate_idx" ON "Vessel"("organizationId", "nextSubcultureDate");

-- CreateIndex
CREATE INDEX "Vessel_healthStatus_contaminationType_idx" ON "Vessel"("healthStatus", "contaminationType");
