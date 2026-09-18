/**
 * Schematic chokepoint plots. Not a map: a plot, in the CIC sense — abstract
 * coastlines, traffic separation lanes and tracks in a 100×70 unit space.
 * Positions are illustrative. Real tracks would come from an AIS feed.
 */
export interface Track {
  id: string;
  /** Position in plot units. */
  x: number;
  y: number;
  /** Course in degrees (0 = up the plot). */
  crs: number;
  kind: "tanker" | "lng" | "bulker" | "container" | "naval" | "unknown";
  label: string;
}
export interface Area {
  id: string;
  name: string;
  subtitle: string;
  /** Closed polygons, plot units. */
  land: number[][][];
  /** Polylines: inbound/outbound lanes. */
  lanes: { id: string; pts: number[][]; label: string }[];
  /** Reference points. */
  marks: { x: number; y: number; label: string; kind: "port" | "datum" | "waypoint" }[];
  tracks: Track[];
  /** Instruments whose latest reading belongs in the plot's status line. */
  instruments: string[];
}

export const areas: Record<string, Area> = {
  hormuz: {
    id: "hormuz",
    name: "Strait of Hormuz",
    subtitle: "Schematic plot — Gulf of Oman (SE) to the Gulf (NW)",
    land: [
      // Iranian coast, northern side
      [[0, 0], [100, 0], [100, 14], [86, 18], [72, 21], [60, 25], [52, 24], [44, 21], [30, 14], [18, 10], [0, 8]],
      // Musandam peninsula (Oman/UAE), southern side
      [[0, 70], [0, 46], [14, 44], [28, 47], [40, 45], [48, 50], [56, 49], [62, 52], [66, 58], [64, 70]],
      // Qeshm island
      [[24, 15], [40, 18], [42, 22], [30, 22], [20, 19]],
    ],
    lanes: [
      { id: "in", pts: [[96, 44], [78, 36], [62, 33], [48, 33], [34, 34]], label: "Inbound TSS" },
      { id: "out", pts: [[34, 40], [48, 39], [62, 39], [78, 42], [96, 50]], label: "Outbound TSS" },
    ],
    marks: [
      { x: 8, y: 30, label: "Bandar Abbas", kind: "port" },
      { x: 20, y: 56, label: "Khasab", kind: "port" },
      { x: 92, y: 22, label: "Jask", kind: "port" },
      { x: 56, y: 36, label: "Datum", kind: "datum" },
      { x: 86, y: 60, label: "Fujairah anch.", kind: "port" },
    ],
    tracks: [
      { id: "T01", x: 90, y: 42, crs: 300, kind: "tanker", label: "VLCC" },
      { id: "T02", x: 70, y: 34, crs: 285, kind: "tanker", label: "VLCC" },
      { id: "T03", x: 44, y: 33, crs: 270, kind: "lng", label: "LNGC" },
      { id: "T04", x: 40, y: 39, crs: 90, kind: "tanker", label: "SMAX" },
      { id: "T05", x: 60, y: 40, crs: 95, kind: "container", label: "CONT" },
      { id: "T06", x: 82, y: 44, crs: 110, kind: "bulker", label: "BULK" },
      { id: "T07", x: 30, y: 30, crs: 40, kind: "naval", label: "FFG" },
      { id: "T08", x: 74, y: 28, crs: 200, kind: "unknown", label: "UNK" },
    ],
    instruments: ["HORMUZ.TX", "TD3C", "WAR.RS"],
  },
  "bab-el-mandeb": {
    id: "bab-el-mandeb",
    name: "Bab el-Mandeb",
    subtitle: "Schematic plot — Red Sea (N) to Gulf of Aden (S)",
    land: [
      [[0, 0], [38, 0], [40, 20], [36, 40], [30, 55], [22, 70], [0, 70]],
      [[62, 0], [100, 0], [100, 70], [58, 70], [60, 50], [64, 30]],
      [[44, 34], [50, 33], [52, 39], [46, 40]],
    ],
    lanes: [
      { id: "n", pts: [[54, 68], [56, 50], [55, 30], [52, 8]], label: "Northbound" },
      { id: "s", pts: [[46, 8], [44, 28], [43, 50], [42, 68]], label: "Southbound" },
    ],
    marks: [
      { x: 20, y: 58, label: "Djibouti", kind: "port" },
      { x: 80, y: 62, label: "Aden", kind: "port" },
      { x: 48, y: 36, label: "Perim", kind: "waypoint" },
      { x: 50, y: 20, label: "Datum", kind: "datum" },
    ],
    tracks: [
      { id: "T11", x: 55, y: 60, crs: 350, kind: "container", label: "CONT" },
      { id: "T12", x: 54, y: 40, crs: 355, kind: "tanker", label: "AFRA" },
      { id: "T13", x: 44, y: 20, crs: 180, kind: "bulker", label: "BULK" },
      { id: "T14", x: 43, y: 45, crs: 178, kind: "lng", label: "LNGC" },
      { id: "T15", x: 62, y: 52, crs: 20, kind: "naval", label: "DDG" },
      { id: "T16", x: 36, y: 30, crs: 120, kind: "unknown", label: "UNK" },
    ],
    instruments: ["BAB.TX", "WAR.RS", "SCFI"],
  },
};
export const areaIds = Object.keys(areas);
