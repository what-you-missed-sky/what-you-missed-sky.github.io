import type { At } from '@atcute/client/lexicons';

import { SampleAuthenticatedClient, type KittyAgent } from 'kitty-agent';
import { StatefulSvelteOAuthClient } from 'kitty-agent/oauth-svelte';
import { derived, writable, type Readable } from 'svelte/store';

class WymClient extends SampleAuthenticatedClient {
}

export interface LoginState {
    readonly handle: string;
    readonly did: At.DID;
    readonly pds: string;
    readonly agent: KittyAgent;
    readonly client: WymClient;
}

const oauthClient: StatefulSvelteOAuthClient<WymClient> = new StatefulSvelteOAuthClient<WymClient>(
    {
        clientId: import.meta.env.VITE_OAUTH_CLIENT_ID,
        redirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI,
        scope: import.meta.env.VITE_OAUTH_SCOPE,
    },
    { createWritableStore: writable, createDerivedStore: derived },
    (loginState) => new WymClient(loginState),
);

export async function authenticateIfNecessary(handle: string, refreshOnly: boolean): Promise<boolean> {
    return await oauthClient.authenticateIfNecessary(handle, refreshOnly);
}
export async function waitForInitialSession(): Promise<void> {
    return await oauthClient.waitForInitialSession();
}
export function revokeSessions() {
    return oauthClient.revokeSessions();
}

export const user: Readable<LoginState | undefined> = oauthClient.user;
export const savedHandle: Readable<string | undefined> = oauthClient.handle;