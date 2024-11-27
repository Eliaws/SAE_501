import mongoose, { Schema } from "mongoose";

import { errorRequiredMessage } from "#database/error-messages.js";
import Article from "./article.js";

const commentArticleSchema = new Schema(
    {
        content: {
            type: String,
            required: [
                true,
                errorRequiredMessage("un commentaire"),
            ],
            trim: true,
        },
        article: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Article",
            required: true,
        },
    },
    {
        timestamps: { createdAt: "created_at" },
    }
);

commentArticleSchema.methods.getClean = function () {
    const res = {
        _id: this._id,
        content: this.content,
        article: this.article._id,
        created_at: this.created_at,
        updatedAt: this.updatedAt,
        __v: this.__v,
    };

    return res;
};

commentArticleSchema.pre(
    "findOneAndDelete",
    { document: true, query: true },
    async function (next) {
        try {
            await Article.findOneAndUpdate({ list_comments: this.getQuery()._id }, { $pull: { list_comments: this.getQuery()._id } });
        } catch {}

        next();
    }
);

export default mongoose.model("CommentArticle", commentArticleSchema);
