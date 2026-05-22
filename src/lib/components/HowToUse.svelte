<script lang="ts">
	const guides = [
		{
			name: 'Ride With GPS',
			steps: [
				'Sign in at ridewithgps.com.',
				'Click Upload, then choose the .gpx file you just downloaded.',
				'It will appear in your Library as a route.',
				'Push to your Garmin or Wahoo from the route page.'
			]
		},
		{
			name: 'Garmin Connect',
			steps: [
				'Open Garmin Connect on the web.',
				'Training & Planning → Courses → Import.',
				'Upload the .gpx — Garmin saves it as a course.',
				'Send to Device from the course detail page.'
			]
		},
		{
			name: 'Wahoo (ELEMNT)',
			steps: [
				'Email the .gpx to yourself.',
				'Open the email on your phone with the Wahoo app installed.',
				'Tap the file → Open in Wahoo.',
				'It syncs to your ELEMNT next time it connects.'
			]
		},
		// TODO: add in the proper instructions for the strava upload.
		{
			name: 'Strava',
			steps: ['please write this']
		}
	];
</script>

<div class="howto-grid">
	{#each guides as guide, i (guide.name)}
		<div class="howto-card">
			<div class="howto-screenshot">
				<div class="fauxscreen">
					<div class="stripe"></div>
					<div class="label">{guide.name} — screenshot</div>
				</div>
			</div>
			<div class="howto-title">
				<span class="howto-num">0{i + 1}</span>
				<span class="howto-name">{guide.name}</span>
			</div>
			<ol class="howto-steps">
				{#each guide.steps as step (step)}
					<li>{step}</li>
				{/each}
			</ol>
		</div>
	{/each}
</div>
