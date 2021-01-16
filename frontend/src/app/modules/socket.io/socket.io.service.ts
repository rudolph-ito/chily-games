import { Observable } from "rxjs";
import { share } from "rxjs/operators";
import { io } from "socket.io-client";

export interface SocketIoConfig {
  url: string;
  options?: any;
}

export class WrappedSocket {
  subscribersCounter: Record<string, number> = {};
  eventObservables$: Record<string, Observable<any>> = {};
  ioSocket: io.Socket;
  emptyConfig: SocketIoConfig = {
    url: "",
    options: {},
  };

  constructor(private readonly config: SocketIoConfig) {
    if (config === undefined) {
      config = this.emptyConfig;
    }
    const url: string = config.url;
    const options: any = config.options;
    this.ioSocket = io(url, options);
  }

  of(namespace: string): void {
    this.ioSocket.of(namespace);
  }

  on(eventName: string, callback: Function): void {
    this.ioSocket.on(eventName, callback);
  }

  once(eventName: string, callback: Function): void {
    this.ioSocket.once(eventName, callback);
  }

  connect(): io.Socket {
    return this.ioSocket.connect();
  }

  disconnect(close?: any): io.Socket {
    return this.ioSocket.disconnect.apply(this.ioSocket, arguments);
  }

  emit(eventName: string, ...args: any[]): io.Socket {
    return this.ioSocket.emit.apply(this.ioSocket, arguments);
  }

  removeListener(eventName: string, callback?: Function): io.Socket {
    return this.ioSocket.removeListener.apply(this.ioSocket, arguments);
  }

  removeAllListeners(eventName?: string): io.Socket {
    return this.ioSocket.removeAllListeners.apply(this.ioSocket, arguments);
  }

  fromEvent<T>(eventName: string): Observable<T> {
    if (this.subscribersCounter[eventName] == null) {
      this.subscribersCounter[eventName] = 0;
    }
    this.subscribersCounter[eventName]++;

    if (this.eventObservables$[eventName] != null) {
      this.eventObservables$[eventName] = new Observable((observer: any) => {
        const listener = (data: T): void => {
          observer.next(data);
        };
        this.ioSocket.on(eventName, listener);
        return (): void => {
          this.subscribersCounter[eventName]--;
          if (this.subscribersCounter[eventName] === 0) {
            this.ioSocket.removeListener(eventName, listener);
            delete this.eventObservables$[eventName]; // eslint-disable-line @typescript-eslint/no-dynamic-delete
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
