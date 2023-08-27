'use client';

import { useEffect, useMemo, useState } from 'react';
import DatePicker, { registerLocale, setDefaultLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import enGB from 'date-fns/locale/en-GB';
import { addHours, differenceInDays } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import myFetch from '~/helpers/myFetch';
import Form from '../form/Form';
import FormTextInput from '../form/FormTextInput';
import FormCountrySelect from '../form/FormCountrySelect';
import FormEventSelect from '../form/FormEventSelect';
import FormRadio from '../form/FormRadio';
import FormSelect from '../form/FormSelect';
import FormPersonInputs from '../form/FormPersonInputs';
import Tabs from '../Tabs';
import Schedule from '../Schedule';
import { ICompetition, ICompetitionDetails, ICompetitionEvent, IEvent, IPerson, IRoom, IRound } from '@sh/interfaces';
import {
  Color,
  CompetitionState,
  CompetitionType,
  EventGroup,
  Role,
  RoundFormat,
  RoundProceed,
  RoundType,
} from '@sh/enums';
import { getDateOnly } from '@sh/sharedFunctions';
import Countries from '@sh/Countries';
import {
  colorOptions,
  competitionTypeOptions,
  roundFormatOptions,
  roundProceedOptions,
} from '~/helpers/multipleChoiceOptions';
import { roundTypes } from '~/helpers/roundTypes';
import { MultiChoiceOption } from '~/helpers/interfaces/MultiChoiceOption';

registerLocale('en-GB', enGB);
setDefaultLocale('en-GB');

const coordToMicrodegrees = (value: string): number | null => {
  if (!value) return null;
  return parseInt(Number(value).toFixed(6).replace('.', ''));
};

const CompetitionForm = ({
  events,
  competition,
  role,
}: {
  events: IEvent[];
  competition?: ICompetition;
  role: Role;
}) => {
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  const [competitionId, setCompetitionId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState(CompetitionType.Meetup);
  const [city, setCity] = useState('');
  const [countryIso2, setCountryId] = useState('');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('0'); // vertical coordinate (Y); ranges from -90 to 90
  const [longitude, setLongitude] = useState('0'); // horizontal coordinate (X); ranges from -180 to 180
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date()); // competition-only
  const [organizerNames, setOrganizerNames] = useState<string[]>(['']);
  const [organizers, setOrganizers] = useState<IPerson[]>([null]);
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [competitorLimit, setCompetitorLimit] = useState('');

  // Event stuff
  const [newEventId, setNewEventId] = useState('333');
  const [competitionEvents, setCompetitionEvents] = useState<ICompetitionEvent[]>([]);
  const [mainEventId, setMainEventId] = useState('333');

  // Schedule stuff
  const [venueTimezone, setVenueTimezone] = useState(''); // e.g. Europe/Berlin
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [roomName, setRoomName] = useState('');
  const [roomColor, setRoomColor] = useState<Color>(Color.White);
  const [selectedRoom, setSelectedRoom] = useState(1); // ID of the currently selected room
  const [activityCode, setActivityCode] = useState('');
  // These are in UTC, but get displayed in the local timezone of the venue
  const [activityStartTime, setActivityStartTime] = useState<Date>();
  const [activityEndTime, setActivityEndTime] = useState<Date>();

  const isAdmin = role === Role.Admin;
  // Only enable competition type for admins
  competitionTypeOptions[2].disabled = !isAdmin;

  const tabs = useMemo(
    () => (type === CompetitionType.Competition ? ['Details', 'Events', 'Schedule'] : ['Details', 'Events']),
    [type],
  );
  const filteredEvents = useMemo(() => {
    const newFiltEv = events.filter(
      (ev) =>
        ev.groups.some((g) => [EventGroup.WCA, EventGroup.Unofficial].includes(g)) &&
        (type === CompetitionType.Meetup || !ev.groups.includes(EventGroup.MeetupOnly)),
    );

    // Reset new event ID and main event ID if new filtered events don't include them
    if (newFiltEv.length > 0) {
      if (!newFiltEv.some((ev) => ev.eventId === newEventId)) setNewEventId(newFiltEv[0]?.eventId);
      if (!newFiltEv.some((ev) => ev.eventId === mainEventId)) setMainEventId(newFiltEv[0]?.eventId);
    }

    return newFiltEv;
  }, [events, type, mainEventId]);
  const remainingEvents = useMemo(
    () => filteredEvents.filter((ev) => !competitionEvents.some((ce) => ce.event.eventId === ev.eventId)),
    [filteredEvents, competitionEvents],
  );
  const disableIfCompFinished = useMemo(
    () => !isAdmin && competition?.state >= CompetitionState.Finished,
    [competition, isAdmin],
  );
  const disableIfCompApproved = useMemo(
    () => !isAdmin && competition?.state >= CompetitionState.Approved,
    [competition, isAdmin],
  );
  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        label: room.name,
        value: room.id,
      })),
    [rooms.length],
  );
  const isValidRoom = useMemo(() => roomName.trim() !== '', [roomName]);
  const isValidActivity = useMemo(
    () => activityCode && roomOptions.some((el) => el.value === selectedRoom),
    [activityCode, roomOptions, selectedRoom],
  );

  //////////////////////////////////////////////////////////////////////////////
  // Use effect
  //////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (competition) {
      setCompetitionId(competition.competitionId);
      setName(competition.name);
      setType(competition.type);
      if (competition.city) setCity(competition.city);
      setCountryId(competition.countryIso2);
      if (competition.venue) setVenue(competition.venue);
      if (competition.address) setAddress(competition.address);
      if (competition.latitudeMicrodegrees && competition.longitudeMicrodegrees) {
        setLatitude((competition.latitudeMicrodegrees / 1000000).toFixed(6));
        setLongitude((competition.longitudeMicrodegrees / 1000000).toFixed(6));
      }
      setOrganizerNames([...competition.organizers.map((el) => el.name), '']);
      setOrganizers([...competition.organizers, null]);
      if (competition.contact) setContact(competition.contact);
      if (competition.description) setDescription(competition.description);
      if (competition.competitorLimit) setCompetitorLimit(competition.competitorLimit.toString());
      setCompetitionEvents(competition.events);
      setNewEventId(
        events.find((ev) => !competition.events.some((ce) => ce.event.eventId === ev.eventId))?.eventId || '333',
      );
      setMainEventId(competition.mainEventId);

      switch (competition.type) {
        case CompetitionType.Meetup: {
          // Because the time is stored as UTC in the DB, but we display it in local time on the frontend
          setStartDate(utcToZonedTime(competition.startDate, competition.timezone));
          setVenueTimezone(competition.timezone);
          break;
        }
        case CompetitionType.Competition: {
          // Convert the dates from string to Date
          setStartDate(new Date(competition.startDate));
          setEndDate(new Date(competition.endDate));

          const venue = competition.compDetails.schedule.venues[0];
          setRooms(venue.rooms);
          setVenueTimezone(venue.timezone);
          break;
        }
        case CompetitionType.Online: {
          setStartDate(utcToZonedTime(competition.startDate, 'UTC'));
          break;
        }
        default:
          throw new Error(`Unknown contest type: ${competition.type}`);
      }
    }
  }, [competition, events]);

  useEffect(() => {
    document.getElementById('competition_name').focus();
  }, []);

  // Scroll to the top of the page when a new error message is shown
  useEffect(() => {
    if (errorMessages.find((el) => el !== '')) window.scrollTo(0, 0);
  }, [errorMessages]);

  useEffect(() => {
    if (organizers.length !== 1 && organizers.filter((el) => el === null).length === 1) {
      document.getElementById(`Organizer_${organizerNames.length}`)?.focus();
    }
  }, [organizers]);

  //////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS
  //////////////////////////////////////////////////////////////////////////////

  const handleSubmit = async () => {
    const selectedOrganizers = organizers.filter((el) => el !== null);
    const latitudeMicrodegrees = type !== CompetitionType.Online ? coordToMicrodegrees(latitude) : undefined;
    const longitudeMicrodegrees = type !== CompetitionType.Online ? coordToMicrodegrees(longitude) : undefined;
    let processedStartDate: Date;
    const endDateOnly = getDateOnly(endDate);

    if (type === CompetitionType.Meetup) {
      // Convert start date so that it is displayed in the venue's local time zone
      processedStartDate = zonedTimeToUtc(startDate, venueTimezone);
    } else if (type === CompetitionType.Online) {
      // Convert start date to UTC using the user's time zone
      processedStartDate = zonedTimeToUtc(startDate, 'UTC');
    } else if (type === CompetitionType.Competition) {
      processedStartDate = getDateOnly(startDate);
    }

    // Set the competition ID and date for every round
    const compEvents = competitionEvents.map((compEvent) => ({
      ...compEvent,
      rounds: compEvent.rounds.map((round) => ({
        ...round,
        competitionId: competition?.competitionId || competitionId,
        date:
          type !== CompetitionType.Competition
            ? processedStartDate
            : // Finds the start time of the round based on the schedule, but then gets only the date
            getDateOnly(
              // This is necessary, because the date could be different due to time zones
              utcToZonedTime(
                (() => {
                  for (const room of rooms) {
                    const activity = room.activities.find((a) => a.activityCode === round.roundId);
                    if (activity) return activity.startTime;
                  }
                })(),
                venueTimezone,
              ),
            ),
      })),
    }));
    let compDetails: ICompetitionDetails; // this is left undefined if the type is not competition

    if (type === CompetitionType.Competition) {
      compDetails = {
        schedule: {
          competitionId,
          startDate: processedStartDate,
          numberOfDays: differenceInDays(endDateOnly, processedStartDate) + 1,
          venues: [
            {
              id: 1,
              name: venue,
              latitudeMicrodegrees,
              longitudeMicrodegrees,
              countryIso2,
              timezone: venueTimezone,
              // Only send the rooms that have at least one activity
              rooms: rooms.filter((el) => el.activities.length > 0),
            },
          ],
        },
      };
    }

    const newComp: ICompetition = {
      ...competition,
      competitionId,
      name: name.trim(),
      type,
      city: city.trim() || undefined,
      // If it's an online competition, set country ISO to online
      countryIso2: type !== CompetitionType.Online ? countryIso2 : Countries[0].code,
      venue: venue.trim() || undefined,
      address: address.trim() || undefined,
      latitudeMicrodegrees,
      longitudeMicrodegrees,
      startDate: processedStartDate,
      endDate: type === CompetitionType.Competition ? endDateOnly : undefined,
      organizers: selectedOrganizers,
      contact: contact.trim() || undefined,
      description: description.trim() || undefined,
      competitorLimit: competitorLimit && !isNaN(parseInt(competitorLimit)) ? parseInt(competitorLimit) : undefined,
      mainEventId,
      events: compEvents,
      compDetails,
    };

    // Check for errors
    const tempErrors: string[] = [];

    if (!newComp.competitionId) tempErrors.push('Please enter a competition ID');
    if (!newComp.name) tempErrors.push('Please enter a name');

    if (selectedOrganizers.length < organizerNames.filter((el) => el !== '').length)
      tempErrors.push('Please enter all organizers');
    else if (newComp.organizers.length === 0) tempErrors.push('Please enter at least one organizer');

    if (newComp.events.length === 0) tempErrors.push('You must enter at least one event');
    else if (!competitionEvents.some((el) => el.event.eventId === mainEventId))
      tempErrors.push('The selected main event is not on the list of events');

    const meetupOnlyCompEvent = competitionEvents.find((el) => el.event.groups.includes(EventGroup.MeetupOnly));
    if (type !== CompetitionType.Meetup && meetupOnlyCompEvent)
      tempErrors.push(`The event ${meetupOnlyCompEvent.event.name} is only allowed for meetups`);

    if (type === CompetitionType.Competition) {
      if (!newComp.address) tempErrors.push('Please enter an address');
      if (!newComp.contact) tempErrors.push('Please enter a contact email');
      if (!newComp.competitorLimit) tempErrors.push('Please enter a valid competitor limit');
      if (newComp.startDate > newComp.endDate) tempErrors.push('The start date must be before the end date');
    }

    if (type !== CompetitionType.Online) {
      if (!newComp.city) tempErrors.push('Please enter a city');
      if (!newComp.venue) tempErrors.push('Please enter a venue');
      if (newComp.latitudeMicrodegrees === null || newComp.longitudeMicrodegrees === null)
        tempErrors.push('Please enter valid venue coordinates');
    }

    if (tempErrors.length > 0) {
      setErrorMessages(tempErrors);
    } else {
      const { errors } = competition
        ? await myFetch.patch(`/competitions/${competition.competitionId}`, newComp) // edit competition
        : await myFetch.post('/competitions', newComp); // create competition

      if (errors) {
        setErrorMessages(errors);
      } else {
        setErrorMessages([]);
        window.location.href = '/mod';
      }
    }
  };

  // Disallows Mo3 format for events that have Ao5 as the default format, and vice versa for all other events
  const getFilteredRoundFormats = (event: IEvent): MultiChoiceOption[] => {
    if (event.defaultRoundFormat === RoundFormat.Average) {
      return roundFormatOptions.filter((el) => el.value !== RoundFormat.Mean);
    } else {
      return roundFormatOptions.filter((el) => el.value !== RoundFormat.Average);
    }
  };

  const changeActiveTab = (newTab: number) => {
    if (newTab === 2) {
      if (latitude && longitude) {
        setActiveTab(newTab);
        // By default set the start time to 12:00 on the first day of the comp and the end time to 13:00
        const firstDay = getDateOnly(startDate);
        setActivityStartTime(zonedTimeToUtc(addHours(firstDay, 12), venueTimezone));
        setActivityEndTime(zonedTimeToUtc(addHours(firstDay, 13), venueTimezone));
      } else {
        setErrorMessages(['Please enter the coordinates first']);
      }
    } else {
      setActiveTab(newTab);
    }
  };

  const changeName = (value: string) => {
    // Update Competition ID accordingly, unless it deviates from the name, but ONLY when creating a new competition
    if (!competition && competitionId === name.replaceAll(/[^a-zA-Z0-9]/g, '')) {
      setCompetitionId(value.replaceAll(/[^a-zA-Z0-9]/g, ''));
    }

    setName(value);
  };

  const changeCoordinates = async (newLat: string, newLong: string) => {
    const getIsValidCoord = (val: string) => !/[^0-9.]/.test(val) && !isNaN(Number(val));

    if (getIsValidCoord(newLat) && getIsValidCoord(newLong)) {
      setLatitude(newLat);
      setLongitude(newLong);

      const { errors, payload } = await myFetch.get(`/competitions/timezone?latitude=${newLat}&longitude=${newLong}`, {
        authorize: true,
      });

      if (errors) {
        setErrorMessages(errors);
      } else {
        setVenueTimezone(payload.timezone);
      }
    }
  };

  const changeRoundFormat = (eventIndex: number, roundIndex: number, value: RoundFormat) => {
    const newCompetitionEvents = competitionEvents.map((event, i) =>
      i !== eventIndex
        ? event
        : {
            ...event,
            rounds: event.rounds.map((round, i) => (i !== roundIndex ? round : { ...round, format: value })),
          },
    );
    setCompetitionEvents(newCompetitionEvents);
  };

  const changeRoundProceed = (eventIndex: number, roundIndex: number, type: RoundProceed, value?: string) => {
    const newCompetitionEvents = competitionEvents.map((event, i) =>
      i !== eventIndex
        ? event
        : {
            ...event,
            rounds: event.rounds.map((round, i) =>
              i !== roundIndex
                ? round
                : { ...round, proceed: { type, value: value ? Number(value) : round.proceed.value } },
            ),
          },
    );
    setCompetitionEvents(newCompetitionEvents);
  };

  const getNewRound = (eventId: string, roundNumber: number): IRound => {
    return {
      roundId: `${eventId}-r${roundNumber}`,
      competitionId: 'temp', // this gets replaced for all rounds on submit
      date: startDate,
      compNotPublished: true,
      roundTypeId: RoundType.Final,
      format: events.find((el) => el.eventId === eventId).defaultRoundFormat,
      results: [],
    };
  };

  const addRound = (eventId: string) => {
    const updatedCompEvent = competitionEvents.find((el) => el.event.eventId === eventId);

    // Update the currently semi-final round
    if (updatedCompEvent.rounds.length > 2) {
      const semiRound = updatedCompEvent.rounds[updatedCompEvent.rounds.length - 2];
      semiRound.roundTypeId = Object.values(RoundType)[updatedCompEvent.rounds.length - 2];
    }

    // Update the currently last round
    const lastRound = updatedCompEvent.rounds[updatedCompEvent.rounds.length - 1];
    lastRound.proceed = {
      type: RoundProceed.Percentage,
      value: 50,
    };
    lastRound.roundTypeId = updatedCompEvent.rounds.length > 1 ? RoundType.Semi : RoundType.First;

    // Add new round
    updatedCompEvent.rounds.push(getNewRound(eventId, updatedCompEvent.rounds.length + 1));

    setCompetitionEvents(competitionEvents.map((el) => (el.event.eventId === eventId ? updatedCompEvent : el)));
  };

  const removeEventRound = (eventId: string) => {
    const updatedCompEvent = competitionEvents.find((el) => el.event.eventId === eventId);
    updatedCompEvent.rounds = updatedCompEvent.rounds.slice(0, -1);

    // Update new final round
    const newLastRound = updatedCompEvent.rounds[updatedCompEvent.rounds.length - 1];
    delete newLastRound.proceed;
    newLastRound.roundTypeId = RoundType.Final;

    // Update new semi final round
    if (updatedCompEvent.rounds.length > 2) {
      const newSemiRound = updatedCompEvent.rounds[updatedCompEvent.rounds.length - 2];
      newSemiRound.roundTypeId = RoundType.Semi;
    }

    setCompetitionEvents(competitionEvents.map((el) => (el.event.eventId === eventId ? updatedCompEvent : el)));
  };

  const addCompetitionEvent = () => {
    setCompetitionEvents(
      [
        ...competitionEvents,
        {
          event: events.find((el) => el.eventId === newEventId),
          rounds: [getNewRound(newEventId, 1)],
        },
      ].sort((a: ICompetitionEvent, b: ICompetitionEvent) => a.event.rank - b.event.rank),
    );

    if (remainingEvents.length > 1) {
      const newId = remainingEvents.find((event) => event.eventId !== newEventId)?.eventId;
      setNewEventId(newId);
    }
  };

  const removeCompetitionEvent = (eventId: string) => {
    setCompetitionEvents(competitionEvents.filter((el) => el.event.eventId !== eventId));
  };

  const addRoom = () => {
    setRoomName('');
    setRooms([
      ...rooms,
      {
        id: rooms.length + 1,
        name: roomName.trim(),
        color: roomColor,
        activities: [],
      },
    ]);
  };

  const changeActivityStartTime = (newTime: Date) => {
    setActivityStartTime(zonedTimeToUtc(newTime, venueTimezone));
  };

  // Get the same date as the start time and use the new end time (the end time input is for time only)
  const changeActivityEndTime = (newTime: Date) => {
    const zonedStartTime = utcToZonedTime(activityStartTime, venueTimezone);
    const newActivityEndTime = zonedTimeToUtc(
      new Date(
        zonedStartTime.getUTCFullYear(),
        zonedStartTime.getUTCMonth(),
        zonedStartTime.getUTCDate(),
        newTime.getUTCHours(),
        newTime.getUTCMinutes(),
      ),
      venueTimezone,
    );

    setActivityEndTime(newActivityEndTime);
  };

  const addActivity = () => {
    const newRooms = rooms.map((room) =>
      room.id !== selectedRoom
        ? room
        : {
            ...room,
            activities: [
              ...room.activities,
              {
                id: room.activities.length + 1,
                activityCode,
                startTime: activityStartTime,
                endTime: activityEndTime,
              },
            ],
          },
    );

    setRooms(newRooms);
    setActivityCode('');
  };

  return (
    <>
      <Form
        buttonText={competition ? 'Edit Contest' : 'Create Contest'}
        errorMessages={errorMessages}
        handleSubmit={handleSubmit}
        hideButton={activeTab === 2}
      >
        <Tabs titles={tabs} activeTab={activeTab} setActiveTab={changeActiveTab} />

        {activeTab === 0 && (
          <>
            <FormTextInput
              id="competition_name"
              title="Contest name"
              value={name}
              setValue={changeName}
              disabled={disableIfCompApproved}
            />
            <FormTextInput
              title="Contest ID"
              value={competitionId}
              setValue={setCompetitionId}
              disabled={!!competition}
            />
            <FormRadio
              title="Type"
              options={competitionTypeOptions}
              selected={type}
              setSelected={(val: any) => setType(val)}
              disabled={!!competition}
            />
            {type !== CompetitionType.Online && (
              <>
                <div className="row">
                  <div className="col">
                    <FormTextInput title="City" value={city} setValue={setCity} disabled={disableIfCompApproved} />
                  </div>
                  <div className="col">
                    <FormCountrySelect countryIso2={countryIso2} setCountryId={setCountryId} disabled={!!competition} />
                  </div>
                </div>
                <FormTextInput title="Address" value={address} setValue={setAddress} disabled={disableIfCompFinished} />
                <div className="row">
                  <div className="col-6">
                    <FormTextInput title="Venue" value={venue} setValue={setVenue} disabled={disableIfCompFinished} />
                  </div>
                  <div className="col-3">
                    <FormTextInput
                      title="Latitude"
                      value={latitude}
                      setValue={(val: string) => changeCoordinates(val, longitude)}
                      disabled={disableIfCompFinished}
                    />
                  </div>
                  <div className="col-3">
                    <FormTextInput
                      title="Longitude"
                      value={longitude}
                      setValue={(val: string) => changeCoordinates(latitude, val)}
                      disabled={disableIfCompFinished}
                    />
                  </div>
                </div>
              </>
            )}
            <div className="mb-3 row">
              <div className="col">
                <label htmlFor="start_date" className="form-label">
                  {type === CompetitionType.Competition
                    ? 'Start date'
                    : 'Start date and time' + (type === CompetitionType.Online ? ' (UTC)' : '')}
                </label>
                <DatePicker
                  id="start_date"
                  selected={startDate}
                  showTimeSelect={type !== CompetitionType.Competition}
                  timeFormat="p"
                  // P is date select only, Pp is date and time select
                  dateFormat={type === CompetitionType.Competition ? 'P' : 'Pp'}
                  locale="en-GB"
                  onChange={(date: Date) => setStartDate(date)}
                  className="form-control"
                  disabled={competition?.state >= CompetitionState.Approved}
                />
              </div>
              {type === CompetitionType.Competition && (
                <div className="col">
                  <label htmlFor="end_date" className="form-label">
                    End date
                  </label>
                  <DatePicker
                    id="end_date"
                    selected={endDate}
                    dateFormat="P"
                    locale="en-GB"
                    onChange={(date: Date) => setEndDate(date)}
                    className="form-control"
                    disabled={competition?.state >= CompetitionState.Approved}
                  />
                </div>
              )}
            </div>
            <h5>Organizers</h5>
            <div className="my-3 pt-3 px-4 border rounded bg-body-tertiary">
              <FormPersonInputs
                title="Organizer"
                personNames={organizerNames}
                setPersonNames={setOrganizerNames}
                persons={organizers}
                setPersons={setOrganizers}
                setErrorMessages={setErrorMessages}
                infiniteInputs
                nextFocusTargetId="contact"
              />
            </div>
            <FormTextInput
              id="contact"
              title="Contact"
              placeholder="john@example.com"
              value={contact}
              setValue={setContact}
            />
            <div className="mb-3">
              <label htmlFor="description" className="form-label">
                Description (optional)
              </label>
              <textarea
                id="description"
                rows={10}
                value={description}
                onChange={(e: any) => setDescription(e.target.value)}
                className="form-control"
              />
            </div>
            <FormTextInput
              title="Competitor limit"
              value={competitorLimit}
              setValue={setCompetitorLimit}
              disabled={disableIfCompApproved}
            />
          </>
        )}

        {activeTab === 1 && (
          <>
            <div className="my-4 d-flex align-items-center gap-3">
              <button
                type="button"
                className="btn btn-success"
                onClick={addCompetitionEvent}
                disabled={competitionEvents.length === filteredEvents.length || disableIfCompFinished}
              >
                Add Event
              </button>
              <div className="flex-grow-1">
                <FormEventSelect
                  title=""
                  noMargin
                  events={remainingEvents}
                  eventId={newEventId}
                  setEventId={setNewEventId}
                  disabled={disableIfCompFinished}
                />
              </div>
            </div>
            {competitionEvents.map((compEvent, eventIndex) => (
              <div key={compEvent.event.eventId} className="mb-3 py-3 px-4 border rounded bg-body-tertiary">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4>{compEvent.event.name}</h4>
                  <button
                    type="button"
                    className="ms-3 btn btn-danger btn-sm"
                    onClick={() => removeCompetitionEvent(compEvent.event.eventId)}
                    disabled={disableIfCompFinished || compEvent.rounds.some((r) => r.results.length > 0)}
                  >
                    Remove Event
                  </button>
                </div>
                {compEvent.rounds.map((round, roundIndex) => (
                  <div key={round.roundTypeId} className="mb-3 pt-2 px-4 border rounded bg-body-secondary">
                    <div className="mb-3 row">
                      <div className="col-4">
                        <h5 className="mt-2">{roundTypes[round.roundTypeId].label}</h5>
                      </div>
                      <div className="col-8">
                        <FormSelect
                          title="Round format"
                          options={getFilteredRoundFormats(compEvent.event)}
                          selected={round.format}
                          disabled={disableIfCompFinished || round.results.length > 0}
                          setSelected={(val: string) => changeRoundFormat(eventIndex, roundIndex, val as RoundFormat)}
                        />
                      </div>
                    </div>
                    {round.roundTypeId !== RoundType.Final && (
                      <>
                        <FormRadio
                          title="Proceed to next round"
                          options={roundProceedOptions}
                          selected={round.proceed.type}
                          setSelected={(val: any) => changeRoundProceed(eventIndex, roundIndex, val as RoundProceed)}
                          disabled={disableIfCompFinished || round.results.length > 0}
                        />
                        <FormTextInput
                          id="round_proceed_value"
                          value={round.proceed.value.toString()}
                          setValue={(val: string) =>
                            changeRoundProceed(eventIndex, roundIndex, round.proceed.type, val)
                          }
                          disabled={disableIfCompFinished || round.results.length > 0}
                        />
                      </>
                    )}
                  </div>
                ))}
                <div className="d-flex gap-3">
                  {compEvent.rounds.length < 10 && (
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={() => addRound(compEvent.event.eventId)}
                      disabled={disableIfCompFinished}
                    >
                      Add Round
                    </button>
                  )}
                  {compEvent.rounds.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeEventRound(compEvent.event.eventId)}
                      disabled={
                        disableIfCompFinished ||
                        compEvent.rounds.find((r) => r.roundTypeId === RoundType.Final).results.length > 0
                      }
                    >
                      Remove Round
                    </button>
                  )}
                </div>
              </div>
            ))}
            <FormEventSelect
              title="Main Event"
              events={filteredEvents}
              eventId={mainEventId}
              setEventId={setMainEventId}
              disabled={disableIfCompApproved}
            />
          </>
        )}

        {activeTab === 2 && (
          <>
            <h3 className="mb-3">Rooms</h3>
            <div className="row">
              <div className="col-8">
                <FormTextInput title="Room name" value={roomName} setValue={setRoomName} />
              </div>
              <div className="col-3">
                <FormSelect title="Color" options={colorOptions} selected={roomColor} setSelected={setRoomColor} />
              </div>
              <div className="col-1 d-flex align-items-end">
                <span
                  style={{
                    marginBottom: '19px',
                    width: '100%',
                    height: '2rem',
                    borderRadius: '5px',
                    backgroundColor: `#${roomColor}`,
                  }}
                ></span>
              </div>
            </div>
            <button type="button" className="mt-3 mb-2 btn btn-success" disabled={!isValidRoom} onClick={addRoom}>
              Create
            </button>
            <hr />
            <h3 className="mb-3">Schedule</h3>
            <div className="mb-3 row">
              <div className="col">
                <FormSelect
                  title="Room"
                  options={roomOptions}
                  selected={selectedRoom}
                  disabled={rooms.length === 0}
                  setSelected={setSelectedRoom}
                />
              </div>
              <div className="col">
                <FormTextInput title="Activity code (TEMPORARY)" value={activityCode} setValue={setActivityCode} />
              </div>
            </div>
            <div className="mb-3 row">
              <div className="col">
                <label htmlFor="activity_start_time" className="form-label">
                  Start time ({venueTimezone})
                </label>
                <DatePicker
                  id="activity_start_time"
                  selected={utcToZonedTime(activityStartTime, venueTimezone)}
                  showTimeSelect
                  timeIntervals={15}
                  timeFormat="p"
                  dateFormat="Pp"
                  locale="en-GB"
                  onChange={(date: Date) => changeActivityStartTime(date)}
                  className="form-control"
                />
              </div>
              <div className="col">
                <label htmlFor="activity_end_time" className="form-label">
                  End time ({venueTimezone})
                </label>
                <DatePicker
                  id="activity_end_time"
                  selected={utcToZonedTime(activityEndTime, venueTimezone)}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  dateFormat="HH:mm"
                  onChange={(date: Date) => changeActivityEndTime(date)}
                  className="form-control"
                />
              </div>
            </div>
            <button
              type="button"
              className="mt-3 mb-2 btn btn-success"
              disabled={!isValidActivity}
              onClick={addActivity}
            >
              Add to schedule
            </button>
          </>
        )}
      </Form>

      {activeTab === 2 && <Schedule rooms={rooms} compEvents={competitionEvents} timezone={venueTimezone} />}
    </>
  );
};

export default CompetitionForm;
