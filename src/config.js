import {readEnvironmentVariable} from '@natlibfi/melinda-backend-commons';
import {parseBoolean} from '@natlibfi/melinda-commons';

export const profileIds = readEnvironmentVariable('PROFILE_IDS', {defaultValue: ['foobar'], format: v => JSON.parse(v)});
export const amqpUrl = readEnvironmentVariable('AMQP_URL', {defaultValue: 'amqp://127.0.0.1:5672/'});
export const abortOnInvalidRecords = readEnvironmentVariable('ABORT_ON_INVALID_RECORDS', {defaultValue: false, format: parseBoolean});

export const recordImportApiOptions = {
  recordImportApiUrl: readEnvironmentVariable('RECORD_IMPORT_API_URL', {defaultValue: 'cli'}),
  userAgent: readEnvironmentVariable('API_CLIENT_USER_AGENT', {defaultValue: '_RECORD-IMPORT-TRANSFORMER'}),
  allowSelfSignedApiCert: readEnvironmentVariable('ALLOW_API_SELF_SIGNED', {defaultValue: false, format: parseBoolean})
};

export const keycloakOptions = {
  issuerBaseURL: readEnvironmentVariable('KEYCLOAK_ISSUER_BASE_URL', {defaultValue: 'KEYCLOAK_ISSUER_BASE_URL env is not set!'}),
  serviceClientID: readEnvironmentVariable('KEYCLOAK_SERVICE_CLIENT_ID', {defaultValue: 'KEYCLOAK_SERVICE_CLIENT_ID env is not set!'}),
  serviceClientSecret: readEnvironmentVariable('KEYCLOAK_SERVICE_CLIENT_SECRET', {defaultValue: 'KEYCLOAK_SERVICE_CLIENT_SECRET env is not set!'})
};