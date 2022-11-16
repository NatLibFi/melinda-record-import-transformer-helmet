export function handle856(marcRecord) {
  marcRecord.get(/^856$/u).forEach(field => {
    const subfield = field.subfields.find(sf => sf.code === 'z');

    if (subfield) { // eslint-disable-line functional/no-conditional-statement
      subfield.code = 'y'; // eslint-disable-line functional/immutable-data
    }

    const y = field.subfields.find(sf => sf.code === 'y');

    /* Move subfield y to the last index */
    if (y) { // eslint-disable-line functional/no-conditional-statement
      const index = field.subfields.indexOf(y);
      field.subfields.splice(index, 1); // eslint-disable-line functional/immutable-data
      field.subfields.push(y); // eslint-disable-line functional/immutable-data
    }
  });
}
