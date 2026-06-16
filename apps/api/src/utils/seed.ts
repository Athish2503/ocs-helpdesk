import { prisma } from "../config/prisma.js";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export async function seedDefaultCategories() {
  const categoriesToSeed = [
    // Parent Categories
    { name: "Domain Registration", description: "Domain name registrations and extensions.", parentName: null },
    { name: "Google Workspace (GWS)", description: "Google Collaboration and Workspace subscriptions.", parentName: null },
    { name: "Microsoft 365", description: "Microsoft Office and Cloud collaboration subscriptions.", parentName: null },
    { name: "Web Hosting", description: "Linux and Windows web hosting services.", parentName: null },
    { name: "SSL Certificates", description: "Security SSL certificates from Commodo, PositiveSSL, etc.", parentName: null },
    { name: "General Services", description: "General queries, domain forwarding, privacy protection, and DNS services.", parentName: null },

    // Children: Domain Registration
    { name: ".ac.in domain", description: "Academic institution domain in India.", parentName: "Domain Registration" },
    { name: ".ai domain", description: "Anguilla TLD, popular for AI companies.", parentName: "Domain Registration" },
    { name: ".ai.in domain", description: "AI domain extension for India.", parentName: "Domain Registration" },
    { name: ".asia domain", description: "Domain extension for the Asia-Pacific region.", parentName: "Domain Registration" },
    { name: ".biz domain", description: "Generic domain for business use.", parentName: "Domain Registration" },
    { name: ".co domain", description: "TLD representing companies or Colombia.", parentName: "Domain Registration" },
    { name: ".co.in domain", description: "Commercial Indian domain extension.", parentName: "Domain Registration" },
    { name: ".com domain", description: "Standard commercial domain extension.", parentName: "Domain Registration" },
    { name: ".design domain", description: "TLD for designers and creative studios.", parentName: "Domain Registration" },
    { name: ".edu.in domain", description: "Educational institution domain in India.", parentName: "Domain Registration" },
    { name: ".in domain", description: "Official country-code TLD for India.", parentName: "Domain Registration" },
    { name: ".info domain", description: "TLD for informative websites.", parentName: "Domain Registration" },
    { name: ".mobi domain", description: "TLD optimized for mobile sites.", parentName: "Domain Registration" },
    { name: ".net domain", description: "Network infrastructure and business domain.", parentName: "Domain Registration" },
    { name: ".net.in domain", description: "Network Indian domain extension.", parentName: "Domain Registration" },
    { name: ".org domain", description: "Organization and non-profit domain extension.", parentName: "Domain Registration" },
    { name: ".org.in domain", description: "Non-profit Indian domain extension.", parentName: "Domain Registration" },
    { name: ".pro domain", description: "TLD for certified professionals.", parentName: "Domain Registration" },
    { name: ".systems domain", description: "Domain for IT, systems, and engineering.", parentName: "Domain Registration" },
    { name: ".us domain", description: "Official country-code TLD for United States.", parentName: "Domain Registration" },

    // Children: Web Hosting
    { name: "5GB-LINUX-2023", description: "Linux Shared Hosting 5GB Storage Plan (2023 edition).", parentName: "Web Hosting" },
    { name: "Dedicated Server - LInux -  1 Month", description: "Dedicated Linux Server Hosting - Monthly Subscription.", parentName: "Web Hosting" },
    { name: "OCS - 100 MB HOSTING", description: "OCS Starter hosting plan with 100 MB disk space.", parentName: "Web Hosting" },
    { name: "OCS - 10000 MB HOSTING", description: "OCS Professional hosting plan with 10,000 MB disk space.", parentName: "Web Hosting" },
    { name: "OCS - 1250 MB HOSTING", description: "OCS Intermediate hosting plan with 1250 MB disk space.", parentName: "Web Hosting" },
    { name: "OCS - 200 MB HOSTING", description: "OCS Basic hosting plan with 200 MB disk space.", parentName: "Web Hosting" },
    { name: "OCS - 2500 MB HOSTING", description: "OCS Advanced hosting plan with 2500 MB disk space.", parentName: "Web Hosting" },
    { name: "OCS - 500 MB HOSTING", description: "OCS hosting plan with 500 MB disk space.", parentName: "Web Hosting" },
    { name: "OCS - 5000 MB HOSTING", description: "OCS Business hosting plan with 5000 MB disk space.", parentName: "Web Hosting" },
    { name: "OCS - 750 MB HOSTING", description: "OCS hosting plan with 750 MB disk space.", parentName: "Web Hosting" },
    { name: "SDH - 5GB - LINUX", description: "Super Shared Linux Hosting 5GB storage space.", parentName: "Web Hosting" },
    { name: "SDH-100GB-LINUX-2014", description: "Shared Linux Hosting 100GB storage space (Legacy 2014).", parentName: "Web Hosting" },
    { name: "SDH-100GB-WINDOWS", description: "Shared Windows Hosting 100GB storage space plan.", parentName: "Web Hosting" },
    { name: "SDH-10GB-LINUX-2014", description: "Shared Linux Hosting 10GB storage space plan (Legacy 2014).", parentName: "Web Hosting" },
    { name: "SDH-10GB-LINUX-2018", description: "Shared Linux Hosting 10GB storage space plan (2018 edition).", parentName: "Web Hosting" },
    { name: "SDH-10GB-WINDOWS", description: "Shared Windows Hosting 10GB storage space plan.", parentName: "Web Hosting" },
    { name: "SDH-20GB-LINUX-2016", description: "Shared Linux Hosting 20GB storage space plan (Legacy 2016).", parentName: "Web Hosting" },
    { name: "Unlimited Linux Hosting", description: "Unlimited Linux Web Hosting plan with unmetered storage.", parentName: "Web Hosting" },
    { name: "Unlimited Windows Hosting", description: "Unlimited Windows Web Hosting plan with unmetered storage.", parentName: "Web Hosting" },

    // Children: Google Workspace (GWS)
    { name: "Google Vault  - PUPM", description: "Google Vault addition - Per User Per Month.", parentName: "Google Workspace (GWS)" },
    { name: "Google Workspace Business Plus  - Annual Plan Monthly Commit - India - PUPY", description: "GWS Business Plus - Annual/Monthly Commit, India - Per User Per Year.", parentName: "Google Workspace (GWS)" },
    { name: "Google Workspace Business Plus - Annual Plan - India - PUPY", description: "GWS Business Plus - Annual Commitment, India - Per User Per Year.", parentName: "Google Workspace (GWS)" },
    { name: "Google Workspace Business Plus - Flexible Plan - India - PUPM", description: "GWS Business Plus - Flexible Monthly Plan, India - Per User Per Month.", parentName: "Google Workspace (GWS)" },
    { name: "Google Workspace Business Standard - Annual Plan - India - PUPY", description: "GWS Business Standard - Annual Commitment, India - Per User Per Year.", parentName: "Google Workspace (GWS)" },
    { name: "Google Workspace Business Standard - Annual Plan Monthly Commit - India - PUPY", description: "GWS Business Standard - Annual/Monthly Commit, India - Per User Per Year.", parentName: "Google Workspace (GWS)" },
    { name: "Google Workspace Business Standard - Flexible Plan - India - PUPM", description: "GWS Business Standard - Flexible Monthly Plan, India - Per User Per Month.", parentName: "Google Workspace (GWS)" },
    { name: "Google Workspace Business Starter - Annual Plan - India - PUPY", description: "GWS Business Starter - Annual Commitment, India - Per User Per Year.", parentName: "Google Workspace (GWS)" },
    { name: "Google Workspace Business Starter - Annual Plan Monthly Commit - India - PUPY", description: "GWS Business Starter - Annual/Monthly Commit, India - Per User Per Year.", parentName: "Google Workspace (GWS)" },
    { name: "Google Workspace Business Starter - Flexible Plan - India - PUPM", description: "GWS Business Starter - Flexible Monthly Plan, India - Per User Per Month.", parentName: "Google Workspace (GWS)" },
    { name: "Google Workspace Enterprise Plus - Annual Plan - India - PUPY", description: "GWS Enterprise Plus - Annual Commitment, India - Per User Per Year.", parentName: "Google Workspace (GWS)" },
    { name: "Google Workspace Enterprise Plus - Annual Plan Monthly Commit - India - PUPM", description: "GWS Enterprise Plus - Annual/Monthly Commit, India - Per User Per Month.", parentName: "Google Workspace (GWS)" },
    { name: "Google Workspace Enterprise Plus - Flexible Plan - India - PUPM", description: "GWS Enterprise Plus - Flexible Monthly Plan, India - Per User Per Month.", parentName: "Google Workspace (GWS)" },
    { name: "Google Workspace Enterprise Standard - Annual Plan - India - PUPY", description: "GWS Enterprise Standard - Annual Commitment, India - Per User Per Year.", parentName: "Google Workspace (GWS)" },
    { name: "Google Workspace Enterprise Standard - Annual Plan Monthly Commit - India - PUPY", description: "GWS Enterprise Standard - Annual/Monthly Commit, India - Per User Per Year.", parentName: "Google Workspace (GWS)" },
    { name: "Google Workspace Enterprise Standard - Flexible Plan - India - PUPM", description: "GWS Enterprise Standard - Flexible Monthly Plan, India - Per User Per Month.", parentName: "Google Workspace (GWS)" },
    { name: "GWS - 1 TB Additional Storage - 1 Month", description: "GWS Extra Storage 1 TB - Monthly Plan.", parentName: "Google Workspace (GWS)" },
    { name: "GWS - 10 TB Additional Storage - 1 Month", description: "GWS Extra Storage 10 TB - Monthly Plan.", parentName: "Google Workspace (GWS)" },
    { name: "GWS - 100 GB Additional Storage - 1 Month", description: "GWS Extra Storage 100 GB - Monthly Plan.", parentName: "Google Workspace (GWS)" },

    // Children: Microsoft 365
    { name: "Microsoft 365 for Business - Apps for Business - PUPY", description: "Office 365 apps subscription - Per User Per Year.", parentName: "Microsoft 365" },
    { name: "Microsoft 365 for Business - Business Basic -  PUPY", description: "M365 Business Basic subscription - Per User Per Year.", parentName: "Microsoft 365" },
    { name: "Microsoft 365 for Business - Business Premium - PUPY", description: "M365 Business Premium subscription - Per User Per Year.", parentName: "Microsoft 365" },
    { name: "Microsoft 365 for Business - Business Standard - PUPY", description: "M365 Business Standard subscription - Per User Per Year.", parentName: "Microsoft 365" },
    { name: "Microsoft Team Essentials - PUPY", description: "Microsoft Teams Essentials - Per User Per Year.", parentName: "Microsoft 365" },
    { name: "MS 365 Business Basic (No Teams) - PUPY", description: "M365 Business Basic (excluding Teams) - Per User Per Year.", parentName: "Microsoft 365" },

    // Children: SSL Certificates
    { name: "COMMODO SSL -1 YEAR", description: "Commodo Standard SSL Certificate - 1 Year.", parentName: "SSL Certificates" },
    { name: "POSITIVE SSL -1 YEAR", description: "PositiveSSL Certificate - 1 Year Validity.", parentName: "SSL Certificates" },
    { name: "POSITIVE SSL WILDCARD -1 YEAR", description: "PositiveSSL Wildcard Certificate (Unlimited Subdomains) - 1 Year.", parentName: "SSL Certificates" },

    // Children: General Services
    { name: "Business Email - Annual Subscription", description: "OCS Professional Business Email - Annual.", parentName: "General Services" },
    { name: "Business Email - Monthly Subscription", description: "OCS Professional Business Email - Monthly.", parentName: "General Services" },
    { name: "DNS Charges", description: "Domain Name System setup, mapping, and routing fees.", parentName: "General Services" },
    { name: "domain forwarding", description: "Domain redirect / forwarding service.", parentName: "General Services" },
    { name: "Domain Privacy Protection", description: "WHOIS contact data masking protection.", parentName: "General Services" },
    { name: "Sitelock Professional  (100 Pages) - 1 Year", description: "Sitelock Professional website malware protection (up to 100 pages) - 1 Year.", parentName: "General Services" },
    { name: "sub domain", description: "Sub-domain mapping and configuration queries.", parentName: "General Services" },
    { name: "General Inquiry", description: "Any general questions not covered by other categories.", parentName: "General Services" }
  ];

  console.log("🌱  Seeding default categories...");

  // First seed parent categories (those with parentName: null)
  const parents = categoriesToSeed.filter(c => c.parentName === null);
  const parentMap = new Map<string, string>(); // name -> id

  for (const parent of parents) {
    const slug = slugify(parent.name);
    const dbCat = await prisma.category.upsert({
      where: { name: parent.name },
      update: { description: parent.description, slug },
      create: { name: parent.name, description: parent.description, slug, isActive: true }
    });
    parentMap.set(parent.name, dbCat.id);
  }

  // Now seed child categories (those with parentName: string)
  const children = categoriesToSeed.filter(c => c.parentName !== null);
  for (const child of children) {
    const parentId = parentMap.get(child.parentName!);
    if (!parentId) continue;
    const slug = slugify(child.name);
    await prisma.category.upsert({
      where: { name: child.name },
      update: { description: child.description, slug, parentId },
      create: { name: child.name, description: child.description, slug, parentId, isActive: true }
    });
  }

  console.log(`✅  Seeded ${categoriesToSeed.length} default categories successfully!`);
}
