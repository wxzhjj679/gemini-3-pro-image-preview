// 导入 Vercel 的 Node.js helper 库
import { NextResponse } from 'next/server';

// 从环境变量中安全地获取你的 API Key
// 这个 Key 在 Vercel 的设置里，不会出现在代码中
const apiKey = process.env.GEMINI_API_KEY;

export async function POST(request) {
  // 如果没有设置 API Key，直接返回错误
  if (!apiKey) {
    return new NextResponse(JSON.stringify({ error: 'API Key is not configured on the server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 获取前端发送过来的请求体
    const reqBody = await request.json();
    const { prompt } = reqBody;

    // 调用 Google Gemini API 的逻辑
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                imageData: {
                  type: "string",
                  description: "The base64 encoded image data."
                }
              },
              required: ["imageData"]
            }
          }
        }),
      }
    );

    if (!response.ok) {
      // 如果 Google API 返回错误，将错误信息返回给前端
      const errorData = await response.json();
      console.error("Google API Error:", errorData);
      return new NextResponse(JSON.stringify({ error: errorData.error.message }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 从 Google API 的响应中提取图片数据
    const data = await response.json();
    const imageData = data.candidates[0].content.parts[0].text;

    // 将图片数据返回给前端
    return new NextResponse(JSON.stringify({ imageData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Server Error:", error);
    return new NextResponse(JSON.stringify({ error: 'An internal server error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
