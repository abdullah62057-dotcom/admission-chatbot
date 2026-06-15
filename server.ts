import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { RagDocument, SimulatedWhatsAppMessage } from "./src/types.js";

// Make sure ESM paths work fine
const dirname = path.resolve();

const app = express();
const PORT = 3000;

// Enable JSON bodies
app.use(express.json());

// Path to durable records
const DATA_DIR = path.join(dirname, "data");
const DOCS_FILE = path.join(DATA_DIR, "documents.json");
const CHATS_FILE = path.join(DATA_DIR, "chats.json");
const WHATSAPP_FILE = path.join(DATA_DIR, "whatsapp.json");

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Initial default Iqra University Admission Docs
const defaultDocs: RagDocument[] = [
  {
    id: "prog-computing",
    category: "programs",
    title: "Computing & Technology Programs",
    content: "Iqra University offers undergraduate computing programs including BS Computer Science (BSCS), BS Software Engineering (BSSE), BS Artificial Intelligence (BSAI), and BS Cyber Security. At the graduate level, we offer MS Computer Science and PhD in Computer Science. Duration: 4 Years (8 semesters) for Bachelor programs, 2 Years for Masters.",
    lastUpdated: new Date().toISOString().split("T")[0]
  },
  {
    id: "prog-business",
    category: "programs",
    title: "Business Administration Programs",
    content: "Our highly ranked Business School offers Bachelor of Business Administration (BBA - 4 Years / 2 Years), Bachelor of Business Studies (BBS), Master of Business Administration (MBA - 1.5, 2, or 2.5 Years depending on prior education), and PhD in Business Administration. Specializations: Marketing, Finance, HR, Supply Chain, and Digital Marketing.",
    lastUpdated: new Date().toISOString().split("T")[0]
  },
  {
    id: "prog-health",
    category: "programs",
    title: "Health & Allied Sciences (Pharm-D, DPT)",
    content: "Iqra University offers Doctor of Pharmacy (Pharm-D), a 5-year professional degree approved by the Pharmacy Council of Pakistan, and Doctor of Physical Therapy (DPT), also a 5-year undergraduate professional doctorate degree. Classes feature cutting-edge medical laboratories, state of the art clinics, and research internships at major partner hospitals.",
    lastUpdated: new Date().toISOString().split("T")[0]
  },
  {
    id: "admission-criteria",
    category: "eligibility",
    title: "Admission Eligibility Criteria",
    content: "1. BS Computer Science / Software Engineering / AI: Minimum 50% marks in Intermediate (HSSC) Pre-Engineering or equivalent (A-Levels) with Mathematics. 2. BBA: Minimum 50% marks in Intermediate/A-Levels of any stream. 3. Pharm-D / DPT: Minimum 60% marks in Intermediate Pre-Medical or equivalent. 4. MS Programs: 16 years of education with CGPA 2.0/4.0 or 50% equivalent marks, plus entry test qualification.",
    lastUpdated: new Date().toISOString().split("T")[0]
  },
  {
    id: "fees-structure",
    category: "fees",
    title: "Fee Structure & Charges (Per Semester)",
    content: "Admission & Registration fee (one-time payable, non-refundable): PKR 22,000. \n- Bachelor of Computer Science (BSCS): Approx PKR 92,000 per semester (PKR 6,500 per credit hour). \n- BBA (Bachelor of Business Administration): Approx PKR 84,000 per semester (PKR 5,800 per credit hour). \n- Pharm-D / DPT: Approx PKR 110,000 per semester. \nSecurity deposit (one-time, refundable): PKR 10,000. Installment plans are available upon request.",
    lastUpdated: new Date().toISOString().split("T")[0]
  },
  {
    id: "campuses-locations",
    category: "campuses",
    title: "Campus Locations and Contacts",
    content: "1. Main Campus (Karachi): Shaheed-e-Millat Road Extension, Defense View, Area. Tel: (021) 111-264-264. \n2. Gulshan Campus (Karachi): Abul Hasan Isphahani Road, near scheme 33, Gulshan-e-Iqbal. \n3. North Campus (Karachi): Sector 7-B, North Karachi, opposite Power House. \n4. Islamabad Campus: Plot # 5, Sector H-9, Islamabad. Tel: (051) 111-264-264.",
    lastUpdated: new Date().toISOString().split("T")[0]
  },
  {
    id: "admission-process",
    category: "admissions",
    title: "Step-by-Step Admission Process",
    content: "1. Online Registration: Apply on admissions.iqra.edu.pk and register an account. \n2. Form Submission: Complete the profile and upload clear scans of Matric/O-level, Intermediate/A-level transcripts, CNIC/B-Form, and photograph. \n3. Entry Test: Secure an admit card and appear for the Iqra Admission test (comprising English, Math, and General Knowledge). \n4. Interview: Shortlisted candidates appear for a department panel interview. \n5. Fee Payment: Confirm the offer by submitting the deposit voucher.",
    lastUpdated: new Date().toISOString().split("T")[0]
  },
  {
    id: "admissions-timeline",
    category: "admissions",
    title: "Academic Calendar / Deadline Fall 2026",
    content: "Admissions for Fall 2026 are officially OPEN! \n- Last Date to Apply online: August 15, 2026. \n- Iqra Admission entry test date: August 20, 2026. \n- Announcement of first Merit List: August 25, 2026. \n- Class commencement: September 7, 2026.",
    lastUpdated: new Date().toISOString().split("T")[0]
  }
];

// Load files or write standard ones
const loadDocs = (): RagDocument[] => {
  try {
    if (fs.existsSync(DOCS_FILE)) {
      const content = fs.readFileSync(DOCS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (e) {
    console.error("Failed to read documents.json", e);
  }
  fs.writeFileSync(DOCS_FILE, JSON.stringify(defaultDocs, null, 2));
  return defaultDocs;
};

const saveDocs = (docs: RagDocument[]) => {
  fs.writeFileSync(DOCS_FILE, JSON.stringify(docs, null, 2));
};

const loadSimulatedWhatsApp = (): SimulatedWhatsAppMessage[] => {
  try {
    if (fs.existsSync(WHATSAPP_FILE)) {
      const content = fs.readFileSync(WHATSAPP_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (e) {
    console.error("Failed to read whatsapp.json", e);
  }
  const defaultWA: SimulatedWhatsAppMessage[] = [
    {
      id: "wa-init-1",
      from: "+92 300 1234567",
      text: "Hi, I want to ask about admissions criteria for BSCS at Iqra University.",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: "incoming"
    },
    {
      id: "wa-init-2",
      from: "Iqra Bot",
      text: "Hello! Thank you for contacting Iqra University Admissions Department. For the BS Computer Science (BSCS) program, the minimum criteria is 50% marks in your Intermediate (HSSC) Pre-Engineering, Computer Science, or equivalent (A-Levels) with Mathematics. Admissions are currently open! Would you like to know the fee structure as well?",
      timestamp: new Date(Date.now() - 3590000).toISOString(),
      type: "outgoing"
    }
  ];
  fs.writeFileSync(WHATSAPP_FILE, JSON.stringify(defaultWA, null, 2));
  return defaultWA;
};

const saveSimulatedWhatsApp = (messages: SimulatedWhatsAppMessage[]) => {
  fs.writeFileSync(WHATSAPP_FILE, JSON.stringify(messages, null, 2));
};

// Webhook config mock storage
let whatsappVerifyToken = "iqra_admission_token_2026";

// RAG Search logic (lexical and similarity metrics over structured categories)
const searchRag = (query: string, docs: RagDocument[]): { doc: RagDocument; score: number }[] => {
  const normQuery = query.toLowerCase();
  
  return docs.map(doc => {
    let score = 0;
    const titleMatch = doc.title.toLowerCase();
    const contentMatch = doc.content.toLowerCase();
    
    // Check key terms
    const keywords = normQuery.split(/\s+/).filter(w => w.length > 2);
    
    keywords.forEach(word => {
      // Direct overlaps
      if (titleMatch.includes(word)) score += 15;
      if (contentMatch.includes(word)) score += 5;
      
      // Category affinity rules
      if (normQuery.includes("fee") && doc.category === "fees") score += 30;
      if ((normQuery.includes("elig") || normQuery.includes("criteria") || normQuery.includes("require")) && doc.category === "eligibility") score += 30;
      if ((normQuery.includes("program") || normQuery.includes("degree") || normQuery.includes("bscs") || normQuery.includes("bba") || normQuery.includes(" pharm")) && doc.category === "programs") score += 20;
      if ((normQuery.includes("campus") || normQuery.includes("locat") || normQuery.includes("address") || normQuery.includes("karachi") || normQuery.includes("islamabad")) && doc.category === "campuses") score += 20;
      if ((normQuery.includes("apply") || normQuery.includes("step") || normQuery.includes("process") || normQuery.includes("dates") || normQuery.includes("when")) && doc.category === "admissions") score += 20;
    });

    // Semantic category matching fallback
    if (doc.category === "programs" && (normQuery.includes("computer") || normQuery.includes("software") || normQuery.includes("business") || normQuery.includes("pharmacy") || normQuery.includes("designer"))) {
      score += 15;
    }

    return { doc, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 3); // Top 3 relevant docs
};

// Safely obtain and verify Gemini AI
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// Main response engine that formats prompt under RAG context and talks to Gemini
const runRagQuery = async (userMessage: string): Promise<{ text: string; retrievedDocs: RagDocument[] }> => {
  const allDocs = loadDocs();
  const matched = searchRag(userMessage, allDocs);
  const retrievedDocs = matched.map(m => m.doc);
  
  // Format the context for LLM prompt
  let contextString = "";
  if (retrievedDocs.length > 0) {
    contextString = retrievedDocs.map((d, index) => {
      return `[Context Document ${index + 1}: ${d.title} (${d.category})] \n${d.content}`;
    }).join("\n\n");
  } else {
    // Basic general context fallback
    contextString = "No explicit matching records found in the immediate database. Answer using general Iqra University admissions knowledge, maintaining a extremely polite and professional admissions officer tone.";
  }

  const ai = getAiClient();
  const systemInstruction = `You are the Official Admissions Chatbot of Iqra University Pakistan. 
Your goal is to answer potential student questions regarding admission criteria, fields of study, programs, credit hours, semesters, tuition fees, campus contacts, and procedures.
You must strictly maintain an encouraging, helpful, elegant, and highly informative academic tone.
Answer the user based on the retrieved context documents if available. If the papers lack full details (like special dates or generic issues), state what you see clearly, speak honestly, and instruct them to contact the Admissions Department at info@iqra.edu.pk or phone 111-264-264 for exact confirmation.
Keep responses concise, clear, and perfectly formatted for standard chat screens (and WhatsApp). Avoid verbose paragraphs. Use bullet points for fee amounts or campus lists. Ensure any phone numbers or links are explicitly accurate according to context.`;

  const finalPrompt = `
Recieved Query: "${userMessage}"

RAG Retrieve Context:
---
${contextString}
---

Please generate details answering their query accurately.
`;

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: finalPrompt,
        config: {
          systemInstruction,
          temperature: 0.3,
        }
      });
      return {
        text: response.text || "I was unable to compile the answer. Please try again or reach our main helpline.",
        retrievedDocs
      };
    } else {
      // Elegant fallback mode if NO API Key is present, so the app remains perfectly functional
      return {
        text: `[Fallback Mode: Chatbot responds with context directly because Gemini API API Key is not set in Secrets] \n\nRelated matches: \n${retrievedDocs.length > 0 ? retrievedDocs.map(d => `• *${d.title}*: ${d.content}`).join("\n\n") : "We have logged your query about admissions. Iqra University offers top engineering, business, and pharmaceutical courses. For direct assistance, call 111-264-264 in Karachi."}`,
        retrievedDocs
      };
    }
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    return {
      text: `Apologies, but the admissions response system is currently experiencing a connection lag: ${error.message || error}. Standard details: Iqra admissions are active until August 15. Please contact our main helpdesk.`,
      retrievedDocs
    };
  }
};


// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// 1. Documents (Knowledge Base Workspace)
app.get("/api/documents", (req, res) => {
  const docs = loadDocs();
  res.json(docs);
});

app.post("/api/documents", (req, res) => {
  const { category, title, content } = req.body;
  if (!category || !title || !content) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const docs = loadDocs();
  const newDoc: RagDocument = {
    id: `doc-${Date.now()}`,
    category,
    title,
    content,
    lastUpdated: new Date().toISOString().split("T")[0]
  };
  docs.push(newDoc);
  saveDocs(docs);
  res.status(201).json(newDoc);
});

app.delete("/api/documents/:id", (req, res) => {
  const id = req.params.id;
  let docs = loadDocs();
  const exists = docs.some(d => d.id === id);
  if (!exists) {
    return res.status(404).json({ error: "Document not found" });
  }
  docs = docs.filter(d => d.id !== id);
  saveDocs(docs);
  res.json({ success: true, message: "Document removed successfully" });
});


// 2. Direct RAG Chat Endpoint
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }
  const result = await runRagQuery(message);
  res.json({
    reply: result.text,
    retrievedContext: result.retrievedDocs.map(d => ({ title: d.title, content: d.content }))
  });
});


// 3. WHATSAPP WEBHOOK integration (Simulated / Real Meta API)
// GET verify webhook
app.get("/api/whatsapp/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === whatsappVerifyToken) {
      console.log("WhatsApp Webhook verified successfully.");
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send("Forbidden: Verify token mismatch");
    }
  }
  res.status(400).send("Bad Request: Missing parameters");
});

// POST receive inbound messages (Meta JSON payload or Twilio HTTP POST)
app.post("/api/whatsapp/webhook", async (req, res) => {
  const payload = req.body;
  console.log("Received general WhatsApp Webhook payload:", JSON.stringify(payload, null, 2));

  // Determine message details either from Twilio urlencoded query params or Meta JSON format
  let fromNumber = "+92 300 0000000";
  let messageText = "";

  // Standard Meta Hook format:
  // payload.entry[0].changes[0].value.messages[0]
  if (payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
    const waMsg = payload.entry[0].changes[0].value.messages[0];
    const contact = payload.entry[0].changes[0].value.contacts?.[0];
    fromNumber = waMsg.from ? `+${waMsg.from}` : (contact?.wa_id ? `+${contact.wa_id}` : fromNumber);
    messageText = waMsg.text?.body || "";
  } 
  // Twilio HTTP post standard body payload parameters:
  else if (payload.From && payload.Body) {
    fromNumber = payload.From.replace("whatsapp:", "");
    messageText = payload.Body;
  }
  // Generic JSON test body format (for custom external tests)
  else if (payload.from && payload.text) {
    fromNumber = payload.from;
    messageText = payload.text;
  }

  if (!messageText) {
    return res.json({ success: true, info: "No text content detected from payload." });
  }

  // 1. Process via RAG
  const result = await runRagQuery(messageText);

  // 2. Append incoming message to simulated database
  const history = loadSimulatedWhatsApp();
  const incomingId = `wa-${Date.now()}-inc`;
  const outgoingId = `wa-${Date.now()}-out`;

  const incomingMessage: SimulatedWhatsAppMessage = {
    id: incomingId,
    from: fromNumber,
    text: messageText,
    timestamp: new Date().toISOString(),
    type: "incoming",
    rawPayload: payload
  };

  const simulatedResponsePayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: fromNumber,
    type: "text",
    text: {
      body: result.text
    }
  };

  const outgoingMessage: SimulatedWhatsAppMessage = {
    id: outgoingId,
    from: "Iqra Bot",
    text: result.text,
    timestamp: new Date().toISOString(),
    type: "outgoing",
    rawPayload: simulatedResponsePayload
  };

  history.push(incomingMessage);
  history.push(outgoingMessage);
  saveSimulatedWhatsApp(history);

  // Send successful response payload back, typical of webhook responses
  res.json({
    success: true,
    processedIncoming: incomingMessage,
    simulatedResponse: outgoingMessage
  });
});

// Simulator Endpoint specifically for the frontend interface
app.get("/api/whatsapp/history", (req, res) => {
  const history = loadSimulatedWhatsApp();
  res.json(history);
});

app.post("/api/whatsapp/simulate", async (req, res) => {
  const { from, text } = req.body;
  if (!from || !text) {
    return res.status(400).json({ error: "Sender identifier and content string required" });
  }

  // Forward to standard webhook function internally to centralize business logic
  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "1098239081230",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "92111264264",
                phone_number_id: "102931293810"
              },
              contacts: [
                {
                  profile: { name: "Admissions Inquiry" },
                  wa_id: from.replace(/\s+/g, "").replace("+", "")
                }
              ],
              messages: [
                {
                  from: from.replace(/\s+/g, "").replace("+", ""),
                  id: `wamid.HBgL${Math.random().toString(36).substring(7)}`,
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  text: { body: text },
                  type: "text"
                }
              ]
            },
            field: "messages"
          }
        ]
      }
    ]
  };

  // Process RAG Response
  const result = await runRagQuery(text);

  const history = loadSimulatedWhatsApp();
  const incomingId = `sim-wa-${Date.now()}-inc`;
  const outgoingId = `sim-wa-${Date.now()}-out`;

  const incomingMessage: SimulatedWhatsAppMessage = {
    id: incomingId,
    from: from,
    text: text,
    timestamp: new Date().toISOString(),
    type: "incoming",
    rawPayload: payload
  };

  const responsePayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: from,
    type: "text",
    text: {
      body: result.text
    }
  };

  const outgoingMessage: SimulatedWhatsAppMessage = {
    id: outgoingId,
    from: "Iqra Bot",
    text: result.text,
    timestamp: new Date().toISOString(),
    type: "outgoing",
    rawPayload: responsePayload
  };

  history.push(incomingMessage);
  history.push(outgoingMessage);
  saveSimulatedWhatsApp(history);

  res.json({
    incoming: incomingMessage,
    outgoing: outgoingMessage
  });
});

app.post("/api/whatsapp/clear", (req, res) => {
  fs.writeFileSync(WHATSAPP_FILE, JSON.stringify([], null, 2));
  res.json({ success: true });
});

// Configure verify token changes
app.post("/api/whatsapp/config", (req, res) => {
  const { verifyToken } = req.body;
  if (verifyToken) {
    whatsappVerifyToken = verifyToken;
  }
  res.json({
    webhookUrl: `${process.env.APP_URL || "https://" + req.headers.host || "localhost:3000"}/api/whatsapp/webhook`,
    verifyToken: whatsappVerifyToken
  });
});

app.get("/api/whatsapp/config", (req, res) => {
  res.json({
    webhookUrl: `${process.env.APP_URL || "http://localhost:3000"}/api/whatsapp/webhook`,
    verifyToken: whatsappVerifyToken
  });
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Iqra Admission Chatbot running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
