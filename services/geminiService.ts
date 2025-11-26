import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Subject, Question, QuestionType, Difficulty } from '../types';

// Fallback data in case of API failure or rate limiting
const FALLBACK_QUESTIONS: Question[] = [
  {
    id: 'fb-1',
    type: QuestionType.MULTIPLE_CHOICE,
    questionText: 'Které z následujících slov je napsáno pravopisně správně?',
    options: ['výřivka', 'vířivka', 'vířyfka', 'výřyfka'],
    correctAnswer: 'vířivka',
    explanation: 'Slovo vířivka je odvozeno od slova vířit, proto píšeme měkké i.',
    hint: 'Zkus si říct základové slovo. Co dělá voda?'
  },
  {
    id: 'fb-2',
    type: QuestionType.MULTIPLE_CHOICE,
    questionText: 'Vypočítejte: 3 + 2 * 4 = ?',
    options: ['20', '11', '14', '9'],
    correctAnswer: '11',
    explanation: 'Násobení má přednost před sčítáním. Tedy 2 * 4 = 8, a poté 3 + 8 = 11.',
    hint: 'Pozor na priority matematických operací.'
  },
  {
    id: 'fb-3',
    type: QuestionType.TRUE_FALSE,
    questionText: 'Ve větě "Děti běhaly po louce." je podmět "Děti".',
    options: ['Ano', 'Ne'],
    correctAnswer: 'Ano',
    explanation: 'Kdo, co běhaly? Děti. Podmět je v 1. pádě.',
    hint: 'Zeptej se pádovou otázkou: Kdo, co?'
  }
];

export const generateLessonQuestions = async (subject: Subject, topic: string, difficulty: Difficulty = Difficulty.MEDIUM): Promise<Question[]> => {
  if (!process.env.API_KEY) {
    console.warn("API Key not found, using fallback data.");
    return FALLBACK_QUESTIONS;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let difficultyInstruction = "";
  switch (difficulty) {
    case Difficulty.EASY:
      difficultyInstruction = "Úroveň obtížnosti: LEHKÁ. Zaměř se na základní znalosti, jasné a přímé otázky bez chytáků.";
      break;
    case Difficulty.MEDIUM:
      difficultyInstruction = "Úroveň obtížnosti: STŘEDNÍ. Standardní úroveň přijímacích zkoušek, mírná komplexita.";
      break;
    case Difficulty.HARD:
      difficultyInstruction = "Úroveň obtížnosti: TĚŽKÁ. Komplexní úlohy, chytáky, vyžaduje více kroků k řešení nebo hlubší znalost výjimek.";
      break;
  }

  // Prompt engineered to simulate official CERMAT tests
  const prompt = `
    Jsi oficiální tvůrce testů CERMAT pro jednotné přijímací zkoušky na střední školy v ČR.
    Tvým úkolem je vytvořit 5 soutěžních otázek pro předmět: ${subject}, zaměřených na téma: ${topic}.
    
    ${difficultyInstruction}
    
    DŮLEŽITÉ POKYNY (STRICT MODE):
    1. Otázky MUSÍ být k nerozeznání od skutečných testů z let 2020-2024.
    2. Používej "chytáky" a typické formulace CERMATu (např. "ve kterém z následujících úryvků...", "pro každé x z reálných čísel platí...", "najděte slovo s pravopisnou chybou").
    3. Musí to být úroveň 9. třídy ZŠ.
    
    Pro Češtinu:
    - Zaměř se na jevy, kde se často chybuje (mě/mně, s/z, velká písmena, interpunkce).
    - Větný rozbor a porozumění textu musí být komplexní.

    Pro Matematiku:
    - Zahrň slovní úlohy, úpravy výrazů, rovnice a geometrii.
    - Čísla nemusí vycházet vždy "hezky", ale musí být spočitatelná bez kalkulačky.

    Formát odpovědi: JSON.
    
    Typy otázek:
    - MULTIPLE_CHOICE: 4 možnosti, vždy jen jedna správná. Možnosti ať jsou matoucí (distraktory).
    - TRUE_FALSE: Otázka Ano/Ne (např. "Rozhodněte o každém z následujících tvrzení...").
    
    U 'correctAnswer' vrať přesný text správné odpovědi.
    U 'explanation' vysvětli látku pedagogicky, ale stručně, s odkazem na pravidlo (např. "Podle vzoru stavení...").
    U 'hint' poskytni malou nápovědu, která NENÍ přímou odpovědí, ale navede studenta (např. "Zaměř se na koncovku druhého pádu").
  `;

  const questionSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING, enum: [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE] },
            questionText: { type: Type.STRING },
            options: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            hint: { type: Type.STRING }
          },
          required: ["id", "type", "questionText", "options", "correctAnswer", "explanation", "hint"]
        }
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.5 // Lower temperature for more rigorous/standardized output
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned");

    const parsed = JSON.parse(jsonText);
    return parsed.questions || FALLBACK_QUESTIONS;

  } catch (error) {
    console.error("Gemini generation failed:", error);
    return FALLBACK_QUESTIONS;
  }
};