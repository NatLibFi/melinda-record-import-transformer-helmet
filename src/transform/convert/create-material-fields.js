export default function (record) {
  const materialType = record.materialType.code.trim();

  if (materialType === 'v') {
    return createElectronicVideo();
  }

  if (materialType === 't') {
    return createElectronicRecording();
  }

  const f007 = {tag: '007'};
  const f008 = {
    tag: '008',
    value: record.varFields.find(f => f.marcTag === '008').content
  };

  f007.value = f007ValueOptionsFromMaterialtype(materialType); // eslint-disable-line functional/immutable-data

  if (f007.value) {
    return [f007, f008];
  }

  function f007ValueOptionsFromMaterialtype(materialType) {
    if (materialType === 'h') {
      return create007Value({len: 9, i0: 'v', i1: 'd', i4: 's'});
    }

    if (materialType === '3') {
      return create007Value({len: 14, i0: 's', i1: 'd', i3: 'f', i6: 'g', i10: 'm'});
    }

    if (materialType === 'b') {
      return create007Value({len: 9, i0: 'g', i1: 's'});
    }

    if (materialType === 'g') {
      return create007Value({len: 9, i0: 'v', i1: 'd', i4: 'v'});
    }

    if (materialType === 'z') {
      update008([{index: 23, value: 'o'}]);
      return create007Value({len: 14, i0: 'c', i1: 'r'});
    }

    if (materialType === 'y') {
      update008([{index: 23, value: 'o'}]);
      return create007Value({len: 14, i0: 'c', i1: 'r'});
    }

    if (materialType === 's') {
      update008([{index: 23, value: '|'}, {index: 26, value: '|'}]);
      return create007Value({len: 14, i0: 'c', i1: '|', i4: 'g', i5: 'a'});
    }

    if (materialType === 'a') {
      return create007Value({len: 6, i0: 'k'});
    }

    if (materialType === 'c') {
      return create007Value({len: 6, i0: 'k', i1: 'l'});
    }

    if (materialType === 'x') {
      update008([{index: 26, value: 'j'}]);
      return create007Value({len: 14, i0: 'c', i1: 'r'});
    }

    if (materialType === '2') {
      return create007Value({len: 8, i0: 'a'});
    }

    if (materialType === 'r') {
      update008([{index: 33, value: 'g'}]);
      return create007Value({len: 2, i0: 'z', i1: 'u'});
    }

    /* Case '4':
    f007.value = create007Value({len: 14, i0: 's', i1: 's', i3: 'l', i6: 'j', i10: 'p'});
    break; */
    /* Case '6':
    f007.value = create007Value({len: 14, i0: 's', i1: 'd', i3: 'b', i6: 'e', i10: 'p'});
    break; */
    /* case 'n':
    f007.value = create007Value({len: 2, i0: 'f', i1: 'b'});
    break; */
    /* Case 'f':
    f007.value = create007Value({len: 9, i0: 'v', i1: 'f', i4: 'b'});
    break; */
    /* case 'd':
    update008([{index: 23, value: 'q'}]);
    f007.value = create007Value({len: 14, i0: 'c', i1: 'd', i4: 'g'});
    break; */
    /* Case 'e':
    update008([{index: 23, value: 'q'}]);
    f007.value = create007Value({len: 14, i0: 'c', i1: 'd', i4: 'g'});
    break; */
    /* case 'j':
    f007.value = create007Value({len: 13, i0: 'h', i1: 'u'});
    break; */

    return false;
  }

  function create007Value(opts) {
    const value = Array(opts.len).fill('|'); // eslint-disable-line functional/immutable-data

    Object.keys(opts).filter(k => k.startsWith('i')).forEach(k => {
      const index = Number(k.replace(/^i/u, ''));
      value[index] = opts[k]; // eslint-disable-line functional/immutable-data
    });

    return value.join('');
  }

  function createElectronicVideo() {
    const valuesFirst007 = replaceArrayValue(Array(9).fill('|'), {'0': 'v', '1': 'z'}); // eslint-disable-line functional/immutable-data
    const valuesSecond007 = replaceArrayValue(Array(14).fill('|'), {'0': 'c', '1': 'r'}); // eslint-disable-line functional/immutable-data
    const values006 = replaceArrayValue(Array(18).fill('|'), {'0': 'm', '6': 'o', '9': 'h'}); // eslint-disable-line functional/immutable-data

    return [
      {tag: '006', value: values006.join('')},
      {tag: '007', value: valuesFirst007.join('')},
      {tag: '007', value: valuesSecond007.join('')}
    ];
  }

  function createElectronicRecording() {
    const valuesFirst007 = replaceArrayValue(Array(14).fill('|'), {'0': 's', '1': 'r'}); // eslint-disable-line functional/immutable-data
    const valuesSecond007 = replaceArrayValue(Array(14).fill('|'), {'0': 'c', '1': 'r'}); // eslint-disable-line functional/immutable-data
    const values006 = replaceArrayValue(Array(18).fill('|'), {'0': 'm', '6': 'o', '9': 'h'}); // eslint-disable-line functional/immutable-data

    return [
      {tag: '006', value: values006.join('')},
      {tag: '007', value: valuesFirst007.join('')},
      {tag: '007', value: valuesSecond007.join('')}
    ];
  }

  function update008(values) {
    const chars = f008.value.split('');

    values.forEach(({index, value}) => {
      chars[index] = value; // eslint-disable-line functional/immutable-data
    });

    f008.value = chars.join(''); // eslint-disable-line functional/immutable-data
  }

  function replaceArrayValue(array, options) {
    return array.map((arrayValue, arrayIndex) => String(arrayIndex) in options ? options[String(arrayIndex)] : arrayValue);
  }
}
