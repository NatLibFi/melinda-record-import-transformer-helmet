import {createHash} from 'crypto';
import {clone} from '@natlibfi/melinda-commons';
import {MarcRecord} from '@natlibfi/marc-record';
import {getTimeStamp} from './utils';

export function handle856(marcRecord) {
  const f856s = marcRecord.get(/^856$/u);

  const validFields = f856s.map(field => {
    const newSubfields = field.subfields.map(sub => {
      if (sub.code === 'z') {
        return {code: 'y', value: sub.value};
      }

      return sub;
    });

    const subY = newSubfields.find(sub => sub.code === 'y');

    /* Move subfield y to the last index */
    if (subY) { // eslint-disable-line functional/no-conditional-statements
      const index = newSubfields.indexOf(subY);
      newSubfields.splice(index, 1); // eslint-disable-line functional/immutable-data
      newSubfields.push(subY); // eslint-disable-line functional/immutable-data
    }

    marcRecord.removeField(field);

    return {
      tag: field.tag,
      ind1: field.ind1,
      ind2: field.ind2,
      subfields: newSubfields
    };
  });

  return validFields;
}

/**
 * Generates 884 field for print and electronical records
 * @param {MarcRecord} marcRecord MarcRecord object of transformed record
 * @param {boolean} testRun Param to generate test friendly field
 * @returns Array containing field 884 ($a, $g, $k, $q, $5)
 */
export function generate884(marcRecord, testRun = false) {
  const copyMarcRecordData = clone(marcRecord);
  const copyMarcRecord = new MarcRecord(copyMarcRecordData);
  emptyCreationDate(copyMarcRecord);
  const hash = createHash('sha256').update(JSON.stringify(copyMarcRecord)).digest('hex');
  const timeStamp = testRun ? getTimeStamp('testYYYYMMDD') : getTimeStamp('YYYYMMDD');

  return [
    {
      tag: '884',
      subfields: [
        {code: 'a', value: 'Helmet to Melinda MARC transformation'},
        {code: 'g', value: timeStamp},
        {code: 'k', value: `HELMET:${testRun ? '' : hash}`},
        {code: 'q', value: 'FI-NL'},
        {code: '5', value: 'MELINDA'}
      ]
    }
  ];

  function emptyCreationDate(record) {
    const [f008] = record.pop(/008/u); // eslint-disable-line functional/immutable-data
    // emptyCreationDate:
    // Normalize f008/00-05 - In non-MARC21 imports f008 'Date entered on file' gets always the current date
    // This propably should be configurable
    const newF008 = {
      tag: f008.tag,
      value: `000000${f008.value.substring(6)}`
    };

    record.insertFields([newF008]);
    return;
  }
}
