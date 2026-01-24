import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AllianceController } from './alliance.controller';
import { AllianceService } from './alliance.service';
import { Alliance, AllianceSchema } from './schemas/alliance.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Message, MessageSchema } from '../message/schemas/message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Alliance.name, schema: AllianceSchema },
      { name: User.name, schema: UserSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  controllers: [AllianceController],
  providers: [AllianceService],
  exports: [AllianceService],
})
export class AllianceModule {}
