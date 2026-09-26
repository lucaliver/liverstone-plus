type Handler<T> = (payload: T) => void;

/** Minimal typed event emitter. */
export class Emitter<Events extends { type: string }> {
  private handlers = new Set<Handler<Events>>();

  on(handler: Handler<Events>): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  emit(event: Events): void {
    for (const h of this.handlers) h(event);
  }

  clear(): void {
    this.handlers.clear();
  }
}
