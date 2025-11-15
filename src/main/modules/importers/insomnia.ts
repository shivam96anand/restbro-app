/**
 * Insomnia Export v4+ Importer
 */

import { Collection, Environment } from '../../../shared/types';
import { mapInsomniaV4Export } from './insomniaV4Mapper';
import { mapInsomniaV5Export } from './insomniaV5Mapper';

/**
 * Checks if data is an Insomnia export
 */
export function isInsomniaExport(data: any): boolean {
  return (
    (data.type && data.type.includes('insomnia') && data.collection) ||
    (data.__export_format && data.resources && Array.isArray(data.resources))
  );
}

/**
 * Maps an Insomnia export to API Courier format
 */
export function mapInsomniaExport(data: any): {
  rootFolder: Collection;
  environments: Environment[];
} {
  // Check if it's v5 format
  if (data.type && data.type.includes('insomnia') && data.collection) {
    return mapInsomniaV5Export(data);
  }

  // Otherwise, treat as v4 format
  if (data.resources && Array.isArray(data.resources)) {
    return mapInsomniaV4Export(data.resources);
  }

  // Invalid format
  throw new Error('Invalid Insomnia export format');
}
