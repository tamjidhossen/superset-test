import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../../.env") });

import express from "express";
import { InsightType } from "@prisma/client";
import { prisma } from "./lib/prisma";
// @ts-ignore
import cors from "cors";

import { getSupersetGuestToken } from "./lib/superset";
import path from "path";


const app = express();
const PORT = process.env.SERVER_PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper to get random item from array
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

app.post("/api/seed", async (req, res) => {
  try {
    console.log("Seeding started...");
    
    // Clear existing data (optional, but good for testing)
    await prisma.percentageBreakdown.deleteMany();
    await prisma.dataPoint.deleteMany();
    await prisma.filterCriteria.deleteMany();
    await prisma.insightPopulation.deleteMany();
    await prisma.metricsInsight.deleteMany();
    await prisma.insights.deleteMany();
    await prisma.metricsIdentifier.deleteMany();
    await prisma.unit.deleteMany();
    await prisma.perfMetricsCategory.deleteMany();
    await prisma.platform.deleteMany();

    // 1. Platform
    const platform = await prisma.platform.create({
      data: { name: "iOS" }
    });

    // 2. Units
    const unitSec = await prisma.unit.create({
        data: { identifier: "seconds", displayName: "Seconds" }
    });
    const unitCount = await prisma.unit.create({
        data: { identifier: "count", displayName: "Count" }
    });
    const unitPercent = await prisma.unit.create({
        data: { identifier: "percentage", displayName: "%" }
    });

    // 3. Categories
    const categories = ["HANG", "LAUNCH", "MEMORY", "DISK", "BATTERY"];
    for (const catIdent of categories) {
      const category = await prisma.perfMetricsCategory.create({
        data: {
          identifier: catIdent,
          platformId: platform.id
        }
      });

      // 4. Metrics Identifiers
      const metricIdents = catIdent === "HANG" ? ["hangRate"] : 
                           catIdent === "LAUNCH" ? ["launchTime"] :
                           catIdent === "MEMORY" ? ["peakMemory"] :
                           catIdent === "DISK" ? ["diskWrites"] : ["batteryUsage"];
      
      for (const mIdent of metricIdents) {
        const metric = await prisma.metricsIdentifier.create({
          data: {
            identifier: mIdent,
            categoryId: category.id,
            unitId: mIdent.includes("Time") ? unitSec.id : unitCount.id
          }
        });

        // 5. Data Points & Filter Criteria
        const devices = ["iPhone 14 Pro", "iPad Pro (12.9-inch)", "iPhone 13"];
        const versions = ["1.0.0", "1.1.0", "1.2.0"];
        
        for (const device of devices) {
          const filter = await prisma.filterCriteria.create({
            data: {
              percentile: "percentile.fifty",
              device: device.replace(/\s+/g, '_').toLowerCase(),
              deviceMarketingName: device,
              metricId: metric.id
            }
          });

          for (const version of versions) {
            const dataPoint = await prisma.dataPoint.create({
              data: {
                version,
                value: Math.random() * 100,
                errorMargin: Math.random() * 5,
                goal: randomItem(["fair", "good", "poor"]),
                datasetId: filter.id
              }
            });

            // 6. Breakdowns
            await prisma.percentageBreakdown.create({
              data: {
                subSystemLabel: "On Screen",
                value: Math.random() * 100,
                dataPointId: dataPoint.id
              }
            });
          }
        }
      }
    }

    res.json({ message: "Database seeded successfully!" });
  } catch (error) {
    console.error("Seeding failed:", error);
    res.status(500).json({ error: "Seeding failed", details: error instanceof Error ? error.message : String(error) });
  }
});

app.get("/api/superset/guest-token", async (req, res) => {
  try {
    const dashboardId = process.env.SUPERSET_DASHBOARD_ID || "1";
    const data = await getSupersetGuestToken(dashboardId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch guest token" });
  }
});

app.get("/api/status", async (req, res) => {

    try {
        const platformCount = await prisma.platform.count();
        res.json({ status: "OK", platformCount });
    } catch (e) {
        res.status(500).json({ status: "ERROR", error: String(e) });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});