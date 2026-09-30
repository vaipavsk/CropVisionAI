from __future__ import annotations

from typing import Dict, TypedDict


class AgronomicDiseaseProfile(TypedDict):
    crop: str
    pathogen_type: str
    severity_tier: str  # "LOW", "MODERATE", "HIGH", "INSUFFICIENT_EVIDENCE"
    severity_basis: str
    evidence_source: str
    source_url: str
    evidence_strength: str  # "HIGH", "MEDIUM"
    limitations: str


AGRONOMIC_KNOWLEDGE_BASE: Dict[str, AgronomicDiseaseProfile] = {
    # -------------------------------------------------------------
    # Corn Diseases
    # -------------------------------------------------------------
    "Corn_Common_Rust": {
        "crop": "Corn",
        "pathogen_type": "Fungal (Puccinia sorghi)",
        "severity_tier": "MODERATE",
        "severity_basis": "Produces scattered cinnamon-brown pustules across foliar surfaces. While common in temperate regions, severe infection in susceptible hybrids during cool, humid conditions can cause moderate yield reductions (10-25%).",
        "evidence_source": "USDA-ARS & Iowa State University Extension (Corn Field Guide)",
        "source_url": "https://crops.extension.iastate.edu/cropnews/2021/07/common-rust-corn",
        "evidence_strength": "HIGH",
        "limitations": "Impact is mitigated by hybrid resistance (Rp genes) and depends on growth stage during infection."
    },
    "Corn_Gray_Leaf_Spot": {
        "crop": "Corn",
        "pathogen_type": "Fungal (Cercospora zeae-maydis)",
        "severity_tier": "MODERATE",
        "severity_basis": "Causes rectangular necrotic lesions delimited by leaf veins. Progressive upward blighting from lower canopy during grain fill causes stalk lodging and moderate-to-high grain loss under sustained humidity.",
        "evidence_source": "Purdue Extension & CABI Plantwise Knowledge Bank",
        "source_url": "https://www.cabi.org/isc/datasheet/12239",
        "evidence_strength": "HIGH",
        "limitations": "Single-leaf image cannot capture the vertical canopy blighting gradient."
    },
    "Corn_Healthy": {
        "crop": "Corn",
        "pathogen_type": "None (Healthy)",
        "severity_tier": "LOW",
        "severity_basis": "No supported disease symptoms detected in the submitted image.",
        "evidence_source": "Agronomic Baseline Standard",
        "source_url": "https://www.fao.org/agriculture/crops/thematic-sitemap/theme/pests",
        "evidence_strength": "HIGH",
        "limitations": "Foliar imagery verifies leaf health but cannot rule out subterranean root or stalk vascular pathogens."
    },
    "Corn_Northern_Leaf_Blight": {
        "crop": "Corn",
        "pathogen_type": "Fungal (Setosphaeria turcica / Exserohilum turcicum)",
        "severity_tier": "HIGH",
        "severity_basis": "Produces large (2.5-15 cm) elliptical cigar-shaped grayish-green to tan lesions. Severe infection before or during silking can destroy large areas of canopy tissue causing 30-50% yield reduction.",
        "evidence_source": "FAO Crop Protection Compendium & University of Illinois Extension",
        "source_url": "http://extension.cropsciences.illinois.edu/fieldcrops/diseases/northern_corn_leaf_blight/",
        "evidence_strength": "HIGH",
        "limitations": "Lesion size and chlorotic halo characteristics vary with host resistance."
    },

    # -------------------------------------------------------------
    # Pepper Diseases
    # -------------------------------------------------------------
    "Pepper_Bacterial_Spot": {
        "crop": "Pepper",
        "pathogen_type": "Bacterial (Xanthomonas euvesicatoria)",
        "severity_tier": "MODERATE",
        "severity_basis": "Causes water-soaked circular-to-irregular foliar spots and fruit lesions, leading to extensive defoliation and sunscald of exposed fruit in warm, wet climates.",
        "evidence_source": "University of Florida IFAS Extension & CABI Plantwise",
        "source_url": "https://edis.ifas.ufl.edu/publication/VH052",
        "evidence_strength": "HIGH",
        "limitations": "Foliar spot count does not directly measure secondary fruit sunscald damage."
    },
    "Pepper_Healthy": {
        "crop": "Pepper",
        "pathogen_type": "None (Healthy)",
        "severity_tier": "LOW",
        "severity_basis": "No supported disease symptoms detected in the submitted image.",
        "evidence_source": "Agronomic Baseline Standard",
        "source_url": "https://www.fao.org/agriculture/crops/thematic-sitemap/theme/pests",
        "evidence_strength": "HIGH",
        "limitations": "Foliar imagery verifies leaf health but cannot rule out subterranean root or vascular pathogens."
    },

    # -------------------------------------------------------------
    # Potato Diseases
    # -------------------------------------------------------------
    "Potato_Early_Blight": {
        "crop": "Potato",
        "pathogen_type": "Fungal (Alternaria solani)",
        "severity_tier": "MODERATE",
        "severity_basis": "Causes dark, concentric 'target-board' lesions on mature leaves. Leads to progressive premature senescence and moderate tuber sizing reduction.",
        "evidence_source": "University of Idaho Extension & EPPO Global Database",
        "source_url": "https://gd.eppo.int/taxon/ALTESO",
        "evidence_strength": "HIGH",
        "limitations": "Early blight develops progressively; initial isolated lesions have lower canopy impact than late-season defoliation."
    },
    "Potato_Healthy": {
        "crop": "Potato",
        "pathogen_type": "None (Healthy)",
        "severity_tier": "LOW",
        "severity_basis": "No supported disease symptoms detected in the submitted image.",
        "evidence_source": "Agronomic Baseline Standard",
        "source_url": "https://www.fao.org/agriculture/crops/thematic-sitemap/theme/pests",
        "evidence_strength": "HIGH",
        "limitations": "Foliar imagery verifies leaf health but cannot rule out subterranean tuber rot."
    },
    "Potato_Late_Blight": {
        "crop": "Potato",
        "pathogen_type": "Oomycete (Phytophthora infestans)",
        "severity_tier": "HIGH",
        "severity_basis": "Highly aggressive pathogen capable of destroying entire fields within 7-10 days under cool, humid weather. Classically classified as high emergency threat in agricultural underwriting.",
        "evidence_source": "CIP (International Potato Center) & FAO Plant Production Papers",
        "source_url": "https://cipotato.org/potato/late-blight/",
        "evidence_strength": "HIGH",
        "limitations": "Exponential spread rate means even moderate initial foliar lesions warrant immediate high-severity intervention."
    },

    # -------------------------------------------------------------
    # Rice Diseases
    # -------------------------------------------------------------
    "Rice_Bacterial_Blight": {
        "crop": "Rice",
        "pathogen_type": "Bacterial (Xanthomonas oryzae pv. oryzae)",
        "severity_tier": "HIGH",
        "severity_basis": "Causes marginal wavy yellow/gray stripes along leaf blades that coalesce, leading to systemic wilting ('kresek') and 50-80% crop failure in severe epidemics.",
        "evidence_source": "IRRI Rice Knowledge Bank & CABI Plantwise",
        "source_url": "http://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/bacterial-blight",
        "evidence_strength": "HIGH",
        "limitations": "Seedling kresek phase is more destructive than late flag-leaf blighting."
    },
    "Rice_Bacterial_Streak": {
        "crop": "Rice",
        "pathogen_type": "Bacterial (Xanthomonas oryzae pv. oryzicola)",
        "severity_tier": "MODERATE",
        "severity_basis": "Produces narrow, water-soaked interveinal streaks with amber bacterial exudate. Generally less destructive than bacterial blight, with moderate yield penalties (10-30%).",
        "evidence_source": "IRRI Rice Knowledge Bank",
        "source_url": "http://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/bacterial-leaf-streak",
        "evidence_strength": "HIGH",
        "limitations": "Lesions are delimited by leaf veins, restricting rapid lateral tissue destruction."
    },
    "Rice_Bakanae": {
        "crop": "Rice",
        "pathogen_type": "Fungal (Fusarium fujikuroi)",
        "severity_tier": "HIGH",
        "severity_basis": "Seed/soil-borne disease causing abnormal elongated, pale-yellow seedlings, foot/crown rot, and sterile panicles. Infected plants frequently die before heading.",
        "evidence_source": "IRRI Rice Knowledge Bank & FAO Rice Protection",
        "source_url": "http://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/bakanae",
        "evidence_strength": "HIGH",
        "limitations": "Foliar chlorosis and elongation are symptoms of systemic fungal gibberellin production."
    },
    "Rice_Brown_Spot": {
        "crop": "Rice",
        "pathogen_type": "Fungal (Bipolaris oryzae)",
        "severity_tier": "MODERATE",
        "severity_basis": "Produces numerous small, oval-to-circular dark brown spots with yellow halos. Severe on nutrient-deficient soils, causing moderate leaf blighting and grain discoloration.",
        "evidence_source": "IRRI Rice Knowledge Bank",
        "source_url": "http://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/brown-spot",
        "evidence_strength": "HIGH",
        "limitations": "Severity is strongly linked to soil fertility, moisture stress, and plant nutrition."
    },
    "Rice_False_Smut": {
        "crop": "Rice",
        "pathogen_type": "Fungal (Ustilaginoidea virens)",
        "severity_tier": "MODERATE",
        "severity_basis": "Transforms individual rice florets into velvety green-to-black chlamydospore balls. Causes direct grain yield loss and mycotoxin contamination.",
        "evidence_source": "IRRI Rice Knowledge Bank & CABI",
        "source_url": "http://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/false-smut",
        "evidence_strength": "MEDIUM",
        "limitations": "Infection targets reproductive panicles; foliar imagery captures indirect or panicle-adjacent symptoms."
    },
    "Rice_Grassy_Stunt_Virus": {
        "crop": "Rice",
        "pathogen_type": "Viral (Rice grassy stunt tenuivirus - Vector: Nilaparvata lugens)",
        "severity_tier": "HIGH",
        "severity_basis": "Causes severe plant stunting, excessive tillering, pale-green narrow erect leaves, and complete panicle sterility. Highly destructive systemic viral disease.",
        "evidence_source": "IRRI Rice Knowledge Bank",
        "source_url": "http://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/rice-grassy-stunt-virus",
        "evidence_strength": "HIGH",
        "limitations": "Foliar symptoms can mimic severe zinc or nitrogen deficiency without vector history."
    },
    "Rice_Healthy": {
        "crop": "Rice",
        "pathogen_type": "None (Healthy)",
        "severity_tier": "LOW",
        "severity_basis": "No supported disease symptoms detected in the submitted image.",
        "evidence_source": "Agronomic Baseline Standard",
        "source_url": "https://www.fao.org/agriculture/crops/thematic-sitemap/theme/pests",
        "evidence_strength": "HIGH",
        "limitations": "Foliar imagery verifies leaf health but cannot rule out subterranean root or water-line crown rots."
    },
    "Rice_Hispa": {
        "crop": "Rice",
        "pathogen_type": "Insect Pest (Dicladispa armigera)",
        "severity_tier": "MODERATE",
        "severity_basis": "Adults scrape upper leaf epidermis producing characteristic parallel white streaks, while larvae mine between leaf layers. Heavy feeding causes characteristic burnt field appearance.",
        "evidence_source": "IRRI Rice Knowledge Bank & FAO",
        "source_url": "http://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/rice-hispa",
        "evidence_strength": "HIGH",
        "limitations": "Damage is mechanical epidermal scraping rather than infectious necrotrophic rot."
    },
    "Rice_Leaf_Blast": {
        "crop": "Rice",
        "pathogen_type": "Fungal (Magnaporthe oryzae)",
        "severity_tier": "HIGH",
        "severity_basis": "Widely recognized as the most devastating fungal disease of rice globally. Spindle-shaped lesions coalesce under high nitrogen and humidity, causing total foliar blighting and crop failure.",
        "evidence_source": "IRRI Rice Knowledge Bank & International Rice Research Institute",
        "source_url": "http://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/blast-leaf-collar",
        "evidence_strength": "HIGH",
        "limitations": "Lesion type varies from small hypersensitive brown specks (resistant) to broad sporulating lesions (susceptible)."
    },
    "Rice_Leaf_Scald": {
        "crop": "Rice",
        "pathogen_type": "Fungal (Microdochium oryzae)",
        "severity_tier": "HIGH",
        "severity_basis": "Causes large chevron-patterned, banded zonate lesions extending from leaf tips and margins. Can cause severe dieback and blighting across upper canopy during reproductive stages.",
        "evidence_source": "IRRI Rice Knowledge Bank",
        "source_url": "http://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/leaf-scald",
        "evidence_strength": "HIGH",
        "limitations": "Secondary saprophytes can darken older scald margins."
    },
    "Rice_Leaf_Smut": {
        "crop": "Rice",
        "pathogen_type": "Fungal (Entyloma oryzae)",
        "severity_tier": "LOW",
        "severity_basis": "Produces small, raised, angular black spots on leaf blades. Considered a minor, late-season disease that rarely causes economically significant yield loss.",
        "evidence_source": "IRRI Rice Knowledge Bank",
        "source_url": "http://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/leaf-smut",
        "evidence_strength": "HIGH",
        "limitations": "High lesion density on senescing leaves does not equate to major economic crop damage."
    },
    "Rice_Narrow_Brown_Spot": {
        "crop": "Rice",
        "pathogen_type": "Fungal (Cercospora janseana)",
        "severity_tier": "MODERATE",
        "severity_basis": "Produces short, linear brown lesions parallel to veins. Typically severe on potassium-deficient soils and maturing crops, accelerating leaf senescence.",
        "evidence_source": "IRRI Rice Knowledge Bank",
        "source_url": "http://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/narrow-brown-spot",
        "evidence_strength": "HIGH",
        "limitations": "Lesion length and density vary with cultivar resistance."
    },
    "Rice_Neck_Blast": {
        "crop": "Rice",
        "pathogen_type": "Fungal (Magnaporthe oryzae)",
        "severity_tier": "HIGH",
        "severity_basis": "Attacks the panicle node/neck, girdling vascular flow and causing complete blanking and lodging of grain heads. Direct 100% loss of affected panicles.",
        "evidence_source": "IRRI Rice Knowledge Bank",
        "source_url": "http://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/blast-node-neck",
        "evidence_strength": "HIGH",
        "limitations": "Critical reproductive phase disease; foliar proxy flags immediate severe crop loss risk."
    },
    "Rice_Ragged_Stunt_Virus": {
        "crop": "Rice",
        "pathogen_type": "Viral (Rice ragged stunt oryzavirus - Vector: Nilaparvata lugens)",
        "severity_tier": "HIGH",
        "severity_basis": "Causes severe plant stunting, ragged/torn leaf edges, vein galls, delayed flowering, and incomplete panicle emergence with high sterility.",
        "evidence_source": "IRRI Rice Knowledge Bank",
        "source_url": "http://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/rice-ragged-stunt-virus",
        "evidence_strength": "HIGH",
        "limitations": "Systemic viral infection."
    },
    "Rice_Sheath_Blight": {
        "crop": "Rice",
        "pathogen_type": "Fungal (Rhizoctonia solani)",
        "severity_tier": "HIGH",
        "severity_basis": "Causes large greenish-gray water-soaked lesions that advance up the sheath and leaf canopy. Second only to blast in global economic rice loss (up to 50% yield reduction).",
        "evidence_source": "IRRI Rice Knowledge Bank & CABI",
        "source_url": "http://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/sheath-blight",
        "evidence_strength": "HIGH",
        "limitations": "Initial lesions begin at water line and move upward into visible leaf canopy."
    },
    "Rice_Sheath_Rot": {
        "crop": "Rice",
        "pathogen_type": "Fungal (Sarocladium oryzae)",
        "severity_tier": "MODERATE",
        "severity_basis": "Rotting of the uppermost leaf sheath enclosing the young panicle, causing aborted or partially emerged panicles and discolored florets.",
        "evidence_source": "IRRI Rice Knowledge Bank",
        "source_url": "http://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/sheath-rot",
        "evidence_strength": "HIGH",
        "limitations": "Closely associated with stem borer and mite injury."
    },
    "Rice_Stem_Rot": {
        "crop": "Rice",
        "pathogen_type": "Fungal (Sclerotium oryzae)",
        "severity_tier": "HIGH",
        "severity_basis": "Attacks culms at water level causing severe internal black rot, stalk collapse, lodging, and blank panicles prior to harvest.",
        "evidence_source": "IRRI Rice Knowledge Bank",
        "source_url": "http://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/stem-rot",
        "evidence_strength": "HIGH",
        "limitations": "Lower stem infection often photographed via representative culm samples."
    },
    "Rice_Tungro": {
        "crop": "Rice",
        "pathogen_type": "Viral Complex (RTBV + RTSV - Vector: Nephotettix virescens)",
        "severity_tier": "HIGH",
        "severity_basis": "The most destructive viral disease of rice in South/Southeast Asia. Causes distinct orange-yellow leaf discoloration, severe stunting, and near total yield loss in early infections.",
        "evidence_source": "IRRI Rice Knowledge Bank & FAO",
        "source_url": "http://www.knowledgebank.irri.org/decision-tools/rice-doctor/rice-doctor-fact-sheets/item/tungro",
        "evidence_strength": "HIGH",
        "limitations": "Yellowing can mimic zinc/nitrogen deficiency."
    },

    # -------------------------------------------------------------
    # Tomato Diseases
    # -------------------------------------------------------------
    "Tomato_Bacterial_Spot": {
        "crop": "Tomato",
        "pathogen_type": "Bacterial (Xanthomonas spp.)",
        "severity_tier": "MODERATE",
        "severity_basis": "Small circular to angular water-soaked lesions with chlorotic halos, leading to extensive defoliation, blossom drop, and sunscalded unmarketable fruit.",
        "evidence_source": "Cornell University Vegetable MD Online & CABI",
        "source_url": "http://vegetablemdonline.ppath.cornell.edu/factsheets/Tomato_BactSpot.htm",
        "evidence_strength": "HIGH",
        "limitations": "Defoliation severity depends heavily on overhead irrigation/rainfall frequency."
    },
    "Tomato_Early_Blight": {
        "crop": "Tomato",
        "pathogen_type": "Fungal (Alternaria solani / A. linariae)",
        "severity_tier": "MODERATE",
        "severity_basis": "Concentric ring lesions on lower leaves progressing upward. Causes substantial defoliation and reduction in fruit quality and yield.",
        "evidence_source": "University of California IPM Pest Management Guidelines",
        "source_url": "https://ipm.ucanr.edu/agriculture/tomato/early-blight/",
        "evidence_strength": "HIGH",
        "limitations": "Standard management (fungicide/pruning) easily arrests early focal infections."
    },
    "Tomato_Healthy": {
        "crop": "Tomato",
        "pathogen_type": "None (Healthy)",
        "severity_tier": "LOW",
        "severity_basis": "No supported disease symptoms detected in the submitted image.",
        "evidence_source": "Agronomic Baseline Standard",
        "source_url": "https://www.fao.org/agriculture/crops/thematic-sitemap/theme/pests",
        "evidence_strength": "HIGH",
        "limitations": "Foliar imagery verifies leaf health but cannot rule out subterranean root or vascular pathogens."
    },
    "Tomato_Late_Blight": {
        "crop": "Tomato",
        "pathogen_type": "Oomycete (Phytophthora infestans)",
        "severity_tier": "HIGH",
        "severity_basis": "Extremely fast-moving pathogen causing large greasy dark brown water-soaked lesions across leaves and stems, with white sporulation under humid conditions. Causes 100% field collapse.",
        "evidence_source": "Cornell Vegetable MD Online & USDA-ARS",
        "source_url": "http://vegetablemdonline.ppath.cornell.edu/factsheets/Tomato_LateBlight.htm",
        "evidence_strength": "HIGH",
        "limitations": "Infection spreads exponentially within 48-72 hours under cool wet weather."
    },
    "Tomato_Leaf_Mold": {
        "crop": "Tomato",
        "pathogen_type": "Fungal (Passalora fulva / Cladosporium fulvum)",
        "severity_tier": "MODERATE",
        "severity_basis": "Pale green/yellow spots on upper leaf surfaces with olive-green velvety mold underneath. Prevalent in greenhouse production, causing moderate defoliation.",
        "evidence_source": "University of Minnesota Extension",
        "source_url": "https://extension.umn.edu/disease-management/tomato-leaf-mold",
        "evidence_strength": "HIGH",
        "limitations": "Rarely kills entire plants, but significantly reduces photosynthetic capacity."
    },
    "Tomato_Mosaic_Virus": {
        "crop": "Tomato",
        "pathogen_type": "Viral (Tomato mosaic virus - ToMV)",
        "severity_tier": "MODERATE",
        "severity_basis": "Causes light/dark green mosaic mottle, leaf distortion ('shoestringing'), and internal fruit browning. Highly stable mechanically transmitted virus causing chronic moderate yield loss.",
        "evidence_source": "UC IPM Guidelines & CABI Plantwise",
        "source_url": "https://ipm.ucanr.edu/agriculture/tomato/tomato-mosaic-tobacco-mosaic/",
        "evidence_strength": "HIGH",
        "limitations": "Severity varies widely depending on cultivar resistance genes (Tm-1, Tm-2)."
    },
    "Tomato_Septoria_Leaf_Spot": {
        "crop": "Tomato",
        "pathogen_type": "Fungal (Septoria lycopersici)",
        "severity_tier": "MODERATE",
        "severity_basis": "Numerous small circular spots with dark brown margins and gray centers containing pycnidia. Causes progressive lower canopy defoliation.",
        "evidence_source": "Penn State Extension",
        "source_url": "https://extension.psu.edu/septoria-leaf-spot-on-tomato",
        "evidence_strength": "HIGH",
        "limitations": "Does not directly infect fruit; damage is via defoliation and sunburn."
    },
    "Tomato_Spider_Mites": {
        "crop": "Tomato",
        "pathogen_type": "Arthropod Pest (Tetranychus urticae - Two-spotted spider mite)",
        "severity_tier": "MODERATE",
        "severity_basis": "Causes dense chlorotic stippling, bronzing of foliage, and webbing under hot, dry conditions. Can cause severe defoliation and plant decline if uncontrolled.",
        "evidence_source": "University of California IPM Guidelines",
        "source_url": "https://ipm.ucanr.edu/agriculture/tomato/spider-mites/",
        "evidence_strength": "HIGH",
        "limitations": "Stippling density must be high to trigger plant mortality."
    },
    "Tomato_Target_Spot": {
        "crop": "Tomato",
        "pathogen_type": "Fungal (Corynespora casiicola)",
        "severity_tier": "MODERATE",
        "severity_basis": "Causes brown target-like lesions with yellow halos on leaves and stems, and sunken fruit lesions. Severe in warm, humid subtropical climates.",
        "evidence_source": "University of Florida IFAS Extension",
        "source_url": "https://edis.ifas.ufl.edu/publication/PP157",
        "evidence_strength": "HIGH",
        "limitations": "Can be confused with early blight or bacterial spot without microscopic examination."
    },
    "Tomato_Yellow_Leaf_Curl_Virus": {
        "crop": "Tomato",
        "pathogen_type": "Viral (Tomato yellow leaf curl virus - TYLCV, Vector: Bemisia tabaci)",
        "severity_tier": "HIGH",
        "severity_basis": "Causes severe upward leaf cupping, severe chlorosis/yellowing, leaf crumpling, dramatic plant stunting, and complete flower abscission. One of the most destructive tomato viruses globally.",
        "evidence_source": "FAO & University of California IPM",
        "source_url": "https://ipm.ucanr.edu/agriculture/tomato/tomato-yellow-leaf-curl/",
        "evidence_strength": "HIGH",
        "limitations": "Early vegetative infection causes near total crop loss; mature plant infection has moderate impact."
    }
}


def get_agronomic_profile(class_name: str) -> AgronomicDiseaseProfile:
    """Retrieve the authoritative agronomic profile for a given crop disease class."""
    if class_name in AGRONOMIC_KNOWLEDGE_BASE:
        return AGRONOMIC_KNOWLEDGE_BASE[class_name]
    
    # Fallback for unrecognized classes
    return {
        "crop": "Unknown",
        "pathogen_type": "Unknown",
        "severity_tier": "INSUFFICIENT_EVIDENCE",
        "severity_basis": f"No authoritative agronomic profile exists in the knowledge base for '{class_name}'.",
        "evidence_source": "None",
        "source_url": "None",
        "evidence_strength": "NONE",
        "limitations": "Unrecognized class requires manual agricultural expert review."
    }
