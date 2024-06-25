import {createLogger} from '@natlibfi/melinda-backend-commons';
import {transformerBlobLogic, createApiClient as createRecordImportApiClient, createMongoOperator} from '@natlibfi/melinda-record-import-commons';
import createTransformHandler from './transform';
import amqplib from 'amqplib';

export async function startApp(config) {
  const logger = createLogger();
  const mongoOperator = config.mongoUrl ? await createMongoOperator(config.mongoUrl) : false;
  const riApiClient = await createRecordImportApiClient(config.recordImportApiOptions, config.keycloakOptions, mongoOperator);
  const transformHandler = createTransformHandler();

  logger.info('Starting melinda record import transformer helmet');
  try {
    await transformerBlobLogic(riApiClient, transformHandler, amqplib, config);
  } catch (error) {
    logger.error(error);
  }
}
