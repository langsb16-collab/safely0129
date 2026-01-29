
import { GoogleGenAI, Type } from "@google/genai";
import { AIClassificationResult, ComplaintCategory, Urgency } from "../types";

export const classifyComplaint = async (
  imageData: string, 
  description: string
): Promise<AIClassificationResult> => {
  // Fix: Initializing with named parameter apiKey as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageData.split(',')[1] || imageData
          }
        },
        {
          text: `민원 설명: ${description || '설명 없음'}`
        }
      ]
    },
    config: {
      // Fix: Move persona and behavioral rules to systemInstruction
      systemInstruction: `너는 "경북 경산시 생활민원 자동분류" 모델이다.
          입력된 사진과 설명을 분석하여 민원을 분류하고 위험도(0-100)와 긴급도(1-5)를 산정하라.

          부서 매핑 지침:
          - ROAD: 포트홀, 도로파손, 침하, 차선훼손 (도로철도과)
          - TRAFFIC: 가로등, 신호기, 표지판 (교통행정과)
          - ENV: 쓰레기 무단투기, 불법적치 (자원순환과)
          - SAFETY: 낙하물, 장애물, 위험물, 배수 불량 (안전총괄과)

          긴급도 기준:
          - 차로 중앙 장애/포트홀: priority 1-2, risk_score 70+
          - 보도 측면 소규모 파손: priority 3-4
          - 쓰레기 무단투기: priority 2-3
          - 가로등 소등(야간/통행로): priority 2

          출력 스키마:
          {
            "category": "ROAD|TRAFFIC_FACILITY|ENV_WASTE|SAFETY_OBSTACLE|DRAINAGE",
            "subcategory": "POTHOLE|ROAD_CRACK|SINKHOLE|STREETLIGHT_OFF|STREETLIGHT_FLICKER|ILLEGAL_DUMPING|LITTERING|FALLEN_OBJECT|HAZARD_MATERIAL|CLOGGED_DRAIN",
            "urgency": "일반|보통|긴급|매우긴급",
            "department": "한글 부서명",
            "department_code": "ROAD|TRAFFIC|ENV|SAFETY",
            "confidence": 0.0-1.0,
            "reasoning": "분류 근거 (한글 1문장)",
            "risk_score": 0-100,
            "priority": 1-5
          }`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          subcategory: { type: Type.STRING },
          urgency: { type: Type.STRING },
          department: { type: Type.STRING },
          department_code: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          reasoning: { type: Type.STRING },
          risk_score: { type: Type.NUMBER },
          priority: { type: Type.NUMBER }
        },
        required: ["category", "subcategory", "urgency", "department", "department_code", "confidence", "reasoning", "risk_score", "priority"]
      }
    }
  });

  try {
    // Fix: Access .text property directly (not a method call)
    const result = JSON.parse(response.text || "{}");
    return result as AIClassificationResult;
  } catch (error) {
    console.error("AI Classification Error:", error);
    return {
      category: ComplaintCategory.UNKNOWN,
      subcategory: "UNKNOWN",
      urgency: Urgency.MEDIUM,
      department: "민원여권과",
      department_code: "GENERAL",
      confidence: 0,
      reasoning: "분류 중 오류가 발생했습니다.",
      risk_score: 50,
      priority: 3
    };
  }
};
