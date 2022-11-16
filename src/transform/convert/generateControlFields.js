import createMaterialFields from './create-material-fields';
import moment from 'moment';

export function handle003(marcRecord) {
  marcRecord.get(/^003$/u).forEach(field => marcRecord.removeField(field));
}

export function handle007(marcRecord, record) {
  if (marcRecord.get(/^007$/u).length === 0) { // eslint-disable-line functional/no-conditional-statement
    const fields = createMaterialFields(record) || [];

    fields.forEach(f => {
      if (f.tag === '008') { // eslint-disable-line functional/no-conditional-statement
        const [f008] = marcRecord.get(/^008$/u);
        f008.value = f.value; // eslint-disable-line functional/immutable-data
      } else if (f.tag === '007') { // eslint-disable-line functional/no-conditional-statement
        marcRecord.insertField(f);
      } else if (f.tag === '006') { // eslint-disable-line functional/no-conditional-statement
        const [f006] = marcRecord.get(/^006$/u);

        if (f006) { // eslint-disable-line functional/no-conditional-statement
          marcRecord.removeField(f006);
        }

        marcRecord.insertField(f);
      }
    });
  }
}

export function handle008(marcRecord, generateTestTimeStamp = false) {

  const [f008] = marcRecord.get(/^008$/u);

  if (f008) { // eslint-disable-line functional/no-conditional-statement
    const creationDate = getTimeStamp(generateTestTimeStamp);

    // Convert to array, pad to 41 characters and remove first 6 chars (Creation time) and the erroneous last three chars ('nam')
    const chars = f008.value.split('').slice(0, 40).slice(6);
    if (chars[17] === ' ') { // eslint-disable-line functional/no-conditional-statement
      chars[17] = '^'; // eslint-disable-line functional/immutable-data
    }

    if (chars[18] === 'c') { // eslint-disable-line functional/no-conditional-statement
      chars[18] = 'i'; // eslint-disable-line functional/immutable-data
    }

    if (['#', '^', 'd', 'u', '|'].includes(chars[39])) { // eslint-disable-line functional/no-conditional-statement
      chars[39] = 'c'; // eslint-disable-line functional/immutable-data
    }

    if (marcRecord.leader[6] === 'r' && chars[33] === 'g') { // eslint-disable-line functional/no-conditional-statement
      chars.fill('|', 18, 21); // eslint-disable-line functional/immutable-data
      chars.fill('|', 30, 32); // eslint-disable-line functional/immutable-data
      chars.fill('|', 34, 35); // eslint-disable-line functional/immutable-data
    }

    f008.value = `${creationDate}${chars.join('')}`; // eslint-disable-line functional/immutable-data
  }

  function getTimeStamp(generateTestTimeStamp) {
    if (generateTestTimeStamp) {
      return moment('2000-01-01T00:00:00').format('YYMMDD');
    }

    return moment().format('YYMMDD');
  }
}