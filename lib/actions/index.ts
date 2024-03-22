'use server';

import { revalidatePath } from "next/cache";
import Product from "../models/product.model";
import { connectDB } from "../mongoose";
import { scrapedAmazonProduct } from "../scraper";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";

export async function scrapeAndStoreProduct(productUrl: string) {
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