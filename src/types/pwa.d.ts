// Types para APIs de PWA que no están en el standard de TypeScript

declare global {
  interface ServiceWorkerRegistration {
    sync: {
      register(tag: string): Promise<void>;
    };
  }

  interface Window {
    ServiceWorkerRegistration: {
      prototype: ServiceWorkerRegistration;
    };
  }

  interface ServiceWorkerGlobalScope {
    addEventListener(type: 'sync', listener: (event: SyncEvent) => void): void;
  }

  interface SyncEvent extends Event {
    tag: string;
    waitUntil(f: Promise<unknown>): void;
  }
}

export {};