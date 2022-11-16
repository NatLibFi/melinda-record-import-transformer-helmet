export function handle300(marcRecord) {
  marcRecord.get(/^300$/u)
    .forEach(field => {
      const a = field.subfields.find(sf => sf.code === 'a'); // eslint-disable-line functional/immutable-data
      const b = field.subfields.find(sf => sf.code === 'b'); // eslint-disable-line functional/immutable-data

      if (a) { // eslint-disable-line functional/no-conditional-statement
        if (b && b.value === 'elektroninen') { // eslint-disable-line functional/no-conditional-statement
          if ((/^1 tekstitiedosto/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement
            a.value = generateExtendDescr(a.value); // eslint-disable-line functional/immutable-data
            marcRecord.removeSubfield(b, field);
          } else if ((/^1 äänitiedosto/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement
            a.value = generateExtendDescr(a.value); // eslint-disable-line functional/immutable-data
            marcRecord.removeSubfield(b, field);

            marcRecord.insertField({
              tag: '347', subfields: [{code: 'a', value: '1 äänitiedosto'}]
            });
          } else if ((/^1 videotiedosto/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement
            a.value = generateExtendDescr(a.value); // eslint-disable-line functional/immutable-data
            marcRecord.removeSubfield(b, field);

            marcRecord.insertField({
              tag: '347', subfields: [{code: 'a', value: '1 videotiedosto'}]
            });
          }
        } else if ((/^(e-äänikirja|e-ljudbok|eljudbok|e-kirja)/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement, prefer-named-capture-group
          a.value = generateExtendDescr(a.value); // eslint-disable-line functional/immutable-data
        } else if ((/^(äänikirja|ljudbok)/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement, prefer-named-capture-group
          a.value = generateExtendDescr(a.value, '1 CD-äänilevy'); // eslint-disable-line functional/immutable-data
        } else if ((/^cd-skiva/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement
          a.value = generateExtendDescr(a.value, '1 CD-ljudskiva'); // eslint-disable-line functional/immutable-data
        } else { // eslint-disable-line functional/no-conditional-statement
          handleConsoleGames();
        }
      }

      function handleConsoleGames() {
        if ((/^konsolipeli \(1 (tietolevy|blu-ray-levy|muistikortti)\)/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement, prefer-named-capture-group
          const re = (/^konsolipeli \((.*)\)(.*)$/ui).exec(a.value); // eslint-disable-line prefer-named-capture-group
          a.value = `${re[1]}${re[2]}`; // eslint-disable-line functional/immutable-data
        } else if ((/^(konsolipeli|konsolspel)/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement, prefer-named-capture-group
          const [f007] = marcRecord.get(/^007$/u);

          if (f007.value[1] === 'o') { // eslint-disable-line functional/no-conditional-statement
            a.value = generateExtendDescr(a.value, '1 tietolevy'); // eslint-disable-line functional/immutable-data
          }

          if (f007.value[1] === 'b') { // eslint-disable-line functional/no-conditional-statement
            a.value = generateExtendDescr(a.value, '1 piirikotelo'); // eslint-disable-line functional/immutable-data
          }

          if (f007.value[1] === 'z') { // eslint-disable-line functional/no-conditional-statement
            a.value = generateExtendDescr(a.value, '1 muistikortti'); // eslint-disable-line functional/immutable-data
          }
        }
      }

      function generateExtendDescr(descr, prefix = '1 verkkoaineisto') {
        const re = (/ \((.*)\)/ui).exec(descr); // eslint-disable-line prefer-named-capture-group

        if (re) { // eslint-disable-line functional/no-conditional-statement
          return `${prefix} (${re[1]})`;
        }

        return prefix;
      }
    });
}
