<script lang="ts">
  	import type { AppBskyFeedDefs, AppBskyFeedGetPostThread, At } from '@atcute/client/lexicons';
	import EmbedFrame from './internal/components/embed-frame.svelte';
	import FeedPost from './internal/components/feed-post.svelte';
	import ProfileFeedHeader from './internal/components/profile-feed-header.svelte';

	import type { ProfileFeedData } from './internal/types/profile-feed.js';
	import { NO_UNAUTHENTICATED_LABEL } from './internal/utils/constants.js';
  	import Post from './internal/components/post.svelte';

	const { did, feed, allowUnauthenticated }: {
		did: At.DID;
		feed: AppBskyFeedDefs.FeedViewPost[];
		allowUnauthenticated: boolean;
	} = $props();

	const items = $derived(feed.filter((item) => {
		const reason = item.reason;
		if (reason) {
			if (reason.$type === 'app.bsky.feed.defs#reasonPin') {
				return true;
			}

			if (reason.$type === 'app.bsky.feed.defs#reasonRepost') {
				const author = item.post.author;

				if (author.did !== did) {
					return (
						allowUnauthenticated || !author.labels?.some((label) => label.val === NO_UNAUTHENTICATED_LABEL)
					);
				}

				return true;
			}

			// Don't show anything we don't recognize
			return false;
		}

		return true;
	}));
</script>

<EmbedFrame>
	{#if items.length > 0}
		<div class="feed">
			{#each items as item (item.post.uri)}
				{#if item.reply?.parent.$type === 'app.bsky.feed.defs#postView'}
					<Post post={item.reply.parent} />
				{:else if item.reply?.parent.$type === 'app.bsky.feed.defs#blockedPost'}
					<div class="blocked-message">The user being replied to has blocked you, or you have blocked the user.</div>
				{:else if item.reply?.parent.$type === 'app.bsky.feed.defs#notFoundPost'}
					<div class="blocked-message">The post being replied to was not found.</div>
				{/if}
				<FeedPost {item} />
			{/each}

			<div class="end-marker">
				<div class="dot"></div>
			</div>
		</div>
	{:else}
		<div class="message">This user has not made any posts.</div>
	{/if}
</EmbedFrame>

{#snippet Message(msg: string)}
	<EmbedFrame>
		<div class="message">{msg}</div>
	</EmbedFrame>
{/snippet}

<style>
	.message {
		margin: 0 auto;
		padding: 32px 16px;
		max-width: 380px;
		color: var(--text-secondary);
		text-align: center;
	}

	.blocked-message {
		margin: 0;
		padding: 16px 16px;
		color: var(--text-secondary);
	}

	.end-marker {
		display: grid;
		place-items: center;
		height: 48px;

		.dot {
			border-radius: 50%;
			background: var(--text-secondary);
			width: 4px;
			height: 4px;
		}
	}

</style>
