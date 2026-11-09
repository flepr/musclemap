/* MuscleMap — hiérarchie musculaire : 3 familles, 13 groupes, 34 muscles.
   Chaque texte existe en français (fr) et en anglais (en).
   Règle de découpage : on sépare deux portions d'un muscle seulement si fibres,
   insertions ou fonctions diffèrent au point qu'un exercice peut laisser l'une
   presque sans travail (cf. note du projet). */

export const FAMILIES = [
  { id: 'haut',   fr: 'Haut du corps', en: 'Upper body',    groups: ['pectoraux', 'epaules', 'trapezes', 'dos'] },
  { id: 'bras',   fr: 'Bras et tronc', en: 'Arms & core',   groups: ['biceps', 'triceps', 'avantbras', 'abdos'] },
  { id: 'jambes', fr: 'Jambes',        en: 'Legs',          groups: ['fessiers', 'quadriceps', 'ischios', 'adducteurs', 'mollets'] },
];

/* size : 'big' = gros groupe (récup par défaut 72 h), 'small' = petit muscle (48 h) */
export const GROUPS = {
  pectoraux:  { size: 'big',   fr: 'Pectoraux',       en: 'Chest',      sciFr: 'Grand pectoral',               sciEn: 'Pectoralis major',            muscles: ['pec_haut', 'pec_mil', 'pec_bas'] },
  epaules:    { size: 'small', fr: 'Épaules',         en: 'Shoulders',  sciFr: 'Deltoïde · coiffe des rotateurs', sciEn: 'Deltoid · rotator cuff',   muscles: ['delt_ant', 'delt_lat', 'delt_post', 'coiffe'] },
  trapezes:   { size: 'big',   fr: 'Trapèzes',        en: 'Traps',      sciFr: 'Trapèze · rhomboïdes',         sciEn: 'Trapezius · rhomboids',       muscles: ['trap_haut', 'trap_mil', 'trap_bas'] },
  dos:        { size: 'big',   fr: 'Dos',             en: 'Back',       sciFr: 'Grand dorsal · grand rond · érecteurs du rachis', sciEn: 'Latissimus dorsi · teres major · erector spinae', muscles: ['dorsal', 'grand_rond', 'lombaires'] },
  biceps:     { size: 'small', fr: 'Biceps',          en: 'Biceps',     sciFr: 'Biceps brachial · brachial',   sciEn: 'Biceps brachii · brachialis', muscles: ['bic_long', 'bic_court', 'brachial'] },
  triceps:    { size: 'small', fr: 'Triceps',         en: 'Triceps',    sciFr: 'Triceps brachial',             sciEn: 'Triceps brachii',             muscles: ['tri_long', 'tri_lat', 'tri_med'] },
  avantbras:  { size: 'small', fr: 'Avant-bras',      en: 'Forearms',   sciFr: 'Loges antérieure et postérieure', sciEn: 'Flexor and extensor compartments', muscles: ['brachiorad', 'flech', 'ext'] },
  abdos:      { size: 'small', fr: 'Abdominaux',      en: 'Abs',        sciFr: 'Paroi abdominale',             sciEn: 'Abdominal wall',              muscles: ['abdos', 'obliques'] },
  fessiers:   { size: 'big',   fr: 'Fessiers',        en: 'Glutes',     sciFr: 'Muscles fessiers',             sciEn: 'Gluteal muscles',             muscles: ['fess_grand', 'fess_moy'] },
  quadriceps: { size: 'big',   fr: 'Quadriceps',      en: 'Quads',      sciFr: 'Quadriceps fémoral',           sciEn: 'Quadriceps femoris',          muscles: ['quad_droit', 'quad_ext', 'quad_int'] },
  ischios:    { size: 'big',   fr: 'Ischio-jambiers', en: 'Hamstrings', sciFr: 'Loge postérieure de la cuisse', sciEn: 'Posterior thigh',            muscles: ['ischio_bf', 'ischio_st'] },
  adducteurs: { size: 'big',   fr: 'Adducteurs',      en: 'Adductors',  sciFr: 'Loge interne de la cuisse',    sciEn: 'Medial thigh',                muscles: ['adduc'] },
  mollets:    { size: 'small', fr: 'Mollets',         en: 'Calves',     sciFr: 'Triceps sural',                sciEn: 'Triceps surae',               muscles: ['gastro', 'soleaire'] },
};

/* name : nom courant de salle ; sci : nom anatomique ; role : ce que fait le muscle ; ex : exercices types */
export const MUSCLES = {
  pec_haut: {
    fr: { name: 'Haut des pecs', sci: 'Grand pectoral — faisceau claviculaire', role: 'Monte le bras vers l’avant et vers le haut', ex: 'Développé incliné, écarté incliné' },
    en: { name: 'Upper chest', sci: 'Pectoralis major — clavicular head', role: 'Raises the arm forward and up', ex: 'Incline press, incline fly' } },
  pec_mil: {
    fr: { name: 'Milieu des pecs', sci: 'Grand pectoral — faisceau sterno-costal', role: 'Ramène le bras devant la poitrine', ex: 'Développé couché, pompes, écarté' },
    en: { name: 'Mid chest', sci: 'Pectoralis major — sternocostal head', role: 'Brings the arm across the chest', ex: 'Bench press, push-ups, flyes' } },
  pec_bas: {
    fr: { name: 'Bas des pecs', sci: 'Grand pectoral — faisceau abdominal', role: 'Abaisse le bras devant le corps', ex: 'Dips, développé décliné, poulie haut-bas' },
    en: { name: 'Lower chest', sci: 'Pectoralis major — abdominal head', role: 'Pulls the arm down and across', ex: 'Dips, decline press, high-to-low cable fly' } },

  delt_ant: {
    fr: { name: 'Deltoïde avant', sci: 'Deltoïde — faisceau antérieur (claviculaire)', role: 'Lève le bras devant soi', ex: 'Développé militaire, élévations frontales' },
    en: { name: 'Front delts', sci: 'Anterior deltoid', role: 'Raises the arm to the front', ex: 'Overhead press, front raises' } },
  delt_lat: {
    fr: { name: 'Deltoïde latéral', sci: 'Deltoïde — faisceau moyen (acromial)', role: 'Écarte le bras sur le côté', ex: 'Élévations latérales, tirage menton' },
    en: { name: 'Side delts', sci: 'Lateral deltoid', role: 'Raises the arm to the side', ex: 'Lateral raises, upright row' } },
  delt_post: {
    fr: { name: 'Deltoïde arrière', sci: 'Deltoïde — faisceau postérieur (spinal)', role: 'Tire le bras vers l’arrière', ex: 'Oiseau, face pull, reverse fly' },
    en: { name: 'Rear delts', sci: 'Posterior deltoid', role: 'Pulls the arm back', ex: 'Rear-delt fly, face pull, reverse pec deck' } },
  coiffe: {
    fr: { name: 'Coiffe des rotateurs', sci: 'Infra-épineux, petit rond, supra-épineux, subscapulaire', role: 'Stabilise et fait tourner l’épaule', ex: 'Rotations externes, face pull' },
    en: { name: 'Rotator cuff', sci: 'Infraspinatus, teres minor, supraspinatus, subscapularis', role: 'Stabilises and rotates the shoulder', ex: 'External rotations, face pull' } },

  trap_haut: {
    fr: { name: 'Haut des trapèzes', sci: 'Trapèze — partie descendante', role: 'Hausse les épaules', ex: 'Shrugs, tirage menton, farmer walk' },
    en: { name: 'Upper traps', sci: 'Trapezius — descending part', role: 'Shrugs the shoulders', ex: 'Shrugs, upright row, farmer’s walk' } },
  trap_mil: {
    fr: { name: 'Milieu du dos', sci: 'Trapèze (partie transverse) et rhomboïdes', role: 'Serre les omoplates', ex: 'Rowing, tirage horizontal, face pull' },
    en: { name: 'Mid traps & rhomboids', sci: 'Trapezius (transverse part) & rhomboids', role: 'Squeezes the shoulder blades together', ex: 'Rows, seated cable row, face pull' } },
  trap_bas: {
    fr: { name: 'Bas des trapèzes', sci: 'Trapèze — partie ascendante', role: 'Abaisse les omoplates', ex: 'Y-raises, tractions, tirage vertical' },
    en: { name: 'Lower traps', sci: 'Trapezius — ascending part', role: 'Pulls the shoulder blades down', ex: 'Y-raises, pull-ups, lat pulldown' } },

  dorsal: {
    fr: { name: 'Grand dorsal', sci: 'Latissimus dorsi', role: 'Ramène le bras vers le bas et l’arrière', ex: 'Tractions, tirage vertical, rowing' },
    en: { name: 'Lats', sci: 'Latissimus dorsi', role: 'Pulls the arm down and back', ex: 'Pull-ups, lat pulldown, rows' } },
  grand_rond: {
    fr: { name: 'Grand rond', sci: 'Teres major', role: 'Aide le grand dorsal à tirer le bras', ex: 'Tractions, tirage vertical, pull-over' },
    en: { name: 'Teres major', sci: 'Teres major', role: 'Helps the lats pull the arm', ex: 'Pull-ups, lat pulldown, pullover' } },
  lombaires: {
    fr: { name: 'Lombaires', sci: 'Érecteurs du rachis', role: 'Redresse et tient le dos droit', ex: 'Soulevé de terre, extensions lombaires, good morning' },
    en: { name: 'Lower back', sci: 'Erector spinae', role: 'Extends and stabilises the spine', ex: 'Deadlift, back extensions, good mornings' } },

  bic_long: {
    fr: { name: 'Biceps — chef long', sci: 'Biceps brachial — chef long (côté externe)', role: 'Plie le coude et tourne l’avant-bras', ex: 'Curl incliné, curl prise serrée' },
    en: { name: 'Biceps long head', sci: 'Biceps brachii — long head (outer)', role: 'Bends the elbow and turns the forearm', ex: 'Incline curl, close-grip curl' } },
  bic_court: {
    fr: { name: 'Biceps — chef court', sci: 'Biceps brachial — chef court (côté interne)', role: 'Plie le coude et tourne l’avant-bras', ex: 'Curl pupitre, curl prise large' },
    en: { name: 'Biceps short head', sci: 'Biceps brachii — short head (inner)', role: 'Bends the elbow and turns the forearm', ex: 'Preacher curl, wide-grip curl' } },
  brachial: {
    fr: { name: 'Brachial', sci: 'Brachial (sous le biceps)', role: 'Plie le coude, quelle que soit la prise', ex: 'Curl marteau, curl inversé' },
    en: { name: 'Brachialis', sci: 'Brachialis (under the biceps)', role: 'Bends the elbow in any grip', ex: 'Hammer curl, reverse curl' } },

  tri_long: {
    fr: { name: 'Triceps — chef long', sci: 'Triceps brachial — chef long', role: 'Tend le coude et ramène le bras en arrière', ex: 'Extension au-dessus de la tête, barre au front' },
    en: { name: 'Triceps long head', sci: 'Triceps brachii — long head', role: 'Straightens the elbow and pulls the arm back', ex: 'Overhead extension, skull crushers' } },
  tri_lat: {
    fr: { name: 'Triceps — chef latéral', sci: 'Triceps brachial — chef latéral (côté externe)', role: 'Tend le coude', ex: 'Extension à la poulie, dips, développé serré' },
    en: { name: 'Triceps lateral head', sci: 'Triceps brachii — lateral head (outer)', role: 'Straightens the elbow', ex: 'Cable pushdown, dips, close-grip bench' } },
  tri_med: {
    fr: { name: 'Triceps — chef médial', sci: 'Triceps brachial — chef médial (près du coude)', role: 'Tend le coude, surtout en fin de mouvement', ex: 'Extension prise inversée, pompes diamant' },
    en: { name: 'Triceps medial head', sci: 'Triceps brachii — medial head (near the elbow)', role: 'Straightens the elbow, especially at lockout', ex: 'Reverse-grip pushdown, diamond push-ups' } },

  brachiorad: {
    fr: { name: 'Brachio-radial', sci: 'Brachio-radial (ex-long supinateur)', role: 'Plie le coude en prise neutre', ex: 'Curl marteau, curl inversé' },
    en: { name: 'Brachioradialis', sci: 'Brachioradialis', role: 'Bends the elbow in a neutral grip', ex: 'Hammer curl, reverse curl' } },
  flech: {
    fr: { name: 'Fléchisseurs', sci: 'Fléchisseurs du poignet et des doigts', role: 'Serre la main, plie le poignet', ex: 'Curl poignet, farmer walk, suspension' },
    en: { name: 'Forearm flexors', sci: 'Wrist and finger flexors', role: 'Grip and wrist flexion', ex: 'Wrist curls, farmer’s walk, dead hangs' } },
  ext: {
    fr: { name: 'Extenseurs', sci: 'Extenseurs du poignet et des doigts', role: 'Relève le poignet, ouvre la main', ex: 'Curl poignet inversé, curl inversé' },
    en: { name: 'Forearm extensors', sci: 'Wrist and finger extensors', role: 'Lifts the wrist, opens the hand', ex: 'Reverse wrist curls, reverse curls' } },

  abdos: {
    fr: { name: 'Grand droit', sci: 'Grand droit de l’abdomen (« la tablette »)', role: 'Enroule le buste', ex: 'Crunch (accent haut), relevé de bassin (accent bas), roue abdominale' },
    en: { name: 'Six-pack', sci: 'Rectus abdominis', role: 'Curls the trunk', ex: 'Crunches (upper emphasis), reverse crunches (lower emphasis), ab wheel' } },
  obliques: {
    fr: { name: 'Obliques', sci: 'Obliques externe et interne', role: 'Tourne et incline le buste', ex: 'Russian twist, crunch oblique, woodchopper' },
    en: { name: 'Obliques', sci: 'External and internal obliques', role: 'Rotates and bends the trunk', ex: 'Russian twists, oblique crunches, woodchoppers' } },

  fess_grand: {
    fr: { name: 'Grand fessier', sci: 'Grand fessier (gluteus maximus)', role: 'Tend la hanche', ex: 'Hip thrust, squat, soulevé de terre' },
    en: { name: 'Glute max', sci: 'Gluteus maximus', role: 'Extends the hip', ex: 'Hip thrust, squat, deadlift' } },
  fess_moy: {
    fr: { name: 'Abducteurs', sci: 'Moyen et petit fessiers, tenseur du fascia lata', role: 'Écarte la jambe, stabilise le bassin', ex: 'Machine abducteurs, marche latérale avec élastique' },
    en: { name: 'Hip abductors', sci: 'Gluteus medius & minimus, tensor fasciae latae', role: 'Moves the leg out, stabilises the pelvis', ex: 'Abductor machine, banded lateral walks' } },

  quad_droit: {
    fr: { name: 'Droit fémoral', sci: 'Droit fémoral (centre de la cuisse)', role: 'Tend le genou et lève la cuisse', ex: 'Leg extension, squat' },
    en: { name: 'Rectus femoris', sci: 'Rectus femoris (center of the thigh)', role: 'Straightens the knee, lifts the thigh', ex: 'Leg extension, squat' } },
  quad_ext: {
    fr: { name: 'Vaste externe', sci: 'Vaste latéral', role: 'Tend le genou', ex: 'Squat, presse à cuisses, fentes' },
    en: { name: 'Outer quad', sci: 'Vastus lateralis', role: 'Straightens the knee', ex: 'Squat, leg press, lunges' } },
  quad_int: {
    fr: { name: 'Vaste interne', sci: 'Vaste médial (« la goutte »)', role: 'Tend le genou, stabilise la rotule', ex: 'Squat complet, leg extension, fentes' },
    en: { name: 'Teardrop', sci: 'Vastus medialis', role: 'Straightens the knee, stabilises the kneecap', ex: 'Deep squat, leg extension, lunges' } },

  ischio_bf: {
    fr: { name: 'Biceps fémoral', sci: 'Biceps fémoral (côté externe)', role: 'Plie le genou, tend la hanche', ex: 'Leg curl, soulevé de terre jambes tendues' },
    en: { name: 'Outer hamstring', sci: 'Biceps femoris', role: 'Bends the knee, extends the hip', ex: 'Leg curl, Romanian deadlift' } },
  ischio_st: {
    fr: { name: 'Semi-tendineux & semi-membraneux', sci: 'Côté interne de la cuisse', role: 'Plie le genou, tend la hanche', ex: 'Leg curl, nordic curl, good morning' },
    en: { name: 'Inner hamstrings', sci: 'Semitendinosus & semimembranosus', role: 'Bends the knee, extends the hip', ex: 'Leg curl, Nordic curl, good mornings' } },

  adduc: {
    fr: { name: 'Adducteurs', sci: 'Long, court et grand adducteurs, pectiné, gracile', role: 'Ramène la jambe vers l’intérieur', ex: 'Machine adducteurs, squat sumo, gainage Copenhague' },
    en: { name: 'Adductors', sci: 'Adductor longus, brevis & magnus, pectineus, gracilis', role: 'Pulls the leg inward', ex: 'Adductor machine, sumo squat, Copenhagen plank' } },

  gastro: {
    fr: { name: 'Gastrocnémiens', sci: 'Gastrocnémiens (« les jumeaux »)', role: 'Pointe le pied, jambe tendue', ex: 'Mollets debout, mollets à la presse' },
    en: { name: 'Gastrocs', sci: 'Gastrocnemius', role: 'Points the foot with a straight knee', ex: 'Standing calf raises, leg-press calf raises' } },
  soleaire: {
    fr: { name: 'Soléaire', sci: 'Soléaire (sous les jumeaux)', role: 'Pointe le pied, genou plié', ex: 'Mollets assis' },
    en: { name: 'Soleus', sci: 'Soleus', role: 'Points the foot with a bent knee', ex: 'Seated calf raises' } },
};

/* Noms courts, pour les étiquettes de l'historique (« Pectoraux · haut, milieu ») */
export const SHORT = {
  fr: { pec_haut: 'haut', pec_mil: 'milieu', pec_bas: 'bas', delt_ant: 'avant', delt_lat: 'latéral', delt_post: 'arrière', coiffe: 'coiffe',
    trap_haut: 'haut', trap_mil: 'milieu', trap_bas: 'bas', dorsal: 'grand dorsal', grand_rond: 'grand rond', lombaires: 'lombaires',
    bic_long: 'chef long', bic_court: 'chef court', brachial: 'brachial', tri_long: 'chef long', tri_lat: 'chef latéral', tri_med: 'chef médial',
    brachiorad: 'brachio-radial', flech: 'fléchisseurs', ext: 'extenseurs', abdos: 'grand droit', obliques: 'obliques',
    fess_grand: 'grand fessier', fess_moy: 'abducteurs', quad_droit: 'droit fémoral', quad_ext: 'vaste externe', quad_int: 'vaste interne',
    ischio_bf: 'biceps fémoral', ischio_st: 'semi-tendineux', adduc: 'adducteurs', gastro: 'gastrocnémiens', soleaire: 'soléaire' },
  en: { pec_haut: 'upper', pec_mil: 'mid', pec_bas: 'lower', delt_ant: 'front', delt_lat: 'side', delt_post: 'rear', coiffe: 'rotator cuff',
    trap_haut: 'upper', trap_mil: 'mid', trap_bas: 'lower', dorsal: 'lats', grand_rond: 'teres major', lombaires: 'lower back',
    bic_long: 'long head', bic_court: 'short head', brachial: 'brachialis', tri_long: 'long head', tri_lat: 'lateral head', tri_med: 'medial head',
    brachiorad: 'brachioradialis', flech: 'flexors', ext: 'extensors', abdos: 'six-pack', obliques: 'obliques',
    fess_grand: 'glute max', fess_moy: 'abductors', quad_droit: 'rectus femoris', quad_ext: 'outer quad', quad_int: 'teardrop',
    ischio_bf: 'outer', ischio_st: 'inner', adduc: 'adductors', gastro: 'gastrocs', soleaire: 'soleus' },
};

export const ALL_MUSCLES = Object.keys(MUSCLES);
export const GROUP_OF = {};
for (const [g, def] of Object.entries(GROUPS)) for (const m of def.muscles) GROUP_OF[m] = g;
export const FAMILY_OF = {};
for (const f of FAMILIES) for (const g of f.groups) FAMILY_OF[g] = f.id;

/* Ancienne version (13 groupes simples) → nouveaux muscles */
export const LEGACY = {
  epaules: ['delt_ant', 'delt_lat', 'delt_post'],
  pectoraux: ['pec_haut', 'pec_mil', 'pec_bas'],
  biceps: ['bic_long', 'bic_court', 'brachial'],
  'avant-bras': ['brachiorad', 'flech', 'ext'],
  abdominaux: ['abdos', 'obliques'],
  quadriceps: ['quad_droit', 'quad_ext', 'quad_int'],
  trapezes: ['trap_haut', 'trap_mil', 'trap_bas'],
  dorsaux: ['dorsal', 'grand_rond'],
  triceps: ['tri_long', 'tri_lat', 'tri_med'],
  lombaires: ['lombaires'],
  fessiers: ['fess_grand', 'fess_moy'],
  ischio: ['ischio_bf', 'ischio_st'],
  mollets: ['gastro', 'soleaire'],
};

/* Études citées (seuils par défaut) */
export const STUDIES = [
  { ref: 'MacDougall et al. (1995)', fr: 'La synthèse des protéines musculaires reste élevée 24 à 36 h après une séance.', en: 'Muscle protein synthesis stays elevated for 24–36 h after a session.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2129163' },
  { ref: 'Phillips et al. (1997)', fr: 'Chez les débutants, elle est encore élevée 48 h après.', en: 'In beginners it is still elevated after 48 h.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2129163' },
  { ref: 'Morán-Navarro et al. (2017)', fr: 'Les séries menées à l’échec rallongent la récupération de 24 à 48 h.', en: 'Training to failure extends recovery by roughly 24–48 h.', url: 'https://pubmed.ncbi.nlm.nih.gov/28965198/' },
  { ref: 'Schoenfeld, Ogborn & Krieger (2016)', fr: 'Entraîner un muscle 2 fois par semaine fait plus progresser que 1 fois.', en: 'Training a muscle twice a week beats once a week for growth.', url: 'https://link.springer.com/10.1007/s40279-016-0543-8' },
  { ref: 'Schoenfeld, Grgic & Krieger (2019)', fr: 'À volume égal, la fréquence compte peu : c’est le volume hebdomadaire qui prime.', en: 'With equal volume, frequency matters little: weekly volume is what counts.', url: 'https://mennohenselmans.com/training-frequency-2018-meta-analysis-review/' },
];

export const DEFAULTS = { recSmall: 48, recBig: 72, targetDays: 5 };
