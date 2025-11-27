declare module "nspell" {
  export interface Dictionary {
    aff: string;
    dic: string;
  }

  interface SpellChecker {
    correct(word: string): boolean;
    suggest(word: string): string[];
  }

  export default function nspell(dictionary: Dictionary): SpellChecker;
}

declare module "dictionary-en" {
  import type { Dictionary } from "nspell";

  type Callback = (error: Error | null, dictionary?: Dictionary) => void;

  export default function dictionary(callback: Callback): void;
}
