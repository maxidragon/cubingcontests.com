import { compareAvgs, compareSingles } from '@sh/sharedFunctions';
import { ResultDocument } from '../models/result.model';

// Assumes results are already sorted
export const sortResultsAndSetRankings = async (
  results: ResultDocument[],
  ranksWithAverage: boolean,
  dontSort = false, // this can be set to true if the results are already sorted
): Promise<ResultDocument[]> => {
  if (results.length === 0) return results;

  let sortedResults: ResultDocument[];

  if (dontSort) {
    sortedResults = results;
  } else {
    if (ranksWithAverage) sortedResults = results.sort(compareAvgs);
    else sortedResults = results.sort(compareSingles);
  }

  let prevResult = sortedResults[0];
  let ranking = 1;

  for (let i = 0; i < sortedResults.length; i++) {
    // If the previous result was not tied with this one, increase ranking
    if (
      i > 0 &&
      ((ranksWithAverage && compareAvgs(prevResult, sortedResults[i]) < 0) ||
        (!ranksWithAverage && compareSingles(prevResult, sortedResults[i]) < 0))
    ) {
      ranking = i + 1;
    }

    sortedResults[i].ranking = ranking;
    await sortedResults[i].save(); // update the result in the DB
    prevResult = sortedResults[i];
  }

  return sortedResults;
};
