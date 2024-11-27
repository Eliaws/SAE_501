import mongoose from "mongoose";
import dotenv from "dotenv";

let envFilePath = "./env/.env.prod.local";
if (process.env.NODE_ENV === "development") {
    envFilePath = "./env/.env.dev.local";
}
const envVars = dotenv.config({ path: envFilePath });

// https://www.mongodb.com/try/download/community-kubernetes-operator
// Database Name
const defaultDBName = "sae501";
const defaultMongoDBURL = `mongodb://0.0.0.0:27017/${defaultDBName}`;
const mongoDBURL = envVars.parsed?.MONGODB_URL || defaultMongoDBURL;

const main = async () => {
    try {
        await mongoose.connect(mongoDBURL, {
            serverSelectionTimeoutMS: 20000,
        });
        return `MongoDB Server running on ${mongoDBURL}`;
    } catch (error) {
        throw new Error(error);
    }
};

export default main;
