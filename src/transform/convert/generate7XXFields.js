import {createLogger} from '@natlibfi/melinda-backend-commons';

const logger = createLogger();

export function handle7xx(marcRecord) {
  const newFields = marcRecord.get(/^(?:700|710|711)$/u).map(field => {
    const hasSubfieldT = Boolean(field.subfields.find(sf => sf.code === 't'));
    const hasSubfieldI = Boolean(field.subfields.find(sf => sf.code === 'i'));

    marcRecord.removeField(field);

    if (hasSubfieldT && !hasSubfieldI) {
      logger.debug(`Dropping field: ${JSON.stringify(field)}`);
      return false;
    }

    return field;
  }).filter(field => field);

  return newFields;
}
