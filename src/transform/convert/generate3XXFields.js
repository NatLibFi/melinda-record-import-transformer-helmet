/**
 * Handle 300 fields for transformation
 * @param {MarcRecord} marcRecord Record data
 * @returns [handled 300 fields]
 */
export function handle300(marcRecord) {
  const extraFields = [];
  const newFields = marcRecord.get(/^300$/u)
    .map(field => {
      const tag = `${field.tag}`;
      const ind1 = `${field.ind1}`;
      const ind2 = `${field.ind2}`;
      const oldSubA = field.subfields.find(sf => sf.code === 'a');
      const oldSubB = field.subfields.find(sf => sf.code === 'b') || false;
      const otherOldSubs = field.subfields.filter(sf => sf.code !== 'a' && sf.code !== 'b');

      marcRecord.removeField(field);

      if (!oldSubA) {
        return field;
      }

      const ifBE = Boolean(oldSubB && oldSubB.value === 'elektroninen');

      if (ifBE && (/^1 tekstitiedosto/ui).test(oldSubA.value)) {
        return {
          tag, ind1, ind2,
          subfields: [{code: 'a', value: generateExtendDescr(oldSubA.value)}]
        };
      }

      if (ifBE && (/^1 äänitiedosto/ui).test(oldSubA.value)) {
        extraFields.push({tag: '347', subfields: [{code: 'a', value: '1 äänitiedosto'}]}); // eslint-disable-line functional/immutable-data
        return {
          tag, ind1, ind2,
          subfields: [{code: 'a', value: generateExtendDescr(oldSubA.value)}]
        };
      }

      if (ifBE && (/^1 videotiedosto/ui).test(oldSubA.value)) {
        extraFields.push({tag: '347', subfields: [{code: 'a', value: '1 videotiedosto'}]}); // eslint-disable-line functional/immutable-data
        return {
          tag, ind1, ind2,
          subfields: [{code: 'a', value: generateExtendDescr(oldSubA.value)}]
        };
      }

      if ((/^(e-äänikirja|e-ljudbok|eljudbok|e-kirja)/ui).test(oldSubA.value)) { // eslint-disable-line prefer-named-capture-group
        return {
          tag, ind1, ind2,
          subfields: [{code: 'a', value: generateExtendDescr(oldSubA.value)}, oldSubB].filter(sf => sf)
        };
      }

      if ((/^(äänikirja|ljudbok)/ui).test(oldSubA.value)) { // eslint-disable-line prefer-named-capture-group
        return {
          tag, ind1, ind2,
          subfields: [{code: 'a', value: generateExtendDescr(oldSubA.value, '1 CD-äänilevy')}, oldSubB].filter(sf => sf)
        };
      }

      if ((/^cd-skiva/ui).test(oldSubA.value)) {
        return {
          tag, ind1, ind2,
          subfields: [{code: 'a', value: generateExtendDescr(oldSubA.value, '1 CD-ljudskiva')}, oldSubB].filter(sf => sf)
        };
      }

      if ((/^konsolipeli \(1 (tietolevy|blu-ray-levy|muistikortti)\)/ui).test(oldSubA.value)) { // eslint-disable-line prefer-named-capture-group
        const re = (/^konsolipeli \((.*)\)(.*)$/ui).exec(oldSubA.value); // eslint-disable-line prefer-named-capture-group
        return {
          tag, ind1, ind2,
          subfields: [{code: 'a', value: `${re[1]}${re[2]}`}, oldSubB, ...otherOldSubs].filter(sf => sf)
        };
      }

      if ((/^(konsolipeli|konsolspel)/ui).test(oldSubA.value)) { // eslint-disable-line prefer-named-capture-group
        const [f007] = marcRecord.get(/^007$/u);

        if (f007.value[1] === 'o') {
          return {
            tag, ind1, ind2,
            subfields: [{code: 'a', value: generateExtendDescr(oldSubA.value, '1 tietolevy')}, oldSubB].filter(sf => sf)
          };
        }

        if (f007.value[1] === 'b') {
          return {
            tag, ind1, ind2,
            subfields: [{code: 'a', value: generateExtendDescr(oldSubA.value, '1 piirikotelo')}, oldSubB].filter(sf => sf)
          };
        }

        if (f007.value[1] === 'z') {
          return {
            tag, ind1, ind2,
            subfields: [{code: 'a', value: generateExtendDescr(oldSubA.value, '1 muistikortti')}, oldSubB].filter(sf => sf)
          };
        }
      }


      return field;

      function generateExtendDescr(descr, prefix = '1 verkkoaineisto') {
        const re = (/ \((.*)\)/ui).exec(descr); // eslint-disable-line prefer-named-capture-group

        if (re) { // eslint-disable-line functional/no-conditional-statements
          return `${prefix} (${re[1]})`;
        }

        return prefix;
      }
    });

  return [...newFields, ...extraFields];
}
