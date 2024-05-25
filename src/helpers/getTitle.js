import apiRequestRawHtml from "./apiRequestRawHtml";
import DomParser from "dom-parser";
import seriesFetcher from "./seriesFetcher";

export default async function getTitle(id) {
  const parser = new DomParser();
  const html = await apiRequestRawHtml(`https://www.imdb.com/title/${id}`);
  const dom = parser.parseFromString(html);
  const nextData = dom.getElementsByAttribute("id", "__NEXT_DATA__");
  const json = JSON.parse(nextData[0].textContent);

  const props = json.props.pageProps;

  const getCredits = (lookFor, v) => {
    const result = props.aboveTheFoldData?.principalCredits?.find(
      (e) => e?.category?.id === lookFor
    );

    return result
      ? result.credits.map((e) => {
          if (v === "2")
            return {
              id: e.name.id,
              name: e.name.nameText.text,
            };

          return e.name.nameText.text;
        })
      : [];
  };

  return {
    id: id,
    review_api_path: `/reviews/${id}`,
    imdb: `https://www.imdb.com/title/${id}`,
    contentType: props.aboveTheFoldData?.titleType?.id ?? "N/A",
    contentRating: props.aboveTheFoldData?.certificate?.rating ?? "N/A",
    isSeries: props.aboveTheFoldData?.titleType?.isSeries ?? false,
    productionStatus:
      props.aboveTheFoldData?.productionStatus?.currentProductionStage?.id ?? "N/A",
    isReleased:
      props.aboveTheFoldData?.productionStatus?.currentProductionStage?.id ===
      "released",
    title: props.aboveTheFoldData?.titleText?.text ?? "N/A",
    image: props.aboveTheFoldData?.primaryImage?.url ?? "N/A",
    images: props.mainColumnData?.titleMainImages?.edges
      ?.filter((e) => e.__typename === "ImageEdge")
      ?.map((e) => e.node.url) ?? [],
    plot: props.aboveTheFoldData?.plot?.plotText?.plainText ?? "N/A",
    runtime:
      props.aboveTheFoldData?.runtime?.displayableProperty?.value?.plainText ??
      "N/A",
    runtimeSeconds: props.aboveTheFoldData?.runtime?.seconds ?? 0,
    rating: {
      count: props.aboveTheFoldData?.ratingsSummary?.voteCount ?? 0,
      star: props.aboveTheFoldData?.ratingsSummary?.aggregateRating ?? 0,
    },
    award: {
      wins: props.mainColumnData?.wins?.total ?? 0,
      nominations: props.mainColumnData?.nominations?.total ?? 0,
    },
    genre: props.aboveTheFoldData?.genres?.genres?.map((e) => e.id) ?? [],
    releaseDetailed: {
      date: new Date(
        props.aboveTheFoldData?.releaseDate?.year ?? 1970,
        (props.aboveTheFoldData?.releaseDate?.month ?? 1) - 1,
        props.aboveTheFoldData?.releaseDate?.day ?? 1
      ).toISOString(),
      day: props.aboveTheFoldData?.releaseDate?.day ?? 1,
      month: props.aboveTheFoldData?.releaseDate?.month ?? 1,
      year: props.aboveTheFoldData?.releaseDate?.year ?? 1970,
      releaseLocation: {
        country: props.mainColumnData?.releaseDate?.country?.text ?? "N/A",
        cca2: props.mainColumnData?.releaseDate?.country?.id ?? "N/A",
      },
      originLocations: props.mainColumnData?.countriesOfOrigin?.countries?.map(
        (e) => ({
          country: e.text,
          cca2: e.id,
        })
      ) ?? [],
    },
    year: props.aboveTheFoldData?.releaseDate?.year ?? "N/A",
    spokenLanguages: props.mainColumnData?.spokenLanguages?.spokenLanguages?.map(
      (e) => ({
        language: e.text,
        id: e.id,
      })
    ) ?? [],
    filmingLocations: props.mainColumnData?.filmingLocations?.edges?.map(
      (e) => e.node.text
    ) ?? [],
    actors: getCredits("cast"),
    actors_v2: getCredits("cast", "2"),
    creators: getCredits("creator"),
    creators_v2: getCredits("creator", "2"),
    directors: getCredits("director"),
    directors_v2: getCredits("director", "2"),
    writers: getCredits("writer"),
    writers_v2: getCredits("writer", "2"),
    top_credits: props.aboveTheFoldData?.principalCredits?.map((e) => ({
      id: e.category.id,
      name: e.category.text,
      credits: e.credits.map((e) => e.name.nameText.text),
    })) ?? [],
    ...(props.aboveTheFoldData?.titleType?.isSeries
      ? await seriesFetcher(id)
      : {}),
  };
}
