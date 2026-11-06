import { IFaceCollection, Subject, SubjectExample } from './types';

/**
 * Local IndexedDB / Memory Collection conforming to CompreFace Subject collection API
 */
export class LocalFaceCollection implements IFaceCollection {
  private storageKey: string;
  private subjects: Map<string, Subject> = new Map();

  constructor(storageKey: string = 'pk_compreface_collection') {
    this.storageKey = storageKey;
    this.load();
  }

  private load(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed: Subject[] = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.subjects.clear();
          for (const s of parsed) {
            if (s && s.subject_id) {
              this.subjects.set(s.subject_id, s);
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  private save(): void {
    try {
      const list = Array.from(this.subjects.values());
      localStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  async addExample(
    subjectId: string,
    embedding: number[],
    metadata?: { pose?: string; quality?: number; modelName?: string; modelVersion?: string }
  ): Promise<SubjectExample> {
    let subject = this.subjects.get(subjectId);
    if (!subject) {
      subject = {
        subject_id: subjectId,
        examples: [],
      };
      this.subjects.set(subjectId, subject);
    }

    const example: SubjectExample = {
      image_id: `IMG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      embedding,
      model_name: metadata?.modelName || 'ResNet-34',
      model_version: metadata?.modelVersion || 'v1.0.0',
      pose_label: metadata?.pose || 'neutral',
      quality_score: metadata?.quality ?? 90,
      created_at: new Date().toISOString(),
    };

    subject.examples.push(example);
    this.save();
    return example;
  }

  async getSubject(subjectId: string): Promise<Subject | null> {
    return this.subjects.get(subjectId) || null;
  }

  async listSubjects(): Promise<Subject[]> {
    return Array.from(this.subjects.values());
  }

  async deleteSubject(subjectId: string): Promise<boolean> {
    const existed = this.subjects.delete(subjectId);
    if (existed) this.save();
    return existed;
  }

  async deleteExample(subjectId: string, imageId: string): Promise<boolean> {
    const subject = this.subjects.get(subjectId);
    if (!subject) return false;
    const initialLen = subject.examples.length;
    subject.examples = subject.examples.filter((e) => e.image_id !== imageId);
    if (subject.examples.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  async clear(): Promise<void> {
    this.subjects.clear();
    this.save();
  }
}
