import Product from "@/lib/models/product.model";
import { connectDB } from "@/lib/mongoose";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import { scrapedAmazonProduct } from "@/lib/scraper";
import { getAveragePrice, getEmailNotifType, getHighestPrice, getLowestPrice } from "@/lib/utils";
import { Product as ProductType, User } from "@/types";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        connectDB();
        const products = await Product.find({});

        if (!products) throw new Error('no products found');

        /////////// SCRAPE LATEST DETAILS FOR ALL EXISTING PRODUCTS AND UPDATE THE DB ///////////
        const updatedProducts = await Promise.all(products.map(async (currentProduct) => {
            const scrapedProduct = await scrapedAmazonProduct(currentProduct.url);

            if (!scrapedAmazonProduct) throw new Error('product not found');

            const updatedPriceHistory = [
                ...currentProduct.priceHistory,
                { price: scrapedProduct?.currentPrice }
            ];

            const product = {
                ...scrapedProduct,
                priceHistory: updatedPriceHistory,
                lowestPrice: getLowestPrice(updatedPriceHistory),
                highestPrice: getHighestPrice(updatedPriceHistory),
                averagePrice: getAveragePrice(updatedPriceHistory),
            }

            const updatedProduct = await Product.findOneAndUpdate({
                url: currentProduct.url
            }, product)


            /////// CHECK PRODUCT STATUS AND SEND EMAIL ACCORDINGLY ///////////
            const emailNotificationType = getEmailNotifType(scrapedProduct as ProductType, currentProduct);

            if (emailNotificationType && updatedProduct.users.length > 0) {
                const productInfo = {
                    title: updatedProduct.title,
                    url: updatedProduct.url,
                };

                const emailContent = await generateEmailBody(productInfo, emailNotificationType);
                const userEmails = updatedProduct.users.map((user: User) => user.email);

                await sendEmail(emailContent, userEmails)
            }

            return updatedProduct
        }))

        return NextResponse.json({
            message: 'OK',
            data: updatedProducts
        });
    } catch (error: any) {
        throw new Error(`Failed to get all products: ${error.message}`);
    }
}