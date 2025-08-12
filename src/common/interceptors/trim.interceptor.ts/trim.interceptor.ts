import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TrimInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.body) {
      request.body = this.trimValues(request.body);
    }

    return next.handle().pipe(
      map((data) => {
        if (typeof data === 'object' && data !== null) {
          return this.trimValues(data);
        }
        return data;
      }),
    );
  }

  private trimValues(obj: any): any {
    if (typeof obj === 'string') {
      return obj.trim();
    } else if (Array.isArray(obj)) {
      return obj.map((item) => this.trimValues(item));
    } else if (obj !== null && typeof obj === 'object') {
      const trimmedObj: { [key: string]: any } = {};
      Object.keys(obj).forEach((key) => {
        trimmedObj[key] = this.trimValues(obj[key]);
      });
      return trimmedObj;
    }
    return obj;
  }
}
