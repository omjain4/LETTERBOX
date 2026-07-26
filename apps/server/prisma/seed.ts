import { PrismaClient, MediaType, ExternalSource } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Sample movies
    const movies = [
        {
            title: 'The Dark Knight',
            description: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague Gotham City.',
            mediaType: MediaType.MOVIE,
            externalId: 'tmdb-155',
            externalSource: ExternalSource.TMDB,
            releaseYear: 2008,
            genres: ['Action', 'Crime', 'Drama', 'Thriller'],
            runtimeMinutes: 152,
            posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/nMKdUUepR0PVAB4jCuaGnLwQmKw.jpg',
        },
        {
            title: 'Inception',
            description: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible.',
            mediaType: MediaType.MOVIE,
            externalId: 'tmdb-27205',
            externalSource: ExternalSource.TMDB,
            releaseYear: 2010,
            genres: ['Action', 'Science Fiction', 'Adventure'],
            runtimeMinutes: 148,
            posterUrl: 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
        },
        {
            title: 'Interstellar',
            description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
            mediaType: MediaType.MOVIE,
            externalId: 'tmdb-157336',
            externalSource: ExternalSource.TMDB,
            releaseYear: 2014,
            genres: ['Adventure', 'Drama', 'Science Fiction'],
            runtimeMinutes: 169,
            posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lZFWFnMCt5ng.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
        },
    ]

    // Sample TV shows
    const tvShows = [
        {
            title: 'Breaking Bad',
            description: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's future.",
            mediaType: MediaType.TV_SHOW,
            externalId: 'tmdb-1396',
            externalSource: ExternalSource.TMDB,
            releaseYear: 2008,
            genres: ['Drama', 'Crime', 'Thriller'],
            runtimeMinutes: 45,
            posterUrl: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
            backdropUrl: null,
        },
    ]

    // Sample songs
    const songs = [
        {
            title: 'Bohemian Rhapsody',
            description: 'Epic rock ballad by Queen from the album A Night at the Opera (1975).',
            mediaType: MediaType.SONG,
            externalId: 'spotify-7tFiyTwD0nx5a1eklYtX2J',
            externalSource: ExternalSource.SPOTIFY,
            releaseYear: 1975,
            genres: ['Rock', 'Classic Rock', 'Art Rock'],
            runtimeMinutes: 6,
            posterUrl: null,
            backdropUrl: null,
        },
    ]

    // Create media with metadata
    for (const movie of movies) {
        await prisma.media.upsert({
            where: { externalId_externalSource: { externalId: movie.externalId, externalSource: movie.externalSource } },
            update: {},
            create: {
                ...movie,
                movieMetadata: {
                    create: {
                        director: movie.title === 'The Dark Knight' ? 'Christopher Nolan' :
                            movie.title === 'Inception' ? 'Christopher Nolan' : 'Christopher Nolan',
                        cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'].slice(0, 3),
                    },
                },
            },
        })
    }

    for (const show of tvShows) {
        await prisma.media.upsert({
            where: { externalId_externalSource: { externalId: show.externalId, externalSource: show.externalSource } },
            update: {},
            create: {
                ...show,
                tvShowMetadata: {
                    create: { seasonCount: 5, episodeCount: 62, status: 'Ended', network: 'AMC' },
                },
            },
        })
    }

    for (const song of songs) {
        await prisma.media.upsert({
            where: { externalId_externalSource: { externalId: song.externalId, externalSource: song.externalSource } },
            update: {},
            create: {
                ...song,
                songMetadata: {
                    create: { artist: 'Queen', albumName: 'A Night at the Opera', durationMs: 354947 },
                },
            },
        })
    }

    console.log('✅ Seed complete!')
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
