import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Planet, PlanetSchema } from './schemas/planet.schema';
import { PlanetService } from './planet.service';
import { PlanetController } from './planet.controller';
import { UserModule } from '../user/user.module';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Planet.name, schema: PlanetSchema }]),
    forwardRef(() => UserModule),
    MessageModule,
  ],
  controllers: [PlanetController],
  providers: [PlanetService],
  exports: [PlanetService, MongooseModule],
})
export class PlanetModule {}

