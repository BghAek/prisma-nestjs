import 'dotenv/config'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    super({ adapter }); 
  }
  async onModuleInit() {
    try {
      await this.$queryRaw`SELECT 1`;
      Logger.log("database connection successful !")
    } catch (error) {
      Logger.log("databse connection failed", error);
      throw(error)
    }
  }
}
