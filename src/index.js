#!/usr/bin/env node
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

'use strict';

import moment from moment;
import MarcRecord from 'marc-record-js';
import validateFactory from '@natlibfi/marc-record-validators-melinda';
import {TransformerUtils as utils} from '@natlibfi/melinda-record-import-commons';
import config from './config';

start();

async function start() {
	let validate;
	const logger = utils.createLogger();

	utils.registerSignalHandlers();
	utils.checkEnv();

	const stopHealthCheckService = utils.startHealthCheckService(process.env.HEALTH_CHECK_PORT);

	try {
		validate = validateFactory(config.validators);

		await utils.startTransformation(transform);
		stopHealthCheckService();
		process.exit();
	} catch (err) {
		stopHealthCheckService();
		logger.error(err);
		process.exit(-1);
	}

	async function transform(response) {
		const result = await response.json();
		const records = await Promise.all(result.entries.map(convertRecord));
		const validationResults = await Promise.all(records.map(r => validate(r, {
			fix: true,
			validateFixes: true
		})));

		return records.reduce((acc, record, index) => {
			return acc.concat({
				record,
				failed: validationResults[index].failed,
				messages: validationResults[index].validators,
			})
		}, []);

		function convertRecord(record) {
			const marcRecord = new MarcRecord();
			record.varFields.forEach(field => {
				if (field.content) {
					if (field.fieldTag === '_') {
						marcRecord.setLeader(field.content);
					} else {
						marcRecord.insertControlField({tag: field.marcTag, value: field.content });
					}
				} else {
					marcRecord.insertField({
						tag: field.marcTag,
						ind1: field.ind1,
						ind2: field.ind2,
						subfields: field.subfields.map(subfield => ({
							code: subfield.tag,
							value: subfield.content
						}))
					});
				}
			});

			return marcRecord;
		}
	}
}
