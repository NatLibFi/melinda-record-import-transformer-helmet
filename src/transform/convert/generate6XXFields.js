export function handleTerms(marcRecord) {
  marcRecord.get(/^(648|651|655)$/u).filter(field => field.subfields).forEach(field => { // eslint-disable-line prefer-named-capture-group
    const sf = field.subfields.find(sf => sf.code === '2');

    if (sf) {
      if (['648', '650'].includes(field.tag) && sf.value === 'kaunokki') { // eslint-disable-line functional/no-conditional-statement
        sf.value = 'ysa'; // eslint-disable-line functional/immutable-data
      }

      if (field.tag === '655' && sf.value === 'kaunokki') { // eslint-disable-line functional/no-conditional-statement
        sf.value = 'slm/fin'; // eslint-disable-line functional/immutable-data
      }

      if (field.tag === '655' && sf.value === 'bella') { // eslint-disable-line functional/no-conditional-statement
        sf.value = 'slm/swe'; // eslint-disable-line functional/immutable-data
      }
    }
  });
}
