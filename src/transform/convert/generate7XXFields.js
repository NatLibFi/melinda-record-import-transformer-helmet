import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/melinda-record-import-transformer/generate7xxFields');

export function handle7xx(marcRecord) {
  const debug7xx = debug.extend('handle7xx:dev');
  const newFields = marcRecord.get(/^(?:700|710|711)$/u).map(field => {
    const hasSubfieldT = Boolean(field.subfields.find(sf => sf.code === 't'));
    const hasSubfieldI = Boolean(field.subfields.find(sf => sf.code === 'i'));

    marcRecord.removeField(field);

    if (hasSubfieldT && !hasSubfieldI) {
      debug7xx(`Dropping field: ${JSON.stringify(field)}`);
      return false;
    }

    return field;
  }).filter(field => field);

  return newFields;
}
