import {createLogger} from '@natlibfi/melinda-backend-commons';
import {transformerBlobLogic, createApiClient as createRecordImportApiClient} from '@natlibfi/melinda-record-import-commons';
import createTransformHandler from './transform';
import amqplib from 'amqplib';

export async function startApp(config) {
  const logger = createLogger();
  const riApiClient = createRecordImportApiClient(config.recordImportApiOptions);
  const transformHandler = createTransformHandler();

  logger.info('Starting melinda record import transformer helmet');
  try {
    await transformerBlobLogic(riApiClient, transformHandler, amqplib, config);
  } catch (error) {
    logger.error(error);
  }
}
