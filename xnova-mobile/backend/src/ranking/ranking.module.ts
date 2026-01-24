import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RankingService } from './ranking.service';
import { RankingController } from './ranking.controller';
import { UserModule } from '../user/user.module';
import { Alliance, AllianceSchema } from '../alliance/schemas/alliance.schema';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([{ name: Alliance.name, schema: AllianceSchema }]),
  ],
  controllers: [RankingController],
  providers: [RankingService],
  exports: [RankingService],
})
export class RankingModule {}

