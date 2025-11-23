const { addonBuilder } = require("stremio-addon-sdk");
const { getMovies, getMovieDetails } = require("./tmdb");

const manifest = {
    "id": "org.stremio.malayalamott",
    "version": "1.0.0",
    "name": "Malayalam OTT",
    "description": "Discover Malayalam movies released on OTT platforms.",
    "resources": ["catalog", "meta"],
    "types": ["movie"],
    "catalogs": [
        {
            "type": "movie",
            "id": "malayalam_ott",
            "name": "Malayalam OTT",
            "extra": [
                { "name": "sort", "options": ["popularity", "release_date"] },
                { "name": "skip" }
            ]
        }
    ]
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, id, extra }) => {
    if (type === "movie" && id === "malayalam_ott") {
        const sort = extra.sort || "popularity";
        const page = extra.skip ? Math.floor(extra.skip / 20) + 1 : 1;
        const movies = await getMovies(sort, page);
        return { metas: movies };
    }
    return { metas: [] };
});

builder.defineMetaHandler(async ({ type, id }) => {
    if (type === 'movie') {
        const meta = await getMovieDetails(id);
        return { meta };
    }
    return { meta: {} };
});

module.exports = builder.getInterface();
