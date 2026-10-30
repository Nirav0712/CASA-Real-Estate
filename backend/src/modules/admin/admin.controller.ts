import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/enums/auth.enums';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateAdminUserDto } from './dto/update-user.dto';
import { BulkDeleteUsersDto } from './dto/bulk-delete-users.dto';
import { BulkStatusUsersDto } from './dto/bulk-status-users.dto';
import { AdminAuditQueryDto } from './dto/admin-audit-query.dto';

@ApiTags('Admin Governance & Moderation')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get administrative dashboard KPI metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics returned from MongoDB' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('properties/pending')
  @ApiOperation({ summary: 'List pending property advertisements for moderation' })
  @ApiResponse({ status: 200, description: 'Pending queue returned from MongoDB' })
  getPendingProperties() {
    return this.adminService.getPendingQueue();
  }

  @Get('queue')
  @ApiOperation({ summary: 'Alias: List pending property advertisements for moderation' })
  @ApiResponse({ status: 200, description: 'Pending queue returned from MongoDB' })
  getQueue() {
    return this.adminService.getPendingQueue();
  }

  @Get('properties')
  @ApiOperation({ summary: 'List all properties for administration overview' })
  @ApiResponse({ status: 200, description: 'All properties returned with moderation metadata' })
  getAllProperties(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('listingType') listingType?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
    @Query('page') page?: number,
  ) {
    return this.adminService.getAllProperties({
      status,
      category,
      listingType,
      isFeatured,
      search,
      limit,
      skip,
      page,
    });
  }

  @Get('properties/:id')
  @ApiOperation({ summary: 'Get single property details for admin management' })
  @ApiResponse({ status: 200, description: 'Property details returned' })
  getPropertyById(@Param('id') id: string) {
    return this.adminService.getPropertyById(id);
  }

  @Patch('properties/:id')
  @ApiOperation({ summary: 'Update property details by administrator' })
  @ApiResponse({ status: 200, description: 'Property updated' })
  updateProperty(
    @Param('id') id: string,
    @Body() updateDto: any,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.updateProperty(id, updateDto, user);
  }

  @Post('properties/:id/approve')
  @ApiOperation({ summary: 'Approve and publish a pending property advertisement' })
  @ApiResponse({ status: 200, description: 'Property listing approved, published, and persisted' })
  approveProperty(
    @Param('id') id: string,
    @Body() body?: { note?: string },
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.approve(id, body?.note, user || undefined);
  }

  @Post('approve/:id')
  @ApiOperation({ summary: 'Alias: Approve and publish a pending property advertisement' })
  @ApiResponse({ status: 200, description: 'Property listing approved and published' })
  approveListing(
    @Param('id') id: string,
    @Body() body?: { note?: string },
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.approve(id, body?.note, user || undefined);
  }

  @Post('properties/:id/reject')
  @ApiOperation({ summary: 'Reject a pending property listing with mandatory reason code' })
  @ApiResponse({ status: 200, description: 'Property listing rejected and persisted in MongoDB' })
  rejectProperty(
    @Param('id') id: string,
    @Body() body?: { reasonCode?: string; feedback?: string },
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.reject(
      id,
      body?.reasonCode || 'INSUFFICIENT_DOCS',
      body?.feedback,
      user || undefined,
    );
  }

  @Post('reject/:id')
  @ApiOperation({ summary: 'Alias: Reject a pending property listing with reason code' })
  @ApiResponse({ status: 200, description: 'Property listing rejected' })
  rejectListing(
    @Param('id') id: string,
    @Body() body?: { reasonCode?: string; feedback?: string },
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.reject(
      id,
      body?.reasonCode || 'INSUFFICIENT_DOCS',
      body?.feedback,
      user || undefined,
    );
  }

  @Post('properties/:id/publish')
  @ApiOperation({ summary: 'Publish property listing' })
  publishProperty(@Param('id') id: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.adminService.publish(id, user);
  }

  @Post('properties/:id/unpublish')
  @ApiOperation({ summary: 'Unpublish property listing' })
  unpublishProperty(@Param('id') id: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.adminService.unpublish(id, user);
  }

  @Post('properties/:id/archive')
  @ApiOperation({ summary: 'Archive property listing' })
  archiveProperty(@Param('id') id: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.adminService.archive(id, user);
  }

  @Post('properties/:id/feature')
  @ApiOperation({ summary: 'Feature a property' })
  featureProperty(@Param('id') id: string) {
    return this.adminService.toggleFeature(id, true);
  }

  @Post('properties/:id/unfeature')
  @ApiOperation({ summary: 'Unfeature a property' })
  unfeatureProperty(@Param('id') id: string) {
    return this.adminService.toggleFeature(id, false);
  }

  // ==========================================
  // FEATURED PROPERTY REQUEST APPROVAL (Requirements 7 & 8)
  // ==========================================

  @Get('featured-requests')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'List all Featured Property Requests submitted by Brokers' })
  @ApiResponse({ status: 200, description: 'Featured requests list returned' })
  getFeaturedRequests(@Query() query: any) {
    return this.adminService.getAdminFeaturedRequests(query);
  }

  @Post('featured-requests/:id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Super Admin approve a Featured Property Request' })
  @ApiResponse({ status: 200, description: 'Featured placement approved and activated' })
  approveFeaturedRequest(
    @Param('id') id: string,
    @Body() body: { approvedDurationDays?: number; approvedStartDate?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.approveFeaturedRequest(user, id, body);
  }

  @Post('featured-requests/:id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Super Admin reject a Featured Property Request' })
  @ApiResponse({ status: 200, description: 'Featured request rejected' })
  rejectFeaturedRequest(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminService.rejectFeaturedRequest(user, id, body);
  }

  @Post('properties/:id/rera-verify')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Admin verify RERA registration for a property' })
  @ApiResponse({ status: 200, description: 'Property RERA marked VERIFIED' })
  verifyPropertyRera(
    @Param('id') id: string,
    @Body() body?: { notes?: string; reraNumber?: string },
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.verifyPropertyRera(id, body, user);
  }

  @Post('properties/:id/rera-reject')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Admin reject RERA registration for a property' })
  @ApiResponse({ status: 200, description: 'Property RERA marked REJECTED' })
  rejectPropertyRera(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.rejectPropertyRera(id, body?.reason, user);
  }

  @Delete('properties/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Super Admin only permanently delete property listing or reel' })
  deleteProperty(@Param('id') id: string) {
    return this.adminService.deleteProperty(id);
  }

  // ==========================================
  // PHASE 08: USER & ROLE MANAGEMENT
  // ==========================================

  @Get('users')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all users with pagination and search' })
  @ApiResponse({ status: 200, description: 'Paginated user list returned' })
  getUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get detailed user record including property statistics' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user profile, credentials (password), role, and status' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.updateUser(id, dto, user);
  }

  @Patch('users/:id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user account status (ACTIVE, SUSPENDED, DEACTIVATED)' })
  @ApiResponse({ status: 200, description: 'User status updated and active sessions invalidated' })
  updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.updateUserStatus(id, dto, user);
  }

  @Patch('users/:id/role')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user role with administrative RBAC verification' })
  @ApiResponse({ status: 200, description: 'User role updated and logged to audit trail' })
  updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.updateUserRole(id, dto, user);
  }

  @Delete('users/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a single user account with session & profile cleanup' })
  @ApiResponse({ status: 200, description: 'User deleted and audit trail logged' })
  deleteUser(
    @Param('id') id: string,
    @Body() body?: { reason?: string },
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.deleteUser(id, body?.reason, user);
  }

  @Post('users/bulk-delete')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Bulk delete selected user accounts' })
  @ApiResponse({ status: 200, description: 'Bulk user deletion report' })
  bulkDeleteUsers(
    @Body() dto: BulkDeleteUsersDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.bulkDeleteUsers(dto.userIds, dto.reason, user);
  }

  @Post('users/bulk-status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Bulk update status (ACTIVE, SUSPENDED, DEACTIVATED) for selected users' })
  @ApiResponse({ status: 200, description: 'Bulk user status update report' })
  bulkUpdateUserStatus(
    @Body() dto: BulkStatusUsersDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.bulkUpdateUserStatus(dto.userIds, dto.status, dto.reason, user);
  }

  // ==========================================
  // PHASE 08: AGENTS & RERA VERIFICATION
  // ==========================================

  @Get('agents')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'List all real estate agents with verification queue data' })
  @ApiResponse({ status: 200, description: 'Agent directory returned' })
  getAgents(@Query() query: AdminUserQueryDto) {
    return this.adminService.getAgents(query);
  }

  @Get('agents/:id/verification')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get full agent verification application details and submitted documents' })
  @ApiResponse({ status: 200, description: 'Verification application detail returned' })
  getAgentVerificationDetail(@Param('id') id: string) {
    return this.adminService.getAgentVerificationDetail(id);
  }

  @Get('kyc')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'List KYC verification queue with documents and status' })
  @ApiResponse({ status: 200, description: 'KYC queue returned' })
  getKycQueue(
    @Query('status') status?: string,
    @Query('accountType') accountType?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getKycVerificationQueue({ status, accountType, search, page, limit });
  }

  @Post('kyc/:id/approve')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve KYC application making 3-Month Free Plan available to claim' })
  @ApiResponse({ status: 200, description: 'KYC approved and 3-Month Free Plan is available to claim' })
  approveKyc(
    @Param('id') id: string,
    @Body() body?: { notes?: string },
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.verifyAgent(id, body?.notes, user);
  }

  @Post('kyc/:id/reject')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject KYC application with mandatory reason' })
  @ApiResponse({ status: 200, description: 'KYC rejected and notification sent' })
  rejectKyc(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.rejectAgentVerification(id, body?.reason, user);
  }

  @Post('users/:id/package')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Manually assign a package to a user' })
  @ApiResponse({ status: 200, description: 'Package assigned to user' })
  assignUserPackage(
    @Param('id') id: string,
    @Body() body: { packageId: string },
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.assignUserPackage(id, body?.packageId, user);
  }

  @Post('agents/:id/verify')
  @Post('agents/:id/approve')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Grant CASA Verified Agent badge / Approve application' })
  @ApiResponse({ status: 200, description: 'Badge granted and persisted in MongoDB' })
  verifyAgent(
    @Param('id') id: string,
    @Body() body?: { notes?: string },
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.verifyAgent(id, body?.notes, user);
  }

  @Post('agents/:id/reject')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject agent verification application with mandatory reason' })
  @ApiResponse({ status: 200, description: 'Verification rejected and logged' })
  rejectAgentVerification(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.rejectAgentVerification(id, body?.reason, user);
  }

  @Post('agents/:id/revoke')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Revoke CASA Verified Agent badge' })
  @ApiResponse({ status: 200, description: 'Badge revoked and persisted in MongoDB' })
  revokeAgentVerification(
    @Param('id') id: string,
    @Body() body?: { reason?: string },
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.adminService.revokeAgentVerification(id, body?.reason, user);
  }

  @Get('agents/:id/employees')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Super Admin inspect employees belonging to a Broker' })
  @ApiResponse({ status: 200, description: 'Broker employee list returned' })
  getAgentEmployees(@Param('id') id: string) {
    return this.adminService.getAgentEmployees(id);
  }

  // ==========================================
  // PHASE 08: PURCHASERS
  // ==========================================

  @Get('purchasers')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'List plan purchasers, free trial users and subscribers' })
  @ApiResponse({ status: 200, description: 'Purchaser list returned' })
  getPurchasers(
    @Query() query: AdminUserQueryDto,
    @Query('category') category?: string,
  ) {
    return this.adminService.getPurchasers({ ...query, category });
  }

  // ==========================================
  // PHASE 08: AUDIT LOGS
  // ==========================================

  @Get('audit-logs')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Query immutable administrative audit logs' })
  @ApiResponse({ status: 200, description: 'Audit trail returned' })
  getAuditLogs(@Query() query: AdminAuditQueryDto) {
    return this.adminService.getAuditLogs(query);
  }

  // ==========================================
  // REAL-TIME NOTIFICATIONS & ALERTS
  // ==========================================

  @Get('notifications')
  @ApiOperation({ summary: 'List real-time consolidated governance alerts and enquiries' })
  @ApiResponse({ status: 200, description: 'Live alerts stream returned' })
  getNotifications(@Query() query: { limit?: number; type?: string; unreadOnly?: boolean }) {
    return this.adminService.getAdminNotifications(query);
  }

  @Patch('notifications/mark-all-read')
  @ApiOperation({ summary: 'Mark all governance alerts and enquiries as read' })
  markAllNotificationsRead() {
    return this.adminService.markAllAdminNotificationsRead();
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Mark single alert as read' })
  markNotificationRead(@Param('id') id: string) {
    return this.adminService.markAdminNotificationRead(id);
  }

  // ==========================================
  // PLATFORM & COMPANY CONTACT SETTINGS
  // ==========================================

  @Get('settings')
  @ApiOperation({ summary: 'Get current system settings and company hotlines' })
  getSettings() {
    return this.adminService.getSystemSettings();
  }

  @Patch('settings')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update system settings and company hotlines' })
  updateSettings(@Body() body: any) {
    return this.adminService.updateSystemSettings(body);
  }
}

