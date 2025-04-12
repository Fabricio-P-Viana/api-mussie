// bull-board.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';

@Module({})
export class BullBoardModule {
  static forRoot(queue: any) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    createBullBoard({
      queues: [new BullAdapter(queue)],
      serverAdapter,
    });

    return {
      module: BullBoardModule,
      providers: [
        {
          provide: 'BULL_BOARD_INSTANCE',
          useValue: serverAdapter.getRouter(),
        },
      ],
      exports: ['BULL_BOARD_INSTANCE'],
    };
  }
}