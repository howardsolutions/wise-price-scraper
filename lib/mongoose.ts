import mongoose from "mongoose";

export async function connectDB() {
    mongoose.set('strictQuery', true);

    if (!process.env.MONGODB_URI) return console.log('MONGODB_URI is required');

    try {
        const connect = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB connected: ${connect.connection.host}`);
    } catch (err: any) {
        console.log(`Error: ${err.message}`);
        process.exit(1);
    }
}