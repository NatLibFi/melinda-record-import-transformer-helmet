export function handle130(marcRecord) {
  marcRecord.get(/^130$/u).forEach(field => {
    const a = field.subfields.find(sf => sf.code === 'a' && (/:/u).test(sf.value));

    if (a) {
      if ((/^(.[^:]*):/u).test(a.value) && (/\(elokuva :/ug).test(a.value)) { // eslint-disable-line prefer-named-capture-group
        const reComplex = (/^(.[^:]*):(\(.*\)|.*|.*\(.*\))/u).exec(a.value); // eslint-disable-line prefer-named-capture-group
        a.value = `${reComplex[1].replace(/\s+$/u, '')},${reComplex[2].replace(/,$/u, '.')}`;// eslint-disable-line functional/immutable-data
        return;
      }

      const reComplex = (/^(.[^:]*):(\(.*\)|.*|.*\(.*\))/u).exec(a.value); // eslint-disable-line prefer-named-capture-group

      if (reComplex) {
        a.value = `${reComplex[1].replace(/\s{2,}$/u, ' ')}:${reComplex[2].replace(/,$/u, '.')}`; // eslint-disable-line functional/immutable-data
        return;
      }

      const reSimple = (/^(.[^:]*)/u).exec(a.value); // eslint-disable-line prefer-named-capture-group
      a.value = `${reSimple[1].replace(/\s+$/u, '').replace(/,$/u, '.')}.`; // eslint-disable-line functional/immutable-data
      return;
    }
  });
}
