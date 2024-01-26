# Helmet record transformer for the Melinda record batch import system  [![Build Status](https://travis-ci.org/NatLibFi/melinda-record-import-transformer-helmet.svg)](https://travis-ci.org/NatLibFi/melinda-record-import-transformer-helmet) [![Test Coverage](https://codeclimate.com/github/NatLibFi/melinda-record-import-transformer-helmet/badges/coverage.svg)](https://codeclimate.com/github/NatLibFi/melinda-record-import-transformer-helmet/coverage)

Helmet record transformer for the Melinda record batch import system. Consumes records as represented by Helmet's [Sierra ILS](https://sandbox.iii.com/iii/sierra-api/swagger/index.html)

## Envs
### Generic transformer envs
| Name                                   | Description                                                 | default                      |
|----------------------------------------|-------------------------------------------------------------|------------------------------|
| RECORD_IMPORT_API_URL                  | Record import api url                                       | 'cli'                        |
| RECORD_IMPORT_API_USERNAME_TRANSFORMER | Record import api username for transformer                  | 'cli'                        |
| RECORD_IMPORT_API_PASSWORD_TRANSFORMER | Record import api password for transformer                  | hidden                       |
| API_CLIENT_USER_AGENT                  | Api client user agent                                       | "_RECORD-IMPORT-TRANSFORMER" |
| ABORT_ON_INVALID_RECORDS               | If record transformation fails abort transformation process | 0  (false)                   |
| PROFILE_IDS                            | Record-import profiles that wish to use this transformer    | "[\"foobar\"]"               |
| LOG_LEVEL                              | Logging level e.g. 'info', 'error, 'debug'                  | "info"                       |
| AMQP_URL                               | Rabbit MQ container url                                     | "amqp://127.0.0.1:5672/"     |
|                                        |                                                             |                              |

## License and copyright

Copyright (c) 2018-2024 **University Of Helsinki (The National Library Of Finland)**

This project's source code is licensed under the terms of **GNU Affero General Public License Version 3** or any later version.
