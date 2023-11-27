export function handleLeader(marcRecord) {
  const chars = marcRecord.leader.split('');

  // Set record as unicode
  chars[9] = 'a'; // eslint-disable-line functional/immutable-data

  if (chars[6] === 'o' && marcRecord.get(/^655$/u).some(isBoardGame)) { // eslint-disable-line functional/no-conditional-statements
    chars[6] = 'r'; // eslint-disable-line functional/immutable-data
  }

  if (chars[18] === 'c') { // eslint-disable-line functional/no-conditional-statements
    chars[18] = 'i'; // eslint-disable-line functional/immutable-data
  }

  marcRecord.leader = chars.join(''); // eslint-disable-line functional/immutable-data

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
