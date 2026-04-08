-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('TRENDING_UP', 'REGRESSION');

-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfMetricsCategory" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,

    CONSTRAINT "PerfMetricsCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricsIdentifier" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "MetricsIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalKey" (
    "id" TEXT NOT NULL,
    "goalKey" TEXT NOT NULL,
    "upperBound" DOUBLE PRECISION,
    "lowerBound" DOUBLE PRECISION,
    "metricId" TEXT NOT NULL,

    CONSTRAINT "GoalKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilterCriteria" (
    "id" TEXT NOT NULL,
    "percentile" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "deviceMarketingName" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,

    CONSTRAINT "FilterCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataPoint" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "errorMargin" DOUBLE PRECISION,
    "goal" TEXT,
    "datasetId" TEXT NOT NULL,

    CONSTRAINT "DataPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PercentageBreakdown" (
    "id" TEXT NOT NULL,
    "subSystemLabel" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "dataPointId" TEXT NOT NULL,

    CONSTRAINT "PercentageBreakdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insights" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,

    CONSTRAINT "Insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricsInsight" (
    "id" TEXT NOT NULL,
    "metricCategoryId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "latestVersion" TEXT NOT NULL,
    "summaryString" TEXT NOT NULL,
    "referenceVersions" JSONB NOT NULL,
    "referenceVersionsKey" TEXT NOT NULL,
    "maxLatestVersionValue" DOUBLE PRECISION NOT NULL,
    "subSystemLabel" TEXT,
    "highImpact" BOOLEAN,
    "insightType" "InsightType" NOT NULL,
    "insightsId" TEXT NOT NULL,

    CONSTRAINT "MetricsInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightPopulation" (
    "id" TEXT NOT NULL,
    "percentile" TEXT NOT NULL,
    "latestVersionValue" DOUBLE PRECISION NOT NULL,
    "device" TEXT NOT NULL,
    "deltaPercentage" DOUBLE PRECISION,
    "referenceAverageValue" DOUBLE PRECISION,
    "summaryString" TEXT,
    "insightId" TEXT NOT NULL,

    CONSTRAINT "InsightPopulation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Platform_name_key" ON "Platform"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PerfMetricsCategory_identifier_key" ON "PerfMetricsCategory"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "MetricsIdentifier_identifier_categoryId_key" ON "MetricsIdentifier"("identifier", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_identifier_key" ON "Unit"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "GoalKey_goalKey_metricId_key" ON "GoalKey"("goalKey", "metricId");

-- CreateIndex
CREATE UNIQUE INDEX "FilterCriteria_percentile_device_deviceMarketingName_metric_key" ON "FilterCriteria"("percentile", "device", "deviceMarketingName", "metricId");

-- CreateIndex
CREATE UNIQUE INDEX "DataPoint_version_datasetId_key" ON "DataPoint"("version", "datasetId");

-- CreateIndex
CREATE UNIQUE INDEX "PercentageBreakdown_dataPointId_subSystemLabel_key" ON "PercentageBreakdown"("dataPointId", "subSystemLabel");

-- CreateIndex
CREATE UNIQUE INDEX "Insights_platformId_key" ON "Insights"("platformId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricsInsight_metricCategoryId_metricId_latestVersion_insi_key" ON "MetricsInsight"("metricCategoryId", "metricId", "latestVersion", "insightType", "insightsId", "referenceVersionsKey");

-- CreateIndex
CREATE UNIQUE INDEX "InsightPopulation_percentile_device_insightId_key" ON "InsightPopulation"("percentile", "device", "insightId");

-- AddForeignKey
ALTER TABLE "PerfMetricsCategory" ADD CONSTRAINT "PerfMetricsCategory_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricsIdentifier" ADD CONSTRAINT "MetricsIdentifier_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PerfMetricsCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricsIdentifier" ADD CONSTRAINT "MetricsIdentifier_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalKey" ADD CONSTRAINT "GoalKey_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "MetricsIdentifier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilterCriteria" ADD CONSTRAINT "FilterCriteria_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "MetricsIdentifier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataPoint" ADD CONSTRAINT "DataPoint_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "FilterCriteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PercentageBreakdown" ADD CONSTRAINT "PercentageBreakdown_dataPointId_fkey" FOREIGN KEY ("dataPointId") REFERENCES "DataPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insights" ADD CONSTRAINT "Insights_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricsInsight" ADD CONSTRAINT "MetricsInsight_metricCategoryId_fkey" FOREIGN KEY ("metricCategoryId") REFERENCES "PerfMetricsCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricsInsight" ADD CONSTRAINT "MetricsInsight_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "MetricsIdentifier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricsInsight" ADD CONSTRAINT "MetricsInsight_trendingUp_fkey" FOREIGN KEY ("insightsId") REFERENCES "Insights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricsInsight" ADD CONSTRAINT "MetricsInsight_regressions_fkey" FOREIGN KEY ("insightsId") REFERENCES "Insights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightPopulation" ADD CONSTRAINT "InsightPopulation_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "MetricsInsight"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
