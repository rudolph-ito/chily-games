import { Observable } from "rxjs";
import { share } from "rxjs/operators";
import { io, Socket } from "socket.io-client";

export interface SocketIoConfig {
  url: string;
  options?: any;
}

export class WrappedSocket {
  subscribersCounter: Record<string, number> = {};
  eventObservables$: Record<string, Observable<any>> = {};
  ioSocket: Socket;
  baseConfig: SocketIoConfig = {
    url: "",
    options: {
      reconnectionAttempts: 3,
      timeout: 5000,
    },
  };

  constructor(config: SocketIoConfig) {
    if (config === undefined) {
      config = this.baseConfig;
    }
    const url: string = config.url;
    const options: any = config.options;
    this.ioSocket = io(url, options);
  }

  isActive(): boolean {
    return this.ioSocket.active;
  }

  off(eventName: string, callback: (...args: any[]) => void): void {
    this.ioSocket.off(eventName, callback);
  }

  on(eventName: string, callback: (...args: any[]) => void): void {
    this.ioSocket.on(eventName, callback);
  }

  once(eventName: string, callback: (...args: any[]) => void): void {
    this.ioSocket.once(eventName, callback);
  }

  connect(): Socket {
    return this.ioSocket.connect();
  }

  disconnect(): Socket {
    return this.ioSocket.disconnect();
  }

  emit(eventName: string, ...args: any[]): Socket {
    return this.ioSocket.emit(eventName, ...args);
  }

  fromEvent<T>(eventName: string): Observable<T> {
    if (this.subscribersCounter[eventName] == null) {
      this.subscribersCounter[eventName] = 0;
    }
    this.subscribersCounter[eventName]++;

    if (this.eventObservables$[eventName] == null) {
      this.eventObservables$[eventName] = new Observable((observer: any) => {
        const listener = (data: T): void => {
          observer.next(data);
        };
        this.ioSocket.on(eventName, listener);
        return (): void => {
          this.subscribersCounter[eventName]--;
          if (this.subscribersCounter[eventName] === 0) {
            this.ioSocket.off(eventName, listener);
            delete this.eventObservables$[eventName];
          }
        };
      }).pipe(share());
    }
    return this.eventObservables$[eventName];
  }

  async fromOneTimeEvent<T>(eventName: string): Promise<T> {
    return await new Promise<T>((resolve) => this.once(eventName, resolve));
  }
}
