/* eslint-disable new-cap */
import validateFactory from '@natlibfi/marc-record-validate';
import {
  EmptyFields,
  EndingPunctuation,
  EndingWhitespace,
  Field505Separators,
  Field521Fix,
  FieldExclusion,
  FieldsPresent,
  FieldStructure,
  IsbnIssn,
  NonBreakingSpace,
  SanitizeVocabularySourceCodes,
  SubfieldExclusion,
  SubfieldValueNormalizations,
  SortSubfields,
  TypeOfDateF008
} from '@natlibfi/marc-record-validators-melinda';
import {getRecordStandardIdentifiers, getRecordTitle} from '@natlibfi/melinda-commons/dist/utils';

export default async () => {
  const validate = validateFactory([
    await EmptyFields(),
    await FieldsPresent([/^(020|022|024)$/u]), // eslint-disable-line
    await FieldsPresent([/^336$/u, /^337$/u, /^338$/u]),
    await FieldExclusion([
      /^(001|091|092|093|094|095|256|533|546|574|575|576|577|578|599)$/u, // eslint-disable-line prefer-named-capture-group
      // Drop 041 https://kansalliskirjasto.slack.com/archives/C0123MAS485/p1679402190105819?thread_ts=1679391807.394099&cid=C0123MAS485
      {tag: /^041$/u, dependencies: [{leader: /^.{6}[g|i]/u}]}, // eslint-disable-line prefer-named-capture-group
      {tag: /^264$/u, subfields: [{code: /^a$/u, value: /^\[.*\]$/u}]},
      {tag: /^650$/u, subfields: [{code: /^a$/u, value: /^overdrive$/ui}]},
      {tag: /^(648|650|651|655)$/u, subfields: [{code: /^2$/u, value: /^(ysa|musa|allars|cilla)$/u}]}, // eslint-disable-line prefer-named-capture-group
      {tag: /^540$/u, subfields: [{code: /^a$/u, value: /^Käyttöoikeus Helmet-kirjastokortilla$/u}]},
      // Dropping note fields to avoid "double" fields - reported by TATI [MRA-453]
      {tag: /^588$/u, dependencies: [{leader: /^.{6}[g]/u}]}, // eslint-disable-line prefer-named-capture-group
      {tag: /^856$/u, subfields: [{code: /^u$/u, value: /^https:\/\/www.ellibslibrary.com/u}]},
      {tag: /^856$/u, subfields: [{code: /^u$/u, value: /^https:\/\/helmet.bibliolibrary.fi/u}]}
    ]),
    await SubfieldValueNormalizations(),
    await SortSubfields(),
    await SanitizeVocabularySourceCodes(),
    await Field505Separators(),
    await TypeOfDateF008(),
    await IsbnIssn({hyphenateISBN: true}),
    await Field521Fix(),
    await SubfieldExclusion([{tag: /^041$/u, subfields: [{code: /a|d/u, value: /^zxx$/u}]}]),
    await FieldStructure([{tag: /^007$/u, dependencies: [{leader: /^.{6}[^at]/u}]}]),
    await NonBreakingSpace(),
    await EndingWhitespace(),
    await NonBreakingSpace(),
    await EndingPunctuation()
  ]);

  return async (record, fix, validateFixes) => {
    const opts = fix ? {fix, validateFixes} : {fix};
    const result = await validate(record, opts);
    if (result.valid === false) {
      return {
        failed: true,
        title: getRecordTitle(record),
        standardIdentifiers: getRecordStandardIdentifiers(record),
        messages: filterErrorMessages(result.report),
        record: result.record
      };
    }

    return {
      record: result.record,
      failed: result.valid === false,
      messages: result.report
    };
  };

  function filterErrorMessages(messages) {
    const invalidValidationMessages = messages.filter(validationMessage => validationMessage.state === 'invalid');
    return invalidValidationMessages.map(validationMessage => `${validationMessage.description}: ${validationMessage.messages ? validationMessage.messages.join(',') : ''}`);
  }
};
