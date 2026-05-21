import { type CallHandler, type ExecutionContext, Injectable, Logger, type NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ method: string; url: string; ip: string }>();
    const { method, url, ip } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.log(`${method} ${url} — ${ms}ms [${ip}]`);
        },
        error: (err: { status?: number }) => {
          const ms = Date.now() - start;
          this.logger.warn(`${method} ${url} — ${ms}ms [${ip}] ERROR ${err?.status ?? 500}`);
        },
      }),
    );
  }
}
