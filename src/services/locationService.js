/**
 * RideSaathi Location Service
 * Powered by Photon (OpenStreetMap-based geocoder)
 * API: https://photon.komoot.io/api/
 */

const PHOTON_API_URL = 'https://photon.komoot.io/api/';

// Lucknow approximate coordinates for location biasing
const LUCKNOW_LAT = 26.8467;
const LUCKNOW_LON = 80.9462;

// Common abbreviation expansions for better typo tolerance in Indian urban contexts
const expandAbbreviations = (query) => {
  if (!query) return '';
  return query
    .replace(/\bngr\b/gi, 'nagar')
    .replace(/\brd\b/gi, 'road')
    .replace(/\bstn\b/gi, 'station')
    .replace(/\bsec\b/gi, 'sector')
    .replace(/\bcantt\b/gi, 'cantonment')
    .replace(/\bjn\b/gi, 'junction')
    .replace(/\bext\b/gi, 'extension')
    .replace(/\bmkt\b/gi, 'market')
    .replace(/\bchauraha\b/gi, 'crossing')
    .trim();
};

/**
 * Calculates a relevancy score for ranking locations.
 * Biases towards Lucknow, Uttar Pradesh, and India, while keeping global/intercity results accessible.
 */
const calculateLocationScore = (feature) => {
  const p = feature.properties || {};
  let score = 0;

  const isIndia = p.countrycode === 'IN' || (p.country && p.country.toLowerCase() === 'india');
  if (isIndia) score += 100;

  const isUP = p.state && p.state.toLowerCase() === 'uttar pradesh';
  if (isUP) score += 50;

  const isLucknow =
    (p.city && p.city.toLowerCase() === 'lucknow') ||
    (p.district && p.district.toLowerCase() === 'lucknow') ||
    (p.county && p.county.toLowerCase() === 'lucknow');
  if (isLucknow) score += 50;

  return score;
};

/**
 * Formats a Photon feature into a normalized canonical location object.
 */
const formatFeature = (feature) => {
  const p = feature.properties || {};
  const coords = feature.geometry?.coordinates || [0, 0];
  const lon = coords[0];
  const lat = coords[1];

  const primaryText = p.name || p.street || p.district || p.city || 'Unknown Location';

  const secondaryParts = [
    p.street && p.street !== primaryText ? p.street : null,
    p.district && p.district !== primaryText ? p.district : null,
    p.city && p.city !== primaryText ? p.city : null,
    p.state,
    p.country
  ].filter(Boolean);

  // Deduplicate consecutive identical elements
  const dedupedSecondary = secondaryParts.filter((part, idx, arr) => arr.indexOf(part) === idx);
  const secondaryText = dedupedSecondary.join(', ');

  // Create clean canonical label (e.g. "Alambagh, Lucknow" or "Alambagh, Lucknow, Uttar Pradesh")
  let label = primaryText;
  if (dedupedSecondary.length > 0) {
    const briefSecondary = dedupedSecondary.slice(0, 2).join(', ');
    label = `${primaryText}, ${briefSecondary}`;
  }

  const placeId = `${p.osm_type || 'osm'}:${p.osm_id || Math.random().toString(36).substring(2, 9)}`;

  return {
    label,
    primaryText,
    secondaryText: secondaryText || (p.country || 'India'),
    name: primaryText,
    city: p.city || p.district || '',
    state: p.state || '',
    country: p.country || 'India',
    latitude: lat,
    longitude: lon,
    placeId,
    postcode: p.postcode || ''
  };
};

/**
 * Searches locations using Photon with Lucknow bias and typo tolerance.
 * @param {string} query Search input string
 * @param {AbortSignal} [signal] Optional abort signal to cancel stale requests
 * @returns {Promise<{ locations: Array, error: string | null }>}
 */
export const searchLocations = async (query, signal) => {
  if (!query || query.trim().length < 2) {
    return { locations: [], error: null };
  }

  const rawQuery = query.trim();
  const expandedQuery = expandAbbreviations(rawQuery);

  const fetchPhoton = async (q) => {
    const params = new URLSearchParams({
      q,
      lat: String(LUCKNOW_LAT),
      lon: String(LUCKNOW_LON),
      limit: '10' // fetch up to 10 to allow scoring and filtering
    });

    const response = await fetch(`${PHOTON_API_URL}?${params.toString()}`, { signal });
    if (!response.ok) {
      throw new Error(`Photon request failed with HTTP ${response.status}`);
    }
    return response.json();
  };

  try {
    let data = await fetchPhoton(expandedQuery);

    // If no results and raw query differed or has spaces, try collapsed word
    if ((!data.features || data.features.length === 0) && rawQuery.includes(' ')) {
      const collapsed = rawQuery.replace(/\s+/g, '');
      if (collapsed.length >= 3) {
        try {
          const fallbackData = await fetchPhoton(collapsed);
          if (fallbackData?.features?.length) {
            data = fallbackData;
          }
        } catch (_) {
          // ignore fallback error and keep data
        }
      }
    }

    const rawFeatures = data.features || [];

    // Sort features by geographic bias score
    const sortedFeatures = [...rawFeatures].sort((a, b) => calculateLocationScore(b) - calculateLocationScore(a));

    // Deduplicate by formatted label
    const seen = new Set();
    const formattedList = [];

    for (const feat of sortedFeatures) {
      const formatted = formatFeature(feat);
      const key = `${formatted.primaryText.toLowerCase()}-${formatted.city.toLowerCase()}-${formatted.latitude.toFixed(3)}`;
      if (!seen.has(key)) {
        seen.add(key);
        formattedList.push(formatted);
      }
      if (formattedList.length >= 5) break;
    }

    return { locations: formattedList, error: null };
  } catch (err) {
    if (err.name === 'AbortError') {
      // Ignored: request was intentionally cancelled
      return { locations: [], error: null, aborted: true };
    }
    console.error('Location search error:', err);
    return {
      locations: [],
      error: 'Location search is temporarily unavailable. Please try again.'
    };
  }
};
