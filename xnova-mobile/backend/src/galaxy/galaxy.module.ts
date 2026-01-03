import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GalaxyService } from './galaxy.service';
import { GalaxyController } from './galaxy.controller';
import { UserModule } from '../user/user.module';
import { MessageModule } from '../message/message.module';
import { PlanetModule } from '../planet/planet.module';
import { Debris, DebrisSchema } from './schemas/debris.schema';

@Module({
  imports: [
    UserModule,
    MessageModule,
    PlanetModule,
    MongooseModule.forFeature([{ name: Debris.name, schema: DebrisSchema }]),
  ],
  controllers: [GalaxyController],
  providers: [GalaxyService],
  exports: [GalaxyService],
})
export class GalaxyModule {}

