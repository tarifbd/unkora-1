import { Module } from '@nestjs/common';
import { ShiprocketController } from './shiprocket.controller';
import { ShiprocketService } from './shiprocket.service';

@Module({ controllers: [ShiprocketController], providers: [ShiprocketService], exports: [ShiprocketService] })
export class ShiprocketModule {}
