import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GalaxyService } from './galaxy.service';
import { GalaxyController } from './galaxy.controller';
import { UserModule } from '../user/user.module';
import { Debris, DebrisSchema } from './schemas/debris.schema';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([{ name: Debris.name, schema: DebrisSchema }]),
  ],
  controllers: [GalaxyController],
  providers: [GalaxyService],
  exports: [GalaxyService],
})
export class GalaxyModule {}

