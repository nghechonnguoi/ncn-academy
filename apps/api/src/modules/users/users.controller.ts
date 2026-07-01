import { Controller, Get, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.usersService.findAll(+page, +limit);
  }

  @Get('me')
  getMe(@Request() req: any) {
    return this.usersService.findOne(req.user.id);
  }

  @Patch('me')
  updateMe(@Request() req: any, @Body() dto: { name?: string; phone?: string }) {
    return this.usersService.update(req.user.id, dto);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
