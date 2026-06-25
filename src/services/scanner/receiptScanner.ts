import type { ScannedReceipt, LLMConfig } from '@/types/scanner';
import type { Category } from '@/types/domain';
import { processImage } from './imageProcessor';

const SYSTEM_PROMPT = `You are a receipt/invoice data extractor. Extract structured data from the receipt image.
Respond with ONLY valid JSON in this exact format:
{
  "date": "YYYY-MM-DD",
  "vendor": "store name",
  "items": [{"name": "item", "amount": 0.00}],
  "total": 0.00,
  "currency": "TTD"
}
If you cannot determine a field, use reasonable defaults. For currency, default to TTD unless another is clearly shown.`;

export async function scanReceipt(
  imageUri: string,
  config: LLMConfig,
  categories: Category[]
): Promise<ScannedReceipt> {
  const { base64, mimeType } = await processImage(imageUri);

  const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            { type: 'text', text: 'Extract the data from this receipt.' },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse receipt data from LLM response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as ScannedReceipt;
  parsed.suggestedCategory = matchCategory(parsed.vendor, categories);

  return parsed;
}

function matchCategory(vendor: string, categories: Category[]): string | undefined {
  const v = vendor.toLowerCase();

  const keywords: Record<string, string[]> = {
    'Food & Dining': ['restaurant', 'food', 'eat', 'lunch', 'dinner', 'breakfast', 'cafe', 'coffee', 'pizza', 'chicken', 'grocery', 'supermarket', 'market'],
    'Travel': ['gas', 'fuel', 'petrol', 'uber', 'taxi', 'transport', 'parking', 'airline', 'travel'],
    'Entertainment': ['cinema', 'movie', 'game', 'streaming', 'bar', 'club', 'concert', 'ticket'],
    'Clothing & Shopping': ['clothing', 'fashion', 'shoe', 'mall', 'shop', 'store', 'amazon'],
    'Phone & Data': ['phone', 'mobile', 'data', 'digicel', 'bmobile', 'flow'],
    'Personal Care': ['pharmacy', 'health', 'supplement', 'barber', 'salon', 'cosmetic'],
    'Gym': ['gym', 'fitness', 'sport'],
  };

  for (const [categoryName, kws] of Object.entries(keywords)) {
    if (kws.some(kw => v.includes(kw))) {
      return categories.find(c => c.name === categoryName)?.id;
    }
  }

  return undefined;
}
