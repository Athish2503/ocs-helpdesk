import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
   import { ZodSchema } from 'zod';

   export class ZodValidationPipe implements PipeTransform {
     constructor(private schema: ZodSchema) {}

     transform(value: unknown, metadata: ArgumentMetadata) {
       try {
         return this.schema.parse(value);
       } catch (error: any) {
         throw new BadRequestException({
           statusCode: 400,
           message: 'Validation failed',
           errors: error.errors || error.message,
         });
       }
     }
   }
   
