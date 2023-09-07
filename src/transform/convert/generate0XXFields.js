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
  marcRecord.get(/^028$/u).forEach(field => {

    const aCode = field.subfields.find(sf => sf.code === 'a');
    const bCode = field.subfields.find(sf => sf.code === 'b');
    const qCode = field.subfields.find(sf => sf.code === 'q');
    const nr6Code = field.subfields.find(sf => sf.code === '6');
    const nr8Code = field.subfields.find(sf => sf.code === '8');

    if (bCode) { // eslint-disable-line functional/no-conditional-statements
      field.subfields.push(bCode); // eslint-disable-line functional/immutable-data
    }

    if (aCode) { // eslint-disable-line functional/no-conditional-statements
      field.subfields.push(aCode); // eslint-disable-line functional/immutable-data
    }

    if (qCode) { // eslint-disable-line functional/no-conditional-statements
      field.subfields.push(qCode); // eslint-disable-line functional/immutable-data
    }

    if (nr6Code) { // eslint-disable-line functional/no-conditional-statements
      field.subfields.push(nr6Code); // eslint-disable-line functional/immutable-data
    }

    if (nr8Code) { // eslint-disable-line functional/no-conditional-statements
      field.subfields.push(nr8Code); // eslint-disable-line functional/immutable-data
    }


    if (bCode) { // eslint-disable-line functional/no-conditional-statements
      marcRecord.removeSubfield(bCode, field);
    }

    if (aCode) { // eslint-disable-line functional/no-conditional-statements
      marcRecord.removeSubfield(aCode, field);
    }

    if (qCode) { // eslint-disable-line functional/no-conditional-statements
      marcRecord.removeSubfield(qCode, field);
    }

    if (nr6Code) { // eslint-disable-line functional/no-conditional-statements
      marcRecord.removeSubfield(nr6Code, field);
    }

    if (nr8Code) { // eslint-disable-line functional/no-conditional-statements
      marcRecord.removeSubfield(nr8Code, field);
    }

  });
}

export function handle037(marcRecord) {
  marcRecord.get(/^037$/u).forEach(field => {
    field.subfields.push({ // eslint-disable-line functional/immutable-data
      code: '5', value: 'HELME'
    });
  });
}

