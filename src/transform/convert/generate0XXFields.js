export function handle020(marcRecord) {
  marcRecord.get(/^020$/u)
    .forEach(field => {
      if (!field.subfields.find(sf => sf.code === 'q')) { // eslint-disable-line functional/no-conditional-statement
        const a = field.subfields.find(sf => sf.code === 'a'); // eslint-disable-line functional/immutable-data

        if (a && (/\s/u).test(a.value.trim())) { // eslint-disable-line functional/no-conditional-statement
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

export function handle037(marcRecord) {
  marcRecord.get(/^037$/u).forEach(field => {
    field.subfields.push({ // eslint-disable-line functional/immutable-data
      code: '5', value: 'HELME<KEEP>'
    });
  });
}
