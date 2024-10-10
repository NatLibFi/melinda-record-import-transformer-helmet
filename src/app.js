import {createLogger} from '@natlibfi/melinda-backend-commons';
import {transformerBlobLogic, createMongoBlobsOperator} from '@natlibfi/melinda-record-import-commons';
import createTransformHandler from './transform';
import amqplib from 'amqplib';

export async function startApp(config) {
  const logger = createLogger();
  const mongoOperator = await createMongoBlobsOperator(config.mongoUrl);

  const transformHandler = createTransformHandler();

  logger.info('Starting melinda record import transformer helmet');
  try {
    await transformerBlobLogic(mongoOperator, transformHandler, amqplib, config);
  } catch (error) {
    logger.error(error);
  }
}
