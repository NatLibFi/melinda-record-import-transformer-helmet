export function handleTerms(marcRecord) {
  marcRecord.get(/^700$/u).filter(field => field.subfields).forEach(field => JSON.stringify(field.subfields));
}
