import { Observable } from 'rxjs';
import { AuthorizeRequest } from './authorize-request';
import { AuthorizeResponse } from './authorize-response';
import { GetPaymentStatusRequest } from './get-payment-status-request';
import { GetPaymentStatusResponse } from './get-payment-status-response';

export interface PaymentsGrpcService {
  Authorize(payload: AuthorizeRequest): Observable<AuthorizeResponse>;
  GetPaymentStatus(
    payload: GetPaymentStatusRequest,
  ): Observable<GetPaymentStatusResponse>;
}
