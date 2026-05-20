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
      // 1V/oct, 0V = C4; c4Freq derived from A4=440 to match MIDI conversion
      const c4Freq = 440 * Math.pow(2, (60 - 69) / 12);
      return Math.log2(value / c4Freq);
    }
    case "frequency:cpm": {
      const c4Freq = 440 * Math.pow(2, (60 - 69) / 12);
      return Math.log2(value / 60 / c4Freq);
    }
    case "frequency:midiNote": {
      return (value - 60) / 12;
    }
  }
}
