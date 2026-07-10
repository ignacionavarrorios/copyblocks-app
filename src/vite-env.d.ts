/// <reference types="vite/client" />

// Permite importar archivos .md como string crudo (import x from "...md?raw").
declare module "*.md?raw" {
  const content: string;
  export default content;
}
