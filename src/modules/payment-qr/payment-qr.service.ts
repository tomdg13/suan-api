import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentQr } from './entities/payment-qr.entity';
import { CreatePaymentQrDto } from './dto/create-payment-qr.dto';
import { UpdatePaymentQrDto } from './dto/update-payment-qr.dto';

@Injectable()
export class PaymentQrService {
  constructor(
    @InjectRepository(PaymentQr)
    private readonly paymentQrRepo: Repository<PaymentQr>,
  ) {}

  findActive() {
    return this.paymentQrRepo.findOne({
      where: { isActive: 1 },
      order: { id: 'DESC' },
    });
  }

  findAll() {
    return this.paymentQrRepo.find({ order: { id: 'DESC' } });
  }

  async findOne(id: number) {
    const qr = await this.paymentQrRepo.findOne({ where: { id } });
    if (!qr) throw new NotFoundException(`payment_qr ${id} not found`);
    return qr;
  }

  async create(dto: CreatePaymentQrDto, filename: string | undefined, adminUserId?: number) {
    if (!filename) {
      throw new BadRequestException('A QR image is required');
    }

    await this.paymentQrRepo.update({ isActive: 1 }, { isActive: 0 });

    const qr = this.paymentQrRepo.create({
      imageUrl: `/uploads/payment-qr/${filename}`,
      title: dto.title,
      isActive: 1,
      createdBy: adminUserId,
    });
    return this.paymentQrRepo.save(qr);
  }

  async update(id: number, dto: UpdatePaymentQrDto, filename?: string) {
    await this.findOne(id);

    if (dto.isActive === 1) {
      await this.paymentQrRepo
        .createQueryBuilder()
        .update(PaymentQr)
        .set({ isActive: 0 })
        .where('isActive = 1 AND id != :id', { id })
        .execute();
    }

    const patch: Partial<PaymentQr> = { ...dto };
    if (filename) {
      patch.imageUrl = `/uploads/payment-qr/${filename}`;
    }

    await this.paymentQrRepo.update(id, patch);
    return this.findOne(id);
  }

  async remove(id: number) {
    const qr = await this.findOne(id);
    await this.paymentQrRepo.delete(id);
    return qr;
  }
}
