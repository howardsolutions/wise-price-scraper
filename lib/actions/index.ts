'use server';

import { revalidatePath } from "next/cache";
import Product from "../models/product.model";
import { connectDB } from "../mongoose";
import { scrapedAmazonProduct } from "../scraper";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";
import { Product as ProductType, User } from '@/types';
import { generateEmailBody, sendEmail } from "../nodemailer";

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

        // revalidate the product details page 
        revalidatePath(`/products/${newProduct._id}`);
        revalidatePath('/');
    } catch (error: any) {
        throw new Error(`Failed to create/update product: ${error.message}`)
    }
}

export async function getProductById(productId: string): Promise<ProductType | undefined> {
    try {
        connectDB();
        const product = await Product.findOne({ _id: productId })

        if (!product) return;

        return product;
    } catch (error) {
        console.log(error);
    }
}

export async function getProducts(): Promise<ProductType[] | undefined> {
    try {
        connectDB();

        const products = await Product.find({});

        if (!products) return;

        return products;
    } catch (error) {
        console.log(error);
    }
}

export async function getSimilarProducts(productId: string): Promise<ProductType[] | undefined> {
    try {
        connectDB();

        const currentProduct = await Product.findById(productId);

        if (!currentProduct) return;

        const similarProducts = await Product.find({
            _id: { $ne: productId }
        }).limit(3);

        return similarProducts;

    } catch (error) {
        console.log(error);
    }
}

// Email Functionality
export async function addUserEmailToProduct(productId: string, userEmail: string) {
    try {
        const product = await Product.findById(productId);

        if (!product) return;

        const isExistingUser = product.users.some((user: User) => user.email === userEmail);

        if (!isExistingUser) {
            product.users.push({ email: userEmail })
            await product.save();

            const emailContent = await generateEmailBody(product, 'WELCOME')

            await sendEmail(emailContent, [userEmail])
        }

    } catch (error) {
        console.log(error)
    }
} 