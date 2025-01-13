import {createLogger} from '@natlibfi/melinda-backend-commons';
import {transformerBlobLogic, createMongoBlobsOperator, createAmqpOperator} from '@natlibfi/melinda-record-import-commons';
import createTransformHandler from './transform';
import amqplib from 'amqplib';

export async function startApp(config) {
  const logger = createLogger();
  const mongoOperator = await createMongoBlobsOperator(config.mongoUrl);
  const amqpOperator = await createAmqpOperator(amqplib, config.amqpUrl);
  const transformHandler = createTransformHandler();

  logger.info('Starting melinda record import transformer helmet');
  try {
    await transformerBlobLogic(mongoOperator, amqpOperator, transformHandler, config);

    debugHandling(`Closing AMQP resources!`);
    await amqpOperator.closeChannel();
    await amqpOperator.closeConnection();
  } catch (error) {
    logger.error(error);
  }
}
