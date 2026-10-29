import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatSegment } from '../../service/apiservice';
import { ChatMessage } from '../aihome-page/aihome-page';

interface InlineTextPart {
  text: string;
  bold: boolean;
}

@Component({
  imports: [FormsModule],
  selector: 'app-aichat',
  styleUrl: './aichat.css',
  templateUrl: './aichat.html',
})
export class AIChat {
  @Input() messages: ChatMessage[] = [];
  @Input() busy = false;
  @Input() errorMessage = '';
  @Output() messageSent = new EventEmitter<string>();

  draft = '';

  messageSegments(message: ChatMessage): ChatSegment[] {
    if (message.segments?.length) return message.segments;
    return [{ type: 'message', content: message.content }];
  }

  inlineTextParts(text: string): InlineTextPart[] {
    const parts: InlineTextPart[] = [];
    const boldPattern = /\*\*(.+?)\*\*/gs;
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ((match = boldPattern.exec(text)) !== null) {
      if (match.index > cursor) {
        parts.push({ text: text.slice(cursor, match.index), bold: false });
      }
      parts.push({ text: match[1], bold: true });
      cursor = boldPattern.lastIndex;
    }

    if (cursor < text.length) parts.push({ text: text.slice(cursor), bold: false });
    if (parts.length === 0 && text) parts.push({ text, bold: false });
    return parts;
  }

  submitMessage(message = this.draft): void {
    const text = message.trim();
    if (!text || this.busy) return;

    this.draft = '';
    this.messageSent.emit(text);
  }

  onEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.shiftKey) return;
    keyboardEvent.preventDefault();
    this.submitMessage();
  }
}
