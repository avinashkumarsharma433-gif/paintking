/**
 * PK-OS Industrial Voice Feedback & Audio Synthesizer
 * Uses Web Speech Synthesis (SpeechSynthesisUtterance) with Web Audio chime fallback.
 * Speaks naturally in Hindi or Indian English upon punch confirmation or safety alerts.
 */

export interface VoiceAnnouncementOptions {
  language?: 'hi-IN' | 'en-IN';
  volume?: number; // 0.0 to 1.0
  rate?: number; // 0.8 to 1.2
}

class IndustrialVoiceEngine {
  private synth: SpeechSynthesis | null = null;
  private voicesLoaded: boolean = false;
  private hindiVoice: SpeechSynthesisVoice | null = null;
  private indianEnglishVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices(): void {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (voices.length > 0) {
      this.voicesLoaded = true;
      this.hindiVoice =
        voices.find((v) => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi')) || null;
      this.indianEnglishVoice =
        voices.find((v) => v.lang === 'en-IN' || v.name.toLowerCase().includes('india')) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        null;
    }
  }

  /**
   * Speak attendance greeting:
   * e.g., "Namaste Rahul Sharma, In-Time recorded at 09:12 AM" or Hindi equivalent.
   */
  public speakAttendanceConfirmation(
    employeeName: string,
    punchType: 'IN' | 'OUT',
    timeStr: string,
    options: VoiceAnnouncementOptions = { language: 'hi-IN' }
  ): void {
    if (!this.synth) return;

    try {
      // Cancel any ongoing speech to avoid overlapping queue lag
      this.synth.cancel();

      const firstName = employeeName.split(' ')[0] || employeeName;
      let text = '';

      if (options.language === 'hi-IN') {
        if (punchType === 'IN') {
          text = `नमस्ते ${firstName}, आपकी इन-टाइम उपस्थिति दर्ज हो गई है।`;
        } else {
          text = `धन्यवाद ${firstName}, आपकी आउट-टाइम उपस्थिति दर्ज हो गई है। शुभ संध्या!`;
        }
      } else {
        if (punchType === 'IN') {
          text = `Welcome ${firstName}. In-time recorded at ${timeStr}.`;
        } else {
          text = `Thank you ${firstName}. Out-time recorded at ${timeStr}. Have a great evening.`;
        }
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? 0.95; // Slightly slower for crisp industrial clarity
      utterance.pitch = 1.0;
      utterance.volume = options.volume ?? 1.0;

      if (options.language === 'hi-IN' && this.hindiVoice) {
        utterance.voice = this.hindiVoice;
      } else if (this.indianEnglishVoice) {
        utterance.voice = this.indianEnglishVoice;
      }

      this.synth.speak(utterance);
    } catch {
      // Audio fallback already triggers chime
    }
  }

  /**
   * Speak Spoof or Liveness warning alert
   */
  public speakSecurityAlert(message: string, isHindi: boolean = true): void {
    if (!this.synth) return;
    try {
      this.synth.cancel();
      const text = isHindi
        ? `चेतावनी: कृपया सीधा देखें और अपना असली चेहरा दिखाएं।`
        : `Security Alert: Please face the camera directly. Anti-spoof check failed.`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.volume = 1.0;
      if (isHindi && this.hindiVoice) {
        utterance.voice = this.hindiVoice;
      }
      this.synth.speak(utterance);
    } catch {
      // ignored
    }
  }
}

export const voiceEngine = new IndustrialVoiceEngine();
