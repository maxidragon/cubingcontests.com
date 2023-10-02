import Link from 'next/link';
import { FaCircle } from 'react-icons/fa';
import ContestTypeBadge from '@c/ContestTypeBadge';
import Country from '@c/Country';
import { IContest } from '@sh/interfaces';
import { ContestState, ContestType } from '@sh/enums';
import { getBSClassFromColor, getFormattedDate } from '~/helpers/utilityFunctions';
import { contestTypeOptions } from '~/helpers/multipleChoiceOptions';

const ContestsTable = async ({
  contests,
  modView = false,
  // If one of these is defined, the other must be defined too
  onEditCompetition,
  onCopyCompetition,
  onPostCompResults,
  onChangeCompState,
  isAdmin = false,
}: {
  contests: IContest[];
  modView?: boolean;
  onEditCompetition?: (competitionId: string) => void;
  onCopyCompetition?: (competitionId: string) => void;
  onPostCompResults?: (competitionId: string) => void;
  onChangeCompState?: (competitionId: string, newState: ContestState) => void;
  isAdmin?: boolean; // used on the admin dashboard
}) => {
  return (
    <>
      {/* MOBILE VIEW */}

      {!modView && (
        <div className="d-block d-lg-none border-top border-bottom">
          <ul className="list-group list-group-flush">
            {contests.map((contest: IContest, index: number) => (
              <li
                key={contest.competitionId}
                className={`list-group-item ps-2 ${index % 2 === 1 ? ' list-group-item-dark' : ''}`}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <FaCircle
                      className={`text-${getBSClassFromColor(
                        contestTypeOptions.find((el) => el.value === contest.type).color,
                      )}`}
                      style={{ minWidth: '0.5rem', width: '0.5rem' }}
                    />

                    <Link href={`/competitions/${contest.competitionId}`} className="link-primary">
                      {contest.name}
                    </Link>
                  </div>

                  <p className="ms-2 mb-0 text-end">
                    <b>{getFormattedDate(contest.startDate, contest.endDate)}</b>
                  </p>
                </div>
                <div className="d-flex justify-content-between gap-3">
                  <div className="ms-2">
                    {contest.type !== ContestType.Online ? (
                      <span>
                        {contest.city}, <Country countryIso2={contest.countryIso2} swapPositions />
                      </span>
                    ) : (
                      'Online'
                    )}
                  </div>
                  <div className="text-end">
                    {contest.participants > 0 && (
                      <span>
                        Participants:&nbsp;<b>{contest.participants}</b>
                        {', '}
                      </span>
                    )}
                    Events:&nbsp;<b>{contest.events.length}</b>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* DESKTOP/MOD DASHBOARD VIEW (includes admin/moderator-only features) */}

      <div className={`${!modView && 'd-none d-lg-block'} mb-5 table-responsive`}>
        <table className="table table-hover text-nowrap">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Name</th>
              <th scope="col">Place</th>
              <th scope="col">Type</th>
              <th scope="col">Participants</th>
              <th scope="col">Events</th>
              {onEditCompetition && <th scope="col">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {contests.map((contest: IContest) => {
              const showApproveButton =
                contest.state === ContestState.Created &&
                isAdmin &&
                (contest.type !== ContestType.Competition || contest.compDetails);

              return (
                <tr key={contest.competitionId}>
                  <td>{getFormattedDate(contest.startDate, contest.endDate)}</td>
                  <td>
                    <Link href={`/competitions/${contest.competitionId}`} className="link-primary">
                      {contest.name}
                    </Link>
                  </td>
                  <td>
                    {contest.type !== ContestType.Online && (
                      <span>
                        {contest.city}, <Country countryIso2={contest.countryIso2} swapPositions />
                      </span>
                    )}
                  </td>
                  <td>
                    <ContestTypeBadge type={contest.type} />
                  </td>
                  <td>{contest.participants || ''}</td>
                  <td>{contest.events.length}</td>

                  {onEditCompetition && (
                    <td className="d-flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEditCompetition(contest.competitionId)}
                        className="btn btn-primary btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onCopyCompetition(contest.competitionId)}
                        className="btn btn-primary btn-sm"
                      >
                        Clone
                      </button>
                      {showApproveButton && (
                        <button
                          type="button"
                          onClick={() => onChangeCompState(contest.competitionId, ContestState.Approved)}
                          className="btn btn-warning btn-sm"
                        >
                          Approve
                        </button>
                      )}
                      {[ContestState.Approved, ContestState.Ongoing].includes(contest.state) && (
                        <button
                          type="button"
                          onClick={() => onPostCompResults(contest.competitionId)}
                          className="btn btn-sm btn-success"
                        >
                          Enter Results
                        </button>
                      )}
                      {contest.state > ContestState.Ongoing && isAdmin && (
                        <button
                          type="button"
                          onClick={() => onPostCompResults(contest.competitionId)}
                          className="btn btn-sm btn-secondary"
                        >
                          Edit Results
                        </button>
                      )}
                      {contest.state === ContestState.Ongoing && (
                        <button
                          type="button"
                          onClick={() => onChangeCompState(contest.competitionId, ContestState.Finished)}
                          className="btn btn-warning btn-sm"
                        >
                          Finish
                        </button>
                      )}
                      {contest.state === ContestState.Finished && isAdmin && (
                        <button
                          type="button"
                          onClick={() => onChangeCompState(contest.competitionId, ContestState.Published)}
                          className="btn btn-warning btn-sm"
                        >
                          Publish
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ContestsTable;
