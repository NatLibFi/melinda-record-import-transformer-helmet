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
  // Official subfield alternatives: a, b, q, 6, 8 -> presentation order (fin): b, a, q, 6, 8
  // non-standard but in use: $5 ja $9
  const arrFoundFields028 = marcRecord.get(/^028$/u);

  if (!arrFoundFields028) {
    return [];
  }

  arrFoundFields028.forEach(field => {
    const mem028field = field;

    const aSubfield = field.subfields.filter(sf => sf.code === 'a'); // eslint-disable-line functional/immutable-data
    const bSubfield = field.subfields.filter(sf => sf.code === 'b'); // eslint-disable-line functional/immutable-data
    const qSubfield = field.subfields.filter(sf => sf.code === 'q'); // eslint-disable-line functional/immutable-data
    const nr5Subfield = field.subfields.filter(sf => sf.code === '5'); // eslint-disable-line functional/immutable-data
    const nr6Subfield = field.subfields.filter(sf => sf.code === '6'); // eslint-disable-line functional/immutable-data
    const nr7Subfield = field.subfields.filter(sf => sf.code === '7'); // eslint-disable-line functional/immutable-data
    const nr8Subfield = field.subfields.filter(sf => sf.code === '8'); // eslint-disable-line functional/immutable-data
    const nr9Subfield = field.subfields.filter(sf => sf.code === '9'); // eslint-disable-line functional/immutable-data
    const otherSubfield = field.subfields.filter(sf => !['a', 'b', 'q', '5', '6', '7', '8', '9'].includes(sf.code)); // eslint-disable-line functional/immutable-data

    marcRecord.removeField(field);

    const newField = {
      tag: `${mem028field.tag}`,
      ind1: `${mem028field.ind1}`,
      ind2: `${mem028field.ind2}`,
      subfields: buildNewSubfields()
    };

    marcRecord.insertField(newField);

    function buildNewSubfields () {
      const newSubs = [...bSubfield, ...aSubfield, ...qSubfield, ...nr5Subfield, ...nr6Subfield, ...nr7Subfield, ...nr8Subfield, ...nr9Subfield, ...otherSubfield];
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
