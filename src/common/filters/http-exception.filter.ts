import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { DateUtil } from '../utils/date.util'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception.message || 'Internal server error'

    // Log the error for debugging purposes
    Logger.error('Error:', exception)

    response.status(status).json({
      statusCode: status,
      timestamp: DateUtil.getCurrentDate().toISOString(),
      path: request.url,
      error: typeof message === 'string' ? message : message['message'],
      details: exception.stack || null,
    })
  }
}
