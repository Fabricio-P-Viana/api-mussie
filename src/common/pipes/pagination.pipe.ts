import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class PaginationPipe implements PipeTransform {
  transform(value: any) {
    const page = parseInt(value.page, 10) || 1;
    const limit = parseInt(value.limit, 10) || 10;

    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page e limit devem ser maiores que 0');
    }

    const skip = (page - 1) * limit;
    return { skip, take: limit };
  }
}