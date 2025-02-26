import express from "express";
import routeName from "#server/utils/name-route.middleware.js";
import fs from "fs/promises";
import path from "path";

const jsonJPO = path.join(process.cwd(), "src", "data", "divers.json");
const base = "divers";
const router = express.Router();

// Get multiple authors
router.get(`/${base}`, routeName("getDivers"), async (req, res) => {
    try {
        // Lire le contenu du fichier JSON
        const diversData = JSON.parse(await fs.readFile(jsonJPO, "utf-8"));

        // Rendre la page avec les données récupérées
        res.render("pages/back-end/divers/divers.njk", { divers: diversData });
    } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
        req.flash("error", "Impossible de charger les données.");
        res.render("pages/back-end/divers/divers.njk", { divers: {} });
    }
});

router.post(`/${base}`, routeName("update_divers"), async (req, res) => {
    console.log(res.locals.jpo);
    const { jpo_date, jpo_start, jpo_end } = req.body;
    try {
        const diversData = JSON.parse(await fs.readFile(jsonJPO, "utf-8"));

        // Mettre à jour les valeurs
        diversData.jpo.date = jpo_date;
        diversData.jpo.start_time = jpo_start;
        diversData.jpo.end_time = jpo_end;

        await fs.writeFile(jsonJPO, JSON.stringify(diversData, null, 4));

        req.flash("success", "La Journée Portes Ouvertes a été mise à jour avec succès.");
    } catch (error) {
        console.error("Erreur lors de la mise à jour des données :", error);
        req.flash("error", "Une erreur est survenue lors de la mise à jour.");
        res.render("pages/back-end/divers/divers.njk");
    }
    res.render("pages/back-end/divers/divers.njk");
});


export default router;
