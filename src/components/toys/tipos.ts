import type { Modo } from '../Sandbox';

/** O que toda ilustração viva aceita. */
export type ToyProps = {
  modoInicial?: Modo;
  /** Quais desafios mostrar (ids). Sem isso, mostra todos. */
  desafios?: string[];
  /** Exemplo pronto para carregar ao abrir. */
  preset?: string;
  /** Se informada, o modo livre é salvo com essa chave e volta como você deixou. */
  chave?: string;
  onProgresso?: (feitos: number, total: number) => void;
};
