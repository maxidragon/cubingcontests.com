import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { ICompetitionDetails, IMeetupDetails } from "@sh/types";
import { RoundDocument } from "./round.model";
import { PersonDocument } from "./person.model";
import { ContestState, ContestType } from "@sh/enums";
import { EventDocument } from "./event.model";
import { ScheduleDocument } from "./schedule.model";
import { UserDocument } from "./user.model";

@Schema({ _id: false })
export class ContestEvent {
  @Prop({ type: mongoose.Types.ObjectId, ref: "Event", required: true })
  event: EventDocument;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: "Round" }], required: true })
  rounds: RoundDocument[];
}

const ContestEventSchema = SchemaFactory.createForClass(ContestEvent);

@Schema({ _id: false })
export class CompetitionDetails implements ICompetitionDetails {
  @Prop({ type: mongoose.Types.ObjectId, ref: "Schedule", required: true })
  schedule: ScheduleDocument;
}

const CompetitionDetailsSchema = SchemaFactory.createForClass(CompetitionDetails);

@Schema({ _id: false })
export class MeetupDetails implements IMeetupDetails {
  @Prop({ required: true })
  startTime: Date;
}

const MeetupDetailsSchema = SchemaFactory.createForClass(MeetupDetails);

@Schema({ timestamps: true })
class Competition {
  @Prop({ required: true, unique: true })
  competitionId: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: "User", required: true })
  createdBy: UserDocument;

  @Prop({ enum: ContestState, required: true })
  state: ContestState;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  shortName: string;

  @Prop({ enum: ContestType, required: true, immutable: true })
  type: ContestType;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true, immutable: true })
  countryIso2: string;

  @Prop({ required: true })
  venue: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  latitudeMicrodegrees: number;

  @Prop({ required: true })
  longitudeMicrodegrees: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  timezone?: string;

  @Prop({ type: [{ type: mongoose.Types.ObjectId, ref: "Person" }], required: true })
  organizers: PersonDocument[];

  @Prop()
  contact?: string;

  @Prop() // this is not set to required, since that would also disallow ''
  description: string;

  @Prop()
  competitorLimit?: number;

  @Prop({ type: [ContestEventSchema] })
  events: ContestEvent[];

  @Prop({ default: 0 })
  participants: number;

  @Prop()
  queuePosition?: number;

  @Prop({ type: CompetitionDetailsSchema })
  compDetails?: CompetitionDetails;

  @Prop({ type: MeetupDetailsSchema })
  meetupDetails?: MeetupDetails;
}

export type ContestDocument = HydratedDocument<Competition>;

export const ContestSchema = SchemaFactory.createForClass(Competition);
