import express from "express";
import path from "path";

const app = express();
const PORT = 3000;
const MAX_ROTATIONS = 5;
const FULL_CIRCLE = 360;
const MIN_ROTATIONAL_DEGREE = 1
// Path to frontend
const frontendPath = path.join(__dirname, "../../frontend");

// Static files 
app.use(express.static(frontendPath));

//  API
app.get("/api/random", (req, res) => {
    const ranNum: number = Math.floor(Math.random() * FULL_CIRCLE*MAX_ROTATIONS) + MIN_ROTATIONAL_DEGREE;

    res.json({ ranNum });
});
 
 
// Fallback: serve index.html
app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});