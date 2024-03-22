import axios from "axios";
import * as cheerio from "cheerio";
import { extractCurrency, extractDescription, extractPrice } from "../utils";

export async function scrapedAmazonProduct(url: string) {
    if (!url) return;

    // BrightData proxy configuration
    const username = String(process.env.BRIGHT_DATA_USERNAME);
    const password = String(process.env.BRIGHT_DATA_PASSWORD);
    const port = 22225;
    const session_id = (1000000 * Math.random()) | 0;

    const options = {
        auth: {
            username: `${username}-session-${session_id}`,
            password
        },
        host: 'brd.superproxy.io',
        port,
        rejectUnauthorized: false,
    }

    try {
        // Fetch the product page
        const response = await axios(url, options);

        const $ = cheerio.load(response.data);

        // Extract the product title and price
        const title = $('#productTitle').text().trim();
        const currentPrice = extractPrice(
            $('.priceToPay span.a-price-whole'),
            $('.a.size.base.a-color-price'),
            $('.a-button-selected .a-color-base'),
        );

        const originalPrice = extractPrice(
            $('#priceblock_ourprice'),
            $('.a-price.a-text-price span.a-offscreen'),
            $('#listPrice'),
            $('#priceblock_dealprice'),
            $('.a-size-base.a-color-price')
        );

        const outOfStock = $('#availability span').text().trim().toLowerCase() === 'currently unavailable';

        const images = $('#imgBlkFront').attr('data-a-dynamic-image') || $('#landingImage').attr('data-a-dynamic-image') || '{}';

        const imageUrls = Object.keys(JSON.parse(images))

        const currency = extractCurrency($('.a-price-symbol'));
        const discountRate = $('.savingPercentage').text().replace(/[-%]/g, '');

        const stars = $('.reviewCountTextLinkedHistogram span a.a-popover-trigger .a-size-base').text().trim();
        const numOfRatings = $('.a-declarative #acrCustomerReviewLink span#acrCustomerReviewText').text();
        const description = extractDescription($);

        // Construct data obj with scapred information from amazon
        const data = {
            url,
            currency: currency || '$',
            image: imageUrls?.at(0) || '',
            title,
            currentPrice: +currentPrice || +originalPrice,
            originalPrice: +originalPrice || +currentPrice,
            priceHistory: [],
            discountRate: +discountRate,
            category: 'category',
            numOfRatings,
            stars: +stars,
            isOutOfStock: outOfStock,
            description,
            lowestPrice: +currentPrice || +originalPrice,
            highestPrice: +originalPrice || +currentPrice,
            averagePrice: +currentPrice || +originalPrice
        }

        return data;
    } catch (err: any) {
        throw new Error(`failed to scrape product: ${err.message}`);
    }
}