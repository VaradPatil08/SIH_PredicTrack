/**
 * Delay Reasons and Diagnostic Categories Localization (English & Hindi)
 * Supports:
 * 1. Exact string matches for all backend and mock diagnostic messages
 * 2. Case-insensitive & normalized string lookups
 * 3. Regex pattern matching for dynamic parameterized strings (e.g. station codes, speeds, train numbers)
 * 4. Keyword / semantic fallback matching for unknown strings from live feeds
 * 5. Graceful fallback to original string if no translation exists
 */

export const DELAY_CATEGORIES = {
  TRACK_OCCUPANCY: {
    en: 'Track Congestion',
    hi: 'ट्रैक भीड़ / संकुलन',
  },
  PLATFORM_HOLD: {
    en: 'Waiting for Platform',
    hi: 'प्लेटफ़ॉर्म की प्रतीक्षा',
  },
  INTERLOCKING_HOLD: {
    en: 'Signal Clearance',
    hi: 'सिग्नल क्लीयरेंस विलंब',
  },
  SPEED_RESTRICTION: {
    en: 'Track Work Caution',
    hi: 'ट्रैक रखरखाव सावधानी',
  },
  WEATHER_CAUTION: {
    en: 'Weather Caution',
    hi: 'मौसम सावधानी',
  },
  HEADWAY_PRESSURE: {
    en: 'Commuter Traffic Headway',
    hi: 'शहरी व्यस्त समय दबाव',
  },
  FREIGHT_PRECEDENCE: {
    en: 'Freight Train Priority',
    hi: 'मालगाड़ी प्राथमिकता',
  },
  OHE_VOLTAGE: {
    en: 'OHE Voltage Issue',
    hi: 'ओएचई वोल्टेज उतार-चढ़ाव',
  },
  PLATFORM_OCCUPANCY: {
    en: 'Platform Occupied',
    hi: 'प्लेटफ़ॉर्म व्यस्त',
  },
  SIGNAL_INTERLOCKING: {
    en: 'Interlocking Conflict',
    hi: 'इंटरलॉकिंग मार्ग टकराव',
  },
  CREW_CHANGEOVER: {
    en: 'Crew Changeover',
    hi: 'चालक दल बदलाव',
  },
  SINGLE_LINE_MERGE: {
    en: 'Single-Line Clearance',
    hi: 'सिंगल लाइन क्लीयरेंस',
  },
  BRIDGE_OVERHAUL: {
    en: 'Bridge Inspection Caution',
    hi: 'पुल निरीक्षण सावधानी',
  },
  BRIDGE_MAINTENANCE: {
    en: 'Bridge Maintenance Block',
    hi: 'पुल मरम्मत ब्लॉक',
  },
  SECTION_CLEARANCE: {
    en: 'Section Clearance',
    hi: 'सेक्शन क्लीयरेंस',
  },
  WILDLIFE_CORRIDOR: {
    en: 'Wildlife Corridor Speed',
    hi: 'वन्यजीव गलियारा गति सीमा',
  },
  SIGNAL_CAUTION: {
    en: 'Signal Caution',
    hi: 'सिग्नल सावधानी स्थिति',
  },
  FOG_VISIBILITY: {
    en: 'Fog Visibility Limit',
    hi: 'कोहरा दृश्यता गति सीमा',
  },
  TERMINAL_CONGESTION: {
    en: 'Terminal Congestion',
    hi: 'टर्मिनल स्टेशन भीड़',
  },
  YARD_INTERLOCKING: {
    en: 'Yard Interlocking',
    hi: 'यार्ड इंटरलॉकिंग कतार',
  },
  YARD_CROSSOVER: {
    en: 'Yard Crossover',
    hi: 'यार्ड क्रॉसओवर विलंब',
  },
  YARD_REMODELING: {
    en: 'Yard Remodeling',
    hi: 'यार्ड रीमॉडलिंग कार्य',
  },
  OVERTAKING_SLOT: {
    en: 'Train Overtaking Slot',
    hi: 'ट्रेन ओवरटेकिंग स्लॉट',
  },
  STATION_REDEVELOPMENT: {
    en: 'Station Redevelopment',
    hi: 'स्टेशन पुनर्विकास कार्य',
  },
  SECTION_THROUGHPUT: {
    en: 'Section Throughput',
    hi: 'सेक्शन क्षमता विनियमन',
  },
};

export const DELAY_REASONS_EXACT = {
  // Backend eta.py stationary delay reasons
  'Speed restriction of 30 km/h due to track renewal near Dahisar':
    'दहिसर के पास ट्रैक नवीनीकरण कार्य के कारण 30 किमी/घंटा की गति सीमा',
  'Heavy suburban commuter peak section headway':
    'शहरी उपनगरीय व्यस्त समय के दौरान भारी हेडवे और ट्रैफिक दबाव',
  'Section clearance delay following freight rake precedence at Sachin yard':
    'सचिन यार्ड में मालगाड़ी प्राथमिकता के कारण सेक्शन क्लीयरेंस में विलंब',
  'Overhead Equipment (OHE) voltage fluctuation':
    'ओवरहेड उपकरण (OHE) वोल्टेज में उतार-चढ़ाव',
  'Platform 2 line occupation by delayed 19015 Saurashtra Express':
    'विलंबित 19015 सौराष्ट्र एक्सप्रेस द्वारा प्लेटफ़ॉर्म 2 पर लाइन का घेराव',
  'Yard junction signal interlocking wait at Makarpura':
    'मकरपुरा में यार्ड जंक्शन सिग्नल इंटरलॉकिंग प्रतीक्षा',
  'Crew changeover & brake continuity test extended by 6 mins':
    'चालक दल बदलाव एवं ब्रेक निरंतरता परीक्षण में 6 मिनट का अतिरिक्त समय',
  'Single-line token exchange clearance at Morwani curve':
    'मोरवानी मोड़ पर सिंगल-लाइन टोकन एक्सचेंज क्लीयरेंस',
  'Speed restriction in Chambal bridge section for safety overhaul':
    'सुरक्षा निरीक्षण हेतु चंबल पुल खंड में गति सीमा प्रतिबंध',
  'Preceding goods train clearing Nagda-Kota quad line':
    'नागदा-कोटा क्वाड्रपल लाइन पर आगे चल रही मालगाड़ी की निकासी',
  'Wildlife alert speed reduction (45 km/h) along Ranthambore corridor':
    'रणथंभौर कॉरिडोर पर वन्यजीव चेतावनी के कारण गति में कमी (45 किमी/घंटा)',
  'Signal aspect caution between Gangapur City and Sawai Madhopur':
    'गंगापुर सिटी और सवाई माधोपुर के बीच सिग्नल सावधानी स्थिति',
  'Dense fog visibility condition (< 150m) in NCR approach segment':
    'एनसीआर क्षेत्र में घना कोहरा और कम दृश्यता (< 150 मीटर)',
  'Platform clearance delay for connecting Agra Cantt passenger train':
    'आगरा कैंट पैसेंजर ट्रेन के लिए प्लेटफ़ॉर्म क्लीयरेंस में विलंब',
  'Terminal platform 12 occupancy by delayed Kalka Shatabdi':
    'विलंबित कालका शताब्दी द्वारा टर्मिनल प्लेटफ़ॉर्म 12 का घेराव',
  'Terminal yard congestion at Shivaji Bridge outer signals':
    'शिवाजी ब्रिज बाहरी सिग्नलों पर टर्मिनल यार्ड में भीड़',
  'Ganga Bridge maintenance block speed limit':
    'गंगा पुल रखरखाव ब्लॉक के कारण गति सीमा प्रतिबंध',
  'Heavy freight crossover at Juhi yard':
    'जूही यार्ड में भारी मालगाड़ी क्रॉसओवर संचलन',
  'Yard remodeling block at Naini junction':
    'नैनी जंक्शन पर यार्ड रीमॉडलिंग ब्लॉक कार्य',
  'Congestion clearance post Vande Bharat overtaking slot':
    'वंदे भारत ट्रेन ओवरटेकिंग स्लॉट के बाद भीड़ निकासी',
  'Outer signal wait due to Varanasi Cantt platform renovation':
    'वाराणसी कैंट प्लेटफ़ॉर्म नवीनीकरण कार्य के कारण आउटर सिग्नल प्रतीक्षा',
  'Speed restriction near Shivpur':
    'शिवपुर के पास गति सीमा प्रतिबंध',
  'Monsoon speed restriction in coastal section':
    'तटीय खंड में मानसून के कारण गति सीमा प्रतिबंध',
  'Level crossing gate repair delay':
    'समपार फाटक (लेवल क्रॉसिंग) मरम्मत कार्य विलंब',
  'Narmada river bridge maintenance inspection':
    'नर्मदा नदी पुल रखरखाव एवं सुरक्षा निरीक्षण',
  'Station approach signal hold':
    'स्टेशन पहुंच पर सिग्नल रोक (सिग्नल होल्ड)',
  'Dairy siding shunting movement crossing mainline':
    'मेनलाइन क्रॉस करती हुई डेयरी साइडिंग शंटिंग गतिविधि',
  'Automated signaling test in section':
    'खंड में स्वचालित सिग्नलिंग परीक्षण कार्य',
  'Suburban MEMU crossover delay':
    'उपनगरीय मेमू (MEMU) क्रॉसओवर विलंब',
  'Platform dwell extended for parcel loading':
    'पार्सल लोडिंग हेतु प्लेटफ़ॉर्म पर ठहराव समय में वृद्धि',
  'Terminal approach track maintenance':
    'टर्मिनल पहुंच मार्ग पर ट्रैक रखरखाव',
  'Platform 1 signal clearance queue':
    'प्लेटफ़ॉर्म 1 सिग्नल क्लीयरेंस कतार',
  'Coal freight rake clearance at Sitarampur':
    'सीतारामपुर में कोयला मालगाड़ी निकासी',
  'Section speed caution due to ballast work':
    'गिट्टी (बैलास्ट) कार्य के कारण खंड में गति सावधानी',
  'Coalfield junction priority conflict':
    'कोयला खदान जंक्शन पर ट्रेन प्राथमिकता टकराव',
  'OHE maintenance speed restriction':
    'ओएचई (OHE) रखरखाव के कारण गति सीमा प्रतिबंध',
  'Ghat section gradient descent regulated speed':
    'घाट खंड में ढलान पर नियंत्रित गति संचलन',
  'Automatic block signaling glitch resolved':
    'स्वचालित ब्लॉक सिग्नलिंग तकनीकी समस्या का समाधान',
  'Crew change and loco inspection duration':
    'चालक दल बदलाव एवं लोकोमोटिव निरीक्षण समय',
  'Grand Chord junction track crossover':
    'ग्रैंड कॉर्ड जंक्शन ट्रैक क्रॉसओवर संचलन',
  'Major freight corridor interchange clearance at Mughalsarai yards':
    'मुगलसराय यार्ड में प्रमुख माल गलियारा इंटरचेंज निकासी',
  'Double-headed container rake precedence':
    'डबल-हेडेड कंटेनर मालगाड़ी को प्राथमिकता',
  'Section speed restriction due to track maintenance work ahead':
    'आगे ट्रैक रखरखाव कार्य के कारण सेक्शन में गति सीमा प्रतिबंध',
  'Preceding express train clearance delay at junction signals':
    'जंक्शन सिग्नलों पर आगे चल रही एक्सप्रेस ट्रेन की निकासी में विलंब',

  // Frontend mock & structured messages
  'TSR caution (30 km/h) due to track renewal work near Dahisar curve.':
    'दहिसर मोड़ के पास ट्रैक नवीनीकरण कार्य के कारण सावधानी गति सीमा (30 किमी/घंटा)।',
  'Heavy suburban commuter peak-hour section occupancy headway.':
    'शहरी उपनगरीय व्यस्त समय के दौरान भारी सेक्शन ऑक्यूपेंसी हेडवे।',
  'Section clearance delay following container rake precedence at Sachin yard.':
    'सचिन यार्ड में कंटेनर मालगाड़ी प्राथमिकता के कारण सेक्शन क्लीयरेंस में विलंब।',
  'Overhead Equipment catenary voltage fluctuation regulated train speed.':
    'ओवरहेड उपकरण (OHE) वोल्टेज में उतार-चढ़ाव के कारण गति नियंत्रण।',
  'Platform 2 line occupation by delayed 19015 Saurashtra Express.':
    'विलंबित 19015 सौराष्ट्र एक्सप्रेस द्वारा प्लेटफ़ॉर्म 2 का घेराव।',
  'Yard junction signal interlocking route conflict at Makarpura.':
    'मकरपुरा में यार्ड जंक्शन सिग्नल इंटरलॉकिंग मार्ग टकराव।',
  'Token exchange clearance wait at Morwani single-track junction.':
    'मोरवानी सिंगल-ट्रैक जंक्शन पर टोकन एक्सचेंज क्लीयरेंस प्रतीक्षा।',
  'Safety speed caution along Chambal bridge girder inspection segment.':
    'चंबल पुल गर्डर निरीक्षण खंड में सुरक्षा सावधानी गति सीमा।',
  'Preceding heavy freight rake clearing Nagda-Kota quad line.':
    'नागदा-कोटा क्वाड्रपल लाइन पर आगे चल रही भारी मालगाड़ी की निकासी।',
  'Ranthambore corridor wildlife caution speed restriction (45 km/h).':
    'रणथंभौर कॉरिडोर पर वन्यजीव चेतावनी गति सीमा प्रतिबंध (45 किमी/घंटा)।',
  'Automated block signaling aspect hold near Gangapur City.':
    'गंगापुर सिटी के पास स्वचालित ब्लॉक सिग्नलिंग होल्ड।',
  'Dense fog visibility restriction (< 150m) requiring fog safety speed ceiling.':
    'घना कोहरा और कम दृश्यता (< 150 मीटर) के कारण कोहरा सुरक्षा गति सीमा।',
  'Platform clearance queue for connecting Agra Cantt passenger rake.':
    'आगरा कैंट पैसेंजर ट्रेन के लिए प्लेटफ़ॉर्म क्लीयरेंस कतार।',
  'Terminal platform 12 occupation by incoming delayed Shatabdi.':
    'आगमन करने वाली विलंबित शताब्दी ट्रेन द्वारा टर्मिनल प्लेटफ़ॉर्म 12 का घेराव।',
  'Shivaji Bridge outer approach interlocking queue.':
    'शिवाजी ब्रिज बाहरी पहुंच पर इंटरलॉकिंग कतार।',
  'Ganga bridge structural maintenance block speed restriction.':
    'गंगा पुल संरचनात्मक रखरखाव ब्लॉक गति सीमा प्रतिबंध।',
  'Juhi freight yard rake crossover precedence conflict.':
    'जूही माल यार्ड में ट्रेन क्रॉसओवर प्राथमिकता टकराव।',
  'Yard track remodeling block caution near Naini junction.':
    'नैनी जंक्शन के पास यार्ड ट्रैक रीमॉडलिंग ब्लॉक सावधानी।',
  'Line clearance post Vande Bharat high-priority overtaking slot.':
    'वंदे भारत उच्च-प्राथमिकता ओवरटेकिंग स्लॉट के बाद लाइन निकासी।',
  'Outer signal wait due to Varanasi Cantt platform renovation work.':
    'वाराणसी कैंट प्लेटफ़ॉर्म नवीनीकरण कार्य के कारण आउटर सिग्नल प्रतीक्षा।',
  'Waiting for signal clearance ahead of station.':
    'स्टेशन के आगे सिग्नल क्लीयरेंस की प्रतीक्षा।',
  'Temporary speed caution due to sectional maintenance work ahead.':
    'आगे सेक्शनल रखरखाव कार्य के कारण अस्थायी गति सावधानी।',
  'Automated block signalling interval headway regulation.':
    'स्वचालित ब्लॉक सिग्नलिंग अंतराल हेडवे विनियमन।',
  'Speed caution':
    'सावधानी गति सीमा',

  // Common prompt & external API expressions
  'Late due to fog':
    'कोहरे के कारण विलंबित',
  'Late due to dense fog':
    'घने कोहरे के कारण विलंबित',
  'Signal failure ahead':
    'आगे सिग्नल विफलता / खराबी',
  'Signal failure':
    'सिग्नल खराबी / विफलता',
  'Signal clearance delay':
    'सिग्नल क्लीयरेंस विलंब',
  'Track maintenance ahead':
    'आगे रेलवे ट्रैक रखरखाव कार्य',
  'Track maintenance work':
    'ट्रैक रखरखाव कार्य',
  'Platform occupied':
    'प्लेटफ़ॉर्म व्यस्त',
  'Platform unavailable':
    'प्लेटफ़ॉर्म अनुपलब्ध',
  'Waiting for platform':
    'प्लेटफ़ॉर्म की प्रतीक्षा',
  'Waiting for platform clearance':
    'प्लेटफ़ॉर्म क्लीयरेंस की प्रतीक्षा',
  'Preceding freight train priority':
    'आगे चल रही मालगाड़ी को प्राथमिकता',
  'Freight train priority':
    'मालगाड़ी प्राथमिकता',
  'OHE breakdown':
    'ओएचई (विद्युत तार) तकनीकी समस्या',
  'Loco breakdown':
    'इंजन (लोको) में तकनीकी समस्या',
  'Engine failure':
    'इंजन खराबी',
  'Speed restriction':
    'गति सीमा प्रतिबंध',
  'Caution order active':
    'सावधानी आदेश (कॉशन ऑर्डर) सक्रिय',
  'Weather caution':
    'मौसम सावधानी स्थिति',
  'Heavy rain / waterlogging':
    'भारी बारिश / जलभराव के कारण विलंब',
  'Cattle runover on track':
    'ट्रैक पर मवेशी आ जाने के कारण विलंब',
  'Level crossing gate open':
    'समपार फाटक खुला होने के कारण विलंब',
  'Route diversion':
    'मार्ग परिवर्तन (डायवर्जन)',
};

// Normalized lowercase lookup map built from DELAY_REASONS_EXACT
const NORMALIZED_LOOKUP = Object.entries(DELAY_REASONS_EXACT).reduce((acc, [key, val]) => {
  const norm = key.trim().toLowerCase().replace(/[.,!?:;]+$/, '');
  acc[norm] = val;
  return acc;
}, {});

// Regex patterns for dynamic parameters
const DYNAMIC_PATTERNS = [
  {
    pattern: /^Section line clearance wait outside ([A-Z0-9_\s-]+)\.?$/i,
    render: (code) => `${code.trim()} के बाहर सेक्शन लाइन क्लीयरेंस की प्रतीक्षा।`,
  },
  {
    pattern: /^Engineering caution speed limit in ([A-Z0-9_\s-]+) approach section\.?$/i,
    render: (code) => `${code.trim()} पहुंच खंड में इंजीनियरिंग सावधानी गति सीमा।`,
  },
  {
    pattern: /^(?:TSR caution|Speed restriction) \(?(\d+)\s*km\/h\)? due to track renewal (?:work )?near (.*?)\.?$/i,
    render: (speed, place) => `${place.trim()} के पास ट्रैक नवीनीकरण कार्य के कारण सावधानी गति सीमा (${speed} किमी/घंटा)।`,
  },
  {
    pattern: /^Platform (\d+) line occupation by delayed (.*?)\.?$/i,
    render: (pf, train) => `विलंबित ${train.trim()} द्वारा प्लेटफ़ॉर्म ${pf} का घेराव।`,
  },
  {
    pattern: /^Outer signal wait due to (.*?) platform renovation(?: work)?\.?$/i,
    render: (station) => `${station.trim()} प्लेटफ़ॉर्म नवीनीकरण कार्य के कारण आउटर सिग्नल प्रतीक्षा।`,
  },
  {
    pattern: /^Waiting for signal clearance ahead of (.*?)\.?$/i,
    render: (station) => `${station.trim()} के आगे सिग्नल क्लीयरेंस की प्रतीक्षा।`,
  },
  {
    pattern: /^Temporary speed caution due to (.*?)\.?$/i,
    render: (reason) => `${reason.trim()} के कारण अस्थायी गति सावधानी।`,
  },
  {
    pattern: /^Speed restriction near (.*?)\.?$/i,
    render: (place) => `${place.trim()} के पास गति सीमा प्रतिबंध।`,
  },
  {
    pattern: /^Preceding (.*?) train clearance delay at junction signals\.?$/i,
    render: (type) => `जंक्शन सिग्नलों पर आगे चल रही ${type.trim()} ट्रेन की निकासी में विलंब।`,
  },
];

/**
 * Translates a train delay diagnostic reason into Hindi or active language.
 * Falls back gracefully to original string if no translation is found.
 */
export function translateDelayReason(reason, language = 'en') {
  if (!reason || typeof reason !== 'string') return reason || '';
  if (language !== 'hi') return reason;

  const trimmed = reason.trim();
  if (!trimmed) return '';

  // 1. Direct exact lookup
  if (DELAY_REASONS_EXACT[trimmed]) {
    return DELAY_REASONS_EXACT[trimmed];
  }

  // Check without trailing period / punctuation
  const stripped = trimmed.replace(/[.,!?:;]+$/, '');
  if (DELAY_REASONS_EXACT[stripped]) {
    return DELAY_REASONS_EXACT[stripped];
  }

  // 2. Case-insensitive / normalized lookup
  const normKey = stripped.toLowerCase();
  if (NORMALIZED_LOOKUP[normKey]) {
    return NORMALIZED_LOOKUP[normKey];
  }

  // 3. Pattern matching for dynamic parameters
  for (const { pattern, render } of DYNAMIC_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return render(match[1], match[2]);
    }
  }

  // 4. Keyword / semantic fallback matchers for live feed & external API strings
  const lower = normKey;
  if (lower.includes('fog') || lower.includes('visibility') || lower.includes('smog')) {
    return 'घना कोहरा और कम दृश्यता के कारण गति प्रतिबंध।';
  }
  if (lower.includes('signal') || lower.includes('interlocking') || lower.includes('aspect') || lower.includes('route conflict')) {
    return 'सिग्नल क्लीयरेंस एवं इंटरलॉकिंग मार्ग प्रतीक्षा।';
  }
  if (lower.includes('freight') || lower.includes('goods train') || lower.includes('rake precedence')) {
    return 'आगे चल रही मालगाड़ी की निकासी हेतु प्राथमिकता।';
  }
  if (lower.includes('platform') || lower.includes('dwell') || lower.includes('station approach hold')) {
    return 'प्लेटफ़ॉर्म उपलब्धता एवं क्लीयरेंस में विलंब।';
  }
  if (lower.includes('track renewal') || lower.includes('maintenance') || lower.includes('ballast') || lower.includes('tsr') || lower.includes('track work')) {
    return 'ट्रैक रखरखाव एवं इंजीनियरिंग मरम्मत कार्य सावधानी।';
  }
  if (lower.includes('crew') || lower.includes('changeover') || lower.includes('brake test') || lower.includes('loco inspection')) {
    return 'चालक दल बदलाव एवं ब्रेक निरंतरता परीक्षण समय।';
  }
  if (lower.includes('bridge') || lower.includes('girder')) {
    return 'पुल निरीक्षण एवं सुरक्षा गति नियंत्रण प्रतिबंध।';
  }
  if (lower.includes('monsoon') || lower.includes('rain') || lower.includes('flood') || lower.includes('waterlogging')) {
    return 'मौसम एवं भारी बारिश के कारण नियंत्रित गति।';
  }
  if (lower.includes('overtaking') || lower.includes('overtake') || lower.includes('precedence')) {
    return 'उच्च-प्राथमिकता ट्रेन ओवरटेकिंग क्लीयरेंस।';
  }
  if (lower.includes('wildlife') || lower.includes('animal') || lower.includes('corridor')) {
    return 'वन्यजीव गलियारा गति सीमा सावधानी।';
  }
  if (lower.includes('voltage') || lower.includes('ohe') || lower.includes('catenary') || lower.includes('power')) {
    return 'ओएचई (OHE) विद्युत वोल्टेज उतार-चढ़ाव।';
  }
  if (lower.includes('token exchange') || lower.includes('single line') || lower.includes('single-line')) {
    return 'सिंगल-लाइन टोकन एक्सचेंज एवं लाइन क्लीयरेंस।';
  }
  if (lower.includes('level crossing') || lower.includes('lc gate')) {
    return 'समपार फाटक (लेवल क्रॉसिंग) मरम्मत / संचालन विलंब।';
  }

  // 5. Graceful fallback: return original string untouched without throwing errors
  return trimmed;
}

/**
 * Translates a diagnostic category code (e.g. 'SPEED_RESTRICTION') into localized title.
 */
export function translateDelayCategory(categoryCode, language = 'en') {
  if (!categoryCode) return language === 'hi' ? 'विलंब का कारण' : 'Delay Reason';
  const normKey = String(categoryCode).trim().toUpperCase();

  const found = DELAY_CATEGORIES[normKey];
  if (found) {
    return language === 'hi' ? found.hi : found.en;
  }

  // If unknown category, format nicely
  return normKey
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
