export enum UnitType {
    WATT = 'W',
    AMPERE = 'A',
    VOLT = 'V',
    CROWN = 'Kč',
    CELSIUS = '°C',
    PERCENT = '%'
  }
  
  export const getLabel = (unit: UnitType): string => {
    switch (unit) {
      case UnitType.WATT:
        return 'Aktuální výkon';
      case UnitType.AMPERE:
        return 'Aktuální proud';
      case UnitType.VOLT:
        return 'Aktuální napětí';
      case UnitType.CROWN:
        return 'Celková cena';
      case UnitType.CELSIUS:
        return 'Teplota';
      case UnitType.PERCENT:
        return unit === '%' ? 'Vlhkost' : 'Baterie';
      default:
        return 'Neznámá hodnota';
    }
  };
  
  export const getUnit = (unit: UnitType): string => {
    switch (unit) {
      case UnitType.WATT:
        return 'Watt';
      case UnitType.AMPERE:
        return 'Ampér';
      case UnitType.VOLT:
        return 'Volt';
      case UnitType.CROWN:
        return 'Koruna';
      case UnitType.CELSIUS:
        return 'Stupeň Celsia';
      case UnitType.PERCENT:
        return 'Procento';
      default:
        return unit;
    }
  };
  