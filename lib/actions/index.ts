'use server';

import { revalidatePath } from "next/cache";
import Product from "../models/product.model";
import { connectDB } from "../mongoose";
import { scrapedAmazonProduct } from "../scraper";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";
import { Product as ProductType } from '@/types';

export async function scrapeAndStoreProduct(productUrl: string): Promise<ProductType | undefined> {
    if (!productUrl) return;

    try {
        connectDB();

        const scrapedProduct = await scrapedAmazonProduct(productUrl);

        if (!scrapedProduct) return;

        let product = scrapedProduct;

        const existingProduct = await Product.findOne({ url: scrapedProduct.url });

        if (existingProduct) {
            const updatedPriceHistoryProduct: any = [
                ...existingProduct.priceHistory,
                { price: scrapedProduct.currentPrice }
            ];

            product = {
                ...scrapedProduct,
                priceHistory: updatedPriceHistoryProduct,
                lowestPrice: getLowestPrice(updatedPriceHistoryProduct),
                highestPrice: getHighestPrice(updatedPriceHistoryProduct),
                averagePrice: getAveragePrice(updatedPriceHistoryProduct),
            }
        }

        // If the product already exists => update
        // if not => create new product
        const newProduct = await Product.findOneAndUpdate({ url: scrapedProduct.url }, product, {
            upsert: true,
            new: true
        });

        revalidatePath(`/products/${newProduct._id}`);
    } catch (error: any) {
        throw new Error(`Failed to create/update product: ${error.message}`)
    }
}

export async function getProductById(productId: string): Promise<ProductType | undefined> {
    try {
        connectDB();
        const product = await Product.findOne({ _id: productId })

        if (!product) return;

    } catch (error) {
        console.log(error);
    }
} 