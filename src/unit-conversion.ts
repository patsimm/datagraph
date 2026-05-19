const frequencyUnitKey = "frequency" as const;
const frequencySubUnits = ["1/oct", "hz", "cpm", "midiNote"] as const;

type FrequencySubUnit = (typeof frequencySubUnits)[number];
function getFrequencyUnit<T extends FrequencySubUnit>(
  subUnit: T
): `${typeof frequencyUnitKey}:${T}` {
  return `${frequencyUnitKey}:${subUnit}`;
}

export const allUnits = [...frequencySubUnits.map(getFrequencyUnit), "raw"] as const;
export type Unit = (typeof allUnits)[number];

export function convertToCv(value: number, unit: Unit): number {
  switch (unit) {
    case "raw": {
      return value;
    }
    case "frequency:1/oct": {
      return value;
    }
    case "frequency:hz": {
      return Math.log2(value / 440);
    }
    case "frequency:cpm": {
      return Math.log2(value / 60 / 440);
    }
    case "frequency:midiNote": {
      return (value - 69) / 12;
    }
  }
}
