export function handleLeader(marcRecord) {
  const chars = marcRecord.leader.split('');

  // Set record as unicode
  chars[9] = 'a';

  if (chars[6] === 'o' && marcRecord.get(/^655$/u).some(isBoardGame)) {
    chars[6] = 'r';
  }

  if (chars[18] === 'c') {
    chars[18] = 'i';
  }

  marcRecord.leader = chars.join('');

  function isBoardGame(field) {
    return field.subfields.some(sf => sf.code === 'a' && sf.value === 'lautapelit');
  }
}

export function handleSID(marcRecord, record) {
  if (record.id === undefined) {
    return [];
  }

  return [
    {
      tag: 'SID', subfields: [
        {code: 'c', value: record.id},
        {code: 'b', value: 'helme'}
      ]
    }
  ];
}
