import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PayrollService } from './payroll.service';
import { PurchaseInvoiceService } from './purchase-invoice.service';
import { ReportService } from './report.service';

describe('Purchase invoices, payroll and reports services', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('filters purchase invoices by view and pays one', () => {
    const invoices = TestBed.inject(PurchaseInvoiceService);
    invoices.list({ page: 1, pageSize: 8, view: 'Overdue' }).subscribe();
    invoices.pay(5).subscribe();

    expect(http.expectOne((r) => r.url === '/api/purchase-invoices').request.params.get('view')).toBe('Overdue');
    expect(http.expectOne('/api/purchase-invoices/5/pay').request.method).toBe('POST');
  });

  it('creates a payroll period and moves it through generate, approve and pay', () => {
    const payroll = TestBed.inject(PayrollService);
    const period = { startDate: '2026-11-01', endDate: '2026-11-30', paymentDate: '2026-11-30' };
    payroll.create(period).subscribe();
    payroll.generate(2).subscribe();
    payroll.approve(2).subscribe();
    payroll.pay(2).subscribe();
    payroll.payslip(40).subscribe();

    expect(http.expectOne('/api/payroll-periods').request.body).toEqual(period);
    for (const step of ['generate', 'approve', 'pay']) {
      expect(http.expectOne(`/api/payroll-periods/2/${step}`).request.method).toBe('POST');
    }
    expect(http.expectOne('/api/payslips/40').request.method).toBe('GET');
  });

  it('asks the report for a range', () => {
    TestBed.inject(ReportService).overview('Month').subscribe();

    expect(http.expectOne((r) => r.url === '/api/reports/overview').request.params.get('range')).toBe('Month');
  });
});
