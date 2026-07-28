import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { CustomerSidebar } from '../components/customer-sidebar/customer-sidebar';
import { StatsCards } from '../components/stats-cards/stats-cards';
import { RevenueChart } from '../components/revenue-chart/revenue-chart';
import { PolicyChart } from '../components/policy-chart/policy-chart';
import { PaymentSidebar } from '../components/payment-sidebar/payment-sidebar';

import { trigger, transition, style, animate } from '@angular/animations';

import { Chatbot } from '../services/chatbot';

@Component({
  selector: 'app-dashboard',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    CustomerSidebar,
    StatsCards,
    RevenueChart,
    PolicyChart,
    PaymentSidebar,
  ],

  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',

  animations: [
    trigger('popupAnimation', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateY(-80px) scale(0.95)',
        }),

        animate(
          '300ms cubic-bezier(0.25,0.8,0.25,1)',
          style({
            opacity: 1,
            transform: 'translateY(0) scale(1)',
          }),
        ),
      ]),

      transition(':leave', [
        animate(
          '300ms ease-in',
          style({
            opacity: 0,
            transform: 'translateY(-60px) scale(0.95)',
          }),
        ),
      ]),
    ]),
  ],
})
export class Dashboard {
  /* ================= CUSTOMER POPUP ================= */

  showCustomerPopup = false;

  selectedCustomer: any = null;

  openCustomerPopup(customer: any): void {
    this.selectedCustomer = customer;
    this.showCustomerPopup = true;
  }

  closeCustomerPopup(): void {
    this.showCustomerPopup = false;
  }

  /* ================= AI ASSISTANT ================= */

  message = '';

  messages: {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    time: Date;
  }[] = [];

  isTyping = false;

  isLoading = false;

  conversationId = '';

  constructor(
    private chatbotService: Chatbot,
    private cdr: ChangeDetectorRef,
  ) {}

  sendMessage(): void {
    const userMessage = this.message.trim();

    if (!userMessage) return;

    // FIX: build a new array instead of push()'ing onto the existing one.
    // push() mutates in place and keeps the same array reference, which
    // can leave Angular's change detection unaware anything changed until
    // some unrelated event (mouse move, etc.) triggers a check later —
    // that's what was causing the "fast in console, slow on screen" gap.
    this.messages = [
      ...this.messages,
      {
        id: Date.now(),
        text: userMessage,
        sender: 'user',
        time: new Date(),
      },
    ];

    this.message = '';

    this.isTyping = true;
    this.isLoading = true;

    this.scrollToBottom();

    this.chatbotService
      .sendMessage(userMessage)
      .pipe(
        finalize(() => {
          this.isTyping = false;
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: any) => {
          console.log('AI response:', response);

          const replyText =
            response?.aiResponse ??
            response?.reply ??
            response?.message ??
            response?.answer ??
            response?.data?.aiResponse ??
            'Sorry, I could not understand the response.';

          this.messages = [
            ...this.messages,
            {
              id: Date.now() + 1,
              text: replyText,
              sender: 'bot',
              time: new Date(),
            },
          ];

          // FIX: force Angular to render this update immediately rather
          // than waiting for the next zone-triggered check.
          this.cdr.detectChanges();

          this.scrollToBottom();
        },

        error: (error) => {
          console.error(error);

          this.messages = [
            ...this.messages,
            {
              id: Date.now() + 1,
              text: 'Sorry! Something went wrong.',
              sender: 'bot',
              time: new Date(),
            },
          ];

          this.cdr.detectChanges();

          this.scrollToBottom();
        },
      });
  }

  onEnter(event: any): void {
    event.preventDefault();
    this.sendMessage();
  }

  clearChat(): void {
    this.messages = [];
  }

  trackByMsgId(index: number, msg: { id: number }): number {
    return msg.id;
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const chatBody = document.querySelector('.ai-chat-body');

      if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    }, 100);
  }

  showAiPopup = false;

  openAiAssistant(): void {
    this.showAiPopup = true;
  }

  closeAiAssistant(): void {
    this.showAiPopup = false;
  }

  /* ================= BUSINESS POPUP ================= */

  showBusinessPopup = false;

  popupTitle = '';

  openBusinessPopup(title: string): void {
    this.popupTitle = title;
    this.showBusinessPopup = true;
  }

  closeBusinessPopup(): void {
    this.showBusinessPopup = false;
  }

  /* ================= VOICE ASSISTANT ================= */

  showSiri = false;
}
