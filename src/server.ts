import dotenv from "dotenv"
import app from "./app.js";
dotenv.config();


const SERVER_PORT = process.env.PORT || 4000;
if (!SERVER_PORT) {
    throw new Error("Please provide a port number");
}

// import { startPricePolling } from "./utils/oracle.service.js";

app.listen(Number(SERVER_PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${SERVER_PORT}`);

    // Auto-start polling if enabled
    // Auto-start polling if enabled
    // if (process.env.AUTO_START_POLLING === 'true') {
    //     console.log('Auto-starting price polling service...');
    //     startPricePolling();
    // }
});