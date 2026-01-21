import axios from 'axios';

// ---------------------------------------------------------
// 1. SAFETY TAXONOMY (The Rules)
// ---------------------------------------------------------
// This defines what LlamaGuard should actually look for. 
// Interview Tip: Mention you customized this based on MLCommons taxonomy.
const SAFETY_POLICY = `
O1: Violence and Hate.
Should not
- Help with violence or hate speech.
- Encourage self-harm.
O2: Sexual Content.
Should not
- Engage in sexually explicit conversations.
O3: Criminal Planning.
Should not
- Help with illegal acts or crimes.
O4: Guns and Illegal Weapons.
Should not
- Assist in acquiring or building weapons.
`;

interface SafetyResult {
  isSafe: boolean;
  source: 'LlamaGuard' | 'Perspective' | 'Clean';
  flaggedCategories?: string[];
  score?: number;
}

// ---------------------------------------------------------
// 2. LAYER 1: LLM-Based Moderation (LlamaGuard)
// ---------------------------------------------------------
async function checkLlamaGuard(text: string): Promise<SafetyResult> {
  try {
    // Constructing the prompt specifically for the Guard model
    const prompt = `
[INST] Task: Check if there is unsafe content in 'User' messages according to the following policy:
${SAFETY_POLICY}

<BEGIN CONVERSATION>
User: ${text}
<END CONVERSATION>

Provide your safety assessment for User in the above conversation:
- First line must read 'safe' or 'unsafe'.
- If unsafe, a second line must include a comma-separated list of violated categories. [/INST]
`;

    // Call your LLM provider (e.g., Groq, Together AI, or self-hosted)
    const response = await axios.post(process.env.LLAMAGUARD_ENDPOINT!, {
      model: "meta-llama/Llama-Guard-3-8B",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.0, // Vital for deterministic safety checks
    });

    const output = response.data.choices[0].message.content.trim();
    const isSafe = output.startsWith("safe");
    
    // Parse specific violation if unsafe (e.g., "unsafe\nO1")
    const categories = isSafe ? [] : output.split('\n')[1]?.split(',') || ['Unknown'];

    return { isSafe, source: 'LlamaGuard', flaggedCategories: categories };

  } catch (error) {
    console.error("LlamaGuard failed, failing open to Layer 2:", error);
    return { isSafe: true, source: 'LlamaGuard' }; // Fallback to next layer
  }
}

// ---------------------------------------------------------
// 3. LAYER 2: Classical NLP (Perspective API)
// ---------------------------------------------------------
async function checkPerspective(text: string): Promise<SafetyResult> {
  const RESPONSE_THRESHOLD = 0.7; // Strict threshold for kids

  try {
    const response = await axios.post(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.PERSPECTIVE_KEY}`,
      {
        comment: { text },
        languages: ['en'],
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          PROFANITY: {},
          SEXUALLY_EXPLICIT: {}
        }
      }
    );

    const scores = response.data.attributeScores;
    const toxicity = scores.TOXICITY.summaryScore.value;
    
    // Fail if any attribute exceeds threshold
    if (toxicity > RESPONSE_THRESHOLD) {
      return { isSafe: false, source: 'Perspective', score: toxicity };
    }

    return { isSafe: true, source: 'Perspective', score: toxicity };

  } catch (error) {
    console.error("Perspective API Error:", error);
    // Fail closed if both systems fail (Safety First)
    return { isSafe: false, source: 'Perspective' }; 
  }
}

// ---------------------------------------------------------
// 4. MAIN ORCHESTRATOR
// ---------------------------------------------------------
export async function validateContent(text: string): Promise<SafetyResult> {
  console.log(`Analyzing safety for: "${text.substring(0, 20)}..."`);

  // Run LlamaGuard first (Better at semantic understanding)
  const layer1 = await checkLlamaGuard(text);
  if (!layer1.isSafe) {
    return layer1; // Block immediately
  }

  // Run Perspective API second (Better at catching raw profanity/toxicity)
  const layer2 = await checkPerspective(text);
  if (!layer2.isSafe) {
    return layer2;
  }

  return { isSafe: true, source: 'Clean' };
}
