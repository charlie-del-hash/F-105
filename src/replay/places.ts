/**
 * Named places for the replay. Airfield coordinates are from OurAirports
 * (public domain, davidmegginson/ourairports-data) — today's runways, which sit
 * on the 1967 fields at this scale. Phuc Yen is now Noi Bai International.
 * Landmarks without an airfield record are marked `approx`.
 */
export interface Place {
  id: string;
  /** Name as the 1967 sources spell it. */
  name: string;
  lat: number;
  lon: number;
  kind: "airfield" | "city" | "landmark";
  side?: "us" | "vpaf" | "neutral";
  note?: string;
  approx?: boolean;
}

export const places = {
  ubon: { id: "ubon", name: "Ubon RTAFB", lat: 15.2513, lon: 104.87, kind: "airfield", side: "us", note: "8th TFW, F-4C — the west force" },
  udorn: { id: "udorn", name: "Udorn RTAFB", lat: 17.3862, lon: 102.7886, kind: "airfield", side: "us" },
  korat: { id: "korat", name: "Korat RTAFB", lat: 14.9347, lon: 102.0789, kind: "airfield", side: "us", note: "388th TFW, F-105" },
  takhli: { id: "takhli", name: "Takhli RTAFB", lat: 15.2773, lon: 100.296, kind: "airfield", side: "us", note: "355th TFW, F-105" },
  danang: { id: "danang", name: "Da Nang AB", lat: 16.0439, lon: 108.199, kind: "airfield", side: "us", note: "366th TFW, F-4C — the east force" },
  phucYen: { id: "phucYen", name: "Phuc Yen", lat: 21.2212, lon: 105.807, kind: "airfield", side: "vpaf", note: "921st FR, MiG-21 · today Noi Bai" },
  kep: { id: "kep", name: "Kep", lat: 21.3946, lon: 106.261, kind: "airfield", side: "vpaf" },
  giaLam: { id: "giaLam", name: "Gia Lam", lat: 21.0405, lon: 105.886, kind: "airfield", side: "vpaf" },
  hoaLac: { id: "hoaLac", name: "Hoa Lac", lat: 21.0285, lon: 105.4874, kind: "airfield", side: "vpaf" },
  catBi: { id: "catBi", name: "Cat Bi", lat: 20.8174, lon: 106.7243, kind: "airfield", side: "vpaf" },
  yenBai: { id: "yenBai", name: "Yen Bai", lat: 21.7329, lon: 104.8536, kind: "airfield", side: "vpaf" },
  hanoi: { id: "hanoi", name: "Hanoi", lat: 21.0285, lon: 105.8542, kind: "city", approx: true },
  /** The Tam Dao range. Its NW–SE spine pointed at Phuc Yen; F-105 pilots called it Thud Ridge. */
  thudRidgeNW: { id: "thudRidgeNW", name: "Thud Ridge (NW end)", lat: 21.68, lon: 105.36, kind: "landmark", approx: true },
  thudRidgeSE: { id: "thudRidgeSE", name: "Thud Ridge (SE end)", lat: 21.33, lon: 105.74, kind: "landmark", approx: true },
} satisfies Record<string, Place>;

export type PlaceId = keyof typeof places;
