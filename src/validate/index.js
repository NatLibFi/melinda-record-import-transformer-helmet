/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Helmet record transformer for the Melinda record batch import system
*
* Copyright (c) 2018-2019 University Of Helsinki (The National Library Of Finland)
*
* This file is part of melinda-record-import-transformer-helmet
*
* melinda-record-import-transformer-helmet program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* melinda-record-import-transformer-helmet is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/

/* eslint-disable new-cap */
import validateFactory from '@natlibfi/marc-record-validate';
import {
  FieldsPresent,
  FieldExclusion,
  EmptyFields,
  FieldStructure,
  EndingPunctuation,
  EndingWhitespace,
  IsbnIssn,
  NonBreakingSpace,
  SanitizeVocabularySourceCodes,
  SubfieldExclusion,
  TypeOfDateF008
} from '@natlibfi/marc-record-validators-melinda';

export default async () => {
  const validate = validateFactory([
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
      {tag: /^856$/u, subfields: [{code: /^u$/u, value: /^https:\/\/www.ellibslibrary.com/u}]}
    ]),
    await SanitizeVocabularySourceCodes(),
    await TypeOfDateF008(),
    await EmptyFields(),
    await IsbnIssn({hyphenateISBN: true}),
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
    return {
      record: result.record,
      failed: result.valid === false,
      messages: result.report
    };
  };
};
