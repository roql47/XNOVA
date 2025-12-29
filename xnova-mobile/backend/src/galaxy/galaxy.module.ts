import { Module } from '@nestjs/common';
import { GalaxyService } from './galaxy.service';
import { GalaxyController } from './galaxy.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [GalaxyController],
  providers: [GalaxyService],
  exports: [GalaxyService],
})
export class GalaxyModule {}

