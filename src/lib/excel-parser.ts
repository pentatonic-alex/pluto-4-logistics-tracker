import * as XLSX from 'xlsx';
import type { MaterialType, EventType } from '@/types';

// Sheet names in the Excel file
export const SHEET_NAMES = {
  INBOUND_SHIPMENT: 'Inbound Shipment',
  GRANULATION: 'Granulation',
  METAL_REMOVAL: 'Metal Removal',
  POLYMER_PURIFICATION: 'Polymer purification',
  EXTRUSION: 'Extrusion',
  ECHA_COMPLIANCE: 'ECHA Compliance',
  TRANSFER_MBA_RGE: 'Transfer MBA-RGE',
  RGE_MANUFACTURING: 'RGE Manufacturing',
} as const;

// Parsed row types for each sheet
export interface InboundShipmentRow {
  campaignCode: string;
  requestedArrivalDate?: string;
  grossWeightKg?: number;
  netWeightKg?: number;
  estimatedAbsKg?: number;
  materialPortfolioLink?: string;
  acceptedArrivalDate?: string;
  trackingRef?: string;
  carrier?: string;
  shipDate?: string;
  arrivalDate?: string;
}

export interface GranulationRow {
  ticketNumber?: string;
  shippingId?: string;
  materialType?: MaterialType;
  campaignCode: string;
  date?: string;
  site?: string;
  location?: string;
  process?: string;
  startingWeightKg?: number;
  outputWeightKg?: number;
  contaminationNotes?: string;
  polymerComposition?: string;
  processHours?: number;
  yieldPercent?: number;
  lossPercent?: number;
  wasteCode?: string;
  deliveryLocation?: string;
  deliveryDate?: string;
  notes?: string;
}

export interface MetalRemovalRow {
  ticketNumber?: string;
  campaignCode: string;
  date?: string;
  site?: string;
  location?: string;
  process?: string;
  startingWeightKg?: number;
  polymerComposition?: string;
  outputWeightKg?: number;
  processHours?: number;
  yieldPercent?: number;
  lossPercent?: number;
  wasteCode?: string;
  deliveryLocation?: string;
  notes?: string;
}

export interface PolymerPurificationRow {
  ticketNumber?: string;
  campaignCode: string;
  date?: string;
  site?: string;
  location?: string;
  process?: string;
  startingWeightKg?: number;
  polymerComposition?: string;
  outputWeightKg?: number;
  outputPolymerComposition?: string;
  wasteComposition?: string;
  processHours?: number;
  yieldPercent?: number;
  lossPercent?: number;
  wasteCode?: string;
  deliveryLocation?: string;
  notes?: string;
}

export interface ExtrusionRow {
  ticketNumber?: string;
  campaignCode: string;
  date?: string;
  site?: string;
  location?: string;
  process?: string;
  startingWeightKg?: number;
  polymerComposition?: string;
  outputWeightKg?: number;
  processHours?: number;
  yieldPercent?: number;
  lossPercent?: number;
  batchNumber?: string;
  deliveryLocation?: string;
  echaComplete?: boolean;
  deliveryDate?: string;
  notes?: string;
}

export interface TransferMbaRgeRow {
  campaignCode: string;
  trackingRef?: string;
  carrier?: string;
  receivedDate?: string;
  receivedGrossWeightKg?: number;
  receivedNetWeightKg?: number;
}

export interface RgeManufacturingRow {
  campaignCode: string;
  poNumber?: string;
  poQuantity?: number;
  startDate?: string;
  endDate?: string;
  requestedPickupDate?: string;
  actualPickupDate?: string;
}

// Combined parsed Excel data
export interface ParsedExcelData {
  inboundShipments: InboundShipmentRow[];
  granulations: GranulationRow[];
  metalRemovals: MetalRemovalRow[];
  polymerPurifications: PolymerPurificationRow[];
  extrusions: ExtrusionRow[];
  transfers: TransferMbaRgeRow[];
  manufacturing: RgeManufacturingRow[];
}

// Helper to parse numbers
function parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === 'n/a' || value === '') return undefined;
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  return isNaN(num) ? undefined : num;
}

// Helper to parse dates
function parseDate(value: unknown): string | undefined {
  if (value === null || value === undefined || value === 'n/a' || value === '') return undefined;
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  if (typeof value === 'number') {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
  }
  const str = String(value).trim();
  if (str === '' || str.toLowerCase() === 'n/a') return undefined;
  return str;
}

// Helper to parse strings
function parseString(value: unknown): string | undefined {
  if (value === null || value === undefined || value === 'n/a') return undefined;
  const str = String(value).trim();
  return str === '' || str.toLowerCase() === 'n/a' ? undefined : str;
}

// Helper to parse material type
function parseMaterialType(value: unknown): MaterialType | undefined {
  const str = parseString(value)?.toUpperCase();
  if (str === 'PI' || str === 'POST-INDUSTRIAL' || str === 'POST-INDRUSTIAL') return 'PI';
  if (str === 'PCR' || str === 'POST-CONSUMER') return 'PCR';
  return undefined;
}

// Helper to parse boolean
function parseBoolean(value: unknown): boolean | undefined {
  if (value === null || value === undefined || value === 'n/a') return undefined;
  const str = String(value).trim().toLowerCase();
  if (str === 'yes' || str === 'true' || str === '1' || str === 'complete') return true;
  if (str === 'no' || str === 'false' || str === '0' || str === '') return false;
  return undefined;
}

// Parse Inbound Shipment sheet
function parseInboundShipmentSheet(worksheet: XLSX.WorkSheet): InboundShipmentRow[] {
  const rows: InboundShipmentRow[] = [];
  const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !Array.isArray(row) || !row[0]) continue; // Skip empty rows
    
    const campaignCode = parseString(row[0]);
    if (!campaignCode) continue;
    
    rows.push({
      campaignCode,
      requestedArrivalDate: parseDate(row[1]),
      grossWeightKg: parseNumber(row[2]),
      netWeightKg: parseNumber(row[3]),
      estimatedAbsKg: parseNumber(row[4]),
      materialPortfolioLink: parseString(row[5]),
      acceptedArrivalDate: parseDate(row[6]),
      trackingRef: parseString(row[7]),
      carrier: parseString(row[8]),
      shipDate: parseDate(row[9]),
      arrivalDate: parseDate(row[10]),
    });
  }
  
  return rows;
}

// Parse Granulation sheet
function parseGranulationSheet(worksheet: XLSX.WorkSheet): GranulationRow[] {
  const rows: GranulationRow[] = [];
  const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !Array.isArray(row) || !row[3]) continue; // Campaign code is col 3
    
    const campaignCode = parseString(row[3]);
    if (!campaignCode) continue;
    
    rows.push({
      ticketNumber: parseString(row[0]),
      shippingId: parseString(row[1]),
      materialType: parseMaterialType(row[2]),
      campaignCode,
      date: parseDate(row[4]),
      site: parseString(row[5]),
      location: parseString(row[6]),
      process: parseString(row[7]),
      startingWeightKg: parseNumber(row[8]),
      outputWeightKg: parseNumber(row[9]),
      contaminationNotes: parseString(row[10]),
      polymerComposition: parseString(row[11]),
      processHours: parseNumber(row[12]),
      yieldPercent: parseNumber(row[13]),
      lossPercent: parseNumber(row[14]),
      wasteCode: parseString(row[15]),
      deliveryLocation: parseString(row[16]),
      deliveryDate: parseDate(row[17]),
      notes: parseString(row[18]),
    });
  }
  
  return rows;
}

// Parse Metal Removal sheet
function parseMetalRemovalSheet(worksheet: XLSX.WorkSheet): MetalRemovalRow[] {
  const rows: MetalRemovalRow[] = [];
  const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !Array.isArray(row) || !row[1]) continue; // Campaign code is col 1
    
    const campaignCode = parseString(row[1]);
    if (!campaignCode) continue;
    
    rows.push({
      ticketNumber: parseString(row[0]),
      campaignCode,
      date: parseDate(row[2]),
      site: parseString(row[3]),
      location: parseString(row[4]),
      process: parseString(row[5]),
      startingWeightKg: parseNumber(row[6]),
      polymerComposition: parseString(row[7]),
      outputWeightKg: parseNumber(row[8]),
      processHours: parseNumber(row[9]),
      yieldPercent: parseNumber(row[10]),
      lossPercent: parseNumber(row[11]),
      wasteCode: parseString(row[12]),
      deliveryLocation: parseString(row[13]),
      notes: parseString(row[14]),
    });
  }
  
  return rows;
}

// Parse Polymer Purification sheet
function parsePolymerPurificationSheet(worksheet: XLSX.WorkSheet): PolymerPurificationRow[] {
  const rows: PolymerPurificationRow[] = [];
  const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !Array.isArray(row) || !row[1]) continue; // Campaign code is col 1
    
    const campaignCode = parseString(row[1]);
    if (!campaignCode) continue;
    
    rows.push({
      ticketNumber: parseString(row[0]),
      campaignCode,
      date: parseDate(row[2]),
      site: parseString(row[3]),
      location: parseString(row[4]),
      process: parseString(row[5]),
      startingWeightKg: parseNumber(row[6]),
      polymerComposition: parseString(row[7]),
      outputWeightKg: parseNumber(row[8]),
      outputPolymerComposition: parseString(row[9]),
      wasteComposition: parseString(row[10]),
      processHours: parseNumber(row[11]),
      yieldPercent: parseNumber(row[12]),
      lossPercent: parseNumber(row[13]),
      wasteCode: parseString(row[14]),
      deliveryLocation: parseString(row[15]),
      notes: parseString(row[16]),
    });
  }
  
  return rows;
}

// Parse Extrusion sheet
function parseExtrusionSheet(worksheet: XLSX.WorkSheet): ExtrusionRow[] {
  const rows: ExtrusionRow[] = [];
  const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !Array.isArray(row) || !row[1]) continue; // Campaign code is col 1
    
    const campaignCode = parseString(row[1]);
    if (!campaignCode) continue;
    
    rows.push({
      ticketNumber: parseString(row[0]),
      campaignCode,
      date: parseDate(row[2]),
      site: parseString(row[3]),
      location: parseString(row[4]),
      process: parseString(row[5]),
      startingWeightKg: parseNumber(row[6]),
      polymerComposition: parseString(row[7]),
      outputWeightKg: parseNumber(row[8]),
      processHours: parseNumber(row[9]),
      yieldPercent: parseNumber(row[10]),
      lossPercent: parseNumber(row[11]),
      batchNumber: parseString(row[12]),
      deliveryLocation: parseString(row[13]),
      echaComplete: parseBoolean(row[14]),
      deliveryDate: parseDate(row[15]),
      notes: parseString(row[16]),
    });
  }
  
  return rows;
}

// Parse Transfer MBA-RGE sheet
function parseTransferSheet(worksheet: XLSX.WorkSheet): TransferMbaRgeRow[] {
  const rows: TransferMbaRgeRow[] = [];
  const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !Array.isArray(row) || !row[0]) continue; // Campaign code is col 0
    
    const campaignCode = parseString(row[0]);
    if (!campaignCode) continue;
    
    rows.push({
      campaignCode,
      trackingRef: parseString(row[1]),
      carrier: parseString(row[2]),
      receivedDate: parseDate(row[3]),
      receivedGrossWeightKg: parseNumber(row[4]),
      receivedNetWeightKg: parseNumber(row[5]),
    });
  }
  
  return rows;
}

// Parse RGE Manufacturing sheet
function parseManufacturingSheet(worksheet: XLSX.WorkSheet): RgeManufacturingRow[] {
  const rows: RgeManufacturingRow[] = [];
  const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !Array.isArray(row) || !row[0]) continue; // Campaign code is col 0
    
    const campaignCode = parseString(row[0]);
    if (!campaignCode) continue;
    
    rows.push({
      campaignCode,
      poNumber: parseString(row[1]),
      poQuantity: parseNumber(row[2]),
      startDate: parseDate(row[3]),
      endDate: parseDate(row[4]),
      requestedPickupDate: parseDate(row[5]),
      actualPickupDate: parseDate(row[6]),
    });
  }
  
  return rows;
}

/**
 * Parse an Excel file buffer and extract all sheet data
 */
export function parseExcelFile(buffer: ArrayBuffer): ParsedExcelData {
  const workbook = XLSX.read(buffer, { type: 'array' });
  
  const getSheet = (name: string) => workbook.Sheets[name];
  
  return {
    inboundShipments: getSheet(SHEET_NAMES.INBOUND_SHIPMENT) 
      ? parseInboundShipmentSheet(getSheet(SHEET_NAMES.INBOUND_SHIPMENT)) 
      : [],
    granulations: getSheet(SHEET_NAMES.GRANULATION) 
      ? parseGranulationSheet(getSheet(SHEET_NAMES.GRANULATION)) 
      : [],
    metalRemovals: getSheet(SHEET_NAMES.METAL_REMOVAL) 
      ? parseMetalRemovalSheet(getSheet(SHEET_NAMES.METAL_REMOVAL)) 
      : [],
    polymerPurifications: getSheet(SHEET_NAMES.POLYMER_PURIFICATION) 
      ? parsePolymerPurificationSheet(getSheet(SHEET_NAMES.POLYMER_PURIFICATION)) 
      : [],
    extrusions: getSheet(SHEET_NAMES.EXTRUSION) 
      ? parseExtrusionSheet(getSheet(SHEET_NAMES.EXTRUSION)) 
      : [],
    transfers: getSheet(SHEET_NAMES.TRANSFER_MBA_RGE) 
      ? parseTransferSheet(getSheet(SHEET_NAMES.TRANSFER_MBA_RGE)) 
      : [],
    manufacturing: getSheet(SHEET_NAMES.RGE_MANUFACTURING) 
      ? parseManufacturingSheet(getSheet(SHEET_NAMES.RGE_MANUFACTURING)) 
      : [],
  };
}

/**
 * Get all unique campaign codes from parsed data
 */
export function getAllCampaignCodes(data: ParsedExcelData): string[] {
  const codes = new Set<string>();
  
  data.inboundShipments.forEach(r => codes.add(r.campaignCode));
  data.granulations.forEach(r => codes.add(r.campaignCode));
  data.metalRemovals.forEach(r => codes.add(r.campaignCode));
  data.polymerPurifications.forEach(r => codes.add(r.campaignCode));
  data.extrusions.forEach(r => codes.add(r.campaignCode));
  data.transfers.forEach(r => codes.add(r.campaignCode));
  data.manufacturing.forEach(r => codes.add(r.campaignCode));
  
  return Array.from(codes);
}

/**
 * Map sheet type to event type
 */
export function getEventTypeForSheet(sheetType: keyof typeof SHEET_NAMES): EventType | EventType[] {
  switch (sheetType) {
    case 'INBOUND_SHIPMENT':
      return ['CampaignCreated', 'InboundShipmentRecorded'];
    case 'GRANULATION':
      return 'GranulationCompleted';
    case 'METAL_REMOVAL':
      return 'MetalRemovalCompleted';
    case 'POLYMER_PURIFICATION':
      return 'PolymerPurificationCompleted';
    case 'EXTRUSION':
      return 'ExtrusionCompleted';
    case 'TRANSFER_MBA_RGE':
      return 'TransferToRGERecorded';
    case 'RGE_MANUFACTURING':
      return ['ManufacturingStarted', 'ManufacturingCompleted'];
    default:
      throw new Error(`Unknown sheet type: ${sheetType}`);
  }
}
