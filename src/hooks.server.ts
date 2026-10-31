/**
 * Loga o erro completo no terminal do servidor durante o desenvolvimento.
 * Em produção devolvemos a mensagem genérica do SvelteKit; em dev mostramos
 * a causa para o 500 não virar uma tela em branco sem pista.
 */
export const handleError = ({
	error,
	event
}: {
	error: unknown;
	event: { url: URL };
}) => {
	const status = (error as { status?: number } | null)?.status ?? 500;
	const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
	console.error(`[mundivista] ${status} em ${event.url.pathname}\n${detail}`);
	return {
		message: import.meta.env.DEV && error instanceof Error ? error.message : 'Erro interno'
	};
};
