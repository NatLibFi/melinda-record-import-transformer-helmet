export function handle020(marcRecord) {
  marcRecord.get(/^020$/u)
    .forEach(field => {
      if (!field.subfields.find(sf => sf.code === 'q')) { // eslint-disable-line functional/no-conditional-statements
        const a = field.subfields.find(sf => sf.code === 'a'); // eslint-disable-line functional/immutable-data

        if (a && (/\s/u).test(a.value.trim())) { // eslint-disable-line functional/no-conditional-statements
          const [isbn, postfix] = a.value.split(/\s/u);
          a.value = isbn; // eslint-disable-line functional/immutable-data

          field.subfields.push({ // eslint-disable-line functional/immutable-data
            code: 'q',
            value: postfix.replace(/[()]/u, '')
          });
        }
      }
    });
}

export function handle028(marcRecord) {
  // subfield alternatives: a, b, q, 6, 8 -> presentation order (fin): b, a, q, 6, 8
  const arrFoundFields028 = marcRecord.get(/^028$/u);

  if (!arrFoundFields028) {
    return [];
  }

  arrFoundFields028.forEach(field => {
    const mem028field = field;

    const aSubfield = field.subfields.find(sf => sf.code === 'a'); // eslint-disable-line functional/immutable-data
    const bSubfield = field.subfields.find(sf => sf.code === 'b'); // eslint-disable-line functional/immutable-data
    const qSubfield = field.subfields.find(sf => sf.code === 'q'); // eslint-disable-line functional/immutable-data
    const nr6Subfield = field.subfields.find(sf => sf.code === '6'); // eslint-disable-line functional/immutable-data
    const nr8Subfield = field.subfields.find(sf => sf.code === '8'); // eslint-disable-line functional/immutable-data

    marcRecord.removeField(field);

    const newField = {
      tag: `${mem028field.tag}`,
      ind1: `${mem028field.ind1}`,
      ind2: `${mem028field.ind2}`,
      subfields: buildNewSubfields()
    };

    marcRecord.insertField(newField);

    function buildNewSubfields () {
      const newSubs = [];

      if (bSubfield) { // eslint-disable-line functional/no-conditional-statements
        newSubs.push(bSubfield); // eslint-disable-line functional/immutable-data
      }
      if (aSubfield) { // eslint-disable-line functional/no-conditional-statements
        newSubs.push(aSubfield); // eslint-disable-line functional/immutable-data
      }
      if (qSubfield) { // eslint-disable-line functional/no-conditional-statements
        newSubs.push(qSubfield); // eslint-disable-line functional/immutable-data
      }
      if (nr6Subfield) { // eslint-disable-line functional/no-conditional-statements
        newSubs.push(nr6Subfield); // eslint-disable-line functional/immutable-data
      }
      if (nr8Subfield) { // eslint-disable-line functional/no-conditional-statements
        newSubs.push(nr8Subfield); // eslint-disable-line functional/immutable-data
      }
      return newSubs;
    }

  });
  return [];
}

export function handle037(marcRecord) {
  marcRecord.get(/^037$/u).forEach(field => {
    field.subfields.push({ // eslint-disable-line functional/immutable-data
      code: '5', value: 'HELME'
    });
  });
}
