'use server';

import { scrapedAmazonProduct } from "../scaper";

export async function scrapeAndStoreProduct(productUrl: string) {
    if (!productUrl) return;

    try {
        const scrapedProduct = await scrapedAmazonProduct(productUrl);
        return scrapedProduct;
    } catch (error: any) {
        throw new Error(`Failed to create/update product: ${error.message}`)
    }
}