declare module 'react-dom' {
  export function createPortal(children: React.ReactNode, container: Element | DocumentFragment, key?: string | null): React.ReactPortal;
  export function render(element: React.ReactNode, container: Element | null, callback?: () => void): void;
  export function unmountComponentAtNode(container: Element): boolean;
  export function findDOMNode(instance: React.ReactInstance | null | undefined): Element | null | Text;
}

declare module 'react-dom/client' {
  export interface Root {
    render(children: React.ReactNode): void;
    unmount(): void;
  }
  export function createRoot(container: Element | DocumentFragment, options?: any): Root;
  export function hydrateRoot(container: Element | DocumentFragment, initialChildren: React.ReactNode, options?: any): Root;
}

declare module 'react-dom/server' {
  export function renderToString(element: React.ReactNode): string;
  export function renderToStaticMarkup(element: React.ReactNode): string;
}
