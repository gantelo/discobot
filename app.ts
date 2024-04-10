import 'dotenv/config';
import express from 'express';
import { InteractionType, InteractionResponseType, MessageComponentTypes, ButtonStyleTypes } from 'discord-interactions';
import { VerifyDiscordRequest, getRandomEmoji } from './src/utils.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY!) }));

type DB = {
	[id: string]: {
		id: string;
		objectName: string;
	};
};

const activeGames: DB = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async function (req, res) {
	// Interaction type and data
	const { type, data } = req.body;

	/**
	 * Handle verification requests
	 */
	if (type === InteractionType.PING) {
		return res.send({ type: InteractionResponseType.PONG });
	}

	/**
	 * Handle slash command requests
	 * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
	 */
	if (type === InteractionType.APPLICATION_COMMAND) {
		const { name, id } = data;

		// "test" command
		if (name === 'test') {
			// Send a message into the channel where command was triggered from
			return res.send({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					// Fetches a random emoji to send from a helper function
					content: 'hello world ' + getRandomEmoji(),
				},
			});
		}

		if (name === 'challenge' && id) {
			const userId = req.body.member.user.id;
			// User's object choice
			const objectName = req.body.data.options[0].value;

			// Create active game using message ID as the game ID
			activeGames[id] = {
				id: userId,
				objectName,
			};

			return res.send({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `Rock papers scissors challenge from <@${userId}>`,
					components: [
						{
							type: MessageComponentTypes.ACTION_ROW,
							components: [
								{
									type: MessageComponentTypes.BUTTON,
									// Append the game ID to use later on
									custom_id: `accept_button_${req.body.id}`,
									label: 'Accept',
									style: ButtonStyleTypes.PRIMARY,
								},
							],
						},
					],
				},
			});
		}
	}
});

app.listen(PORT, () => {
	console.log('Listening on port', PORT);
});
