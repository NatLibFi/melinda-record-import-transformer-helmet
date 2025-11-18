export function handle500(marcRecord) {
  marcRecord.get(/^500$/u).forEach(field => {
    const a = field.subfields.find(sf => sf.code === 'a');

    if (a && (/^(ääniraita|lainausoikeus\.|ljudspår)/ui).test(a.value)) {
      const newField = clone(field);
      newField.tag = (/^lainausoikeus/ui).test(a.value) ? '540' : '546';

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

    if (a) {
      const re = (/^(Kielletty alle [0-9]+-v\.)(.*)$/ui).exec(a.value);

      if (re) {
        const reInner = (/^Kielletty alle ([0-9]+)-v\./ui).exec(re[1]);
        a.value = `Kielletty alle ${reInner[1]}-vuotiailta.${re[2]}`;
      }
    }
  });
}

export function handle530(marcRecord) {
  marcRecord.get(/^530$/u).forEach(field => {
    const a = field.subfields.find(sf => sf.code === 'a');

    if (a && (/^Julkaistu myös e-kirjana\.$/u).test(a.value)) {
      a.value = 'Julkaistu myös verkkoaineistona.';
    }
  });
}

export function handle546(marcRecord) {
  const [f040] = marcRecord.get(/^040$/u);

  if (f040) {
    const b = f040.subfields.find(sf => sf.code === 'b');

    if (b && b.value === 'fin') {
      marcRecord.get(/^546$/u)
        .forEach(field => {
          const a = field.subfields.find(sf => sf.code === 'a');

          if (a && (/svenska/ui).test(a.value)) {
            a.value = a.value.replace(/svenska/ui, 'ruotsi');
            a.value = a.value.replace(/^ruotsi/u, 'Ruotsi');
          }
        });
    }
  }
}
