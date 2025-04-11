export type Secret = string | [string, string];
export declare namespace Secret {
    function scrub(string: string, keep?: string): string;
    function rend(secret: Secret, scrub?: boolean): readonly [string, string];
    function mend(secret: Secret, scrub?: boolean): string;
    function id(secret: Secret, scrub?: boolean): string;
    function pw(secret: Secret, scrub?: boolean): string;
    function random(n?: number, m?: number, from?: string): string;
}
export default Secret;
