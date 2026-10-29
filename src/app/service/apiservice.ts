import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface ChatSegment {
  type: 'message' | 'code';
  content: string;
  language?: string;
}

export interface ApiHealth {
  status: string;
  model_loaded: boolean;
}

interface OpenAIChatResponse {
  choices: Array<{ message: { content: string } }>;
}

@Injectable({ providedIn: 'root' })
export class APIService {
  private readonly baseUrl = 'http://127.0.0.1:8000';
  private readonly chatUrl = `${this.baseUrl}/v1/chat/completions`;

  constructor(private readonly http: HttpClient) {}

  sendMessage(message: string): Observable<ChatSegment[]> {
    return this.http
      .post<OpenAIChatResponse>(this.chatUrl, {
        model: 'local-gguf',
        messages: [{ role: 'user', content: message }],
        temperature: 0.2,
        max_tokens: 1024,
      })
      .pipe(
        map((response) => {
          const answer = response.choices?.[0]?.message?.content;
          if (typeof answer !== 'string') {
            throw new Error('The local AI returned an unexpected chat completion.');
          }
          return this.parseSegments(answer);
        }),
      );
  }

  checkHealth(): Observable<ApiHealth> {
    return this.http.get<ApiHealth>(`${this.baseUrl}/health`);
  }

  private parseSegments(text: string): ChatSegment[] {
    const segments: ChatSegment[] = [];
    const codeFence = /```([\w+#.-]*)\s*\r?\n([\s\S]*?)(?:```|$)/g;
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ((match = codeFence.exec(text)) !== null) {
      const message = text.slice(cursor, match.index).trim();
      if (message) segments.push({ type: 'message', content: message });
      const code = match[2].replace(/[\r\n]+$/, '');
      if (code) segments.push({ type: 'code', language: match[1] || 'text', content: code });
      cursor = codeFence.lastIndex;
    }

    const trailing = text.slice(cursor).trim();
    if (trailing) segments.push({ type: 'message', content: trailing });
    if (segments.length === 0 && text.trim())
      segments.push({ type: 'message', content: text.trim() });
    return segments;
  }
}
