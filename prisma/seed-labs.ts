import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const STAGES = ["initiation", "multiplication", "rooting", "acclimation", "hardening"] as const;
const HEALTH = ["healthy", "healthy", "healthy", "healthy", "healthy", "healthy", "healthy", "stable", "stable", "slow_growth", "critical"] as const;

function randomDate(daysBack: number): Date {
  return new Date(Date.now() - Math.random() * daysBack * 86400000);
}
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface LabConfig {
  name: string;
  slug: string;
  email: string;
  contactName: string;
  address: string;
  siteName: string;
  cultivars: { name: string; code: string; species: string; strain: string }[];
  locations: { name: string; type: string; capacity: number }[];
  mediaRecipes: { name: string; baseMedia: string; targetPH: number; agar: number; sucrose: number; stage: string }[];
  vesselCount: number;
}

const LABS: LabConfig[] = [
  // ── Oglesby Plants International ──
  {
    name: "Oglesby Plants International",
    slug: "oglesby",
    email: "demo@oglesby.vitros.app",
    contactName: "Gary Hennen",
    address: "15855 NW CR 12, Altha, FL 32421",
    siteName: "Altha Main Facility",
    cultivars: [
      { name: "Spathiphyllum Sensation", code: "SPA-SEN", species: "Spathiphyllum", strain: "Sensation" },
      { name: "Spathiphyllum Sweet Pablo", code: "SPA-SWP", species: "Spathiphyllum", strain: "Sweet Pablo" },
      { name: "Spathiphyllum Emerald Star", code: "SPA-EMS", species: "Spathiphyllum", strain: "Emerald Star" },
      { name: "Mandevilla Flaming Red", code: "MAN-FLR", species: "Mandevilla", strain: "Tropical Breeze Flaming Red" },
      { name: "Mandevilla Bride's Cascade", code: "MAN-BRC", species: "Mandevilla", strain: "Bride's Cascade" },
      { name: "Anthurium Tickled Pink", code: "ANT-TKP", species: "Anthurium", strain: "Tickled Pink" },
      { name: "Anthurium Pizzazz", code: "ANT-PIZ", species: "Anthurium", strain: "Pizzazz" },
      { name: "Schefflera Amate", code: "SCH-AMA", species: "Schefflera actinophylla", strain: "Amate" },
      { name: "Philodendron Rojo Congo", code: "PHI-ROJ", species: "Philodendron", strain: "Rojo Congo" },
      { name: "Syngonium Glo-Go", code: "SYN-GLO", species: "Syngonium podophyllum", strain: "Glo-Go" },
      { name: "Nephrolepis Macho Fern", code: "NEP-MAC", species: "Nephrolepis biserrata", strain: "Macho" },
      { name: "Calathea Freddie", code: "CAL-FRE", species: "Goeppertia concinna", strain: "Freddie" },
    ],
    locations: [
      { name: "TC Lab 1 — Flow Hood A", type: "flow_hood", capacity: 300 },
      { name: "TC Lab 1 — Flow Hood B", type: "flow_hood", capacity: 300 },
      { name: "TC Lab 2 — Flow Hood C", type: "flow_hood", capacity: 250 },
      { name: "TC Lab 2 — Flow Hood D", type: "flow_hood", capacity: 250 },
      { name: "Growth Chamber North", type: "growth_chamber", capacity: 800 },
      { name: "Growth Chamber South", type: "growth_chamber", capacity: 800 },
      { name: "Growth Chamber East", type: "growth_chamber", capacity: 600 },
      { name: "Greenhouse Bay A", type: "greenhouse", capacity: 2000 },
      { name: "Greenhouse Bay B", type: "greenhouse", capacity: 2000 },
      { name: "Greenhouse Bay C", type: "greenhouse", capacity: 1500 },
      { name: "Hardening House 1", type: "bench", capacity: 600 },
      { name: "Hardening House 2", type: "bench", capacity: 600 },
      { name: "Cold Storage Unit", type: "cold_storage", capacity: 400 },
    ],
    mediaRecipes: [
      { name: "MS + 2mg/L BAP (Spath)", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 30.0, stage: "multiplication" },
      { name: "MS + 1mg/L TDZ (Anthurium)", baseMedia: "MS", targetPH: 5.8, agar: 7.5, sucrose: 25.0, stage: "multiplication" },
      { name: "MS + 0.5mg/L NAA Rooting", baseMedia: "MS", targetPH: 5.8, agar: 7.0, sucrose: 30.0, stage: "rooting" },
      { name: "MS Initiation Standard", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 30.0, stage: "initiation" },
      { name: "B5 Tropical Foliage", baseMedia: "B5", targetPH: 5.7, agar: 8.0, sucrose: 30.0, stage: "multiplication" },
    ],
    vesselCount: 600,
  },

  // ── AgriStarts ──
  {
    name: "AgriStarts",
    slug: "agristarts",
    email: "demo@agristarts.vitros.app",
    contactName: "Randy Strode",
    address: "1728 Kelly Park Rd, Apopka, FL 32712",
    siteName: "Apopka Propagation Center",
    cultivars: [
      { name: "Alocasia Dragon Scale", code: "ALO-DRS", species: "Alocasia baginda", strain: "Dragon Scale" },
      { name: "Alocasia Polly", code: "ALO-POL", species: "Alocasia amazonica", strain: "Polly" },
      { name: "Alocasia Black Velvet", code: "ALO-BLV", species: "Alocasia reginula", strain: "Black Velvet" },
      { name: "Alocasia Frydek", code: "ALO-FRY", species: "Alocasia micholitziana", strain: "Frydek" },
      { name: "Alocasia Stingray", code: "ALO-STR", species: "Alocasia macrorrhiza", strain: "Stingray" },
      { name: "Anthurium King", code: "ANT-KNG", species: "Anthurium veitchii", strain: "King" },
      { name: "Anthurium Big Red Bird", code: "ANT-BRB", species: "Anthurium", strain: "Big Red Bird" },
      { name: "Syngonium Pink Allusion", code: "SYN-PKA", species: "Syngonium podophyllum", strain: "Pink Allusion" },
      { name: "Syngonium Neon Robusta", code: "SYN-NRO", species: "Syngonium podophyllum", strain: "Neon Robusta" },
      { name: "Spathiphyllum Mojo", code: "SPA-MOJ", species: "Spathiphyllum", strain: "Mojo" },
      { name: "Colocasia Black Magic", code: "COL-BLM", species: "Colocasia esculenta", strain: "Black Magic" },
      { name: "Homalomena Emerald Gem", code: "HOM-EMG", species: "Homalomena", strain: "Emerald Gem" },
    ],
    locations: [
      { name: "Lab A — Flow Hood 1", type: "flow_hood", capacity: 250 },
      { name: "Lab A — Flow Hood 2", type: "flow_hood", capacity: 250 },
      { name: "Lab B — Flow Hood 3", type: "flow_hood", capacity: 200 },
      { name: "Lab B — Flow Hood 4", type: "flow_hood", capacity: 200 },
      { name: "Growth Room Alpha", type: "growth_chamber", capacity: 600 },
      { name: "Growth Room Beta", type: "growth_chamber", capacity: 600 },
      { name: "Growth Room Gamma", type: "growth_chamber", capacity: 400 },
      { name: "Greenhouse A — Tropicals", type: "greenhouse", capacity: 1500 },
      { name: "Greenhouse B — Aroids", type: "greenhouse", capacity: 1500 },
      { name: "Hardening Bench Section A", type: "bench", capacity: 500 },
      { name: "Hardening Bench Section B", type: "bench", capacity: 500 },
      { name: "Cold Storage", type: "cold_storage", capacity: 300 },
    ],
    mediaRecipes: [
      { name: "MS + 1mg/L BAP (Aroid)", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 30.0, stage: "multiplication" },
      { name: "MS + 2mg/L BAP (Alocasia)", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 25.0, stage: "multiplication" },
      { name: "MS + 0.5mg/L IBA Rooting", baseMedia: "MS", targetPH: 5.8, agar: 7.0, sucrose: 30.0, stage: "rooting" },
      { name: "MS Initiation + Antifungal", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 30.0, stage: "initiation" },
      { name: "B5 Colocasia Special", baseMedia: "B5", targetPH: 5.6, agar: 7.5, sucrose: 25.0, stage: "multiplication" },
    ],
    vesselCount: 550,
  },

  // ── AG3 Inc ──
  {
    name: "AG3 Inc",
    slug: "ag3",
    email: "demo@ag3.vitros.app",
    contactName: "Belynda Rinck",
    address: "9410 CR 44A, Eustis, FL 32736",
    siteName: "Eustis Main Lab",
    cultivars: [
      { name: "Dionaea King Henry", code: "DIO-KNH", species: "Dionaea muscipula", strain: "King Henry" },
      { name: "Dionaea Akai Ryu", code: "DIO-AKR", species: "Dionaea muscipula", strain: "Akai Ryu" },
      { name: "Dionaea Cup Trap", code: "DIO-CUP", species: "Dionaea muscipula", strain: "Cup Trap" },
      { name: "Dionaea Dente", code: "DIO-DEN", species: "Dionaea muscipula", strain: "Dente" },
      { name: "Sarracenia Scarlet Belle", code: "SAR-SCB", species: "Sarracenia", strain: "Scarlet Belle" },
      { name: "Sarracenia Bug Bat", code: "SAR-BUG", species: "Sarracenia", strain: "Bug Bat" },
      { name: "Sarracenia Fat Chance", code: "SAR-FAT", species: "Sarracenia", strain: "Fat Chance" },
      { name: "Drosera Fraser Island", code: "DRO-FRA", species: "Drosera spathulata", strain: "Fraser Island Form" },
      { name: "Begonia Escargot", code: "BEG-ESC", species: "Begonia rex", strain: "Escargot" },
      { name: "Begonia Autumn Embers", code: "BEG-AUT", species: "Begonia", strain: "Autumn Embers" },
      { name: "Agapanthus Blue Yonder", code: "AGA-BLY", species: "Agapanthus", strain: "Blue Yonder" },
      { name: "Agapanthus Storm Cloud", code: "AGA-STC", species: "Agapanthus", strain: "Storm Cloud" },
    ],
    locations: [
      { name: "Lab 1 — Flow Hood A", type: "flow_hood", capacity: 200 },
      { name: "Lab 1 — Flow Hood B", type: "flow_hood", capacity: 200 },
      { name: "Lab 2 — Carnivorous", type: "flow_hood", capacity: 150 },
      { name: "Growth Chamber 1", type: "growth_chamber", capacity: 400 },
      { name: "Growth Chamber 2", type: "growth_chamber", capacity: 400 },
      { name: "Greenhouse — Sarracenia", type: "greenhouse", capacity: 800 },
      { name: "Greenhouse — General", type: "greenhouse", capacity: 600 },
      { name: "Hardening Bench A", type: "bench", capacity: 300 },
      { name: "Hardening Bench B", type: "bench", capacity: 300 },
      { name: "Bog Garden Acclimation", type: "bench", capacity: 200 },
      { name: "Cold Storage", type: "cold_storage", capacity: 200 },
    ],
    mediaRecipes: [
      { name: "½MS Carnivorous Standard", baseMedia: "MS", targetPH: 5.0, agar: 7.0, sucrose: 10.0, stage: "multiplication" },
      { name: "½MS + 1mg/L BAP (Dionaea)", baseMedia: "MS", targetPH: 5.0, agar: 7.0, sucrose: 10.0, stage: "multiplication" },
      { name: "MS Initiation (Begonia)", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 30.0, stage: "initiation" },
      { name: "MS + 0.5mg/L NAA Rooting", baseMedia: "MS", targetPH: 5.5, agar: 7.0, sucrose: 20.0, stage: "rooting" },
      { name: "Sarracenia Peat Medium", baseMedia: "MS", targetPH: 4.5, agar: 6.0, sucrose: 5.0, stage: "multiplication" },
    ],
    vesselCount: 400,
  },

  // ── Terra Nova Nurseries ──
  {
    name: "Terra Nova Nurseries",
    slug: "terranova",
    email: "demo@terranova.vitros.app",
    contactName: "Dan Heims",
    address: "10051 S Macksburg Rd, Canby, OR 97013",
    siteName: "Canby Breeding Facility",
    cultivars: [
      { name: "Heuchera Berry Smoothie", code: "HEU-BSM", species: "Heuchera", strain: "Berry Smoothie" },
      { name: "Heuchera Caramel", code: "HEU-CAR", species: "Heuchera", strain: "Caramel" },
      { name: "Heuchera Obsidian", code: "HEU-OBS", species: "Heuchera", strain: "Obsidian" },
      { name: "Heuchera Lime Rickey", code: "HEU-LMR", species: "Heuchera", strain: "Lime Rickey" },
      { name: "Heuchera Georgia Peach", code: "HEU-GAP", species: "Heuchera", strain: "Georgia Peach" },
      { name: "Heuchera Fire Alarm", code: "HEU-FAL", species: "Heuchera", strain: "Fire Alarm" },
      { name: "Echinacea KISMET Raspberry", code: "ECH-KMR", species: "Echinacea", strain: "KISMET Raspberry" },
      { name: "Echinacea Leilani", code: "ECH-LEI", species: "Echinacea", strain: "Leilani" },
      { name: "Coleus Electric Slide", code: "COL-ELS", species: "Coleus scutellarioides", strain: "Electric Slide" },
      { name: "Heucherella Sweet Tea", code: "HXA-SWT", species: "Heucherella", strain: "Sweet Tea" },
      { name: "Tiarella Pink Skyrocket", code: "TIA-PSR", species: "Tiarella", strain: "Pink Skyrocket" },
      { name: "Sedum Dark Magic", code: "SED-DKM", species: "Sedum", strain: "Dark Magic" },
    ],
    locations: [
      { name: "TC Lab — Flow Hood 1", type: "flow_hood", capacity: 250 },
      { name: "TC Lab — Flow Hood 2", type: "flow_hood", capacity: 250 },
      { name: "TC Lab — Flow Hood 3", type: "flow_hood", capacity: 200 },
      { name: "Growth Chamber A", type: "growth_chamber", capacity: 500 },
      { name: "Growth Chamber B", type: "growth_chamber", capacity: 500 },
      { name: "Growth Chamber C (Heuchera)", type: "growth_chamber", capacity: 400 },
      { name: "Trial Greenhouse", type: "greenhouse", capacity: 1200 },
      { name: "Production Greenhouse", type: "greenhouse", capacity: 1500 },
      { name: "Hardening Bay A", type: "bench", capacity: 500 },
      { name: "Hardening Bay B", type: "bench", capacity: 500 },
      { name: "Cold Vernalization Chamber", type: "cold_storage", capacity: 300 },
    ],
    mediaRecipes: [
      { name: "MS + 1mg/L BAP (Heuchera)", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 30.0, stage: "multiplication" },
      { name: "MS + 0.5mg/L TDZ (Echinacea)", baseMedia: "MS", targetPH: 5.8, agar: 7.5, sucrose: 25.0, stage: "multiplication" },
      { name: "MS Initiation Standard", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 30.0, stage: "initiation" },
      { name: "MS + 0.5mg/L IBA Rooting", baseMedia: "MS", targetPH: 5.8, agar: 7.0, sucrose: 30.0, stage: "rooting" },
      { name: "WPM Perennial Standard", baseMedia: "WPM", targetPH: 5.5, agar: 7.5, sucrose: 20.0, stage: "multiplication" },
    ],
    vesselCount: 500,
  },

  // ── Conception Nurseries ──
  {
    name: "Conception Nurseries",
    slug: "conception",
    email: "demo@conception.vitros.app",
    contactName: "Kevin Brooks",
    address: "2424 Glendale Ln, Sacramento, CA 95825",
    siteName: "Sacramento Propagation Facility",
    cultivars: [
      { name: "Wedding Cake", code: "CAN-WDC", species: "Cannabis sativa", strain: "Wedding Cake" },
      { name: "Gelato #41", code: "CAN-G41", species: "Cannabis sativa", strain: "Gelato #41" },
      { name: "GMO Cookies", code: "CAN-GMO", species: "Cannabis indica", strain: "GMO Cookies" },
      { name: "Zkittlez", code: "CAN-ZKT", species: "Cannabis indica", strain: "Zkittlez" },
      { name: "Blue Dream", code: "CAN-BLD", species: "Cannabis sativa", strain: "Blue Dream" },
      { name: "OG Kush", code: "CAN-OGK", species: "Cannabis indica", strain: "OG Kush" },
      { name: "Girl Scout Cookies", code: "CAN-GSC", species: "Cannabis hybrid", strain: "Girl Scout Cookies" },
      { name: "Runtz", code: "CAN-RNZ", species: "Cannabis hybrid", strain: "Runtz" },
      { name: "Ice Cream Cake", code: "CAN-ICC", species: "Cannabis hybrid", strain: "Ice Cream Cake" },
      { name: "Purple Punch", code: "CAN-PPH", species: "Cannabis indica", strain: "Purple Punch" },
      { name: "Mimosa", code: "CAN-MIM", species: "Cannabis sativa", strain: "Mimosa" },
      { name: "MAC (Miracle Alien Cookies)", code: "CAN-MAC", species: "Cannabis hybrid", strain: "MAC" },
    ],
    locations: [
      { name: "TC Lab — Flow Hood 1", type: "flow_hood", capacity: 300 },
      { name: "TC Lab — Flow Hood 2", type: "flow_hood", capacity: 300 },
      { name: "TC Lab — Flow Hood 3", type: "flow_hood", capacity: 250 },
      { name: "TC Lab — Flow Hood 4", type: "flow_hood", capacity: 250 },
      { name: "Growth Chamber A", type: "growth_chamber", capacity: 600 },
      { name: "Growth Chamber B", type: "growth_chamber", capacity: 600 },
      { name: "Growth Chamber C", type: "growth_chamber", capacity: 400 },
      { name: "Mother Room", type: "growth_chamber", capacity: 200 },
      { name: "Rooting Chamber", type: "growth_chamber", capacity: 500 },
      { name: "Hardening Greenhouse A", type: "greenhouse", capacity: 1500 },
      { name: "Hardening Greenhouse B", type: "greenhouse", capacity: 1500 },
      { name: "Acclimation Bench Section", type: "bench", capacity: 400 },
      { name: "Cold Storage", type: "cold_storage", capacity: 300 },
    ],
    mediaRecipes: [
      { name: "MS + 1mg/L BAP (Cannabis Mult)", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 30.0, stage: "multiplication" },
      { name: "MS + 0.5mg/L TDZ (High Mult)", baseMedia: "MS", targetPH: 5.8, agar: 7.5, sucrose: 25.0, stage: "multiplication" },
      { name: "MS + 0.5mg/L IBA Rooting", baseMedia: "MS", targetPH: 5.8, agar: 7.0, sucrose: 30.0, stage: "rooting" },
      { name: "MS Initiation + PPM", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 30.0, stage: "initiation" },
      { name: "MS Meristem Isolation", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 20.0, stage: "initiation" },
    ],
    vesselCount: 500,
  },

  // ── Rancho Tissue Technologies ──
  {
    name: "Rancho Tissue Technologies",
    slug: "rancho",
    email: "demo@rancho.vitros.app",
    contactName: "Heather May",
    address: "18539 Aliso Canyon Rd, Rancho Santa Fe, CA 92067",
    siteName: "Rancho Santa Fe Lab",
    cultivars: [
      { name: "Agave Boutin Blue", code: "AGV-BTB", species: "Agave attenuata", strain: "Boutin Blue" },
      { name: "Agave Dragon Toes", code: "AGV-DRT", species: "Agave pygmae", strain: "Dragon Toes" },
      { name: "Agave Globe", code: "AGV-GLB", species: "Agave parrasana", strain: "Globe" },
      { name: "Agave Blue Flame", code: "AGV-BLF", species: "Agave hybrid", strain: "Blue Flame" },
      { name: "Agave Black and Blue", code: "AGV-BAB", species: "Agave titanota", strain: "Black and Blue" },
      { name: "Echeveria Lipstick", code: "ECH-LPS", species: "Echeveria agavoides", strain: "Lipstick" },
      { name: "Echeveria Ebony", code: "ECH-EBN", species: "Echeveria agavoides", strain: "Ebony" },
      { name: "Echeveria Raindrops", code: "ECH-RND", species: "Echeveria", strain: "Raindrops" },
      { name: "Anigozanthos Big Red", code: "ANZ-BGR", species: "Anigozanthos", strain: "Big Red" },
      { name: "Anigozanthos Orange Cross", code: "ANZ-ORC", species: "Anigozanthos", strain: "Orange Cross" },
      { name: "Anigozanthos Landscape Lilac", code: "ANZ-LLL", species: "Anigozanthos", strain: "Landscape Lilac" },
      { name: "Aloe Piranha", code: "ALO-PIR", species: "Aloe", strain: "Piranha" },
    ],
    locations: [
      { name: "TC Lab — Flow Hood 1", type: "flow_hood", capacity: 200 },
      { name: "TC Lab — Flow Hood 2", type: "flow_hood", capacity: 200 },
      { name: "TC Lab — Flow Hood 3", type: "flow_hood", capacity: 150 },
      { name: "Growth Chamber 1", type: "growth_chamber", capacity: 500 },
      { name: "Growth Chamber 2", type: "growth_chamber", capacity: 500 },
      { name: "Succulent Greenhouse A", type: "greenhouse", capacity: 1200 },
      { name: "Succulent Greenhouse B", type: "greenhouse", capacity: 1200 },
      { name: "Kangaroo Paw House", type: "greenhouse", capacity: 800 },
      { name: "Hardening Shade Structure A", type: "bench", capacity: 400 },
      { name: "Hardening Shade Structure B", type: "bench", capacity: 400 },
      { name: "Cold Storage", type: "cold_storage", capacity: 200 },
    ],
    mediaRecipes: [
      { name: "MS + 1mg/L BAP (Agave)", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 30.0, stage: "multiplication" },
      { name: "MS + 2mg/L BAP (Echeveria)", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 25.0, stage: "multiplication" },
      { name: "MS + 0.5mg/L NAA Succulent Root", baseMedia: "MS", targetPH: 5.8, agar: 7.0, sucrose: 30.0, stage: "rooting" },
      { name: "MS Initiation + PPM", baseMedia: "MS", targetPH: 5.7, agar: 8.0, sucrose: 30.0, stage: "initiation" },
      { name: "LS Anigozanthos Special", baseMedia: "LS", targetPH: 5.6, agar: 7.5, sucrose: 20.0, stage: "multiplication" },
    ],
    vesselCount: 450,
  },
];

async function seedLab(lab: LabConfig) {
  console.log(`\n🌱 Creating ${lab.name}...`);

  // Check if org already exists
  const existing = await prisma.organization.findUnique({ where: { slug: lab.slug } });
  if (existing) {
    console.log(`  Deleting existing ${lab.slug} org...`);
    await prisma.activity.deleteMany({ where: { vessel: { organizationId: existing.id } } });
    await prisma.vessel.deleteMany({ where: { organizationId: existing.id } });
    await prisma.mediaBatch.deleteMany({ where: { recipe: { organizationId: existing.id } } });
    await prisma.mediaComponent.deleteMany({ where: { recipe: { organizationId: existing.id } } });
    await prisma.mediaRecipe.deleteMany({ where: { organizationId: existing.id } });
    await prisma.cultivar.deleteMany({ where: { organizationId: existing.id } });
    await prisma.environmentReading.deleteMany({ where: { location: { site: { organizationId: existing.id } } } });
    await prisma.location.deleteMany({ where: { site: { organizationId: existing.id } } });
    await prisma.site.deleteMany({ where: { organizationId: existing.id } });
    await prisma.alert.deleteMany({ where: { organizationId: existing.id } });
    await prisma.session.deleteMany({ where: { user: { organizationId: existing.id } } });
    await prisma.account.deleteMany({ where: { user: { organizationId: existing.id } } });
    await prisma.user.deleteMany({ where: { organizationId: existing.id } });
    await prisma.organization.delete({ where: { id: existing.id } });
  }

  // Create org
  const org = await prisma.organization.create({
    data: { name: lab.name, slug: lab.slug, plan: "pro" },
  });

  // Create users
  const passwordHash = await bcrypt.hash("demo1234", 12);
  const admin = await prisma.user.create({
    data: {
      name: lab.contactName,
      email: lab.email,
      passwordHash,
      role: "admin",
      pin: "0000",
      organizationId: org.id,
    },
  });

  const tech1 = await prisma.user.create({
    data: {
      name: "Lab Technician",
      email: `tech1@${lab.slug}.vitros.app`,
      passwordHash,
      role: "lead_tech",
      pin: "1111",
      organizationId: org.id,
    },
  });

  const tech2 = await prisma.user.create({
    data: {
      name: "Junior Technician",
      email: `tech2@${lab.slug}.vitros.app`,
      passwordHash,
      role: "tech",
      pin: "2222",
      organizationId: org.id,
    },
  });

  const users = [admin, tech1, tech2];
  console.log(`  ✓ Org "${org.name}" with 3 users`);
  console.log(`    Login: ${lab.email} / demo1234`);

  // Create site + locations
  const site = await prisma.site.create({
    data: { name: lab.siteName, address: lab.address, organizationId: org.id },
  });

  const locationIds: string[] = [];
  for (const loc of lab.locations) {
    const created = await prisma.location.create({
      data: { name: loc.name, type: loc.type, capacity: loc.capacity, siteId: site.id },
    });
    locationIds.push(created.id);
  }
  console.log(`  ✓ ${lab.locations.length} locations`);

  // Create media recipes
  const recipeIds: string[] = [];
  for (const recipe of lab.mediaRecipes) {
    const created = await prisma.mediaRecipe.create({
      data: {
        name: recipe.name,
        baseMedia: recipe.baseMedia,
        targetPH: recipe.targetPH,
        agarConcentration: recipe.agar,
        sucroseConcentration: recipe.sucrose,
        stage: recipe.stage,
        organizationId: org.id,
      },
    });
    recipeIds.push(created.id);
  }
  console.log(`  ✓ ${lab.mediaRecipes.length} media recipes`);

  // Create cultivars
  const cultivarIds: string[] = [];
  for (const c of lab.cultivars) {
    const created = await prisma.cultivar.create({
      data: {
        name: c.name,
        code: c.code,
        species: c.species,
        strain: c.strain,
        cultivarType: "in_house",
        targetMultiplicationRate: randomInt(3, 8),
        organizationId: org.id,
      },
    });
    cultivarIds.push(created.id);
  }
  console.log(`  ✓ ${lab.cultivars.length} cultivars`);

  // ── Create Vessels ──
  const prefix = lab.slug.substring(0, 3).toUpperCase();
  let vesselNum = 0;

  // Distribution ratios
  const total = lab.vesselCount;
  const initCount = Math.round(total * 0.06);
  const multiCount = Math.round(total * 0.35);
  const rootCount = Math.round(total * 0.22);
  const acclCount = Math.round(total * 0.18);
  const hardCount = Math.round(total * 0.10);
  const disposedCount = Math.round(total * 0.06);
  const multipliedCount = total - initCount - multiCount - rootCount - acclCount - hardCount - disposedCount;

  const stageDistribution = [
    { stage: "initiation", count: initCount, statusOptions: ["planted", "growing"] },
    { stage: "multiplication", count: multiCount, statusOptions: ["growing", "ready_to_multiply"] },
    { stage: "rooting", count: rootCount, statusOptions: ["growing"] },
    { stage: "acclimation", count: acclCount, statusOptions: ["growing"] },
    { stage: "hardening", count: hardCount, statusOptions: ["growing"] },
  ];

  for (const dist of stageDistribution) {
    for (let i = 0; i < dist.count; i++) {
      vesselNum++;
      const barcode = `${prefix}-${String(vesselNum).padStart(5, "0")}`;
      const cultivarId = pick(cultivarIds);
      const locationId = pick(locationIds);
      const recipeId = pick(recipeIds);
      const health = pick(HEALTH);
      const status = pick(dist.statusOptions as string[]);
      const generation = dist.stage === "initiation" ? 0 : randomInt(1, 6);
      const subcultureNumber = dist.stage === "initiation" ? 0 : randomInt(1, generation + 2);
      const plantedAt = randomDate(90);
      const lastSub = new Date(plantedAt.getTime() + randomInt(7, 30) * 86400000);
      const nextSub = new Date(lastSub.getTime() + 14 * 86400000);

      const isContaminated = Math.random() < 0.04;
      const contaminationType = isContaminated ? pick(["bacterial", "fungal", "viral", "unknown"] as const) : null;
      const contaminationDate = isContaminated ? randomDate(30) : null;
      const finalHealth = isContaminated ? "critical" : health;

      const vessel = await prisma.vessel.create({
        data: {
          barcode,
          cultivarId,
          mediaRecipeId: recipeId,
          locationId,
          explantCount: randomInt(1, 12),
          healthStatus: finalHealth,
          status,
          stage: dist.stage,
          subcultureNumber,
          generation,
          contaminationType,
          contaminationDate,
          plantedAt,
          lastSubcultureDate: dist.stage !== "initiation" ? lastSub : null,
          nextSubcultureDate: dist.stage === "multiplication" ? nextSub : null,
          organizationId: org.id,
        },
      });

      // Activity: created
      await prisma.activity.create({
        data: {
          vesselId: vessel.id,
          userId: pick(users).id,
          type: "created",
          category: "vessel",
          newState: { status: "planted", stage: "initiation" },
          notes: `Vessel ${barcode} initiated`,
          createdAt: plantedAt,
        },
      });

      // Stage advance activities
      const stageIdx = STAGES.indexOf(dist.stage as typeof STAGES[number]);
      if (stageIdx > 0) {
        for (let s = 1; s <= stageIdx; s++) {
          const advDate = new Date(plantedAt.getTime() + s * randomInt(10, 20) * 86400000);
          await prisma.activity.create({
            data: {
              vesselId: vessel.id,
              userId: pick(users).id,
              type: "stage_advanced",
              category: "vessel",
              previousState: { stage: STAGES[s - 1] },
              newState: { stage: STAGES[s] },
              notes: `Advanced from ${STAGES[s - 1]} to ${STAGES[s]}`,
              createdAt: advDate,
            },
          });
        }
      }

      if (isContaminated) {
        await prisma.activity.create({
          data: {
            vesselId: vessel.id,
            userId: pick(users).id,
            type: "contaminated",
            category: "vessel",
            newState: { healthStatus: "critical", contaminationType },
            notes: `${contaminationType} contamination detected`,
            createdAt: contaminationDate!,
          },
        });
      }
    }
  }

  // Disposed vessels
  for (let i = 0; i < disposedCount; i++) {
    vesselNum++;
    const barcode = `${prefix}-${String(vesselNum).padStart(5, "0")}`;
    const plantedAt = randomDate(90);
    const vessel = await prisma.vessel.create({
      data: {
        barcode,
        cultivarId: pick(cultivarIds),
        locationId: pick(locationIds),
        explantCount: randomInt(1, 6),
        healthStatus: "dead",
        status: "disposed",
        stage: pick(["initiation", "multiplication", "rooting"] as const),
        disposalReason: pick(["contaminated", "dead", "end_of_life"] as const),
        contaminationType: Math.random() < 0.6 ? pick(["bacterial", "fungal"] as const) : null,
        contaminationDate: randomDate(60),
        plantedAt,
        organizationId: org.id,
      },
    });

    await prisma.activity.create({
      data: {
        vesselId: vessel.id,
        userId: pick(users).id,
        type: "disposed",
        category: "vessel",
        notes: "Disposed",
        createdAt: randomDate(30),
      },
    });
  }

  // Multiplied vessels
  for (let i = 0; i < multipliedCount; i++) {
    vesselNum++;
    const barcode = `${prefix}-${String(vesselNum).padStart(5, "0")}`;
    const plantedAt = randomDate(60);
    const vessel = await prisma.vessel.create({
      data: {
        barcode,
        cultivarId: pick(cultivarIds),
        locationId: pick(locationIds),
        explantCount: 0,
        healthStatus: "healthy",
        status: "multiplied",
        stage: "multiplication",
        generation: randomInt(1, 4),
        subcultureNumber: randomInt(2, 6),
        plantedAt,
        lastSubcultureDate: randomDate(30),
        organizationId: org.id,
      },
    });

    await prisma.activity.create({
      data: {
        vesselId: vessel.id,
        userId: pick(users).id,
        type: "multiplied",
        category: "vessel",
        previousState: { status: "growing" },
        newState: { status: "multiplied" },
        metadata: { childCount: randomInt(3, 8) },
        notes: "Multiplied into new vessels",
        createdAt: randomDate(30),
      },
    });
  }

  console.log(`  ✓ ${vesselNum} vessels with activity history`);
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  VitrOS — Seeding personalized lab demos");
  console.log("═══════════════════════════════════════════════");

  for (const lab of LABS) {
    await seedLab(lab);
  }

  console.log("\n══════════════════════════════════════════════");
  console.log("✅ All 6 lab demos ready!");
  console.log("══════════════════════════════════════════════");
  console.log("");
  for (const lab of LABS) {
    console.log(`  ${lab.name}`);
    console.log(`    Login: ${lab.email} / demo1234 (PIN: 0000)`);
  }
  console.log("");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
