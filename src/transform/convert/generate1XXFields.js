// Backround: https://wiki.helsinki.fi/xwiki/bin/view/rdasovellusohje/RDA-kuvailu%20MARC%2021%20-formaatilla/Aineistokohtaiset%20ty%C3%B6ohjeet/Videotallenteet/#H1302013PE4E4kirjaus2CyhtenE4istettynimeke28ET292013Ydinelementti


export function handle130(marcRecord) {
  marcRecord.get(/^130$/u).forEach(field => {
    const a = field.subfields.find(sf => sf.code === 'a');
    if (!a) {
      return;
    }

    const [fullTitle, qualifier] = splitAndTuneTitleAndQualifier(a.value);

    if (qualifier !== undefined) {
      a.value = `${fullTitle} ${qualifier}`;
    }

    // Convert final ',' to '.' (presumably Helmet had/has this punctuation error):
    a.value = a.value.replace(/([^ ]) *, *$/, '$1.');
    return;
  });

  function splitAndTuneTitleAndQualifier(f130a) {
    const matches = f130a.match(/^([^ ].*?)(\((?:(?:elokuva|lyhytelokuva|Motion picture|televisio-ohjelma)[^\)]*|19[0-9][0-9]|20[012][0-9])\)[ ,.:-]*)$/ui);
    if (matches) {
      // MRA-614: "(elokuva, YYYY)"" is converted to "(elokuva : YYYY)".
      return [matches[1].trim().replace(/ ?: /u, ', '), matches[2].replace(/^([^ ]+), ([12][0-9][0-9][0-9])/u, "$1 : $2")];
    }
    return [f130a, undefined];
  }
}
