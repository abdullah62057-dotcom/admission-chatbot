export interface RagDocument {
  id: string;
  category: 'programs' | 'fees' | 'eligibility' | 'campuses' | 'admissions' | 'general';
  title: string;
  content: string;
  lastUpdated: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  retrievedContext?: { title: string; content: string }[];
}

export interface WebhookConfig {
  webhookUrl: string;
  verifyToken: string;
  status: 'active' | 'inactive';
}

export interface SimulatedWhatsAppMessage {
  id: string;
  from: string;
  text: string;
  timestamp: string;
  type: 'incoming' | 'outgoing';
  rawPayload?: any; // The JSON payload simulating what was sent or received
}
