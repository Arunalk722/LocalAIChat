import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { APIService, ChatSegment } from '../../service/apiservice';
import { AIChat } from '../aichat/aichat';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  segments?: ChatSegment[];
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
}

@Component({
  imports: [AIChat],
  selector: 'app-aihome-page',
  styleUrl: './aihome-page.css',
  templateUrl: './aihome-page.html',
})
export class AIHomePage implements OnInit {
  private readonly api = inject(APIService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'ai-chat-conversations';
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly conversations = signal<Conversation[]>([]);
  readonly activeId = signal<string | null>(null);
  readonly activeConversation = computed(
    () => this.conversations().find((conversation) => conversation.id === this.activeId()) ?? null,
  );
  readonly apiOnline = signal(false);
  readonly modelLoaded = signal(false);
  readonly sending = signal(false);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.restoreConversations();
    this.api.checkHealth().subscribe({
      next: (health) => {
        this.apiOnline.set(health.status === 'ok');
        this.modelLoaded.set(health.model_loaded);
      },
      error: () => this.apiOnline.set(false),
    });
  }

  startConversation(): void {
    const conversation: Conversation = {
      id: this.createId(),
      title: 'New conversation',
      updatedAt: Date.now(),
      messages: [],
    };
    this.conversations.update((items) => [conversation, ...items]);
    this.activeId.set(conversation.id);
    this.errorMessage.set('');
    this.persistConversations();
  }

  openConversation(id: string): void {
    this.activeId.set(id);
    this.errorMessage.set('');
  }

  deleteConversation(event: Event, id: string): void {
    event.stopPropagation();
    this.conversations.update((items) => items.filter((item) => item.id !== id));
    if (this.activeId() === id) this.activeId.set(null);
    this.persistConversations();
  }

  sendMessage(text: string): void {
    if (this.sending()) return;
    if (!this.activeConversation()) this.startConversation();

    const conversationId = this.activeId();
    if (!conversationId) return;

    const userMessage: ChatMessage = {
      id: this.createId(),
      role: 'user',
      content: text,
    };
    this.updateConversation(conversationId, (conversation) => ({
      ...conversation,
      title: conversation.messages.length === 0 ? this.titleFrom(text) : conversation.title,
      updatedAt: Date.now(),
      messages: [...conversation.messages, userMessage],
    }));

    this.errorMessage.set('');
    this.sending.set(true);
    this.api
      .sendMessage(text)
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: (reply) => {
          const assistantMessage: ChatMessage = {
            id: this.createId(),
            role: 'assistant',
            content: reply.map((segment) => segment.content).join('\n'),
            segments: reply,
          };
          this.updateConversation(conversationId, (conversation) => ({
            ...conversation,
            updatedAt: Date.now(),
            messages: [...conversation.messages, assistantMessage],
          }));
        },
        error: () =>
          this.errorMessage.set(
            'Could not reach the local AI service. Start app.py and try again.',
          ),
      });
  }

  private updateConversation(
    id: string,
    update: (conversation: Conversation) => Conversation,
  ): void {
    this.conversations.update((items) =>
      items
        .map((conversation) => (conversation.id === id ? update(conversation) : conversation))
        .sort((left, right) => right.updatedAt - left.updatedAt),
    );
    this.persistConversations();
  }

  private restoreConversations(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) return;
      const conversations = JSON.parse(saved) as Conversation[];
      if (!Array.isArray(conversations)) return;
      this.conversations.set(conversations);
      this.activeId.set(conversations[0]?.id ?? null);
    } catch {
      localStorage.removeItem(this.storageKey);
    }
  }

  private persistConversations(): void {
    if (this.isBrowser) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.conversations()));
    }
  }

  private titleFrom(text: string): string {
    const firstLine = text.split('\n')[0].trim();
    return firstLine.length > 34 ? `${firstLine.slice(0, 34)}...` : firstLine;
  }

  private createId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
