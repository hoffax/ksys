import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { parseActiveStatus, parsePagination } from '~/validators/common';
import {
   entityCreateSchema,
   entityFilterSchema,
   entityUpdateSchema,
} from '~/validators/entity';
import { prisma } from '../prisma';
import { t } from '../trpc';

export const entityRouter = t.router({
   list: t.procedure.input(entityFilterSchema).query(async ({ input }) => {
      const pagination = parsePagination(input.pagination);
      const filter = Prisma.validator<Prisma.EntityWhereInput>()({
         OR: [
            {
               name: {
                  contains: input.text,
                  mode: 'insensitive',
               },
            },
            { cellphone: { contains: input.text } },
            { document: { contains: input.text } },
         ],
      });

      const count = await prisma.entity.count({ where: filter });
      const items = await prisma.entity.findMany({
         where: filter,
         ...pagination,
         orderBy: {
            createdAt: 'asc',
         },
      });

      return {
         items: items,
         count: count,
      };
   }),
   byDocument: t.procedure.input(z.string()).query(async ({ input }) => {
      return await prisma.entity.findUnique({
         where: {
            document: input,
         },
      });
   }),
   byId: t.procedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
         return prisma.entity.findUnique({
            where: { id: input.id },
            include: {
               Credit: {
                  where: {
                     paymentLeft: {
                        gt: 0,
                     },
                  },
                  include: {
                     sale: true,
                  },
               },
               PaymentProcess: {
                  take: 100,
                  orderBy: {
                     createdAt: 'desc',
                  },
               },
               Sale: {
                  take: 100,
                  orderBy: {
                     createdAt: 'desc',
                  },
               },
            },
         });
      }),
   add: t.procedure.input(entityCreateSchema).mutation(async ({ input }) => {
      return prisma.$transaction(async (prisma) => {
         const newEntity = await prisma.entity.create({
            data: input,
         });

         await prisma.log.create({
            data: {
               table: 'entity',
               rowId: newEntity.id,
               type: 'CREATE',
               data: input,
            },
         });

         return newEntity;
      });
   }),
   update: t.procedure.input(entityUpdateSchema).mutation(async ({ input }) => {
      return prisma.$transaction(async (prisma) => {
         const entity = await prisma.entity.update({
            where: { id: input.id },
            data: input,
         });

         await prisma.log.create({
            data: {
               table: 'entity',
               rowId: entity.id,
               type: 'UPDATE',
               data: {
                  ...input,
                  deletedAt: undefined,
               },
            },
         });

         return entity;
      });
   }),
});
