import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomerSidebar } from '../components/customer-sidebar/customer-sidebar';
import { StatsCards } from '../components/stats-cards/stats-cards';
import { RevenueChart } from '../components/revenue-chart/revenue-chart';
import { PolicyChart } from '../components/policy-chart/policy-chart';
import { PaymentSidebar } from '../components/payment-sidebar/payment-sidebar';

import { trigger, transition, style, animate } from '@angular/animations';

import { ChatService } from '../services/chat';

@Component({
  selector: 'app-dashboard',

  standalone: true,

  imports: [CommonModule, CustomerSidebar, StatsCards, RevenueChart, PolicyChart, PaymentSidebar],

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

  templateUrl: './dashboard.html',

  styleUrl: './dashboard.css',
})
export class Dashboard {
  constructor(private chatService: ChatService) {}

  // ==========================
  // CUSTOMER POPUP
  // ==========================

  showCustomerPopup = false;

  selectedCustomer: any = null;

  openCustomerPopup(customer: any) {
    this.selectedCustomer = customer;

    this.showCustomerPopup = true;
  }

  closeCustomerPopup() {
    this.showCustomerPopup = false;

    this.showSiri = false;
  }

  // ==========================
  // AI POPUP
  // ==========================

  showAiPopup = false;

  openAiAssistant() {
    this.showAiPopup = true;

    this.status = 'Press microphone';
  }

  closeAiAssistant() {
    this.showAiPopup = false;

    this.userText = '';

    this.aiReply = '';

    this.status = '';
  }

  // ==========================
  // BUSINESS POPUP
  // ==========================

  showBusinessPopup = false;

  popupTitle = '';

  openBusinessPopup(title: string) {
    this.popupTitle = title;

    this.showBusinessPopup = true;
  }

  closeBusinessPopup() {
    this.showBusinessPopup = false;
  }

  // ==========================
  // VOICE ASSISTANT
  // ==========================

  showSiri = false;

  userText = '';

  aiReply = '';

  status = '';

  isListening = false;

  mediaRecorder!: MediaRecorder;

  audioChunks: Blob[] = [];

  // START RECORDING

  startVoiceAssistant() {
    this.status = 'Listening...';

    this.isListening = true;

    navigator.mediaDevices
      .getUserMedia({
        audio: true,
      })

      .then((stream) => {
        this.mediaRecorder = new MediaRecorder(stream);

        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
          this.audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(
            this.audioChunks,

            {
              type: 'audio/webm',
            },
          );

          this.sendVoiceToBackend(audioBlob);
        };

        this.mediaRecorder.start();
      })

      .catch((error) => {
        console.log(error);

        this.status = 'Microphone permission denied';
      });
  }

  // STOP RECORDING

  stopVoiceAssistant() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    this.status = 'Processing...';
  }

  // SEND VOICE TO BACKEND

  sendVoiceToBackend(audio: Blob) {
    const formData = new FormData();

    formData.append(
      'audio',

      audio,

      'voice.webm',
    );

    this.chatService
      .sendVoice(formData)

      .subscribe({
        next: (response: any) => {
          console.log('AI RESPONSE', response);

          /*
Backend response:

{
 success:true,
 text:"user question",
 reply:"Gemini answer",
 audio:"base64 audio"
}

*/

          // Speech To Text

          this.userText = response.text;

          // Gemini Reply

          this.aiReply = response.reply;

          this.status = 'Speaking...';

          // Text To Speech

          if (response.audio) {
            this.playAudio(response.audio);
          } else {
            this.browserSpeak(this.aiReply);
          }
        },

        error: (error) => {
          console.log(error);

          this.status = 'AI Error';

          this.isListening = false;
        },
      });
  }

  // PLAY BACKEND TTS AUDIO

  playAudio(base64: string) {
    const audio = new Audio('data:audio/mp3;base64,' + base64);

    audio.play();

    audio.onended = () => {
      this.status = 'Done';

      this.isListening = false;
    };
  }

  // FALLBACK BROWSER TTS

  browserSpeak(text: string) {
    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = 'en-US';

    speech.rate = 1;

    window.speechSynthesis.speak(speech);

    speech.onend = () => {
      this.status = 'Done';

      this.isListening = false;
    };
  }
}
