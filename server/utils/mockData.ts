type QualityValidity = 'good' | 'invalid' | 'questionable'
type RangeStatus = 'normal' | 'high' | 'low' | 'high-high' | 'low-low'

interface MockSymbolDef {
  Name: string
  Type: string
  Description: string
  baseValue: number
  jitter: number
  units: string
  range: RangeStatus
  quality: QualityValidity
  multiplier: number
}

// 12 INS + 6 non-INS — the app filters to INS only, proving the filter works
export const MOCK_SYMBOLS: MockSymbolDef[] = [
  { Name: 'AnalogDeadband',   Type: 'INS',  Description: 'Analog input deadband threshold',     baseValue: 42,    jitter: 5,  units: 'mV',  range: 'normal',   quality: 'good',         multiplier: 1.0 },
  { Name: 'BinaryDebounce',   Type: 'INS',  Description: 'Binary input debounce delay',          baseValue: 150,   jitter: 10, units: 'ms',  range: 'normal',   quality: 'good',         multiplier: 1.0 },
  { Name: 'CommTimeout',      Type: 'INS',  Description: 'Communication timeout threshold',      baseValue: 5000,  jitter: 0,  units: 'ms',  range: 'normal',   quality: 'good',         multiplier: 1.0 },
  { Name: 'SystemTimer',      Type: 'INS',  Description: 'System uptime counter',                baseValue: 12458, jitter: 1,  units: 's',   range: 'normal',   quality: 'good',         multiplier: 1.0 },
  { Name: 'ControlLoopGain',  Type: 'INS',  Description: 'Control loop proportional gain',       baseValue: 128,   jitter: 3,  units: '',    range: 'normal',   quality: 'good',         multiplier: 0.01 },
  { Name: 'MotorSpeed',       Type: 'INS',  Description: 'Motor shaft speed feedback',           baseValue: 1750,  jitter: 25, units: 'RPM', range: 'normal',   quality: 'good',         multiplier: 1.0 },
  { Name: 'PressureSetpoint', Type: 'INS',  Description: 'Process pressure setpoint',            baseValue: 850,   jitter: 0,  units: 'kPa', range: 'high',     quality: 'questionable', multiplier: 1.0 },
  { Name: 'TemperatureLimit', Type: 'INS',  Description: 'High temperature trip limit',          baseValue: 250,   jitter: 0,  units: 'C',   range: 'normal',   quality: 'good',         multiplier: 1.0 },
  { Name: 'FlowRate',         Type: 'INS',  Description: 'Primary process flow rate',            baseValue: 320,   jitter: 15, units: 'L/m', range: 'normal',   quality: 'good',         multiplier: 1.0 },
  { Name: 'TankLevel',        Type: 'INS',  Description: 'Main storage tank level',              baseValue: 74,    jitter: 2,  units: '%',   range: 'normal',   quality: 'good',         multiplier: 1.0 },
  { Name: 'ValvePosition',    Type: 'INS',  Description: 'Control valve position feedback',      baseValue: 65,    jitter: 1,  units: '%',   range: 'normal',   quality: 'good',         multiplier: 1.0 },
  { Name: 'PumpFrequency',    Type: 'INS',  Description: 'Variable speed pump drive frequency',  baseValue: 48,    jitter: 2,  units: 'Hz',  range: 'low',      quality: 'invalid',      multiplier: 1.0 },
  // Non-INS — filtered out by the app
  { Name: 'SystemStatus',     Type: 'BOOL', Description: 'Overall system operational status',    baseValue: 1,     jitter: 0,  units: '',    range: 'normal',   quality: 'good',         multiplier: 1.0 },
  { Name: 'AlarmCount',       Type: 'INT',  Description: 'Active alarm count',                   baseValue: 3,     jitter: 1,  units: '',    range: 'normal',   quality: 'good',         multiplier: 1.0 },
  { Name: 'ProcessTemp',      Type: 'REAL', Description: 'Measured process temperature',         baseValue: 87,    jitter: 3,  units: 'C',   range: 'normal',   quality: 'good',         multiplier: 1.0 },
  { Name: 'NetworkLatency',   Type: 'INT',  Description: 'Network round-trip latency',           baseValue: 12,    jitter: 5,  units: 'ms',  range: 'normal',   quality: 'good',         multiplier: 1.0 },
  { Name: 'BatteryVoltage',   Type: 'REAL', Description: 'Backup battery voltage',               baseValue: 24,    jitter: 1,  units: 'V',   range: 'normal',   quality: 'good',         multiplier: 1.0 },
  { Name: 'FaultCode',        Type: 'INT',  Description: 'Last fault code registered',           baseValue: 0,     jitter: 0,  units: '',    range: 'normal',   quality: 'good',         multiplier: 1.0 },
]

function buildQuality(validity: QualityValidity) {
  return {
    validity,
    source: 'process',
    test: false,
    operatorBlocked: false,
    detailQual: {
      overflow: false,
      outOfRange: validity === 'invalid',
      badReference: false,
      oscillatory: false,
      failure: validity === 'invalid',
      oldData: validity === 'questionable',
      inconsistent: false,
      inaccurate: validity === 'questionable',
    },
  }
}

export function getSymbolList() {
  return MOCK_SYMBOLS.map(({ Name, Type, Description }) => ({ Name, Type, Description }))
}

export function generateSymbolValue(name: string) {
  const def = MOCK_SYMBOLS.find(s => s.Name === name)
  if (!def) return null

  const jitter = def.jitter > 0 ? Math.floor((Math.random() - 0.5) * 2 * def.jitter) : 0
  const stVal = def.baseValue + jitter

  return {
    stVal,
    q: buildQuality(def.quality),
    t: {
      value: new Date().toISOString(),
      leapSecondsKnown: true,
      clockFailure: false,
      clockNotSynchronized: false,
      timeAccuracy: 10,
      source: 'ntp',
    },
    range: def.range,
    units: def.units,
    multiplier: def.multiplier,
    d: def.Description,
  }
}
