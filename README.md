# Helmet record transformer for the Melinda record batch import system  [![Build Status](https://travis-ci.org/NatLibFi/melinda-record-import-transformer-marc.svg)](https://travis-ci.org/NatLibFi/melinda-record-import-transformer-marc) [![Test Coverage](https://codeclimate.com/github/NatLibFi/melinda-record-import-transformer-marc/badges/coverage.svg)](https://codeclimate.com/github/NatLibFi/melinda-record-import-transformer-marc/coverage)

Helmet record transformer for the Melinda record batch import system. Consumes records as represented by Helmet's [Sierra ILS](https://sandbox.iii.com/iii/sierra-api/swagger/index.html)

## Usage
Create `config.js` in `src`. The module must export an object which has a property `validators` (See how [validators are specified](https://github.com/NatLibFi/marc-record-validators-melinda#passing-options-to-validators)).

## License and copyright

Copyright (c) 2018 **University Of Helsinki (The National Library Of Finland)**

This project's source code is licensed under the terms of **GNU Affero General Public License Version 3** or any later version.
