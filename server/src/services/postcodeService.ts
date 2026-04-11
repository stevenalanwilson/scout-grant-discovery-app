import axios from 'axios';

interface PostcodesIoResponse {
  status: number;
  result: {
    region: string | null;
    admin_district: string | null;
    parliamentary_constituency: string | null;
    codes: {
      admin_district: string;
    };
    rural_urban: string | null;
  } | null;
}

interface PostcodesIoDeprivationResponse {
  status: number;
  result: {
    deprivation: {
      imd: number | null;
    } | null;
  } | null;
}

export interface PostcodeData {
  region: string | null;
  deprivationFlag: boolean | null;
  ruralFlag: boolean | null;
  imdDecile: number | null;
  localAuthority: string | null;
  parliamentaryConstituency: string | null;
}

const RURAL_PREFIXES = ['R', 'D2', 'D3', 'D4', 'D5']; // ONS Rural/Urban Classification codes

function isRural(ruralUrbanCode: string | null): boolean | null {
  if (!ruralUrbanCode) return null;
  return RURAL_PREFIXES.some((prefix) => ruralUrbanCode.startsWith(prefix));
}

export async function lookupPostcode(postcode: string): Promise<PostcodeData> {
  const normalised = postcode.replace(/\s+/g, '').toUpperCase();

  try {
    const [mainRes, deprivationRes] = await Promise.allSettled([
      axios.get<PostcodesIoResponse>(`https://api.postcodes.io/postcodes/${normalised}`, {
        timeout: 5000,
      }),
      axios.get<PostcodesIoDeprivationResponse>(
        `https://api.postcodes.io/postcodes/${normalised}/deprivation`,
        { timeout: 5000 },
      ),
    ]);

    const result = mainRes.status === 'fulfilled' ? mainRes.value.data.result : null;
    const depResult =
      deprivationRes.status === 'fulfilled' ? deprivationRes.value.data.result : null;

    const region = result?.region ?? null;
    const ruralUrbanCode = result?.rural_urban ?? null;
    const ruralFlag = isRural(ruralUrbanCode);
    const localAuthority = result?.admin_district ?? null;
    const parliamentaryConstituency = result?.parliamentary_constituency ?? null;

    const imdDecile = depResult?.deprivation?.imd ?? null;
    // IMD decile 1–2 = most deprived 20%
    const deprivationFlag = imdDecile !== null ? imdDecile <= 2 : null;

    return { region, deprivationFlag, ruralFlag, imdDecile, localAuthority, parliamentaryConstituency };
  } catch {
    return {
      region: null,
      deprivationFlag: null,
      ruralFlag: null,
      imdDecile: null,
      localAuthority: null,
      parliamentaryConstituency: null,
    };
  }
}
