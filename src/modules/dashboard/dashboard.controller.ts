import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview() {
    const [
      summary,
      today,
      revenueTrend,
      statusBreakdown,
      pendingApplications,
      topStores,
      topProducts,
      salesByCategory,
      flashSales,
      recentOrders,
      pendingWithdrawals,
      lowStock,
      salesByProvince,
      paymentBreakdown,
    ] = await Promise.all([
      this.dashboardService.getSummary(),
      this.dashboardService.getTodaySales(),
      this.dashboardService.getRevenueTrend(30),
      this.dashboardService.getOrderStatusBreakdown(),
      this.dashboardService.getPendingApplications(),
      this.dashboardService.getTopStores(),
      this.dashboardService.getTopProducts(),
      this.dashboardService.getSalesByCategory(),
      this.dashboardService.getActiveFlashSales(),
      this.dashboardService.getRecentOrders(),
      this.dashboardService.getPendingWithdrawals(),
      this.dashboardService.getLowStock(),
      this.dashboardService.getSalesByProvince(),
      this.dashboardService.getPaymentMethodBreakdown(),
    ]);

    return {
      summary,
      today,
      revenueTrend,
      statusBreakdown,
      pendingApplications,
      topStores,
      topProducts,
      salesByCategory,
      flashSales,
      recentOrders,
      pendingWithdrawals,
      lowStock,
      salesByProvince,
      paymentBreakdown,
    };
  }

  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('revenue-trend')
  getRevenueTrend() {
    return this.dashboardService.getRevenueTrend(30);
  }

  @Get('top-stores')
  getTopStores() {
    return this.dashboardService.getTopStores();
  }

  @Get('top-products')
  getTopProducts() {
    return this.dashboardService.getTopProducts();
  }

  @Get('low-stock')
  getLowStock() {
    return this.dashboardService.getLowStock();
  }

  @Get('pending-applications')
  getPendingApplications() {
    return this.dashboardService.getPendingApplications();
  }

  @Get('pending-withdrawals')
  getPendingWithdrawals() {
    return this.dashboardService.getPendingWithdrawals();
  }
}
