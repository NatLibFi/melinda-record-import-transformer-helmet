import createMaterialFields from './create-material-fields.js';
import {getTimeStamp} from './utils.js';

export function handle003(marcRecord) {
  marcRecord.get(/^003$/u).forEach(field => marcRecord.removeField(field));
}

export function handle007(marcRecord, record) {
  if (marcRecord.get(/^007$/u).length === 0) {
    const fields = createMaterialFields(record) || [];

    fields.forEach(f => {
      if (f.tag === '008') {
        const [f008] = marcRecord.get(/^008$/u);
        f008.value = f.value;
      } else if (f.tag === '007') {
        marcRecord.insertField(f);
      } else if (f.tag === '006') {
        const [f006] = marcRecord.get(/^006$/u);

        if (f006) {
          marcRecord.removeField(f006);
        }

        marcRecord.insertField(f);
      }
    });
  }
}

export function handle008(marcRecord, testRun = false) {

  const [f008] = marcRecord.get(/^008$/u);

  if (f008) {
    const creationDate = testRun ? getTimeStamp('testYYMMDD') : getTimeStamp('YYMMDD');

    // Convert to array, update first 6 chars (Creation time) and remove the erroneous last three chars ('nam')
    const chars = [...creationDate.split(''), ...f008.value.split('').slice(0, 40).slice(6)];
    // if (chars[17] === ' ') {
    //   chars[17] = '^';
    // }

    // if (chars[18] === 'c') {
    //   chars[18] = 'i';
    // }

    if (['#', '^', 'd', 'u', '|', ' ', ''].includes(chars[39])) {
      chars[39] = chars[39] === '' ? '|' : 'c';
    }

    if (marcRecord.leader[6] === 'r' && chars[33] === 'g') {
      chars.fill('|', 18, 21);
      chars.fill('|', 30, 32);
      chars.fill('|', 34, 35);
    }

    f008.value = `${chars.join('')}`;
  }
}
