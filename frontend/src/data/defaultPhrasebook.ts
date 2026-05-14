import type { Phrase } from '../types';

type SeedPhrase = {
  id: string;
  originalText: string;
  hi: string;
  pa: string;
  category: Phrase['category'];
};

const now = new Date();

const seedPhrases: SeedPhrase[] = [
  { id: 'phrase_1', originalText: 'Hello', hi: 'नमस्ते', pa: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', category: 'general' },
  { id: 'phrase_2', originalText: 'Thank you', hi: 'धन्यवाद', pa: 'ਧੰਨਵਾਦ', category: 'general' },
  { id: 'phrase_3', originalText: 'Please help me', hi: 'कृपया मेरी मदद करें', pa: 'ਕਿਰਪਾ ਕਰਕੇ ਮੇਰੀ ਮਦਦ ਕਰੋ', category: 'general' },
  { id: 'phrase_4', originalText: 'I do not understand', hi: 'मैं नहीं समझता', pa: 'ਮੈਂ ਨਹੀਂ ਸਮਝਦਾ', category: 'general' },
  { id: 'phrase_5', originalText: 'Can you repeat that?', hi: 'क्या आप दोहरा सकते हैं?', pa: 'ਕੀ ਤੁਸੀਂ ਦੁਹਰਾ ਸਕਦੇ ਹੋ?', category: 'general' },
  { id: 'phrase_6', originalText: 'Goodbye', hi: 'अलविदा', pa: 'ਅਲਵਿਦਾ', category: 'general' },
  { id: 'phrase_7', originalText: 'Where is the airport?', hi: 'हवाई अड्डा कहाँ है?', pa: 'ਹਵਾਈ ਅੱਡਾ ਕਿੱਥੇ ਹੈ?', category: 'travel' },
  { id: 'phrase_8', originalText: 'I need a taxi', hi: 'मुझे टैक्सी चाहिए', pa: 'ਮੈਨੂੰ ਟੈਕਸੀ ਚਾਹੀਦੀ ਹੈ', category: 'travel' },
  { id: 'phrase_9', originalText: 'How much is the ticket?', hi: 'टिकट कितने का है?', pa: 'ਟਿਕਟ ਕਿੰਨੇ ਦੀ ਹੈ?', category: 'travel' },
  { id: 'phrase_10', originalText: 'Which platform?', hi: 'कौन सा प्लेटफ़ॉर्म?', pa: 'ਕਿਹੜਾ ਪਲੇਟਫਾਰਮ?', category: 'travel' },
  { id: 'phrase_11', originalText: 'Where is the hotel?', hi: 'होटल कहाँ है?', pa: 'ਹੋਟਲ ਕਿੱਥੇ ਹੈ?', category: 'travel' },
  { id: 'phrase_12', originalText: 'I need a map', hi: 'मुझे नक्शा चाहिए', pa: 'ਮੈਨੂੰ ਨਕਸ਼ਾ ਚਾਹੀਦਾ ਹੈ', category: 'travel' },
  { id: 'phrase_13', originalText: 'Call the police', hi: 'पुलिस को बुलाइए', pa: 'ਪੁਲਿਸ ਨੂੰ ਬੁਲਾਓ', category: 'emergency' },
  { id: 'phrase_14', originalText: 'This is an emergency', hi: 'यह आपातकाल है', pa: 'ਇਹ ਐਮਰਜੈਂਸੀ ਹੈ', category: 'emergency' },
  { id: 'phrase_15', originalText: 'I am in danger', hi: 'मैं खतरे में हूँ', pa: 'ਮੈਂ ਖਤਰੇ ਵਿੱਚ ਹਾਂ', category: 'emergency' },
  { id: 'phrase_16', originalText: 'Call an ambulance', hi: 'एम्बुलेंस बुलाइए', pa: 'ਐਂਬੂਲੈਂਸ ਬੁਲਾਓ', category: 'emergency' },
  { id: 'phrase_17', originalText: 'I lost my passport', hi: 'मेरा पासपोर्ट खो गया', pa: 'ਮੇਰਾ ਪਾਸਪੋਰਟ ਗੁੰਮ ਗਿਆ', category: 'emergency' },
  { id: 'phrase_18', originalText: 'I lost my wallet', hi: 'मेरा बटुआ खो गया', pa: 'ਮੇਰਾ ਬਟੂਆ ਗੁੰਮ ਗਿਆ', category: 'emergency' },
  { id: 'phrase_19', originalText: 'I need a doctor', hi: 'मुझे डॉक्टर चाहिए', pa: 'ਮੈਨੂੰ ਡਾਕਟਰ ਚਾਹੀਦਾ ਹੈ', category: 'medical' },
  { id: 'phrase_20', originalText: 'Where is the hospital?', hi: 'अस्पताल कहाँ है?', pa: 'ਹਸਪਤਾਲ ਕਿੱਥੇ ਹੈ?', category: 'medical' },
  { id: 'phrase_21', originalText: 'I have a fever', hi: 'मुझे बुखार है', pa: 'ਮੈਨੂੰ ਬੁਖਾਰ ਹੈ', category: 'medical' },
  { id: 'phrase_22', originalText: 'I need medicine', hi: 'मुझे दवा चाहिए', pa: 'ਮੈਨੂੰ ਦਵਾਈ ਚਾਹੀਦੀ ਹੈ', category: 'medical' },
  { id: 'phrase_23', originalText: 'I am vegetarian', hi: 'मैं शाकाहारी हूँ', pa: 'ਮੈਂ ਸ਼ਾਕਾਹਾਰੀ ਹਾਂ', category: 'food' },
  { id: 'phrase_24', originalText: 'No spicy food please', hi: 'कृपया मसालेदार खाना नहीं', pa: 'ਕਿਰਪਾ ਕਰਕੇ ਮਸਾਲੇਦਾਰ ਖਾਣਾ ਨਹੀਂ', category: 'food' },
  { id: 'phrase_25', originalText: 'Can I see the menu?', hi: 'क्या मैं मेन्यू देख सकता हूँ?', pa: 'ਕੀ ਮੈਂ ਮੀਨੂ ਦੇਖ ਸਕਦਾ ਹਾਂ?', category: 'food' },
  { id: 'phrase_26', originalText: 'I want water', hi: 'मुझे पानी चाहिए', pa: 'ਮੈਨੂੰ ਪਾਣੀ ਚਾਹੀਦਾ ਹੈ', category: 'food' },
  { id: 'phrase_27', originalText: 'How much does this cost?', hi: 'यह कितने का है?', pa: 'ਇਹ ਕਿੰਨੇ ਦਾ ਹੈ?', category: 'shopping' },
  { id: 'phrase_28', originalText: 'Can you lower the price?', hi: 'क्या आप कीमत कम कर सकते हैं?', pa: 'ਕੀ ਤੁਸੀਂ ਕੀਮਤ ਘਟਾ ਸਕਦੇ ਹੋ?', category: 'shopping' },
  { id: 'phrase_29', originalText: 'Do you accept cards?', hi: 'क्या आप कार्ड स्वीकार करते हैं?', pa: 'ਕੀ ਤੁਸੀਂ ਕਾਰਡ ਲੈਂਦੇ ਹੋ?', category: 'shopping' },
  { id: 'phrase_30', originalText: 'I want this one', hi: 'मुझे यह वाला चाहिए', pa: 'ਮੈਨੂੰ ਇਹ ਵਾਲਾ ਚਾਹੀਦਾ ਹੈ', category: 'shopping' },
  { id: 'phrase_31', originalText: 'Please send the document', hi: 'कृपया दस्तावेज़ भेजें', pa: 'ਕਿਰਪਾ ਕਰਕੇ ਦਸਤਾਵੇਜ਼ ਭੇਜੋ', category: 'business' },
  { id: 'phrase_32', originalText: 'Thank you for your time', hi: 'आपके समय के लिए धन्यवाद', pa: 'ਤੁਹਾਡੇ ਸਮੇਂ ਲਈ ਧੰਨਵਾਦ', category: 'business' },
  { id: 'phrase_33', originalText: 'Let us schedule a meeting', hi: 'आइए एक बैठक तय करें', pa: 'ਆਓ ਇੱਕ ਮੀਟਿੰਗ ਤੈਅ ਕਰੀਏ', category: 'business' },
  { id: 'phrase_34', originalText: 'I have a reservation', hi: 'मेरी बुकिंग है', pa: 'ਮੇਰੀ ਬੁਕਿੰਗ ਹੈ', category: 'hotel' },
  { id: 'phrase_35', originalText: 'What is the Wi-Fi password?', hi: 'वाई-फाई का पासवर्ड क्या है?', pa: 'ਵਾਈ-ਫਾਈ ਦਾ ਪਾਸਵਰਡ ਕੀ ਹੈ?', category: 'hotel' },
  { id: 'phrase_36', originalText: 'I need extra towels', hi: 'मुझे अतिरिक्त तौलिए चाहिए', pa: 'ਮੈਨੂੰ ਵਾਧੂ ਤੌਲੀਆ ਚਾਹੀਦਾ ਹੈ', category: 'hotel' },
  { id: 'phrase_37', originalText: 'Where can I buy a ticket?', hi: 'मैं टिकट कहाँ खरीद सकता हूँ?', pa: 'ਮੈਂ ਟਿਕਟ ਕਿੱਥੋਂ ਖਰੀਦ ਸਕਦਾ ਹਾਂ?', category: 'transportation' },
  { id: 'phrase_38', originalText: 'When is the next train?', hi: 'अगली ट्रेन कब है?', pa: 'ਅਗਲੀ ਟ੍ਰੇਨ ਕਦੋਂ ਹੈ?', category: 'transportation' },
  { id: 'phrase_39', originalText: 'Please stop here', hi: 'कृपया यहाँ रोकिए', pa: 'ਕਿਰਪਾ ਕਰਕੇ ਇੱਥੇ ਰੋਕੋ', category: 'transportation' },
  { id: 'phrase_40', originalText: 'How long will it take?', hi: 'कितना समय लगेगा?', pa: 'ਕਿੰਨਾ ਸਮਾਂ ਲੱਗੇਗਾ?', category: 'transportation' },
];

export const defaultPhrasebook: Phrase[] = seedPhrases.flatMap((phrase) => ([
  {
    id: `${phrase.id}_hi`,
    originalText: phrase.originalText,
    translatedText: phrase.hi,
    category: phrase.category,
    languagePair: 'en-hi',
    createdAt: now,
  },
  {
    id: `${phrase.id}_pa`,
    originalText: phrase.originalText,
    translatedText: phrase.pa,
    category: phrase.category,
    languagePair: 'en-pa',
    createdAt: now,
  },
]));
