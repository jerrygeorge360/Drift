import dotenv from "dotenv"
import app from "./app.js";
dotenv.config();


const port = process.env.PORT || 4000;

app.listen(4000, "0.0.0.0", () => {
    console.log("Server running on port 4000");
});
