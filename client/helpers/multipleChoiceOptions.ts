import { MultiChoiceOption } from './interfaces/MultiChoiceOption';
import { Color, CompetitionType, RoundProceed } from '~/shared_helpers/enums';
import { roundFormats } from './roundFormats';

export const colorOptions: MultiChoiceOption[] = [
  {
    label: 'No color',
    value: Color.White,
  },
  {
    label: 'Blue',
    value: Color.Blue,
  },
  {
    label: 'Red',
    value: Color.Red,
  },
  {
    label: 'Green',
    value: Color.Green,
  },
  {
    label: 'Yellow',
    value: Color.Yellow,
  },
  {
    label: 'Cyan',
    value: Color.Cyan,
  },
  {
    label: 'Magenta',
    value: Color.Magenta,
  },
];

export const competitionTypeOptions: MultiChoiceOption[] = [
  {
    label: 'Meetup',
    value: CompetitionType.Meetup,
  },
  {
    label: 'Online',
    value: CompetitionType.Online,
  },
  {
    label: 'Competition',
    value: CompetitionType.Competition,
  },
];

export const roundFormatOptions: MultiChoiceOption[] = Object.values(roundFormats).map((rf: any) => ({
  label: rf.label,
  value: rf.id,
}));

export const roundProceedOptions: MultiChoiceOption[] = [
  {
    label: 'Number',
    value: RoundProceed.Number,
  },
  {
    label: 'Percentage',
    value: RoundProceed.Percentage,
  },
];