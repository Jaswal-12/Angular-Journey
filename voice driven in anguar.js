
  isRecording = false;

  isTranscribing = false;

  private mediaRecorder: MediaRecorder | null = null;

  private audioChunks: Blob[] = [];

  private micStream: MediaStream | null = null;

  toggleMic(): void {

    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }

  }

  private async startRecording(): Promise<void> {

    if (!navigator.mediaDevices?.getUserMedia) {
      this.pushBotMessage('Voice input isn\'t supported in this browser.');
      return;
    }

    try {

      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.audioChunks = [];

      // 'audio/webm' is broadly supported (Chrome/Edge/Firefox); Safari
      // may fall back to a different mimeType automatically if omitted.
      this.mediaRecorder = new MediaRecorder(this.micStream);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingStop();
      };

      this.mediaRecorder.start();

      this.isRecording = true;
      this.cdr.detectChanges();

    } catch (error) {
      console.error('Microphone access error:', error);
      this.pushBotMessage('Couldn\'t access your microphone. Please check permissions.');
      this.isRecording = false;
      this.cdr.detectChanges();
    }

  }

  private stopRecording(): void {

    this.mediaRecorder?.stop();

    // release the mic so the browser's "recording" indicator turns off
    this.micStream?.getTracks().forEach(track => track.stop());
    this.micStream = null;

    this.isRecording = false;
    this.cdr.detectChanges();

  }

  private handleRecordingStop(): void {

    if (this.audioChunks.length === 0) {
      return;
    }

    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

    this.isTranscribing = true;
    this.cdr.detectChanges();

    this.chatbotService
      .sendVoiceMessage(audioBlob)
      .pipe(
        finalize(() => {
          this.isTranscribing = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: (response: any) => {

          console.log('Speech-to-text response:', response);

          const transcript =
            response?.transcript ??
            response?.text ??
            response?.message ??
            '';

          if (transcript.trim()) {
            this.message = transcript;
            this.sendMessage();
          } else {
            this.pushBotMessage('Sorry, I couldn\'t make out what you said. Please try again.');
          }

        },

        error: (error) => {
          console.error('Speech-to-text error:', error);
          this.pushBotMessage('Sorry! Voice transcription failed.');
        }

      });

  }

  private pushBotMessage(text: string): void {
    this.messages = [
      ...this.messages,
      {
        id: Date.now(),
        text,
        sender: 'bot',
        time: new Date()
      }
    ];
    this.cdr.detectChanges();
  }

} 
