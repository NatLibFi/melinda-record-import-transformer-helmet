export function handle500(marcRecord) {
  marcRecord.get(/^500$/u).forEach(field => {
    const a = field.subfields.find(sf => sf.code === 'a');

    if (a && (/^(ääniraita|lainausoikeus\.|ljudspår)/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement, prefer-named-capture-group
      const newField = clone(field);
      newField.tag = (/^lainausoikeus/ui).test(a.value) ? '540' : '546'; // eslint-disable-line functional/immutable-data

      marcRecord.insertField(newField);
      marcRecord.removeField(field);
    }
  });

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }
}

export function handle506(marcRecord) {
  marcRecord.get(/^506$/u).forEach(field => {
    const a = field.subfields.find(sf => sf.code === 'a');

    if (a) { // eslint-disable-line functional/no-conditional-statement
      const re = (/^(Kielletty alle [0-9]+-v\.)(.*)$/ui).exec(a.value); // eslint-disable-line prefer-named-capture-group

      if (re) { // eslint-disable-line functional/no-conditional-statement
        const reInner = (/^Kielletty alle ([0-9]+)-v\./ui).exec(re[1]); // eslint-disable-line prefer-named-capture-group
        a.value = `Kielletty alle ${reInner[1]}-vuotiailta.${re[2]}`; // eslint-disable-line functional/immutable-data
      }
    }
  });
}

export function handle530(marcRecord) {
  marcRecord.get(/^530$/u).forEach(field => {
    const a = field.subfields.find(sf => sf.code === 'a');

    if (a && (/^Julkaistu myös e-kirjana\.$/u).test(a.value)) { // eslint-disable-line functional/no-conditional-statement
      a.value = 'Julkaistu myös verkkoaineistona.'; // eslint-disable-line functional/immutable-data
    }
  });
}

export function handle546(marcRecord) {
  const [f040] = marcRecord.get(/^040$/u); // eslint-disable-line functional/immutable-data

  if (f040) { // eslint-disable-line functional/no-conditional-statement
    const b = f040.subfields.find(sf => sf.code === 'b');

    if (b && b.value === 'fin') { // eslint-disable-line functional/no-conditional-statement
      marcRecord.get(/^546$/u)
        .forEach(field => {
          const a = field.subfields.find(sf => sf.code === 'a');

          if (a && (/svenska/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement
            a.value = a.value.replace(/svenska/ui, 'ruotsi'); // eslint-disable-line functional/immutable-data
            a.value = a.value.replace(/^ruotsi/u, 'Ruotsi'); // eslint-disable-line functional/immutable-data
          }
        });
    }
  }
}
