import { MongoDriver } from '@mikro-orm/mongodb';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const clientUrl = configService.get<string>('MONGO_URL');
        const dbName = configService.get<string>('MONGO_INITDB_DATABASE');
        return {
          driver: MongoDriver,
          implicitTransactions: true,
          autoLoadEntities: true,
          entities: ['@domain'],
          debug: true,
          clientUrl,
          dbName,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class RepositoryModule {}
