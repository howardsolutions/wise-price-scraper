import { Product } from '@/types';
import Link from 'next/link';
import React from 'react';
import Image from 'next/image';

type ProductCardProps = {
  product: Product;
};

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Link href={`/products/${product._id}`} className='product-card'>
      <div>
        <Image
          src={product.image}
          width={200}
          height={200}
          alt={product.title}
          className='product-cart_img'
        />
      </div>

      <div className='flex flex-col gap-3'>
        <h3 className='product-title'>{product.title}</h3>

        <div className='flex justify-between'>
          <p className='text-black opacity-50 text-lg capitalize'>
            {product.category}
          </p>

          <p className='text-black text-lg font-semibold'>
            <span>{product?.currency}</span>
            <span>{product?.currentPrice}</span>
          </p>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
