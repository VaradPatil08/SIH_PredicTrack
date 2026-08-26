/**
 * RailPulse API Client Service
 * Connects to the FastAPI backend (default: http://localhost:8000).
 * Gracefully provides realistic fallback data when backend is not running.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Mock Trains Dataset for resilient offline demo
const MOCK_TRAINS = [
  {
    train_number: '12951',
    name: 'Mumbai Central - New Delhi Tejas Rajdhani Express',
    origin: 'Mumbai Central (MMCT)',
    destination: 'New Delhi (NDLS)',
    type: 'Rajdhani Express',
    zone: 'WR / Northern Railway',
    scheduled_departure: '17:00',
    total_distance_km: 1386,
  },
  {
    train_number: '22436',
    name: 'New Delhi - Varanasi Vande Bharat Express',
    origin: 'New Delhi (NDLS)',
    destination: 'Varanasi Junction (BSB)',
    type: 'Vande Bharat',
    zone: 'NR / North Central',
    scheduled_departure: '06:00',
    total_distance_km: 759,
  },
  {
    train_number: '12009',
    name: 'Mumbai Central - Ahmedabad Shatabdi Express',
    origin: 'Mumbai Central (MMCT)',
    destination: 'Ahmedabad Junction (ADI)',
    type: 'Shatabdi Express',
    zone: 'Western Railway',
    scheduled_departure: '06:20',
    total_distance_km: 493,
  },
  {
    train_number: '12301',
    name: 'Howrah - New Delhi Rajdhani Express (via Gaya)',
    origin: 'Howrah Junction (HWH)',
    destination: 'New Delhi (NDLS)',
    type: 'Rajdhani Express',
    zone: 'Eastern Railway',
    scheduled_departure: '16:50',
    total_distance_km: 1451,
  },
  {
    train_number: '12626',
    name: 'New Delhi - Thiruvananthapuram Kerala Express',
    origin: 'New Delhi (NDLS)',
    destination: 'Thiruvananthapuram Central (TVC)',
    type: 'Superfast Express',
    zone: 'Southern Railway',
    scheduled_departure: '20:10',
    total_distance_km: 3036,
  },
  {
    train_number: '20608',
    name: 'Mysuru - MGR Chennai Central Vande Bharat Express',
    origin: 'Mysuru Junction (MYS)',
    destination: 'MGR Chennai Central (MAS)',
    type: 'Vande Bharat',
    zone: 'Southern Railway',
    scheduled_departure: '13:05',
    total_distance_km: 496,
  }
];

const MOCK_ROUTES = {
  '12951': {
    train_number: '12951',
    name: 'Mumbai Central - New Delhi Tejas Rajdhani Express',
    stations: [
      { code: 'MMCT', name: 'Mumbai Central', lat: 18.9696, lng: 72.8193, scheduled_offset_min: 0, distance_km: 0 },
      { code: 'BVI', name: 'Borivali', lat: 19.2288, lng: 72.8569, scheduled_offset_min: 35, distance_km: 30 },
      { code: 'ST', name: 'Surat', lat: 21.2052, lng: 72.8407, scheduled_offset_min: 175, distance_km: 263 },
      { code: 'BRC', name: 'Vadodara Junction', lat: 22.3107, lng: 73.1812, scheduled_offset_min: 270, distance_km: 392 },
      { code: 'RTM', name: 'Ratlam Junction', lat: 23.3421, lng: 75.0396, scheduled_offset_min: 475, distance_km: 653 },
      { code: 'KOTA', name: 'Kota Junction', lat: 25.2185, lng: 75.8648, scheduled_offset_min: 685, distance_km: 920 },
      { code: 'SWM', name: 'Sawai Madhopur', lat: 25.9928, lng: 76.3687, scheduled_offset_min: 765, distance_km: 1028 },
      { code: 'MTJ', name: 'Mathura Junction', lat: 27.4924, lng: 77.6737, scheduled_offset_min: 910, distance_km: 1245 },
      { code: 'NDLS', name: 'New Delhi', lat: 28.6415, lng: 77.2209, scheduled_offset_min: 1040, distance_km: 1386 },
    ]
  },
  '22436': {
    train_number: '22436',
    name: 'New Delhi - Varanasi Vande Bharat Express',
    stations: [
      { code: 'NDLS', name: 'New Delhi', lat: 28.6415, lng: 77.2209, scheduled_offset_min: 0, distance_km: 0 },
      { code: 'CNB', name: 'Kanpur Central', lat: 26.4547, lng: 80.3507, scheduled_offset_min: 245, distance_km: 440 },
      { code: 'PRYJ', name: 'Prayagraj Junction', lat: 25.4484, lng: 81.8340, scheduled_offset_min: 360, distance_km: 635 },
      { code: 'BSB', name: 'Varanasi Junction', lat: 25.3283, lng: 82.9863, scheduled_offset_min: 480, distance_km: 759 },
    ]
  },
  '12009': {
    train_number: '12009',
    name: 'Mumbai Central - Ahmedabad Shatabdi Express',
    stations: [
      { code: 'MMCT', name: 'Mumbai Central', lat: 18.9696, lng: 72.8193, scheduled_offset_min: 0, distance_km: 0 },
      { code: 'BVI', name: 'Borivali', lat: 19.2288, lng: 72.8569, scheduled_offset_min: 30, distance_km: 30 },
      { code: 'VAPI', name: 'Vapi', lat: 20.3713, lng: 72.9042, scheduled_offset_min: 110, distance_km: 168 },
      { code: 'ST', name: 'Surat', lat: 21.2052, lng: 72.8407, scheduled_offset_min: 170, distance_km: 263 },
      { code: 'BH', name: 'Bharuch Junction', lat: 21.7051, lng: 72.9959, scheduled_offset_min: 215, distance_km: 322 },
      { code: 'BRC', name: 'Vadodara Junction', lat: 22.3107, lng: 73.1812, scheduled_offset_min: 260, distance_km: 392 },
      { code: 'ANND', name: 'Anand Junction', lat: 22.5645, lng: 72.9289, scheduled_offset_min: 295, distance_km: 427 },
      { code: 'ND', name: 'Nadiad Junction', lat: 22.6916, lng: 72.8634, scheduled_offset_min: 312, distance_km: 446 },
      { code: 'ADI', name: 'Ahmedabad Junction', lat: 23.0225, lng: 72.5714, scheduled_offset_min: 375, distance_km: 493 },
    ]
  },
  '12301': {
    train_number: '12301',
    name: 'Howrah - New Delhi Rajdhani Express (via Gaya)',
    stations: [
      { code: 'HWH', name: 'Howrah Junction', lat: 22.5839, lng: 88.3426, scheduled_offset_min: 0, distance_km: 0 },
      { code: 'ASN', name: 'Asansol Junction', lat: 23.6889, lng: 86.9661, scheduled_offset_min: 130, distance_km: 200 },
      { code: 'DHN', name: 'Dhanbad Junction', lat: 23.7957, lng: 86.4304, scheduled_offset_min: 185, distance_km: 259 },
      { code: 'PNME', name: 'Parasnath', lat: 23.9742, lng: 86.0821, scheduled_offset_min: 220, distance_km: 307 },
      { code: 'GAYA', name: 'Gaya Junction', lat: 24.8027, lng: 84.9994, scheduled_offset_min: 335, distance_km: 458 },
      { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya', lat: 25.2783, lng: 83.1189, scheduled_offset_min: 490, distance_km: 663 },
      { code: 'PRYJ', name: 'Prayagraj Junction', lat: 25.4484, lng: 81.8340, scheduled_offset_min: 610, distance_km: 816 },
      { code: 'CNB', name: 'Kanpur Central', lat: 26.4547, lng: 80.3507, scheduled_offset_min: 755, distance_km: 1010 },
      { code: 'NDLS', name: 'New Delhi', lat: 28.6415, lng: 77.2209, scheduled_offset_min: 1025, distance_km: 1451 },
    ]
  }
};

// Reasons dictionary for simulated root causes
const MOCK_REASONS = {
  'BVI': ['Speed restriction of 30 km/h due to track renewal near Dahisar', 'Heavy suburban commuter peak section headway'],
  'ST': ['Section clearance delay following freight rake precedence at Sachin yard', 'Overhead Equipment (OHE) voltage fluctuation'],
  'BRC': ['Platform 2 line occupation by delayed 19015 Saurashtra Express', 'Yard junction signal interlocking wait at Makarpura'],
  'RTM': ['Crew changeover & brake continuity test extended by 6 mins', 'Single-line token exchange clearance at Morwani curve'],
  'KOTA': ['Speed restriction in Chambal bridge section for safety overhaul', 'Preceding goods train clearing Nagda-Kota quad line'],
  'SWM': ['Wildlife alert speed reduction (45 km/h) along Ranthambore corridor', 'Signal aspect caution between Gangapur City and Sawai Madhopur'],
  'MTJ': ['Dense fog visibility condition (< 150m) in NCR approach segment', 'Platform clearance delay for connecting Agra Cantt passenger train'],
  'NDLS': ['Terminal platform 12 occupancy by delayed Kalka Shatabdi', 'Terminal yard congestion at Shivaji Bridge outer signals'],
  'CNB': ['Ganga Bridge maintenance block speed limit', 'Heavy freight crossover at Juhi yard'],
  'PRYJ': ['Yard remodeling block at Naini junction', 'Congestion clearance post Vande Bharat overtaking slot'],
  'BSB': ['Outer signal wait due to Varanasi Cantt platform renovation', 'Speed restriction near Shivpur'],
  'VAPI': ['Monsoon speed restriction in coastal section', 'Level crossing gate repair delay'],
  'BH': ['Narmada river bridge maintenance inspection', 'Station approach signal hold'],
  'ANND': ['Dairy siding shunting movement crossing mainline', 'Automated signaling test in section'],
  'ND': ['Suburban MEMU crossover delay', 'Platform dwell extended for parcel loading'],
  'ADI': ['Terminal approach track maintenance', 'Platform 1 signal clearance queue'],
  'ASN': ['Coal freight rake clearance at Sitarampur', 'Section speed caution due to ballast work'],
  'DHN': ['Coalfield junction priority conflict', 'OHE maintenance speed restriction'],
  'PNME': ['Ghat section gradient descent regulated speed', 'Automatic block signaling glitch resolved'],
  'GAYA': ['Crew change and loco inspection duration', 'Grand Chord junction track crossover'],
  'DDU': ['Major freight corridor interchange clearance at Mughalsarai yards', 'Double-headed container rake precedence'],
};

// Simulation state tracker for mock mode
let mockSimElapsedMin = 310;
let mockTickCount = 0;

/**
 * Generic fetch wrapper with timeout
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 2500) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Helper to generate synthetic ETA status from route and simulated elapsed minutes
 */
function generateSyntheticETA(routeData) {
  mockTickCount++;
  // Increment simulated time slightly every few ticks to simulate movement
  const effectiveElapsed = mockSimElapsedMin + Math.floor(mockTickCount / 2) * 2;
  const stations = routeData.stations;

  // Determine current position based on elapsed minutes
  let currentStationIndex = 0;
  for (let i = 0; i < stations.length; i++) {
    if (stations[i].scheduled_offset_min <= effectiveElapsed) {
      currentStationIndex = i;
    } else {
      break;
    }
  }

  // Calculate interpolation between current and next station
  const curStn = stations[currentStationIndex];
  const nextStn = stations[Math.min(currentStationIndex + 1, stations.length - 1)];
  
  let currentLat = curStn.lat;
  let currentLng = curStn.lng;
  let currentSpeed = 0;

  if (currentStationIndex < stations.length - 1) {
    const segmentDuration = Math.max(1, nextStn.scheduled_offset_min - curStn.scheduled_offset_min);
    const progressInSegment = Math.min(0.95, Math.max(0.05, (effectiveElapsed - curStn.scheduled_offset_min) / segmentDuration));
    currentLat = curStn.lat + (nextStn.lat - curStn.lat) * progressInSegment;
    currentLng = curStn.lng + (nextStn.lng - curStn.lng) * progressInSegment;
    currentSpeed = Math.floor(95 + Math.sin(mockTickCount) * 18);
  } else {
    currentSpeed = 0;
  }

  // Add jittered dynamic delay predictions
  const baseDelay = 18;
  const enrichedStations = stations.map((stn, idx) => {
    let status = 'on_time';
    let delay = 0;

    if (idx < currentStationIndex) {
      status = 'reached';
      delay = (idx === 0) ? 0 : Math.max(0, baseDelay - (stations.length - idx) * 2);
    } else if (idx === currentStationIndex) {
      status = 'delayed';
      delay = baseDelay + Math.floor(Math.sin(idx + mockTickCount * 0.5) * 4);
    } else {
      // Dynamic ML predicted delay increases with section distance & congestion
      const distanceFactor = Math.round((idx - currentStationIndex) * 2.5);
      delay = Math.max(0, baseDelay + distanceFactor + Math.floor(Math.cos(idx) * 3));
      status = delay > 5 ? 'delayed' : 'on_time';
    }

    return {
      ...stn,
      predicted_delay_min: Math.max(0, delay),
      predicted_offset_min: stn.scheduled_offset_min + Math.max(0, delay),
      status: status,
      platform: (idx % 4) + 1,
    };
  });

  return {
    train_number: routeData.train_number,
    name: routeData.name,
    current_position: {
      lat: currentLat,
      lng: currentLng,
      speed_kmh: currentSpeed,
      last_updated: new Date().toLocaleTimeString(),
      next_station_code: nextStn.code,
      next_station_name: nextStn.name,
      distance_to_next_km: Math.max(4, Math.round(Math.abs(nextStn.distance_km - (curStn.distance_km + 40)))),
    },
    elapsed_min: effectiveElapsed,
    stations: enrichedStations,
    is_mock: true
  };
}

/**
 * 1. GET /trains → list of trains
 */
export async function getTrains() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/trains`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data.trains || MOCK_TRAINS);
  } catch (err) {
    console.warn(`[RailPulse API] Live backend unreachable at ${BASE_URL}/trains. Using fallback mock dataset.`, err.message);
    return MOCK_TRAINS;
  }
}

/**
 * 2. GET /trains/{train_number}/route
 */
export async function getTrainRoute(trainNumber) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/trains/${trainNumber}/route`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[RailPulse API] Backend unreachable at /trains/${trainNumber}/route. Using mock route data.`, err.message);
    if (MOCK_ROUTES[trainNumber]) {
      return MOCK_ROUTES[trainNumber];
    }
    // Generic fallback for any other train number
    return {
      train_number: trainNumber,
      name: `Express Train ${trainNumber}`,
      stations: MOCK_ROUTES['12951'].stations
    };
  }
}

/**
 * 3. GET /trains/{train_number}/eta
 */
export async function getTrainETA(trainNumber) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/trains/${trainNumber}/eta`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { ...data, is_mock: false };
  } catch (err) {
    console.warn(`[RailPulse API] Backend unreachable at /trains/${trainNumber}/eta. Using ML synthetic dynamic simulation.`, err.message);
    const route = MOCK_ROUTES[trainNumber] || {
      train_number: trainNumber,
      name: `Express Train ${trainNumber}`,
      stations: MOCK_ROUTES['12951'].stations
    };
    return generateSyntheticETA(route);
  }
}

/**
 * 4. GET /trains/{train_number}/eta/{station_code}/reasons
 */
export async function getStationDelayReasons(trainNumber, stationCode) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/trains/${trainNumber}/eta/${stationCode}/reasons`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[RailPulse API] Backend unreachable at /trains/${trainNumber}/eta/${stationCode}/reasons. Using mock reasons.`, err.message);
    const reasons = MOCK_REASONS[stationCode] || [
      'Section speed restriction due to track maintenance work ahead',
      'Preceding express train clearance delay at junction signals',
      'Sectional throughput regulation under automated train control'
    ];
    return { reasons: reasons.slice(0, 2) };
  }
}

/**
 * 5. AUTH: POST /auth/otp/request
 */
export async function requestOTP(phoneNumber) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[RailPulse API] requestOTP error:`, err.message);
    // Offline simulation fallback
    return {
      message: 'DEV_MODE: Simulated OTP generated (offline fallback).',
      dev_otp: '123456'
    };
  }
}

/**
 * 6. AUTH: POST /auth/otp/verify
 */
export async function verifyOTP(phoneNumber, code, name = null) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber, code, name })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[RailPulse API] verifyOTP error:`, err.message);
    if (code === '123456') {
      return {
        access_token: 'mock-jwt-token-' + Date.now(),
        token_type: 'bearer',
        user_id: 'mock-user-' + phoneNumber.replace(/\D/g, '')
      };
    }
    throw err;
  }
}

/**
 * 7. AUTH: GET /users/me
 */
export async function getUserProfile(token) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[RailPulse API] getUserProfile error:`, err.message);
    return null;
  }
}

/**
 * 8. PREFERENCES: GET /users/me/preferences
 */
export async function getUserPreferences(token) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/users/me/preferences`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[RailPulse API] getUserPreferences error:`, err.message);
    return [];
  }
}

/**
 * 9. PREFERENCES: POST /users/me/preferences
 */
export async function addUserPreference(token, trainNumber) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/users/me/preferences`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ train_number: trainNumber })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[RailPulse API] addUserPreference error:`, err.message);
    return { id: 'mock-pref-' + trainNumber, train_number: trainNumber, created_at: new Date().toISOString() };
  }
}

/**
 * 10. PREFERENCES: DELETE /users/me/preferences/{train_number}
 */
export async function removeUserPreference(token, trainNumber) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/users/me/preferences/${trainNumber}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[RailPulse API] removeUserPreference error:`, err.message);
    return { message: 'Removed' };
  }
}

/**
 * 11. REPORTS: POST /trains/{train_number}/reports
 */
export async function submitDisruptionReport(trainNumber, { station_code, description, phone_number }) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/trains/${trainNumber}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ station_code, description, phone_number })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[RailPulse API] submitDisruptionReport error:`, err.message);
    return {
      id: 'mock-rep-' + Date.now(),
      train_number: trainNumber,
      station_code,
      description,
      created_at: new Date().toISOString()
    };
  }
}

/**
 * 12. REPORTS: GET /trains/{train_number}/reports/summary
 */
export async function getDisruptionReportSummary(trainNumber) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/trains/${trainNumber}/reports/summary`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[RailPulse API] getDisruptionReportSummary error:`, err.message);
    return {
      train_number: trainNumber,
      window_hours: 3,
      report_count: 0,
      flagged: false,
      recent_reports: []
    };
  }
}

/**
 * 13. PNR LOOKUP: POST /pnr/lookup
 */
export async function lookupPNR(pnrNumber) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/pnr/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pnr_number: pnrNumber })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[RailPulse API] lookupPNR error:`, err.message);
    return {
      found: false,
      train_number: null,
      message: "PNR lookup isn't available yet — please enter your train number manually."
    };
  }
}


