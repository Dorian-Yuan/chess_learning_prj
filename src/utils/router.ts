export type RouteHandler = (path: string) => void;

export interface Route {
  path: string;
  handler: RouteHandler;
}

export class Router {
  private routes: Map<string, RouteHandler> = new Map();
  private defaultHandler: RouteHandler | null = null;
  private currentPath: string = '';
  private listeners: Array<(path: string) => void> = [];

  public register(path: string, handler: RouteHandler): void {
    this.routes.set(path, handler);
  }

  public setDefault(handler: RouteHandler): void {
    this.defaultHandler = handler;
  }

  public onRouteChange(listener: (path: string) => void): void {
    this.listeners.push(listener);
  }

  public navigate(path: string): void {
    window.location.hash = path;
  }

  public getCurrentPath(): string {
    return this.currentPath;
  }

  public init(): void {
    const handleHashChange = () => {
      let hash = window.location.hash.slice(1);
      if (!hash.startsWith('/')) {
        hash = '/' + hash;
      }
      this.currentPath = hash;

      const basePath = hash.split('?')[0];
      const handler = this.routes.get(basePath) || this.routes.get(hash);

      if (handler) {
        handler(hash);
      } else if (this.defaultHandler) {
        this.defaultHandler(hash);
      }

      this.listeners.forEach((listener) => listener(hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial trigger
    handleHashChange();
  }
}

export const appRouter = new Router();
