'use client';

import { useState, useEffect } from 'react';
import myFetch from '~/helpers/myFetch';
import PostResultsScreen from '@c/adminAndModerator/PostResultsScreen';
import { ICompetitionData } from '@sh/interfaces';
import Loading from '@c/Loading';

const PostCompetitionResults = ({ params }: { params: { id: string } }) => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [competitionData, setCompetitionData] = useState<ICompetitionData>();

  useEffect(() => {
    myFetch.get(`/competitions/mod/${params.id}`, { authorize: true }).then(({ payload, errors }) => {
      if (errors) setErrorMessages(errors);
      else setCompetitionData(payload as ICompetitionData);
    });
  }, [params.id]);

  if (competitionData) {
    return <PostResultsScreen compData={competitionData} />;
  }

  return <Loading errorMessages={errorMessages} />;
};

export default PostCompetitionResults;