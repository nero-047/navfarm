"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/landing/navbar";
import Hero from "../components/landing/hero";
import VerticalHub from "../components/landing/vertical-hub";
import CostingSimulator from "../components/landing/costing-simulator";
import AuthDrawer from "../components/landing/auth-drawer";
import Card from "../components/source-ui/card";
import {
  CheckCircle, X, ChevronDown, Shield, Bell, Cpu, HelpCircle,
  Layers, Users, RefreshCw, Scale, BookOpen, ArrowRight, FileText, Database, Activity
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [selectedVertical, setSelectedVertical] = useState<"poultry" | "livestock" | "agri" | "aqua">("poultry");
  const [selectedCostingModel, setSelectedCostingModel] = useState<"standard" | "fifo" | "bio">("standard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeExploreModule, setActiveExploreModule] = useState<"poultry" | "livestock" | "agri" | "feed" | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      const userStr = localStorage.getItem("user");
      if (token && userStr) {
        setIsLoggedIn(true);
        try {
          const u = JSON.parse(userStr);
          setUserType(u.userType);
        } catch (e) {
          // Ignore
        }
      }
    }
  }, []);

  const handleDashboardRedirect = () => {
    if (userType === "SYSTEM_ADMIN") {
      router.push("/admin");
    } else {
      router.push("/console");
    }
  };

  const openAuth = (tab: "login" | "signup") => {
    setAuthTab(tab);
    setIsLoginOpen(true);
  };

  const faqs = [
    {
      q: "How does the multi-tenant database isolation work?",
      a: "NAVFarm allocates a completely separate, isolated database schema for each tenant. Access tokens and database credentials are cryptographically protected, ensuring your business parameters can never mix with other tenants."
    },
    {
      q: "What biosecurity costing methods do you support?",
      a: "We support Standard Costing with automated price/usage variance logs, FIFO (First In First Out) layers for inventory tracking, and Biological Asset valuation (IAS 41) supporting Bearer Asset capitalization, Fair Value revaluation journals, and mature depreciation runs."
    },
    {
      q: "Can we configure custom SMTP servers and webhooks for alerts?",
      a: "Yes. In the Notifications module, each company can provision its own custom SMTP host, ports, and App Passwords to send transactional emails, alongside webhooks for Slack or Microsoft Teams alerts."
    },
    {
      q: "How is user authorization managed?",
      a: "We provide a granular Role Permissions matrix. Company Administrators can create roles (like Accountant, Auditor, Operator) and toggle view/create/edit/delete/approve permissions for individual modules (like Accounting, Inventory, Farm Operations)."
    }
  ];

  const exploreModules = {
    poultry: {
      title: "Poultry Operations",
      tagline: "From rearing house to hatcheries and joint-cost cut settle-to-zero routines.",
      icon: Layers,
      color: "border-orange-500/35",
      badgeStyle: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      description: "Manage commercial poultry operations at scale. Tracks rearing placement, laying collection case rates, incubation trays, grading lots, and automated slaughterhouse yield settlements.",
      processes: [
        { name: "Flock Placement & Rearing", desc: "Assigns Day-Old Chicks (DOC) to rearing houses. Automatically records feed weight consumes, daily mortality logs, and computes biosecurity costing inputs." },
        { name: "Laying Schedules & Counts", desc: "Tracks daily egg production counts, laying rates (%), feed ratios per bird, and coops climate sensor averages." },
        { name: "Egg Grading Batches", desc: "Segments collected eggs into Grade A, Grade B, and rejects. Updates warehouse inventory lots dynamically." },
        { name: "Incubator & Hatchery Setter Logs", desc: "Tracks egg trays loaded into setter machines, schedules hatch dates, registers chick yield output percentage, and disposes rejects." },
        { name: "Slaughterhouse Joint-Cost Splits", desc: "Applies multi-output split algorithms (by weight ratios, dynamic metrics, or fixed percentages) to allocate rearing costs to primary cuts (e.g. breast fillets) and by-products." }
      ],
      tables: [
        { name: "poultry_rearing_batch", type: "Transaction Log", desc: "Tracks bird counts, start date, parent strain, and cumulative feed costs." },
        { name: "poultry_laying_log", type: "Operational Daily Yield", desc: "Daily egg collection parameters per laying house." },
        { name: "egg_grading_batch", type: "Inventory Control", desc: "Grades, sizes, and maps raw outputs to stock SKUs." },
        { name: "hatchery_incubation_log", type: "Lifecycle Tracker", desc: "Setter tray dates, candling details, and hatch chick counts." },
        { name: "slaughter_joint_cost_settlement", type: "Financial Entry", desc: "Joint-cost allocation variables and WIP clearings." }
      ],
      accounting: [
        { entry: "WIP Capitalization", journal: "Dr 1190 Work-in-Progress / Cr 1100 Raw Feed Silo (Expensing feed consumption)" },
        { entry: "Standard Variance Posting", journal: "Dr 6120 Usage Variance / Cr 1190 Work-in-Progress (Recording excess feed or high mortality adjustments at batch close)" },
        { entry: "Yield Settle-To-Zero", journal: "Dr 1110 Finished Bird Stock / Cr 1190 Work-in-Progress (Clearing WIP accounts to zero upon batch harvest)" }
      ],
      scenario: "A farm manager schedules a hatch batch. Eggs are gathered, graded, and loaded into incubator setter tray 'TRAY-002'. At hatch day (Day 21), 8,700 live chicks are registered and transferred to a commercial rearing batch. All feed and medicine costs are capitalised into WIP daily. At batch close, standard costing estimates are compared to actual feed bags issued, and differences are automatically posted to GL Variance lines."
    },
    livestock: {
      title: "Dairy & Livestock Management",
      tagline: "Ear tag logs, daily milking yields, and IAS 41 biological asset reclassifications.",
      icon: Users,
      color: "border-blue-500/35",
      badgeStyle: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      description: "Comprehensive cattle, buffalo, sheep, and piggery herd management. Tracks ancestry, medical check alerts, stage transitions, and daily dairy volume logs.",
      processes: [
        { name: "Herd Registration & RFID Tagging", desc: "Logs individual ear tags, birth weight, lineage, breed parameters, and current biosecurity quarantine flags." },
        { name: "Stage Reclassification", desc: "Transitions animals dynamically across developmental categories (e.g., Calf -> Heifer -> Milking Cow), modifying asset values." },
        { name: "Daily Dairy Milking Logs", desc: "Tracks morning and evening milk weight yields per cow, FAT/SNF quality indicators, and tank storage assignments." },
        { name: "Gestation & Breeding Tracker", desc: "Registers insemination logs, sire parameters, gestation check alerts, and weaning statistics." },
        { name: "Biosecurity & Vet Audits", desc: "Schedules vaccination schedules, quarantine entries, and logs medicine issues." }
      ],
      tables: [
        { name: "herd_animal_master", type: "Master Entity", desc: "RFID tags, parentage logs, current stage, and biosecurity flags." },
        { name: "milking_yield_log", type: "Operational Daily Yield", desc: "Per-cow morning/evening milk volume and fat contents." },
        { name: "veterinary_audit_log", type: "Compliance Auditor", desc: "Medication dosages, audit dates, and veterinarian credentials." },
        { name: "gestation_cycle_tracker", type: "Breeding Tracker", desc: "Insemination, expected delivery, and weaning totals." }
      ],
      accounting: [
        { entry: "Asset Capitalization", journal: "Dr 1220 Non-Current Asset (Cattle) / Cr 1100 Feed Silo (Capitalizing pre-maturity nurturing cost)" },
        { entry: "Fair Value Adjustments", journal: "Dr 1220 Non-Current Asset / Cr 8100 Unrealized Fair Value Gain (Recording market price gains under IAS 41)" },
        { entry: "Mature Amortization", journal: "Dr 7100 Depreciation Expense / Cr 1221 Accumulated Depreciation (Amortizing cows book value post-maturity)" }
      ],
      scenario: "RFID ear tag 'COW-RFID-992' transitions from a premature Heifer to a mature Milking Cow. The system reclassifies its asset ledger from development to production assets. Pre-maturity nurturing costs total Rs.45,000, which are capitalized. Every morning, its milk FAT % is tracked; cumulative volumes are settled to dairy stock. At month end, an auditor runs IAS 41 Fair Value revaluation relative to local livestock index charts."
    },
    agri: {
      title: "Bearer Assets & Agriculture",
      tagline: "Cultivation stage logs, bearer plant orchards, and FIFO serial inventory lots.",
      icon: BookOpen,
      color: "border-emerald-500/35",
      badgeStyle: "bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border-emerald-500/20",
      description: "Manage agricultural fields, orchards, greenhouse crop cycles, and bearer plants. Supports pre-maturity capitalization, crop schedules copy, and packing conversions.",
      processes: [
        { name: "Bearer Plant Asset Capitalization", desc: "Monitors developmental years of orchards/vineyards (IAS 16). Capitalizes maintenance costs before first harvest." },
        { name: "Crop Cycle Duplication", desc: "Enables operators to clone historical crop schedules, inputs, and chemical treatment recipes to new fields." },
        { name: "Field Preparation & Sowing stage", desc: "Logs soil analysis variables, fertilizer application quantities, and seed sowing schedules." },
        { name: "FIFO Harvest Lot Serializer", desc: "Serializes harvested crops into chronological inventory lots to track shelf-life and supply tracing." },
        { name: "UOM Packaging Conversions", desc: "Tracks crop stocks as they transition from fields (crates) to cold storage (kilograms) and package bags (units)." }
      ],
      tables: [
        { name: "crop_cultivation_batch", type: "Transaction Log", desc: "Tracks crop type, field ID, sowing date, and seed batch source." },
        { name: "bearer_plant_asset_master", type: "Asset Master", desc: "Orchard tree count, maturity date, and capitalized development costs." },
        { name: "agriculture_field_log", type: "Operational Daily Yield", desc: "Schedules soil testing, spray chemicals, and irrigation details." },
        { name: "harvest_inventory_lot", type: "Inventory Control", desc: "Tracks trace codes, cold storage shelf-life, and package weights." }
      ],
      accounting: [
        { entry: "Development Capitalization", journal: "Dr 1230 Land & Bearer Assets / Cr 1110 Fertilizer Inventory (Capitalizing tree nurturing expenses)" },
        { entry: "Orchard Depreciation", journal: "Dr 7120 Orchard Depreciation / Cr 1231 Accumulated Orchard Amortization (Amortizing mature trees over crop cycles)" },
        { entry: "Harvest Posting", journal: "Dr 1140 Crop Inventory / Cr 1190 Work-in-Progress (Capitalizing harvest value into product lots)" }
      ],
      scenario: "An agricultural team initiates orchard 'ORCH-APPLE-C'. For the first 5 years, water, chemical spray, and manual labor inputs are capitalized. In Year 6, the orchard reaches maturity and starts bearing fruit. Apple harvest batches are registered under trace code 'LOT-APP-2026-01'. The system initiates Apple Tree depreciation over its remaining 20-year productive life, matching asset expenses with harvest revenues."
    },
    feed: {
      title: "Feed Mill Formulation",
      tagline: "Least-cost feed formulations, BOR version control, and nutritional calculation.",
      icon: Cpu,
      color: "border-purple-500/35",
      badgeStyle: "bg-purple-500/10 text-purple-650 dark:text-purple-400 border-purple-500/20",
      description: "Ensure highest feed conversion ratios (FCR) with least-cost feed formulation (LCF) recipes, Bill of Resources version audits, and stock mixing transfer controls.",
      processes: [
        { name: "Bill of Resources (BOR) Version Control", desc: "Maintains raw ingredient listings (corn, soy, micro-nutrients) with strict validation, version logs, and supervisor signatures." },
        { name: "Nutritional Auto-Calculator", desc: "Computes total chemical contribution (crude protein, fat, moisture) dynamically relative to feedstock quality testing variables." },
        { name: "Least-Cost Formulation Recipe", desc: "Calculates formulation adjustments based on raw material market prices to meet target nutrients at lowest expense." },
        { name: "Stock Mixing Issues & silo tracking", desc: "Authorizes silo raw material depletion logs, recording bulk material issues to mixers." },
        { name: "Processed Bag Packaging", desc: "Logs finished processed feed bag stocks, printing trace tracking lot numbers." }
      ],
      tables: [
        { name: "feed_bor_master", type: "Master Entity", desc: "Raw resource codes, default recipe shares, and approval parameters." },
        { name: "feed_formula_recipe", type: "Operational Daily Yield", desc: "Nutrient limits, target metrics, and batch mixing parameters." },
        { name: "feed_mill_production_job", type: "Transaction Log", desc: "Mixer ID, raw bags issued, finished bags produced, and mix variance." },
        { name: "feed_material_issue_log", type: "Inventory Control", desc: "Silo depletion log weights and grain grades." }
      ],
      accounting: [
        { entry: "Mix Raw Material Issue", journal: "Dr 1195 Feed Mix WIP / Cr 1100 Grains Silo Stock (Recording raw grain issues to mix lines)" },
        { entry: "Mix Yield Output Settle", journal: "Dr 1120 Finished Feed Stock / Cr 1195 Feed Mix WIP (Clearing WIP accounts to bag stocks)" },
        { entry: "Mix Cost Variance Posting", journal: "Dr 6130 Feed Mix Variance / Cr 1195 Feed Mix WIP (Posting variance from moisture loss or grade swaps)" }
      ],
      scenario: "An accountant updates the corn price index. The formulation engine triggers and recommends a revised recipe batch ('RECIPE-V2.4') substituting 3% corn with sorghum to minimize cost while matching 21% crude protein targets. Raw ingredients are issued from silos to mixer 'MIX-B'. After mixing and bag bagging, moisture evaporation causes a 0.5% weight variance, which is automatically posted to GL feed mix variance."
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] font-sans relative overflow-x-hidden selection:bg-teal-500 selection:text-white transition-colors duration-300 pt-20">

      {/* Background Glows & Particle Effects (Theme Aware) */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[6000ms]" />
      <div className="absolute top-[20%] right-[10%] w-[600px] h-[600px] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[10%] left-[5%] w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle, var(--text-primary) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Header / Navbar */}
      <Navbar
        onSignInClick={isLoggedIn ? handleDashboardRedirect : () => openAuth("login")}
        onRegisterClick={() => openAuth("signup")}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        isLoggedIn={isLoggedIn}
      />

      {/* Hero Section Wrapper */}
      <div className="border-b border-[var(--border)] bg-[var(--surface-raised)]/30 backdrop-blur-sm">
        <Hero
          onRegisterClick={() => openAuth("signup")}
          onLaunchClick={isLoggedIn ? handleDashboardRedirect : () => openAuth("login")}
          isLoggedIn={isLoggedIn}
        />
      </div>

      {/* Nature of Business / Farming Verticals (Theme Aware) */}
      <div className="bg-[var(--bg)] py-4">
        <VerticalHub
          selectedVertical={selectedVertical}
          setSelectedVertical={setSelectedVertical}
        />
      </div>

      {/* Detailed ERP Capabilities Section */}
      <section id="features" className="py-24 border-t border-[var(--border)] bg-[var(--surface-raised)]/50 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-4 mb-16">
            <div className="inline-flex self-center items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-655 dark:text-teal-400 text-xs font-semibold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" /> Platform Capabilities
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
              End-to-End Operational Control
            </h2>
            <p className="text-[var(--text-secondary)] text-sm md:text-base">
              NAVFarm modules are integrated directly into your general ledger, bringing real-time accounting and field metrics together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Poultry */}
            <Card
              onClick={() => setActiveExploreModule("poultry")}
              className="hover:border-teal-500/30 hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-5 bg-[var(--surface)] shadow-md hover:shadow-xl relative group cursor-pointer"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-500">
                <Layers className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Poultry Operations</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Full-lifecycle bird tracking. Manage incubation phases, hatchery metrics, grading sheets, and joint-cost split slaughter yield settle-to-zero routines.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["Flock Rearing", "Egg Grading", "Incubator", "Slaughter"].map((t, idx) => (
                  <span key={idx} className="bg-orange-500/5 text-orange-600 dark:text-orange-400 border border-orange-500/10 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                    {t}
                  </span>
                ))}
              </div>
              <span className="text-xs font-bold text-orange-500 flex items-center gap-1.5 mt-auto pt-4 group-hover:underline">
                Explore module <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Card>

            {/* Livestock */}
            <Card
              onClick={() => setActiveExploreModule("livestock")}
              className="hover:border-blue-500/30 hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-5 bg-[var(--surface)] shadow-md hover:shadow-xl relative group cursor-pointer"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Dairy & Livestock</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Manage cows, buffaloes, and pigs. Log daily milk production yields, veterinarian check schedules, and bio-asset stage reclassifications.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["Herd Records", "Milk Logs", "IAS 41 Bio", "Vet Audits"].map((t, idx) => (
                  <span key={idx} className="bg-blue-500/5 text-blue-600 dark:text-blue-400 border border-blue-500/10 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                    {t}
                  </span>
                ))}
              </div>
              <span className="text-xs font-bold text-blue-500 flex items-center gap-1.5 mt-auto pt-4 group-hover:underline">
                Explore module <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Card>

            {/* Agriculture */}
            <Card
              onClick={() => setActiveExploreModule("agri")}
              className="hover:border-emerald-500/30 hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-5 bg-[var(--surface)] shadow-md hover:shadow-xl relative group cursor-pointer"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Bearer Assets</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Track crop stages, amortization of fruit trees (IAS 16), and flower yields. Duplicate crop cycles and convert unit measurements dynamically.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["Bearer Plants", "Crop Cycles", "FIFO Lots", "UOM Match"].map((t, idx) => (
                  <span key={idx} className="bg-emerald-500/5 text-emerald-650 dark:text-emerald-400 border border-emerald-500/10 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                    {t}
                  </span>
                ))}
              </div>
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 mt-auto pt-4 group-hover:underline">
                Explore module <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Card>

            {/* Feed Mill */}
            <Card
              onClick={() => setActiveExploreModule("feed")}
              className="hover:border-purple-500/30 hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-5 bg-[var(--surface)] shadow-md hover:shadow-xl relative group cursor-pointer"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-500">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Feed Mill & Formula</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Manage bill of resources (BOR) version controls. Calculate raw material attributes dynamically and settle stock transfers.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["Least-Cost BOR", "Attribute Calc", "Feed Transfers", "Versions"].map((t, idx) => (
                  <span key={idx} className="bg-purple-500/5 text-purple-650 dark:text-purple-400 border border-purple-500/10 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                    {t}
                  </span>
                ))}
              </div>
              <span className="text-xs font-bold text-purple-500 flex items-center gap-1.5 mt-auto pt-4 group-hover:underline">
                Explore module <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Card>

          </div>
        </div>
      </section>

      {/* Accounting and Costing Engine (Interactive Simulator - Theme Aware) */}
      <div className="border-t border-b border-[var(--border)] bg-[var(--bg)]">
        <CostingSimulator
          selectedCostingModel={selectedCostingModel}
          setSelectedCostingModel={setSelectedCostingModel}
        />
      </div>

      {/* Dynamic Security & Audit Log Feature Grid */}
      <section className="py-24 bg-[var(--surface-raised)]/30 px-6 border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-semibold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" /> Trust & Compliance
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] leading-tight">
              Enterprise-Grade Multi-Tenant Infrastructure
            </h2>
            <p className="text-[var(--text-secondary)] text-sm md:text-base leading-relaxed">
              NAVFarm isolates client companies completely at the database layer. In addition, our auditing ledger monitors all updates, deletions, and insertions, storing the previous and updated values for comprehensive regulatory safety.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500 shrink-0 border border-teal-500/20">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Database Isolation</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Separate schema instances for each tenant prevent shared record exposures.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 border border-blue-500/20">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Custom Alert Engines</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Configure dedicated outbound SMTP hosts and Webhook signatures.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-500/20">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Audit Trail Logging</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Track transactional adjustments with pre/post JSON payload logs.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0 border border-purple-500/20">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Permission Matrix</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Fine-tune operators permissions using granular security scopes.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Security Status: Workspace Compliant
            </h3>
            <div className="space-y-3 font-mono text-[11px] text-[var(--text-secondary)]">
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span>DATABASE STATUS</span>
                <span className="text-emerald-500 font-bold">ISOLATED SCHEMA ACTIVE</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span>ENCRYPTION AT REST</span>
                <span className="text-emerald-500 font-bold">AES-256 ENABLED</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span>AUDITING LEDGER</span>
                <span className="text-teal-500 font-bold">MONITORING OPERATIONAL AUDITS</span>
              </div>
              <div className="flex justify-between">
                <span>SMTP NOTIFICATIONS</span>
                <span className="text-teal-500 font-bold">VERIFIED TLS CONNECTIONS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Plan Section */}
      <section id="pricing" className="py-24 bg-[var(--surface)] px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Simple, Feature-Locked Pricing Plans
            </h2>
            <p className="text-[var(--text-secondary)] text-sm md:text-base">
              Choose the package that scales with your farming operational scopes. All plans are isolated multi-tenant workspaces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">

            {/* Basic Plan */}
            <Card className="flex flex-col justify-between bg-[var(--surface-raised)] border-[var(--border)] shadow-md hover:border-teal-500/20 transition-colors">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-secondary)]">Basic Plan</h3>
                <div className="text-3xl font-extrabold text-[var(--text-primary)] mt-4">$99<span className="text-sm text-[var(--text-secondary)] font-normal">/month</span></div>
                <div className="h-px bg-[var(--border)] my-6" />
                <ul className="flex flex-col gap-4 text-sm text-[var(--text-secondary)]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" /> Max Companies: 1
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" /> Max Users: 5
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" /> Storage Limit: 5 GB
                  </li>
                  <li className="flex items-center gap-2 opacity-50">
                    <X className="w-4 h-4 text-rose-500 flex-shrink-0" /> QR Traceability Engine
                  </li>
                </ul>
              </div>
              <button
                onClick={() => openAuth("signup")}
                className="w-full py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--row-hover)] transition-all text-sm font-bold text-center mt-8 cursor-pointer text-[var(--text-primary)]"
              >
                Sign Up Basic
              </button>
            </Card>

            {/* Pro Plan */}
            <Card glow={true} className="flex flex-col justify-between relative transform md:-translate-y-2 bg-[var(--surface-raised)] border border-teal-500/40 shadow-xl shadow-teal-500/5 pt-10">
              <div className="absolute top-3 right-4 bg-teal-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                Most Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-teal-500">Pro Plan</h3>
                <div className="text-3xl font-extrabold text-[var(--text-primary)] mt-4">$199<span className="text-sm text-[var(--text-secondary)] font-normal">/month</span></div>
                <div className="h-px bg-[var(--border)] my-6" />
                <ul className="flex flex-col gap-4 text-sm text-[var(--text-secondary)]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" /> Max Companies: 3
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" /> Max Users: 10
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" /> Storage Limit: 10 GB
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" /> QR Traceability Module
                  </li>
                </ul>
              </div>
              <button
                onClick={() => openAuth("signup")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:shadow-lg hover:shadow-teal-500/20 transition-all text-sm font-bold text-center mt-8 cursor-pointer text-white"
              >
                Sign Up Pro
              </button>
            </Card>

            {/* Enterprise Plan */}
            <Card className="flex flex-col justify-between bg-[var(--surface-raised)] border-[var(--border)] shadow-md hover:border-teal-500/20 transition-colors">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-secondary)]">Enterprise Plan</h3>
                <div className="text-3xl font-extrabold text-[var(--text-primary)] mt-4">$499<span className="text-sm text-[var(--text-secondary)] font-normal">/month</span></div>
                <div className="h-px bg-[var(--border)] my-6" />
                <ul className="flex flex-col gap-4 text-sm text-[var(--text-secondary)]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" /> Max Companies: 10
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" /> Max Users: 100
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" /> Storage Limit: 100 GB
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" /> API Access & Integrations
                  </li>
                </ul>
              </div>
              <button
                onClick={() => openAuth("signup")}
                className="w-full py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--row-hover)] transition-all text-sm font-bold text-center mt-8 cursor-pointer text-[var(--text-primary)]"
              >
                Sign Up Enterprise
              </button>
            </Card>

          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-24 bg-[var(--surface-raised)]/20 px-6 border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-4 mb-16">
            <div className="inline-flex self-center items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-650 dark:text-purple-400 text-xs font-semibold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" /> FAQ
            </div>
            <h2 className="text-3xl font-extrabold text-[var(--text-primary)]">Frequently Asked Questions</h2>
            <p className="text-[var(--text-secondary)] text-sm md:text-base">Have queries about deployment or security? We have answers.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)] shadow-sm hover:border-[var(--border-subtle)] transition-colors">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--row-hover)] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${activeFaq === idx ? "transform rotate-180" : ""}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-5 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border)] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--surface)] py-12 border-t border-[var(--border)] px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 flex-wrap">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center md:text-left">
            <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              NAV<span className="text-teal-400">Farm</span>
            </span>
            <span className="text-xs text-[var(--text-secondary)]">© 2026 Prudence technology private Ltd. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--text-secondary)] font-semibold font-sans">
            <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms of Service</Link>
            <a href="http://localhost:2877/api/docs" target="_blank" rel="noreferrer" className="hover:text-[var(--text-primary)] transition-colors">API Docs</a>
          </div>
        </div>
      </footer>

      {/* Interactive Explore Module Modal */}
      {activeExploreModule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 transition-all duration-300">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl relative">

            {/* Modal Header */}
            <div className={`p-6 border-b border-[var(--border)] flex justify-between items-start gap-4 bg-[var(--surface-raised)] rounded-t-2xl relative`}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
                  {React.createElement(exploreModules[activeExploreModule].icon, { className: "w-6 h-6" })}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
                    {exploreModules[activeExploreModule].title} Explorer
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                    {exploreModules[activeExploreModule].tagline}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveExploreModule(null)}
                className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--row-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                title="Close Explorer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-8 overflow-y-auto">

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-500" /> Module Description
                </h4>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed bg-[var(--surface-raised)] border border-[var(--border)] p-4 rounded-xl">
                  {exploreModules[activeExploreModule].description}
                </p>
              </div>

              {/* Sub-processes Workflow list */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-500" /> Core Workflow Sub-processes
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {exploreModules[activeExploreModule].processes.map((proc, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-teal-500/25 transition-colors">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center text-[10px] font-extrabold font-mono shrink-0">
                          0{idx + 1}
                        </span>
                        <span className="font-bold text-sm text-[var(--text-primary)]">{proc.name}</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-7">{proc.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Database Entity Mapping */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-teal-500" /> Associated Database Entities Schema
                </h4>
                <div className="overflow-x-auto pb-2">
                  <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg)] font-mono text-[11px] min-w-[550px]">
                    <div className="grid grid-cols-12 gap-2 bg-[var(--surface-raised)] border-b border-[var(--border)] p-3 font-bold text-[var(--text-muted)] uppercase text-[10px]">
                      <span className="col-span-5">Table Physical Name</span>
                      <span className="col-span-3">Data Classification</span>
                      <span className="col-span-4">Primary Attribute Purpose</span>
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                      {exploreModules[activeExploreModule].tables.map((table, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 p-3 text-[var(--text-secondary)] items-center">
                          <span className="col-span-5 font-bold text-[var(--text-primary)]">{table.name}</span>
                          <span className="col-span-3 font-semibold text-teal-600 dark:text-teal-400">{table.type}</span>
                          <span className="col-span-4 text-xs text-[var(--text-muted)]">{table.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Accounting Ledgers journals impact */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-teal-500" /> General Ledger (GL) Impact Rules
                </h4>
                <div className="overflow-x-auto pb-2">
                  <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg)] font-mono text-[11px] min-w-[550px]">
                    <div className="grid grid-cols-12 gap-2 bg-[var(--surface-raised)] border-b border-[var(--border)] p-3 font-bold text-[var(--text-muted)] uppercase text-[10px]">
                      <span className="col-span-4">Accounting Event</span>
                      <span className="col-span-8">Standard Double-Entry Journal Posting Rule</span>
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                      {exploreModules[activeExploreModule].accounting.map((rule, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 p-3 text-[var(--text-secondary)] items-center">
                          <span className="col-span-4 font-bold text-[var(--text-primary)]">{rule.entry}</span>
                          <span className="col-span-8 text-emerald-650 dark:text-emerald-400 font-bold">{rule.journal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Typical Use-case Business Scenario */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-teal-500" /> Example Production Scenario
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic bg-[var(--surface-raised)] border border-[var(--border)] p-4 rounded-xl">
                  &ldquo;{exploreModules[activeExploreModule].scenario}&rdquo;
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--border)] flex justify-end bg-[var(--surface-raised)] rounded-b-2xl">
              <button
                onClick={() => setActiveExploreModule(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm border border-[var(--border)] hover:bg-[var(--row-hover)] transition-colors cursor-pointer text-[var(--text-primary)]"
              >
                Close Explorer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Authentication & Registration Side Drawer */}
      <AuthDrawer
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        initialTab={authTab}
      />

    </div>
  );
}
