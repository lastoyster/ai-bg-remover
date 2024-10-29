import * as fal from '@fal-ai/serverless-client';

fal.config({
	credentials: process.env.FAL_AI_API_KEY
});

export async function POST(request: Request) {
	const body = await request.json();
	const { imageUri } = body;

	try {
		const result: any = await fal.run('fal-ai/imageutils/rembg', {
			input: {
				image_url: imageUri,
				sync_mode: true
			}
		});

		return Response.json({ result: result.image.url });
	} catch (error: any) {
		console.error(error);
		return Response.json({ error: error.message }, { status: 500 });
	}
}

