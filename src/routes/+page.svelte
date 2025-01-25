<script lang="ts">
import { authenticateIfNecessary, savedHandle, user, waitForInitialSession } from '$lib/atproto/signed-in-user';
import BlueskyProfileFeed from '$lib/components/bluesky-profile-feed.svelte';
import { hoursAgo } from '$lib/date-utils';
import type { AppBskyFeedDefs, AppBskyFeedGetTimeline, At } from '@atcute/client/lexicons';
import { onMount } from 'svelte';

let did = $state<At.DID>();
let feedData = $state<AppBskyFeedGetTimeline.Output>();

let initialSessionPromise = $state<Promise<void>>();

async function signIn() {
    if (!$user) {
        await waitForInitialSession();
    }

    if (!$user) {
        const handle = $savedHandle ?? prompt("What's your @handle?");
        if (!handle) return;

        await authenticateIfNecessary(handle, false);
    }
}
onMount(async () => {
    initialSessionPromise = waitForInitialSession();
});

user.subscribe(async (user) => {
    if (user) {
        did = user.did;
        const result = await user.agent.query('app.bsky.feed.getTimeline', { limit: 100 });
        console.log(result);
        feedData = result;
    }
});

let feedDerived = $state<AppBskyFeedDefs.FeedViewPost[]>([]);

let orderBy: 'asc' | 'desc' = $state('asc');
let lastNHours = $state(1);
let includeReposts = $state(true);
let includeReplies = $state(true);

$effect(() => {
    includeReposts;
    lastNHours;
    orderBy;
    includeReplies;

    console.log('called this pussy', includeReposts, lastNHours, orderBy, includeReplies);

    if (feedData) {
        feedDerived = feedData.feed
            .filter((post) => {
                if (post.reason?.$type === 'app.bsky.feed.defs#reasonRepost' && !includeReposts) {
                    return false;
                }

                if (new Date(post.post.indexedAt).getTime() < hoursAgo(lastNHours).getTime()) {
                    return false;
                }

                return includeReplies || !post.reply;
            })
            .sort((a, b) => {
                if (orderBy === 'desc') {
                    return new Date(a.post.indexedAt).getTime() - new Date(b.post.indexedAt).getTime();
                }

                return new Date(b.post.indexedAt).getTime() - new Date(a.post.indexedAt).getTime();
            });
    }
});

const catchupRanges = {
    '1': 'last 1 hour',
    '2': 'last 2 hours',
    '3': 'last 3 hours',
    '4': 'last 4 hours',
    '5': 'last 5 hours',
    '6': 'last 6 hours',
    '7': 'last 7 hours',
    '8': 'last 8 hours',
    '9': 'last 9 hours',
    '10': 'last 10 hours',
    '11': 'last 11 hours',
    '12': 'last 12 hours',
};
</script>

{#if $user}
    <div class="catchup-form">
        <select bind:value={orderBy}>
        <option value="asc">Newest</option>
        <option value="desc">Oldest</option>
        </select>
        
        <label>
            <input type="checkbox" bind:checked={includeReposts} />
            Reposts
        </label>
        <label>
            <input type="checkbox" bind:checked={includeReplies} />
            Replies
        </label>
        
        <div style="width: 32em; margin: auto;">
            <input type="range" min="1" max="12" step="1" list="catchup-ranges" bind:value={lastNHours} />
            {catchupRanges[lastNHours as unknown as keyof typeof catchupRanges]}<br />
            <small class="insignificant">{hoursAgo(lastNHours)}</small>
        </div>
        <datalist id="catchup-ranges">
            {#each Object.entries(catchupRanges) as [key, value]}
                <option label={value} value={key}></option>
            {/each}
        </datalist>
    </div>

    {#await feedData}
    Fetching maids...
    {:then x}
        {#if x}
            {@const { result, did } = x}
            <BlueskyProfileFeed feed={feedDerived} {did} allowUnauthenticated={true} />
        {/if}
    {/await}
{:else}
    {#if initialSessionPromise}
        {#await initialSessionPromise}
            Loading...
        {:then _}
            <button onclick={signIn}>Sign In</button>
        {/await}
    {/if}
{/if}

<style>
    .catchup-form {
        margin: auto;
        text-align: center;
        
		color: var(--text-primary);
		font-weight: 400;
		font-size: calc(var(--font-size) * 0.875);
		line-height: calc(var(--font-size) * 1.25);
		font-family: var(--font-family);
    }

	/* Light theme */
    :root {
		--font-size: 16px;
		--font-family: system-ui, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif, 'Apple Color Emoji',
			'Segoe UI Emoji';
		--max-feed-height: 600px;

		--text-primary: #000000;
		--text-secondary: #455668;
		--text-link: #1083fe;
		--background-primary: #ffffff;
		--background-secondary: #455668;
		--divider-hover: #a9b7c5;
		--divider: #d4dbe2;
		--button: #1083fe;
		--button-text: #ffffff;
		--button-hover: #0168d5;
    }
</style>