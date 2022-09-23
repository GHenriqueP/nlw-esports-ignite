import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express from 'express';

import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes';
import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string';

const app = express();

app.use(express.json());
app.use(cors());

const prisma = new PrismaClient({
	log: ['query'],
});

// ========= Rota para listar os jogos cadastrados no banco de dados
app.get('/games', async (request, response) => {
	const games = await prisma.game.findMany({
		include: {
			_count: {
				select: {
					ads: true,
				},
			},
		},
	});

	return response.json(games);
});

// ========= Rota para criar anúncios por jogo
app.post('/games/:id/ads', async (request, response) => {
	const gameId = request.params.id;
	const { body } = request;

	const ad = await prisma.ad.create({
		data: {
			gameId,
			name: body.name,
			yearsPlaying: body.yearsPlaying,
			discord: body.discord,
			weekDays: body.weekDays.join(','),
			hourStart: convertHourStringToMinutes(body.hourStart),
			hourEnd: convertHourStringToMinutes(body.hourEnd),
			useVoiceChannel: body.useVoiceChannel,
		},
	});

	return response.status(201).json(ad);
});

// ========= Rota para listar os anúncios de um jogo específico
app.get('/games/:id/ads', async (request, response) => {
	const gameId = request.params.id;

	const ads = await prisma.ad.findMany({
		select: {
			id: true,
			name: true,
			weekDays: true,
			useVoiceChannel: true,
			yearsPlaying: true,
			hourStart: true,
			hourEnd: true,
		},
		where: {
			gameId,
		},
		orderBy: {
			createdAt: 'desc',
		},
	});

	return response.json(ads.map((ad) => ({
		...ad,
		weekDays: ad.weekDays.split(','),
		hourStart: convertMinutesToHourString(ad.hourStart),
		hourEnd: convertMinutesToHourString(ad.hourEnd),
	})));
});

// ========= Rota para listar os jogos cadastrados no banco de dados
app.get('/ads/:id/discord', async (request, response) => {
	const adId = request.params.id;

	const ad = await prisma.ad.findUniqueOrThrow({
		select: {
			discord: true,
		},
		where: {
			id: adId,
		},
	});

	return response.json({
		discord: ad.discord,
	});
});

async function main() {
	await prisma.$connect();
	app.listen(3333, () => console.log('O servidor está ativo!'));
}

main();
