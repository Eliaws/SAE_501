import mongoose, { Schema } from "mongoose";
import validator from "validator";

const messageSchema = new Schema({
    lastname: {
        type: String,
        required: [true, "Veuillez mettre un nom de famille"],
    },
    firstname: {
        type: String,
        required: [true, "Veuillez mettre un prénom"],
    },
    email: {
        type: String,
        validate: [validator.isEmail, "E-mail incorrect"],
        required: [true, "Veuillez mettre un email"],
    },
    content: {
        type: String,
        required: [true, "Veuillez mettre un nom de famille"],
    },
    identity: {
        type: String,
        enum: ["non_precise", "autre", "etudiant", "parent"],
        default: "non_precise",
    }
},
    {
        timestamps: { createdAt: "created_at", }
    }
);

export default mongoose.model("Message", messageSchema);
