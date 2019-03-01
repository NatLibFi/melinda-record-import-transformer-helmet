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

import transform from './transform';
import createValidateFunction from './validate';
import {TransformerUtils, registerSignalHandlers, createLogger, startHealthCheckService} from '@natlibfi/melinda-record-import-commons';

import {API_URL, BLOB_ID, PROFILE_ID, API_USERNAME, API_PASSWORD, AMQP_URL, ABORT_ON_INVALID_RECORDS} from './config';

start();

async function start() {
	const {checkEnv, startTransformation} = TransformerUtils;
	const Logger = createLogger();

	registerSignalHandlers();
	checkEnv();

	const stopHealthCheckService = startHealthCheckService(process.env.HEALTH_CHECK_PORT);

	process.on('SIGINT', () => {
		stopHealthCheckService();
	});

	try {
		Logger.log('info', 'Starting melinda-record-import-transformer-helmet');
		await startTransformation({
			callback: transformCallback,
			blobId: BLOB_ID,
			profile: PROFILE_ID,
			apiURL: API_URL,
			apiUsername: API_USERNAME,
			apiPassword: API_PASSWORD,
			amqpURL: AMQP_URL,
			abortOnInvalid: ABORT_ON_INVALID_RECORDS
		});

		stopHealthCheckService();
		process.exit();
	} catch (err) {
		stopHealthCheckService();
		Logger.error(err.stack);
		process.exit(-1);
	}

	async function transformCallback(response) {
		Logger.log('debug', 'Transforming records');

		const records = await transform(response);
		const validate = await createValidateFunction();

		Logger.log('debug', 'Validating records');
		return validate(records, true);
	}
}
