import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminService } from './admin.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Get revenue chart data' })
  getRevenueChart(@Query('days') days?: string) {
    return this.adminService.getRevenueChart(days ? parseInt(days, 10) : 30);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get paginated user list' })
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getUsers({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      role,
      status,
    });
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get single user detail' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user role or status' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Soft-delete user (set status to SUSPENDED)' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('analytics/orders-by-status')
  @ApiOperation({ summary: 'Get count of orders grouped by status' })
  getOrdersByStatus() {
    return this.adminService.getOrdersByStatus();
  }

  @Get('analytics/category-sales')
  @ApiOperation({ summary: 'Get sum of sales per category (top 8)' })
  getCategorySales() {
    return this.adminService.getCategorySales();
  }

  @Get('analytics/top-customers')
  @ApiOperation({ summary: 'Get top 5 customers by total spend' })
  getTopCustomers() {
    return this.adminService.getTopCustomers();
  }
}
