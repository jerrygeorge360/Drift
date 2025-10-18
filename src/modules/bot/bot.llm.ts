import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function llmDecisionEngine(botName: string, context: string): Promise<string> {
    console.log(`[${botName}] Thinking...`);

    const completion = await groq.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [
            { role: "system", content: `You are an autonomous trading and delegation agent named ${botName}.` },
            { role: "user", content: context },
        ],
    });

    const result = completion.choices[0]?.message?.content?.trim() || "";
    console.log(`🧩 [${botName}] Response: ${result}`);
    return result;
}
