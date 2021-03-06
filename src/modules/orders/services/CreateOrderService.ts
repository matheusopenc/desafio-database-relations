import { inject, injectable } from 'tsyringe';
import { validate } from 'uuid';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    if (!validate(customer_id)) throw new AppError('Customer not valid');
    const customer = await this.customersRepository.findById(customer_id);
    if (!customer) {
      throw new AppError('Customer not found');
    }

    const productsList = await this.productsRepository.findAllById(
      products.map(({ id }) => ({ id })),
    );

    if (productsList.length <= 0) {
      throw new AppError('Products not found');
    }

    await this.productsRepository.updateQuantity(products);

    const newAddProducts = productsList.map(product => ({
      product_id: product.id,
      price: product.price,
      quantity:
        products[products.findIndex(data => data.id === product.id)].quantity,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: newAddProducts,
    });

    return order;
  }
}

export default CreateOrderService;
