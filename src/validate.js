/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Helmet record transformer for the Melinda record batch import system
*
* Copyright (C) 2018 University Of Helsinki (The National Library Of Finland)
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
import {MarcRecord} from '@natlibfi/marc-record';
import validateFactory from '@natlibfi/marc-record-validate';
import {
	EndingPunctuation,
	FieldExclusion,
	SubfieldExclusion,
	FieldStructure,
	EmptyFields
} from '@natlibfi/marc-record-validators-melinda';

export default async () => {
	const validate = await validateFactory([
		await FieldExclusion([
			/^(001|091|092|093|094|095|574|575|576|577|578|599)$/,
			{ tag: /^264$/, subfields: [{code: /^a$/, value: /^\[.*\]$/ }]},
			{ tag: /^650$/, subfields: [{code: /^a$/, value: /^overdrive$/i }]},
			{ tag: /^041$/, dependencies: [{leader: /^.{6}[g|i]/}] }
		]),
		await EmptyFields(),
		await SubfieldExclusion([
			{ tag: /^041$/, subfields: [{code: /a|d/, value: /^zxx$/ }]}
		]),
		await FieldStructure([
			{tag: /^007$/, dependencies: [{leader: /^.{6}[^at]/}]}
		]),
		await EndingPunctuation()
	]);

	return async (records, fix = false) => {
		const opts = fix ? {fix: true, validateFixes: true} : {fix: false};
		const results = await Promise.all(
			records.map(r => validate(r, opts))
		);

		return results.map(result => ({
			record: result.record,
			failed: !result.valid,
			messages: result.report
		}));
	};
};
