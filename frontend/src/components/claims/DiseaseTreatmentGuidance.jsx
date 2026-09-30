import React, { useState } from 'react';
import {
  ShieldAlert,
  Sprout,
  CheckCircle2,
  AlertTriangle,
  Info,
  UserCheck,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Activity
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

// Helper to format confidence percentage safely
function formatConfidence(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Number.isNaN(value)) return null;
  if (value < 0) return null;
  if (value <= 1.0) {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (value <= 100.0) {
    return `${value.toFixed(1)}%`;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE TREATMENT GUIDANCE MAP FOR ALL 37 TRAINED MODEL CLASSES
// ─────────────────────────────────────────────────────────────────────────────
const TREATMENT_GUIDANCE_MAP = {
  // CORN (MAIZE)
  Corn_Common_Rust: {
    crop: 'Corn (Maize)',
    disease: 'Common Rust (Puccinia sorghi)',
    isHealthy: false,
    overview: 'Common rust appears as small, reddish-brown pustules on both upper and lower leaf surfaces. It is favored by cool, moist conditions and high relative humidity.',
    immediateActions: [
      'Inspect affected field areas to determine rust pustule coverage on upper leaves.',
      'Remove and destroy heavily infested lower leaves if infection is isolated.',
      'Ensure field drainage is adequate to prevent prolonged canopy moisture.',
      'Monitor weather forecasts for persistent damp or foggy conditions.'
    ],
    prevention: [
      'Plant resistant or tolerant corn hybrids in subsequent growing seasons.',
      'Rotate crops with non-host species like legumes or small grains.',
      'Avoid excessive nitrogen fertilization, which promotes dense canopy growth.',
      'Maintain optimal row spacing to facilitate canopy airflow.'
    ],
    professionalHelp: 'Consult a local agricultural extension officer if rust pustules cover more than 15% of the ear leaf before the tasseling stage.'
  },
  Corn_Gray_Leaf_Spot: {
    crop: 'Corn (Maize)',
    disease: 'Gray Leaf Spot (Cercospora zeae-maydis)',
    isHealthy: false,
    overview: 'Gray leaf spot causes rectangular, tan-to-gray leaf lesions bounded by leaf veins. Severe infections cause premature leaf death and stalk lodging.',
    immediateActions: [
      'Scout lower leaves first, as gray leaf spot moves upwards from crop residue.',
      'Mark infected field zones and monitor lesion spread weekly.',
      'Avoid overhead irrigation during humid weather conditions.'
    ],
    prevention: [
      'Select high-yielding corn hybrids with genetic resistance to Cercospora.',
      'Perform conventional tillage or crop rotation to decompose infected corn residue.',
      'Implement a 2-year crop rotation cycle with soybeans or alfalfa.'
    ],
    professionalHelp: 'Seek agronomist advice if lesions reach the leaves above the ear leaf prior to grain fill.'
  },
  Corn_Healthy: {
    crop: 'Corn (Maize)',
    disease: 'Healthy Specimen (No Disease Detected)',
    isHealthy: true,
    overview: 'The corn foliage displays normal chlorophyll density, leaf architecture, and no visible fungal or bacterial lesions.',
    immediateActions: [
      'Maintain regular irrigation and balanced N-P-K nutrient application schedules.',
      'Continue routine weekly field scouting for early pest or disease signs.',
      'Keep field perimeter clean of weed hosts.'
    ],
    prevention: [
      'Practice crop rotation to preserve soil fertility and break pathogen cycles.',
      'Ensure soil testing is performed prior to the next planting season.'
    ],
    professionalHelp: 'Routine agricultural officer visits are recommended at key growth stages (tasseling and silking).'
  },
  Corn_Northern_Leaf_Blight: {
    crop: 'Corn (Maize)',
    disease: 'Northern Corn Leaf Blight (Exserohilum turcicum)',
    isHealthy: false,
    overview: 'Characterized by large, cigar-shaped, grayish-green to tan lesions on leaves. It can cause significant yield loss if leaves near the ear are blighted early.',
    immediateActions: [
      'Survey the canopy to evaluate lesion density on leaves at and above the ear leaf.',
      'Isolate severely blighted crop debris after harvest to reduce overwintering spores.',
      'Minimize leaf wetness duration by managing irrigation timing.'
    ],
    prevention: [
      'Utilize corn hybrids carrying specific Ht resistance genes.',
      'Rotate fields out of corn for at least one full growing season.',
      'Incorporate crop residue deep into the soil post-harvest.'
    ],
    professionalHelp: 'Consult local agricultural extension agents if blighting occurs before 6 weeks post-silking.'
  },

  // PEPPER
  Pepper_Bacterial_Spot: {
    crop: 'Bell Pepper / Chili',
    disease: 'Bacterial Spot (Xanthomonas spp.)',
    isHealthy: false,
    overview: 'Bacterial spot causes small, water-soaked lesions on leaves and fruit, leading to severe defoliation and sunscald on exposed fruit.',
    immediateActions: [
      'Avoid working in wet fields or handling plants when foliage is damp.',
      'Remove and safely dispose of severely infected foliage or spotted fruit.',
      'Sanitize tools and equipment with 70% alcohol solution between rows.'
    ],
    prevention: [
      'Use certified pathogen-free seeds and disease-resistant pepper transplants.',
      'Implement drip irrigation instead of overhead sprinklers.',
      'Apply a 2-3 year crop rotation away from solanaceous crops (tomatoes, potatoes, peppers).'
    ],
    professionalHelp: 'Consult an agricultural officer for approved copper-based bactericide recommendations if environmental conditions favor bacterial spread.'
  },
  Pepper_Healthy: {
    crop: 'Bell Pepper / Chili',
    disease: 'Healthy Specimen (No Disease Detected)',
    isHealthy: true,
    overview: 'The pepper leaf specimen demonstrates healthy turgor, uniform green coloration, and absence of bacterial or fungal spotting.',
    immediateActions: [
      'Maintain steady soil moisture using drip irrigation.',
      'Apply organic mulch to retain soil moisture and reduce soil splash.',
      'Monitor for sap-sucking insects like aphids or thrips.'
    ],
    prevention: [
      'Maintain balanced calcium fertilization to prevent blossom end rot.',
      'Keep field rows weed-free to eliminate alternate virus vector hosts.'
    ],
    professionalHelp: 'No emergency action needed. Consult local agronomist for routine crop nutrition guidance.'
  },

  // POTATO
  Potato_Early_Blight: {
    crop: 'Potato',
    disease: 'Early Blight (Alternaria solani)',
    isHealthy: false,
    overview: 'Early blight produces dark brown to black spots with characteristic concentric rings ("target board" pattern) on older foliage first.',
    immediateActions: [
      'Remove lower infected leaves showing target-board lesions.',
      'Ensure adequate nitrogen and potassium fertilization to reduce plant stress.',
      'Avoid overhead watering to limit leaf wetness hours.'
    ],
    prevention: [
      'Plant certified disease-free seed tubers.',
      'Maintain a 3-year crop rotation with non-solanaceous crops.',
      'Destroy volunteer potato plants and nightshade weeds near fields.'
    ],
    professionalHelp: 'Contact an agricultural extension agent for spray schedule guidance if wet weather persists during tuber initiation.'
  },
  Potato_Healthy: {
    crop: 'Potato',
    disease: 'Healthy Specimen (No Disease Detected)',
    isHealthy: true,
    overview: 'Potato foliage shows vigorous green leaf growth, robust stems, and no signs of leaf spot or late blight infection.',
    immediateActions: [
      'Continue regular hill cultivation to protect developing tubers from sun exposure.',
      'Monitor soil moisture levels during tuber bulking.',
      'Scout regularly for potato beetles and leafhoppers.'
    ],
    prevention: [
      'Rotate fields annually and maintain good field sanitation.',
      'Store harvested tubers in cool, well-ventilated facilities.'
    ],
    professionalHelp: 'Consult local agricultural officers during tuber initiation for harvest timing guidance.'
  },
  Potato_Late_Blight: {
    crop: 'Potato',
    disease: 'Late Blight (Phytophthora infestans)',
    isHealthy: false,
    overview: 'Late blight is a destructive water-mold disease causing dark, water-soaked leaf lesions with white fungal growth on the undersides during high humidity.',
    immediateActions: [
      'Immediately isolate infected foliage and flag affected field sections.',
      'Avoid movement through damp infected rows to prevent spore transport.',
      'Destroy heavily infected plant patches to protect surrounding crops.'
    ],
    prevention: [
      'Plant certified late blight-resistant potato varieties.',
      'Eliminate cull piles and volunteer potatoes before planting.',
      'Monitor local late blight forecasting warnings and relative humidity alerts.'
    ],
    professionalHelp: 'URGENT: Immediately contact your local agricultural extension service or certified plant pathologist for emergency management guidelines.'
  },

  // RICE
  Rice_Bacterial_Blight: {
    crop: 'Rice',
    disease: 'Bacterial Blight (Xanthomonas oryzae pv. oryzae)',
    isHealthy: false,
    overview: 'Causes yellow to white wavy lesions along leaf margins that turn brown and dry up. Highly damaging during the tillering to heading stages.',
    immediateActions: [
      'Drain waterlogged fields temporarily to reduce bacterial multiplication.',
      'Avoid excessive nitrogen fertilizer application during early disease outbreak.',
      'Keep field channels clean of weed hosts like Leersia hexandra.'
    ],
    prevention: [
      'Grow resistant rice cultivars carrying Xa resistance genes.',
      'Ensure balanced nutrient application with adequate potassium.',
      'Avoid clipping rice seedling tips prior to transplanting.'
    ],
    professionalHelp: 'Consult a rice specialist for field water management and resistant seed selection.'
  },
  Rice_Bacterial_Streak: {
    crop: 'Rice',
    disease: 'Bacterial Leaf Streak (Xanthomonas oryzae pv. oryzicola)',
    isHealthy: false,
    overview: 'Produces narrow, dark, translucent interveinal streaks on leaves with yellow bacterial ooze droplets under moist conditions.',
    immediateActions: [
      'Reduce field water depth to lower canopy humidity.',
      'Avoid nitrogen top-dressing until disease progression halts.',
      'Sanitize farm implements between infected paddies.'
    ],
    prevention: [
      'Use clean, certified seeds treated against bacterial pathogens.',
      'Practice fallow field plowing to decompose infected stubble.'
    ],
    professionalHelp: 'Consult local agricultural extension for leaf streak diagnostic verification.'
  },
  Rice_Bakanae: {
    crop: 'Rice',
    disease: 'Bakanae Disease / Foolish Seedling (Fusarium fujikuroi)',
    isHealthy: false,
    overview: 'Infected plants are abnormally tall, thin, and yellowish with weak tillers, often dying before producing grain.',
    immediateActions: [
      'Uproot and burn tall, elongated "foolish" seedlings from the field.',
      'Do not harvest seeds from infected fields for future planting.'
    ],
    prevention: [
      'Treat seed lots with hot water or approved seed fungicide soak.',
      'Source certified clean seed stock from verified agricultural agencies.'
    ],
    professionalHelp: 'Consult certified seed testing laboratories for seed-borne pathogen screening.'
  },
  Rice_Brown_Spot: {
    crop: 'Rice',
    disease: 'Brown Spot (Bipolaris oryzae)',
    isHealthy: false,
    overview: 'Causes small, oval sesame-shaped brown spots with yellow halos across leaf blades, commonly linked to nutrient-deficient soils.',
    immediateActions: [
      'Test soil for potassium, silicon, or micronutrient deficiencies.',
      'Apply balanced fertilizer top-dressing to boost crop vigor.',
      'Maintain consistent paddy water depth.'
    ],
    prevention: [
      'Improve soil fertility through organic compost and soil amendments.',
      'Use pathogen-tested seeds and treat seeds before sowing.'
    ],
    professionalHelp: 'Consult soil health specialists to address underlying field soil imbalances.'
  },
  Rice_False_Smut: {
    crop: 'Rice',
    disease: 'False Smut (Ustilaginoidea virens)',
    isHealthy: false,
    overview: 'Transforms individual rice grains into velvety orange-to-green smut balls, reducing grain yield and quality.',
    immediateActions: [
      'Avoid late application of high-rate nitrogen fertilizers.',
      'Mark infected paddies to prevent mixing diseased grains during harvest.'
    ],
    prevention: [
      'Plant early-maturing cultivars to avoid late-season rain during flowering.',
      'Deep plow field stubble post-harvest.'
    ],
    professionalHelp: 'Seek advice from agricultural officers on timing preventive treatments at booting stage.'
  },
  Rice_Grassy_Stunt_Virus: {
    crop: 'Rice',
    disease: 'Rice Grassy Stunt Virus (RGSV)',
    isHealthy: false,
    overview: 'Transmitted by brown planthoppers (BPH). Causes severe plant stunting, excessive tillering, and pale green erect leaves.',
    immediateActions: [
      'Scout for brown planthopper vectors at plant bases.',
      'Rogue (remove and destroy) severely stunted viral-infected hills.'
    ],
    prevention: [
      'Plant BPH-resistant rice varieties.',
      'Synchronize planting times across neighboring rice paddies.',
      'Conserve natural planthopper predators like spiders and mirid bugs.'
    ],
    professionalHelp: 'Contact local plant protection officers for insect vector management strategies.'
  },
  Rice_Healthy: {
    crop: 'Rice',
    disease: 'Healthy Specimen (No Disease Detected)',
    isHealthy: true,
    overview: 'Rice tillers display vibrant green foliage, vigorous root systems, and absence of leaf spots or stem rot.',
    immediateActions: [
      'Maintain target water levels for current crop growth stage.',
      'Follow split nitrogen application guidelines.'
    ],
    prevention: [
      'Conduct weekly field monitoring for pest and disease signs.',
      'Maintain weed-free bunds around paddies.'
    ],
    professionalHelp: 'Consult extension officers for routine crop stage advice.'
  },
  Rice_Hispa: {
    crop: 'Rice',
    disease: 'Rice Hispa Damage (Dicladispa armigera)',
    isHealthy: false,
    overview: 'Adult beetles scrape leaf tissue leaving clear parallel white streaks; larvae tunnel between leaf epidermal layers.',
    immediateActions: [
      'Clip leaf tips of seedlings before transplanting to destroy hispa eggs.',
      'Manually collect adult beetles using sweep nets in early mornings.'
    ],
    prevention: [
      'Avoid excessive nitrogen fertilization.',
      'Keep paddy bunds clear of alternate grass weeds.'
    ],
    professionalHelp: 'Consult local plant protection staff for vector threshold levels.'
  },
  Rice_Leaf_Blast: {
    crop: 'Rice',
    disease: 'Rice Blast / Leaf Blast (Magnaporthe oryzae)',
    isHealthy: false,
    overview: 'Produces diamond-shaped or spindle-shaped lesions with gray centers and reddish-brown margins. Highly destructive.',
    immediateActions: [
      'Increase paddy water depth to suppress spore development.',
      'Temporarily suspend nitrogen application until leaf blast stabilizes.'
    ],
    prevention: [
      'Plant blast-resistant rice cultivars.',
      'Avoid high plant density to improve canopy ventilation.',
      'Treat seeds prior to sowing.'
    ],
    professionalHelp: 'URGENT: Consult local rice agronomist if blast lesions spread rapidly during tillering stage.'
  },
  Rice_Leaf_Scald: {
    crop: 'Rice',
    disease: 'Leaf Scald (Microdochium oryzae)',
    isHealthy: false,
    overview: 'Causes zonate, light brown to dark brown scalded bands starting from leaf tips and margins.',
    immediateActions: [
      'Avoid high nitrogen top-dressing during disease activity.',
      'Maintain proper paddy field drainage.'
    ],
    prevention: [
      'Use certified disease-free seed stock.',
      'Rotate with non-cereal crops.'
    ],
    professionalHelp: 'Consult extension staff for seed treatment options.'
  },
  Rice_Leaf_Smut: {
    crop: 'Rice',
    disease: 'Leaf Smut (Entyloma oryzae)',
    isHealthy: false,
    overview: 'Produces small, lead-black rectangular spots on leaves that burst under moisture releasing dark spores.',
    immediateActions: [
      'Remove heavily smudged leaves if confined to localized spots.',
      'Maintain balanced fertilizer ratios.'
    ],
    prevention: [
      'Plow down rice stubble immediately after harvest.',
      'Avoid crop overcrowding.'
    ],
    professionalHelp: 'Consult local agricultural extension officer for diagnostic verification.'
  },
  Rice_Narrow_Brown_Spot: {
    crop: 'Rice',
    disease: 'Narrow Brown Leaf Spot (Cercospora janseana)',
    isHealthy: false,
    overview: 'Causes short, narrow, linear reddish-brown lesions parallel to leaf veins, usually appearing late in the season.',
    immediateActions: [
      'Apply balanced potassium fertilizer to improve tissue resistance.',
      'Avoid water stress during grain filling.'
    ],
    prevention: [
      'Use resistant rice varieties.',
      'Practice field crop rotation.'
    ],
    professionalHelp: 'Consult extension agent if premature leaf drying threatens yield.'
  },
  Rice_Neck_Blast: {
    crop: 'Rice',
    disease: 'Neck Blast / Panicle Blast (Magnaporthe oryzae)',
    isHealthy: false,
    overview: 'Attacks the neck node of the panicle, causing it to rot and turn dark brown, resulting in unfilled "whiteheads".',
    immediateActions: [
      'Maintain flooded paddy conditions to reduce plant stress.',
      'Mark affected fields for early harvest to prevent total panicle breakage.'
    ],
    prevention: [
      'Plant blast-resistant varieties.',
      'Time planting to avoid heading during peak night fog or dew.'
    ],
    professionalHelp: 'URGENT: Contact your local agricultural extension service immediately.'
  },
  Rice_Ragged_Stunt_Virus: {
    crop: 'Rice',
    disease: 'Rice Ragged Stunt Virus (RRSV)',
    isHealthy: false,
    overview: 'Vectored by brown planthoppers. Causes ragged, notched leaves, twisted tips, and vein swelling (galls).',
    immediateActions: [
      'Remove and destroy viral-infected hills.',
      'Monitor brown planthopper population densities.'
    ],
    prevention: [
      'Use vector-resistant cultivars.',
      'Maintain crop-free periods between rice seasons.'
    ],
    professionalHelp: 'Consult local plant protection office for vector control programs.'
  },
  Rice_Sheath_Blight: {
    crop: 'Rice',
    disease: 'Sheath Blight (Rhizoctonia solani)',
    isHealthy: false,
    overview: 'Causes oval, greenish-gray water-soaked spots on leaf sheaths near the waterline, progressing upward.',
    immediateActions: [
      'Drain fields slightly to reduce canopy humidity.',
      'Avoid excess nitrogen fertilization.'
    ],
    prevention: [
      'Optimize planting density to promote aeration.',
      'Remove weed hosts from paddy borders.'
    ],
    professionalHelp: 'Consult agronomist for biological or cultural control recommendations.'
  },
  Rice_Sheath_Rot: {
    crop: 'Rice',
    disease: 'Sheath Rot (Sarocladium oryzae)',
    isHealthy: false,
    overview: 'Causes oblong gray-brown lesions on the boot sheath, preventing complete panicle emergence.',
    immediateActions: [
      'Apply potassium fertilizer to strengthen stem sheaths.',
      'Control stem borers and mites that facilitate fungal entry.'
    ],
    prevention: [
      'Use pathogen-free seeds.',
      'Practice crop sanitation.'
    ],
    professionalHelp: 'Consult local extension officer.'
  },
  Rice_Stem_Rot: {
    crop: 'Rice',
    disease: 'Stem Rot (Sclerotium oryzae)',
    isHealthy: false,
    overview: 'Produces blackish lesions on sheaths near the waterline, causing stem lodging and unfilled panicles.',
    immediateActions: [
      'Drain fields to allow soil surface drying.',
      'Apply potassium fertilizers to reinforce stalk strength.'
    ],
    prevention: [
      'Burn or plow under rice stubble containing sclerotia.',
      'Rotate paddies with upland crops.'
    ],
    professionalHelp: 'Consult agricultural officer for soil drainage guidance.'
  },
  Rice_Tungro: {
    crop: 'Rice',
    disease: 'Rice Tungro Disease (RTBV / RTSV)',
    isHealthy: false,
    overview: 'Vectored by green leafhoppers. Causes distinct yellow-orange leaf discoloration, stunting, and reduced tillering.',
    immediateActions: [
      'Rogue out yellow-orange stunted hills immediately.',
      'Monitor green leafhopper populations on leaves.'
    ],
    prevention: [
      'Plant tungro-resistant varieties.',
      'Practice synchronous community planting.'
    ],
    professionalHelp: 'URGENT: Immediately notify your local agriculture office upon confirming tungro symptoms.'
  },

  // TOMATO
  Tomato_Bacterial_Spot: {
    crop: 'Tomato',
    disease: 'Bacterial Spot (Xanthomonas spp.)',
    isHealthy: false,
    overview: 'Causes small, dark, water-soaked spots on leaves, stems, and fruit. Severe infections lead to extensive defoliation.',
    immediateActions: [
      'Avoid working among plants when leaves are wet.',
      'Remove and destroy spotted fruit and heavily infected foliage.',
      'Disinfect garden tools between plants.'
    ],
    prevention: [
      'Use certified disease-free seeds and transplants.',
      'Implement drip irrigation to keep foliage dry.',
      'Rotate out of solanaceous crops for at least 2 years.'
    ],
    professionalHelp: 'Consult an extension agent for approved bactericide application recommendations.'
  },
  Tomato_Early_Blight: {
    crop: 'Tomato',
    disease: 'Early Blight (Alternaria solani)',
    isHealthy: false,
    overview: 'Produces dark brown spots with concentric target-like rings on older leaves first, surrounded by yellow tissue.',
    immediateActions: [
      'Prune off lower infected leaves near ground level.',
      'Apply organic mulch beneath plants to prevent soil splash.',
      'Avoid overhead sprinkling.'
    ],
    prevention: [
      'Plant early blight-tolerant tomato varieties.',
      'Maintain wide plant spacing for rapid drying.',
      'Rotate crops on a 3-year cycle.'
    ],
    professionalHelp: 'Consult local agricultural office for organic or conventional preventive spray schedules.'
  },
  Tomato_Healthy: {
    crop: 'Tomato',
    disease: 'Healthy Specimen (No Disease Detected)',
    isHealthy: true,
    overview: 'Tomato plant foliage shows dark green compound leaves, stout stems, and no evidence of fungal, bacterial, or viral infection.',
    immediateActions: [
      'Maintain consistent moisture levels to prevent blossom end rot.',
      'Stake or cage plants to keep foliage off the ground.',
      'Prune suckers to encourage good canopy airflow.'
    ],
    prevention: [
      'Rotate planting locations annually.',
      'Apply organic mulch around plant bases.'
    ],
    professionalHelp: 'Consult local agricultural extension for routine tomato nutrition and trellising tips.'
  },
  Tomato_Late_Blight: {
    crop: 'Tomato',
    disease: 'Late Blight (Phytophthora infestans)',
    isHealthy: false,
    overview: 'Rapidly causes large, dark, greasy-looking leaf lesions with white fuzzy growth underneath in cool, humid weather.',
    immediateActions: [
      'Immediately pull and bag infected plants if infection is localized.',
      'Destroy blighted stems and fruit to prevent spore spread.',
      'Avoid overhead watering completely.'
    ],
    prevention: [
      'Plant late blight-resistant tomato varieties.',
      'Avoid planting tomatoes near potatoes.',
      'Monitor regional late blight tracking reports.'
    ],
    professionalHelp: 'URGENT: Immediately contact your agricultural extension provider for emergency control guidance.'
  },
  Tomato_Leaf_Mold: {
    crop: 'Tomato',
    disease: 'Leaf Mold (Passalora fulva)',
    isHealthy: false,
    overview: 'Causes pale green to yellow spots on upper leaf surfaces with velvety olive-green to brown fungal growth underneath.',
    immediateActions: [
      'Increase greenhouse or field ventilation to lower relative humidity below 85%.',
      'Prune lower leaves to enhance airflow.',
      'Water plants at soil level.'
    ],
    prevention: [
      'Grow leaf mold-resistant tomato cultivars.',
      'Ensure adequate spacing between plants.'
    ],
    professionalHelp: 'Consult agricultural officers for greenhouse humidity management advice.'
  },
  Tomato_Mosaic_Virus: {
    crop: 'Tomato',
    disease: 'Tomato Mosaic Virus (ToMV)',
    isHealthy: false,
    overview: 'Causes mottled light and dark green mosaic patterns on leaves, leaf distortion (stringy fern-like leaves), and stunted growth.',
    immediateActions: [
      'Remove and burn infected plants immediately; do not compost.',
      'Wash hands with soap and water after handling infected plants.',
      'Refrain from using tobacco products near tomato plants.'
    ],
    prevention: [
      'Plant viral-resistant tomato varieties (look for "ToMV" tag).',
      'Disinfect tools in a 10% trisodium phosphate (TSP) or bleach solution.'
    ],
    professionalHelp: 'Consult a plant pathologist to confirm viral identity and prevent greenhouse contamination.'
  },
  Tomato_Septoria_Leaf_Spot: {
    crop: 'Tomato',
    disease: 'Septoria Leaf Spot (Septoria lycopersici)',
    isHealthy: false,
    overview: 'Produces numerous tiny, circular spots with dark brown margins and light gray centers containing black specks.',
    immediateActions: [
      'Pick off infected lower leaves as soon as spots appear.',
      'Mulch around plant bases to block soil-borne spores.',
      'Avoid touching wet plants.'
    ],
    prevention: [
      'Rotate tomato crops every 3 years.',
      'Keep garden clean of solanaceous weed hosts.'
    ],
    professionalHelp: 'Consult local agronomist for spray timing during rainy periods.'
  },
  Tomato_Spider_Mites: {
    crop: 'Tomato',
    disease: 'Two-Spotted Spider Mites (Tetranychus urticae)',
    isHealthy: false,
    overview: 'Causes fine yellow stippling on leaf surfaces, silken webbing between stems, and bronzing or drying of leaves.',
    immediateActions: [
      'Spray plant undersides with a strong stream of clean water to knock off mites.',
      'Prune and destroy heavily webbed plant parts.',
      'Keep field area dust-free, as dust favors mite outbreaks.'
    ],
    prevention: [
      'Conserve natural predatory insects like predatory mites and ladybugs.',
      'Avoid unnecessary broad-spectrum chemical sprays that kill natural predators.'
    ],
    professionalHelp: 'Consult local extension agent for insecticidal soap or horticultural oil recommendations.'
  },
  Tomato_Target_Spot: {
    crop: 'Tomato',
    disease: 'Target Spot (Corynespora cassiicola)',
    isHealthy: false,
    overview: 'Causes dark brown leaf spots that expand into circular lesions with subtle target-like concentric rings and yellow halos.',
    immediateActions: [
      'Prune lower dense foliage to lower canopy humidity.',
      'Ensure plants are staked and tied securely.',
      'Switch to ground-level drip irrigation.'
    ],
    prevention: [
      'Implement 3-year crop rotations.',
      'Destroy plant debris post-harvest.'
    ],
    professionalHelp: 'Consult local agricultural office for spray recommendations.'
  },
  Tomato_Yellow_Leaf_Curl_Virus: {
    crop: 'Tomato',
    disease: 'Tomato Yellow Leaf Curl Virus (TYLCV)',
    isHealthy: false,
    overview: 'Vectored by whiteflies (Bemisia tabaci). Causes severe plant stunting, leaf cupping upward, yellow margins, and flower drop.',
    immediateActions: [
      'Rogue out and bag virus-infected plants immediately.',
      'Deploy yellow sticky traps to monitor and reduce whitefly populations.',
      'Cover young crops with fine insect netting.'
    ],
    prevention: [
      'Plant TYLCV-resistant tomato cultivars.',
      'Control whiteflies using reflective mulches and natural predators.'
    ],
    professionalHelp: 'URGENT: Contact your local agricultural extension service for regional whitefly vector alerts.'
  }
};

// Normalization function to match raw or formatted classification strings to dictionary keys
function findGuidanceMatch(rawClassification) {
  if (!rawClassification || typeof rawClassification !== 'string') return null;

  const cleaned = rawClassification.trim();
  if (!cleaned) return null;

  // Rejection list for generic ImageNet or non-crop fallback labels
  const invalidLabels = ['conch', 'damselfly', 'cricket', 'chameleon', 'dragonfly', 'unknown', 'unrecognized'];
  if (invalidLabels.some((inv) => cleaned.toLowerCase().includes(inv))) {
    return null;
  }

  // Exact key match
  if (TREATMENT_GUIDANCE_MAP[cleaned]) {
    return TREATMENT_GUIDANCE_MAP[cleaned];
  }

  // Underscore / Space normalized match
  const normalizedKey = cleaned.replace(/\s+/g, '_');
  if (TREATMENT_GUIDANCE_MAP[normalizedKey]) {
    return TREATMENT_GUIDANCE_MAP[normalizedKey];
  }

  // Case-insensitive key search
  const lowerCleaned = cleaned.toLowerCase().replace(/[\s_]+/g, '');
  const matchKey = Object.keys(TREATMENT_GUIDANCE_MAP).find(
    (key) => key.toLowerCase().replace(/[\s_]+/g, '') === lowerCleaned
  );

  return matchKey ? TREATMENT_GUIDANCE_MAP[matchKey] : null;
}

export default function DiseaseTreatmentGuidance({ prediction = null, className = '' }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // 1. Prediction State Validation
  if (!prediction) {
    return (
      <Card hoverable={false} className={`bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <Info className="h-5 w-5 text-teal-400" />
          <span className="text-sm font-semibold">
            Treatment guidance is unavailable until an AI assessment is completed.
          </span>
        </div>
      </Card>
    );
  }

  // Extract classification payload
  const rawClassification = prediction.classification || prediction.damage_type || prediction.predicted_class || null;
  const rawConfidence = prediction.classification_confidence ?? prediction.confidence;
  const formattedConfidence = formatConfidence(rawConfidence);
  const severityVal = prediction.severity || null;
  const guidance = findGuidanceMatch(rawClassification);

  // 2. Unsupported / Unmapped Classification Fallback
  if (!guidance) {
    return (
      <Card hoverable={false} className={`bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-xl p-6 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Agricultural Guidance Fallback
            </h4>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Specific guidance is not currently available for classification &quot;{rawClassification || 'Unmapped'}&quot;. Please consult a qualified agricultural extension officer or local agronomist.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const { crop, disease, isHealthy, overview, immediateActions, prevention, professionalHelp } = guidance;

  return (
    <Card
      hoverable={false}
      className={`bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-white/5 shadow-xl p-6 ${className}`}
    >
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-200/80 dark:border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Disease & Agricultural Treatment Guidance
            </h3>
            <Badge variant={isHealthy ? 'success' : 'warning'} className="text-[10px] uppercase font-bold ml-2">
              {isHealthy ? 'Crop Healthy' : 'Action Recommended'}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Agronomic guidance tailored to diagnosed crop issue and best agricultural practices.
          </p>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg border border-slate-200 dark:border-white/5 self-start sm:self-auto"
          aria-label="Toggle treatment guidance section"
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-6">

          {/* A. SUMMARY BANNER CARD */}
          <div className={`p-4 rounded-2xl border ${
            isHealthy
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-white/10'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-bold text-xs block mb-0.5">
                  Target Crop
                </span>
                <span className="font-bold text-slate-800 dark:text-white text-sm">
                  {crop}
                </span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 font-bold text-xs block mb-0.5">
                  Diagnosed Condition
                </span>
                <span className={`font-bold text-sm ${isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {disease}
                </span>
              </div>

              {formattedConfidence && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-bold text-xs block mb-0.5">
                    AI Confidence
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white text-sm">
                    {formattedConfidence}
                  </span>
                </div>
              )}

              {severityVal && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-bold text-xs block mb-0.5">
                    Assessed Severity
                  </span>
                  <Badge
                    variant={['HIGH', 'SEVERE'].includes(String(severityVal || '').toUpperCase()) ? 'danger' : String(severityVal || '').toUpperCase() === 'MODERATE' ? 'warning' : 'success'}
                    className="text-xs font-bold ml-1"
                  >
                    {severityVal}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* B. DISEASE OVERVIEW SECTION */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <BookOpen size={14} className="text-teal-400" />
              Agronomic Overview
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50/50 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/60 dark:border-white/5">
              {overview}
            </p>
          </div>

          {/* C. RECOMMENDED IMMEDIATE ACTIONS */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Activity size={14} className="text-emerald-400" />
              {isHealthy ? 'Immediate Care & Maintenance' : 'Recommended Immediate Field Actions'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {immediateActions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-white/5 text-xs">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold flex items-center justify-center flex-shrink-0 text-xs mt-0.5">
                    {idx + 1}
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {action}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* D. PREVENTION & MONITORING */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-teal-400" />
              Long-Term Prevention & Monitoring
            </h4>
            <div className="space-y-2">
              {prevention.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  <CheckCircle2 size={14} className="text-teal-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* E. AGRICULTURAL EXPERT NOTICE */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-3">
            <UserCheck size={18} className="flex-shrink-0 mt-0.5 text-amber-500" />
            <div className="space-y-1">
              <strong className="font-bold block">Professional Extension Notice</strong>
              <p className="leading-relaxed">
                {professionalHelp} AI assessment is for guidance only and does not replace certified agricultural extensions or local agronomist diagnosis.
              </p>
            </div>
          </div>

        </div>
      )}
    </Card>
  );
}
