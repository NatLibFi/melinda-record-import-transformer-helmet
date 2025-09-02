export function handleTerms(marcRecord) {
  marcRecord.get(/^(648|651|655)$/u).filter(field => field.subfields).forEach(field => { // eslint-disable-line prefer-named-capture-group
    const sf = field.subfields.find(sf => sf.code === '2');

    if (sf) {
      if (['648', '650'].includes(field.tag) && sf.value === 'kaunokki') {
        sf.value = 'ysa';
      }

      if (field.tag === '655' && sf.value === 'kaunokki') {
        sf.value = 'slm/fin';
      }

      if (field.tag === '655' && sf.value === 'bella') {
        sf.value = 'slm/swe';
      }
    }
  });
}
