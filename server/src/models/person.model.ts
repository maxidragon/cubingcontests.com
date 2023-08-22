import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { IPerson } from '@sh/interfaces';
import { UserDocument } from './user.model';

@Schema({ timestamps: true })
export class Person implements IPerson {
  @Prop({ required: true, immutable: true, unique: true })
  personId: number;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User' })
  user?: UserDocument;

  @Prop({ immutable: true, unique: true })
  wcaId?: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  localizedName?: string;

  @Prop({ required: true })
  countryIso2: string;
}

export type PersonDocument = HydratedDocument<Person>;

export const PersonSchema = SchemaFactory.createForClass(Person);
