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

import fs from 'fs';
import yargs from 'yargs';
import transformFactory from './transform';
import moment from 'moment';
import {transformerCliLogic} from '@natlibfi/melinda-record-import-commons';

cli();

async function cli() {
  const args = yargs(process.argv.slice(2))
    .scriptName('melinda-record-import-transformer-helmet')
    .epilog('Copyright (C) 2018-2022 University Of Helsinki (The National Library Of Finland)')
    .usage('$0 <file> [options] and env variable info in README')
    .showHelpOnFail(true)
    .example([
      ['$ node $0/dist/cli.js helmet_file.json -rfv true -d transformed/'],
      ['$ node $0/dist/cli.js helmet_file.json -rv true -f false -d transformed/'],
      ['$ node $0/dist/cli.js  -r true -d transformed/ helmet_file.json']
    ])
    .env('TRANSFORM_HELMET')
    .positional('file', {type: 'string', describe: 'File to transform'})
    .options({
      v: {type: 'boolean', default: false, alias: 'validate', describe: 'Validate records'},
      f: {type: 'boolean', default: false, alias: 'fix', describe: 'Validate & fix records'},
      r: {type: 'boolean', default: false, alias: 'recordsOnly', describe: 'Write only record data to output (Invalid records are excluded)'},
      d: {type: 'string', alias: 'outputDirectory', describe: 'Output directory where each record file is written (Applicable only with `recordsOnly`'}
    })
    .check((args) => {
      const [file] = args._;
      if (file === undefined) {
        throw new Error('No file argument given');
      }

      if (!fs.existsSync(file)) {
        throw new Error(`File ${file} does not exist`);
      }

      return true;
    })
    .parseSync();

  const transform = transformFactory({moment});
  await transformerCliLogic(args, transform);
}
